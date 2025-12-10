import os
from django.core.management.base import BaseCommand
from django.db import transaction
from voters.models import Voter
try:
    import openpyxl
except ImportError:
    openpyxl = None


class Command(BaseCommand):
    help = 'Update voter party affiliation from Excel file containing serial numbers'

    def add_arguments(self, parser):
        parser.add_argument(
            '--excel-file',
            type=str,
            default='TharaList/voters.xlsx',
            help='Path to Excel file (relative to project root or absolute path)'
        )
        parser.add_argument(
            '--sheet-name',
            type=str,
            default='Sheet1',
            help='Name of the sheet to read (default: Sheet1)'
        )
        parser.add_argument(
            '--sheet-index',
            type=int,
            default=0,
            help='Index of the sheet to read (0-based, default: 0 for first sheet)'
        )
        parser.add_argument(
            '--range',
            type=str,
            default='A1:R26',
            help='Cell range to read (e.g., A1:R26)'
        )
        parser.add_argument(
            '--party',
            type=str,
            default='ldf',
            choices=['ldf', 'udf', 'bjp', 'other', 'unknown'],
            help='Party to assign to voters (default: ldf)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        # Check if openpyxl is installed
        if openpyxl is None:
            self.stdout.write(self.style.ERROR('openpyxl is not installed. Install it with: pip install openpyxl'))
            return

        excel_file = options['excel_file']
        sheet_name = options['sheet_name']
        sheet_index = options['sheet_index']
        cell_range = options['range']
        party = options['party']
        dry_run = options['dry_run']

        # If relative path, make it relative to project root
        if not os.path.isabs(excel_file):
            # Get the project root (BackEnd directory)
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
            # Go up one more level to Ward14VotingTracker
            project_root = os.path.dirname(base_dir)
            excel_file = os.path.join(project_root, excel_file)

        # Check if file exists
        if not os.path.exists(excel_file):
            self.stdout.write(self.style.ERROR(f'Excel file not found: {excel_file}'))
            return

        self.stdout.write(self.style.SUCCESS(f'Found Excel file: {excel_file}'))

        # Read Excel file
        self.stdout.write(f'Reading Excel file...')
        serial_numbers = self.read_excel_serial_numbers(excel_file, sheet_name, sheet_index, cell_range)

        if not serial_numbers:
            self.stdout.write(self.style.ERROR('No valid serial numbers found in Excel file!'))
            return

        self.stdout.write(f'Found {len(serial_numbers)} serial numbers in range {cell_range}')
        self.stdout.write(f'Serial numbers: {sorted(serial_numbers)}')

        # Update voters
        self.stdout.write('')
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))
        else:
            self.stdout.write(f'Updating voters to party: {party.upper()}...')

        updated_count = 0
        not_found_count = 0
        not_found_serials = []

        with transaction.atomic():
            for serial_no in sorted(serial_numbers):
                try:
                    voter = Voter.objects.get(serial_no=serial_no)
                    
                    if not dry_run:
                        old_party = voter.party
                        voter.party = party
                        voter.save(update_fields=['party'])
                        
                        if old_party != party:
                            self.stdout.write(
                                f'  Serial {serial_no}: {voter.name_en} - Updated from {old_party.upper()} to {party.upper()}'
                            )
                        else:
                            self.stdout.write(
                                f'  Serial {serial_no}: {voter.name_en} - Already {party.upper()}'
                            )
                    else:
                        self.stdout.write(
                            f'  Serial {serial_no}: {voter.name_en} - Would update to {party.upper()} (currently {voter.party.upper()})'
                        )
                    
                    updated_count += 1

                except Voter.DoesNotExist:
                    not_found_count += 1
                    not_found_serials.append(serial_no)
                    self.stdout.write(
                        self.style.WARNING(f'  Serial {serial_no}: Voter not found in database')
                    )

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('Update Summary'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN - No changes were made'))
        
        self.stdout.write(self.style.SUCCESS(f'Updated: {updated_count}'))
        self.stdout.write(self.style.WARNING(f'Not Found: {not_found_count}'))
        
        if not_found_serials:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('Serial numbers not found in database:'))
            self.stdout.write(self.style.WARNING(f'{not_found_serials}'))

        self.stdout.write(self.style.SUCCESS('=' * 50))

        if dry_run:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('To apply these changes, run without --dry-run flag'))

    def read_excel_serial_numbers(self, file_path, sheet_name, sheet_index, cell_range):
        """Read Excel file and extract serial numbers from specified range"""
        serial_numbers = set()
        
        try:
            # Load workbook
            workbook = openpyxl.load_workbook(file_path, data_only=True)
            
            # Get sheet - try by name first, then by index
            try:
                worksheet = workbook[sheet_name]
                self.stdout.write(f'Using sheet: {sheet_name}')
            except KeyError:
                worksheet = workbook.worksheets[sheet_index]
                self.stdout.write(f'Using sheet at index {sheet_index}: {worksheet.title}')
            
            # Parse the range (e.g., "A1:R26")
            cell_range_obj = worksheet[cell_range]
            
            # Iterate through all cells in the range
            for row in cell_range_obj:
                for cell in row:
                    if cell.value is not None:
                        # Try to convert to integer
                        try:
                            # Handle different types
                            if isinstance(cell.value, (int, float)):
                                serial_no = int(cell.value)
                            elif isinstance(cell.value, str):
                                # Remove any whitespace and try to convert
                                cleaned_value = cell.value.strip()
                                if cleaned_value.isdigit():
                                    serial_no = int(cleaned_value)
                                else:
                                    continue
                            else:
                                continue
                            
                            # Validate serial number is positive
                            if serial_no > 0:
                                serial_numbers.add(serial_no)
                                
                        except (ValueError, AttributeError):
                            # Skip cells that can't be converted to integers
                            continue
            
            workbook.close()
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error reading Excel file: {str(e)}'))
        
        return serial_numbers
