#!/bin/bash
# Script 3: Assign Level 2 Volunteers to Voters based on TharaList.csv
# Maps voters (by serial_no) to Level 2 volunteers based on Thara assignments

set -e -o pipefail

echo "=========================================="
echo "Assigning Level 2 Volunteers to Voters"
echo "=========================================="

# Database connection details
DB_NAME="voting_tracker_db"
DB_USER="voting_admin"
DB_PASSWORD="voting_secure_pass"
DB_HOST="localhost"
DB_PORT="5432"

# Path to CSV file (adjust if needed)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSV_FILE="$SCRIPT_DIR/../TharaList/TharaList.csv"

# Check if CSV file exists
if [ ! -f "$CSV_FILE" ]; then
    echo "Error: CSV file not found at $CSV_FILE"
    exit 1
fi

echo "✓ Found CSV file: $CSV_FILE"

# Count total records in CSV (excluding header)
TOTAL_RECORDS=$(tail -n +2 "$CSV_FILE" | grep -v '^[[:space:]]*$' | wc -l)
echo "Total records to process: $TOTAL_RECORDS"

# Create temporary SQL file
TEMP_SQL_FILE=$(mktemp)
echo "-- SQL script to assign Level 2 volunteers to voters" > "$TEMP_SQL_FILE"
echo "-- Generated on $(date)" >> "$TEMP_SQL_FILE"
echo "" >> "$TEMP_SQL_FILE"

# Process CSV and generate UPDATE statements
echo "Processing CSV and generating SQL updates..."

PROCESSED=0
SKIPPED=0

# Read CSV line by line (skip header)
while IFS=',' read -r vl_no thara_no remainder; do
    # Remove leading/trailing whitespace and quotes
    vl_no="${vl_no#"${vl_no%%[![:space:]]*}"}"
    vl_no="${vl_no%"${vl_no##*[![:space:]]}"}"
    vl_no="${vl_no//\"/}"
    
    thara_no="${thara_no#"${thara_no%%[![:space:]]*}"}"
    thara_no="${thara_no%"${thara_no##*[![:space:]]}"}"
    thara_no="${thara_no//\"/}"
    
    # Skip empty lines or invalid VL numbers
    if [ -z "$vl_no" ] || ! [[ "$vl_no" =~ ^[0-9]+$ ]]; then
        continue
    fi
    
    # Skip if thara_no is empty
    if [ -z "$thara_no" ] || ! [[ "$thara_no" =~ ^[0-9]+$ ]]; then
        ((SKIPPED++))
        continue
    fi
    
    # Map Thara number to volunteer username (th01, th02, etc.)
    # Thara 1 -> th01, Thara 2 -> th02, etc.
    volunteer_username=$(printf "th%02d" "$thara_no")
    
    # Generate UPDATE statement
    echo "UPDATE voters SET level2_volunteer_id = (SELECT v.id FROM volunteers v JOIN users u ON v.user_id = u.id WHERE u.username = '$volunteer_username' AND v.level = 'level2' LIMIT 1) WHERE serial_no = $vl_no;" >> "$TEMP_SQL_FILE"
    
    ((PROCESSED++))
    
    # Show progress every 100 records
    if [ $((PROCESSED % 100)) -eq 0 ]; then
        echo "  Processed $PROCESSED records..."
    fi
done < <(tail -n +2 "$CSV_FILE")

echo "✓ Generated SQL for $PROCESSED records ($SKIPPED skipped due to missing Thara)"

# Display SQL file location
echo ""
echo "SQL file generated at: $TEMP_SQL_FILE"
echo ""

# Ask for confirmation before executing
read -p "Do you want to execute the SQL updates? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted. SQL file saved at: $TEMP_SQL_FILE"
    echo "You can review and execute it manually with:"
    echo "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f $TEMP_SQL_FILE"
    exit 0
fi

# Execute SQL file
echo ""
echo "Executing SQL updates..."
if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$TEMP_SQL_FILE" > /dev/null 2>&1; then
    echo "✓ SQL updates executed successfully"
else
    echo "⚠ Error executing SQL updates"
    echo "SQL file saved at: $TEMP_SQL_FILE"
    exit 1
fi

# Verify assignments
echo ""
echo "Verifying assignments..."
ASSIGNED_COUNT=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM voters WHERE level2_volunteer_id IS NOT NULL;")
echo "Total voters assigned to Level 2 volunteers: $(echo $ASSIGNED_COUNT | xargs)"

# Show distribution by volunteer
echo ""
echo "Distribution by Level 2 volunteer:"
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d $DB_NAME << EOF
SELECT 
    u.username,
    v.name,
    COUNT(vt.id) as voter_count
FROM volunteers v
JOIN users u ON v.user_id = u.id
LEFT JOIN voters vt ON vt.level2_volunteer_id = v.id
WHERE v.level = 'level2'
GROUP BY u.username, v.name
ORDER BY u.username;
EOF

# Clean up temporary file
rm -f "$TEMP_SQL_FILE"

echo ""
echo "=========================================="
echo "✓ Volunteer assignment completed!"
echo "=========================================="
echo "Processed: $PROCESSED records"
echo "Skipped: $SKIPPED records (missing Thara)"
echo "Assigned: $(echo $ASSIGNED_COUNT | xargs) voters"
echo "=========================================="
