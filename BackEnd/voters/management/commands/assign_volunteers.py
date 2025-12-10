import csv
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from voters.models import Voter, Volunteer, User


class Command(BaseCommand):
    help = 'Assign Level 2 volunteers to voters based on TharaList.csv'

    def add_arguments(self, parser):
        parser.add_argument(
            '--csv-file',
            type=str,
            default='TharaList/TharaList.csv',
            help='Path to TharaList CSV file (relative to project root or absolute path)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']

        # If relative path, make it relative to project root
        if not os.path.isabs(csv_file):
            # Get the project root (BackEnd directory)
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            # Go up one more level to Ward14VotingTracker
            project_root = os.path.dirname(base_dir)
            csv_file = os.path.join(project_root, csv_file)

        # Check if file exists
        if not os.path.exists(csv_file):
            self.stdout.write(self.style.ERROR(f'CSV file not found: {csv_file}'))
            return

        self.stdout.write(self.style.SUCCESS(f'Found CSV file: {csv_file}'))

        # Read CSV and build mapping
        self.stdout.write('Reading TharaList CSV...')
        thara_mapping = self.read_thara_csv(csv_file)

        if not thara_mapping:
            self.stdout.write(self.style.ERROR('No valid mappings found in CSV!'))
            return

        self.stdout.write(f'Found {len(thara_mapping)} voter-to-thara mappings')

        # Get unique thara numbers from the mapping
        unique_tharas = set(thara_mapping.values())
        self.stdout.write(f'Unique Thara numbers in CSV: {sorted(unique_tharas)}')

        # Get all level 2 volunteers that are actually needed
        level2_volunteers = {}
        for thara_no in sorted(unique_tharas):
            username = f'th{thara_no:02d}'
            try:
                user = User.objects.get(username=username)
                volunteer = Volunteer.objects.get(user=user, level='level2')
                level2_volunteers[thara_no] = volunteer
                self.stdout.write(f'  Found volunteer: {username} - {volunteer.name}')
            except (User.DoesNotExist, Volunteer.DoesNotExist):
                self.stdout.write(self.style.WARNING(f'  Volunteer {username} not found'))

        if not level2_volunteers:
            self.stdout.write(self.style.ERROR('No Level 2 volunteers found in database!'))
            return

        # Assign volunteers to voters
        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        else:
            self.stdout.write('Assigning volunteers to voters...')

        assigned_count = 0
        skipped_count = 0
        error_count = 0
        
        # Group by thara for better reporting
        thara_stats = {}

        with transaction.atomic():
            for serial_no, thara_no in thara_mapping.items():
                try:
                    # Get the volunteer
                    volunteer = level2_volunteers.get(thara_no)
                    if not volunteer:
                        self.stdout.write(
                            self.style.WARNING(f'Skipping serial {serial_no}: Volunteer th{thara_no:02d} not found')
                        )
                        skipped_count += 1
                        continue

                    # Get the voter
                    try:
                        voter = Voter.objects.get(serial_no=serial_no)
                    except Voter.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(f'Skipping serial {serial_no}: Voter not found in database')
                        )
                        skipped_count += 1
                        continue

                    # Assign volunteer
                    if not dry_run:
                        voter.level2_volunteer = volunteer
                        voter.save(update_fields=['level2_volunteer'])

                    assigned_count += 1
                    
                    # Track stats
                    if thara_no not in thara_stats:
                        thara_stats[thara_no] = 0
                    thara_stats[thara_no] += 1

                    # Show progress
                    if assigned_count % 100 == 0:
                        self.stdout.write(f'  Processed {assigned_count} assignments...')

                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'Error assigning voter {serial_no}: {str(e)}')
                    )

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('Assignment Summary'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes were made'))
        
        self.stdout.write(self.style.SUCCESS(f'Assigned: {assigned_count}'))
        self.stdout.write(self.style.WARNING(f'Skipped: {skipped_count}'))
        
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'Errors: {error_count}'))

        # Show distribution by volunteer
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Distribution by Level 2 Volunteer:'))
        for thara_no in sorted(thara_stats.keys()):
            volunteer = level2_volunteers.get(thara_no)
            count = thara_stats[thara_no]
            if volunteer:
                self.stdout.write(f'  th{thara_no:02d} ({volunteer.name}): {count} voters')
            else:
                self.stdout.write(f'  th{thara_no:02d}: {count} voters')

        self.stdout.write(self.style.SUCCESS('=' * 50))

        if dry_run:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('To apply these changes, run without --dry-run flag'))

    def read_thara_csv(self, file_path):
        """Read TharaList CSV and return mapping of serial_no -> thara_no"""
        mapping = {}
        
        try:
            with open(file_path, 'r', encoding='utf-8-sig') as f:
                reader = csv.DictReader(f)
                
                # Check if required columns exist
                if not reader.fieldnames:
                    self.stdout.write(self.style.ERROR('CSV file is empty or invalid'))
                    return mapping
                
                self.stdout.write(f'CSV Columns: {reader.fieldnames}')
                
                row_count = 0
                for row in reader:
                    row_count += 1
                    
                    try:
                        # Get VL No (serial number)
                        vl_no_str = row.get('VL No', '').strip().strip('"')
                        if not vl_no_str or not vl_no_str.isdigit():
                            continue
                        
                        vl_no = int(vl_no_str)
                        
                        # Get Thara number
                        thara_str = row.get('Thara', '').strip().strip('"')
                        if not thara_str or not thara_str.isdigit():
                            continue
                        
                        thara_no = int(thara_str)
                        
                        # Add to mapping
                        mapping[vl_no] = thara_no
                        
                    except (ValueError, AttributeError) as e:
                        if row_count <= 5:  # Only show first few errors
                            self.stdout.write(
                                self.style.WARNING(f'Skipping row {row_count}: {e}')
                            )
                        continue
                
                self.stdout.write(f'Read {len(mapping)} valid mappings from {row_count} rows')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading CSV: {str(e)}'))
        
        return mapping
