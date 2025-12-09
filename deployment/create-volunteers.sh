#!/bin/bash
# Create volunteers - Level 1 (CH) and Level 2 (TH)

set -e

echo "=========================================="
echo "Creating Volunteers"
echo "=========================================="

# Get the script directory (deployment folder)
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
# Get the project root (one level up from deployment)
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/BackEnd"

cd "$BACKEND_DIR"

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Create Python script to add volunteers
cat > /tmp/create_volunteers.py << 'PYTHON_SCRIPT'
import os
import sys
import django

# Setup Django
sys.path.insert(0, '/root/Ward14VotingTracker/BackEnd')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'voting_tracker.settings_droplet')
django.setup()

from django.contrib.auth import get_user_model
from voters.models import Volunteer

User = get_user_model()

print("\n" + "="*50)
print("Creating Level 2 Volunteers (TH)")
print("="*50)

# Create Level 2 volunteers (TH-01 to TH-05)
for i in range(1, 6):
    username = f"th{i:02d}"
    password = f"ldfth{i:02d}"
    name = f"TH-{i:02d}"
    volunteer_id = 200 + i  # 201-205
    
    # Create or get user
    user, user_created = User.objects.get_or_create(
        username=username,
        defaults={
            'role': 'level2',
            'is_staff': False,
            'is_superuser': False,
        }
    )
    
    if user_created:
        user.set_password(password)
        user.save()
        print(f"✓ Created user: {username} (password: {password})")
    else:
        print(f"  User already exists: {username}")
    
    # Create or get volunteer
    volunteer, vol_created = Volunteer.objects.get_or_create(
        volunteer_id=volunteer_id,
        defaults={
            'user': user,
            'name': name,
            'level': 'level2',
            'is_active': True,
        }
    )
    
    if vol_created:
        print(f"✓ Created volunteer: {name} (ID: {volunteer_id})")
    else:
        print(f"  Volunteer already exists: {name} (ID: {volunteer_id})")

print("\n" + "="*50)
print("Creating Level 1 Volunteers (CH)")
print("="*50)

# Create Level 1 volunteers (CH-01 to CH-15)
for i in range(1, 16):
    username = f"ch{i:02d}"
    password = f"ldfch{i:02d}"
    name = f"CH-{i:02d}"
    volunteer_id = 100 + i  # 101-115
    
    # Assign to Level 2 supervisor (distribute evenly among 5 TH volunteers)
    # CH-01 to CH-03 -> TH-01 (201)
    # CH-04 to CH-06 -> TH-02 (202)
    # CH-07 to CH-09 -> TH-03 (203)
    # CH-10 to CH-12 -> TH-04 (204)
    # CH-13 to CH-15 -> TH-05 (205)
    supervisor_id = 201 + ((i - 1) // 3)
    
    try:
        parent_volunteer = Volunteer.objects.get(volunteer_id=supervisor_id)
    except Volunteer.DoesNotExist:
        print(f"  Warning: Supervisor {supervisor_id} not found for {name}")
        parent_volunteer = None
    
    # Create or get user
    user, user_created = User.objects.get_or_create(
        username=username,
        defaults={
            'role': 'level1',
            'is_staff': False,
            'is_superuser': False,
        }
    )
    
    if user_created:
        user.set_password(password)
        user.save()
        print(f"✓ Created user: {username} (password: {password})")
    else:
        print(f"  User already exists: {username}")
    
    # Create or get volunteer
    volunteer, vol_created = Volunteer.objects.get_or_create(
        volunteer_id=volunteer_id,
        defaults={
            'user': user,
            'name': name,
            'level': 'level1',
            'parent_volunteer': parent_volunteer,
            'is_active': True,
        }
    )
    
    if vol_created:
        supervisor_name = parent_volunteer.name if parent_volunteer else "None"
        print(f"✓ Created volunteer: {name} (ID: {volunteer_id}, Supervisor: {supervisor_name})")
    else:
        print(f"  Volunteer already exists: {name} (ID: {volunteer_id})")

print("\n" + "="*50)
print("Summary")
print("="*50)
print(f"Level 2 Volunteers: {Volunteer.objects.filter(level='level2').count()}")
print(f"Level 1 Volunteers: {Volunteer.objects.filter(level='level1').count()}")
print(f"Total Volunteers: {Volunteer.objects.count()}")
print(f"Total Users: {User.objects.filter(role__in=['level1', 'level2']).count()}")

print("\n" + "="*50)
print("Login Credentials")
print("="*50)
print("\nLevel 2 (TH) - Supervisors:")
for i in range(1, 6):
    print(f"  Username: th{i:02d}  |  Password: ldfth{i:02d}  |  Name: TH-{i:02d}")

print("\nLevel 1 (CH) - Bottom Level:")
for i in range(1, 16):
    supervisor_num = ((i - 1) // 3) + 1
    print(f"  Username: ch{i:02d}  |  Password: ldfch{i:02d}  |  Name: CH-{i:02d}  |  Supervisor: TH-{supervisor_num:02d}")

print("\n" + "="*50)
print("✓ Volunteer Creation Complete!")
print("="*50)
PYTHON_SCRIPT

# Run the Python script
echo ""
echo "Running volunteer creation script..."
python /tmp/create_volunteers.py

# Clean up
rm /tmp/create_volunteers.py

deactivate

echo ""
echo "=========================================="
echo "✓ All volunteers created successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Assign voters to these volunteers in the admin panel"
echo "2. Test login with any of the created credentials"
echo ""
