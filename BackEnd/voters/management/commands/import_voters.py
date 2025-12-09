import csv
import os
from django.core.management.base import BaseCommand
from django.db import transaction
from voters.models import Voter


class Command(BaseCommand):
    help = 'Import voters from CSV files (English and Malayalam)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--en-file',
            type=str,
            default=r'D:\Hemang\Election\Chuduvalathur Ward List\VotersList_Ward14_en.csv',
            help='Path to English CSV file'
        )
        parser.add_argument(
            '--ml-file',
            type=str,
            default=r'D:\Hemang\Election\Chuduvalathur Ward List\VotersList_Ward14_ml.csv',
            help='Path to Malayalam CSV file'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing voters before import'
        )

    def handle(self, *args, **options):
        en_file = options['en_file']
        ml_file = options['ml_file']
        clear_existing = options['clear']

        # Check if files exist
        if not os.path.exists(en_file):
            self.stdout.write(self.style.ERROR(f'English file not found: {en_file}'))
            return
        
        if not os.path.exists(ml_file):
            self.stdout.write(self.style.WARNING(f'Malayalam file not found: {ml_file}'))
            self.stdout.write(self.style.WARNING('Proceeding with English file only'))
            ml_file = None

        # Clear existing voters if requested
        if clear_existing:
            count = Voter.objects.count()
            Voter.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Deleted {count} existing voters'))

        # Read English CSV
        self.stdout.write('Reading English CSV file...')
        en_voters = self.read_csv(en_file)
        
        # Read Malayalam CSV if available
        ml_voters = {}
        if ml_file:
            self.stdout.write('Reading Malayalam CSV file...')
            ml_voters = self.read_csv(ml_file)

        # Import voters
        self.stdout.write('Importing voters...')
        created_count = 0
        updated_count = 0
        error_count = 0

        if not en_voters:
            self.stdout.write(self.style.ERROR('No voters found in English CSV file!'))
            return

        with transaction.atomic():
            for serial_no, en_data in en_voters.items():
                try:
                    ml_data = ml_voters.get(serial_no, {})
                    
                    # Get SEC ID - this is required
                    sec_id = en_data.get('New SEC ID No.', '').strip()
                    if not sec_id:
                        self.stdout.write(self.style.WARNING(f'Skipping voter {serial_no}: No SEC ID'))
                        error_count += 1
                        continue
                    
                    # Parse gender
                    gender_str = en_data.get('Gender', '').strip().upper()
                    if 'M' in gender_str and 'F' not in gender_str:
                        gender = 'M'
                    elif 'F' in gender_str:
                        gender = 'F'
                    else:
                        gender = 'O'
                    
                    # Parse age
                    age_str = en_data.get('Age', '0').strip()
                    try:
                        age = int(age_str) if age_str else 0
                    except ValueError:
                        age = 0
                    
                    # Parse category
                    category_str = en_data.get('Category', '').strip().lower()
                    category = 'deletion' if 'deletion' in category_str else 'existing'
                    
                    # Get name
                    name_en = en_data.get('Name', '').strip()
                    if not name_en:
                        self.stdout.write(self.style.WARNING(f'Skipping voter {serial_no}: No name'))
                        error_count += 1
                        continue
                    
                    # Create or update voter
                    voter, created = Voter.objects.update_or_create(
                        sec_id=sec_id,
                        defaults={
                            'serial_no': serial_no,
                            'name_en': name_en,
                            'name_ml': ml_data.get('Name', '').strip() if ml_data else '',
                            'guardian_name_en': en_data.get("Guardian's Name", '').strip(),
                            'guardian_name_ml': ml_data.get("Guardian's Name", '').strip() if ml_data else '',
                            'old_ward_house_no': en_data.get('OldWard No/ House No.', '').strip(),
                            'house_name_en': en_data.get('House Name', '').strip(),
                            'house_name_ml': ml_data.get('House Name', '').strip() if ml_data else '',
                            'gender': gender,
                            'age': age,
                            'category': category,
                        }
                    )
                    
                    if created:
                        created_count += 1
                    else:
                        updated_count += 1
                    
                    if (created_count + updated_count) % 100 == 0:
                        self.stdout.write(f'Processed {created_count + updated_count} voters...')
                
                except Exception as e:
                    error_count += 1
                    self.stdout.write(
                        self.style.ERROR(f'Error processing voter {serial_no}: {str(e)}')
                    )

        # Summary
        self.stdout.write(self.style.SUCCESS('\n=== Import Summary ==='))
        self.stdout.write(self.style.SUCCESS(f'Created: {created_count}'))
        self.stdout.write(self.style.SUCCESS(f'Updated: {updated_count}'))
        if error_count > 0:
            self.stdout.write(self.style.ERROR(f'Errors: {error_count}'))
        self.stdout.write(self.style.SUCCESS(f'Total: {created_count + updated_count}'))

    def read_csv(self, file_path):
        """Read CSV file and return dictionary keyed by serial number"""
        voters = {}
        
        with open(file_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig handles BOM
            reader = csv.DictReader(f)
            
            # Debug: Print column names
            if reader.fieldnames:
                self.stdout.write(f'CSV Columns: {reader.fieldnames}')
            
            row_count = 0
            for row in reader:
                row_count += 1
                try:
                    # Debug first row
                    if row_count == 1:
                        self.stdout.write(f'First row data: {dict(row)}')
                    
                    # Clean up the row data - remove extra spaces and empty values
                    cleaned_row = {}
                    for k, v in row.items():
                        if k:  # Only process non-empty keys
                            cleaned_key = k.strip()
                            cleaned_value = v.strip() if v else ''
                            cleaned_row[cleaned_key] = cleaned_value
                    
                    serial_no_str = cleaned_row.get('Serial No.', '').strip()
                    if serial_no_str and serial_no_str.isdigit():
                        serial_no = int(serial_no_str)
                        if serial_no > 0:
                            voters[serial_no] = cleaned_row
                except (ValueError, AttributeError) as e:
                    if row_count <= 5:  # Only show first few errors
                        self.stdout.write(self.style.WARNING(f'Skipping row {row_count}: {e}'))
                    continue
        
        self.stdout.write(f'Read {len(voters)} voters from {file_path} (processed {row_count} rows)')
        return voters
