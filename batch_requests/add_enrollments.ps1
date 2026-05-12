# Batch API Requests for Adding Enrollments
# API Base URL: http://localhost:8000

Write-Host "Adding enrollments..."

# Check if students and offerings exist
$students = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/students/"

if ($students.Count -eq 0) {
    Write-Host "Error: No students found. Please create students first."
    exit 1
}

Write-Host "Found $($students.Count) students."

$offerings = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/course-offerings/"

if ($offerings.Count -eq 0) {
    Write-Host "Error: No course offerings found. Please create course offerings first."
    exit 1
}

Write-Host "Found $($offerings.Count) course offerings."
Write-Host ""

# Option 1: Auto-enroll all students to all offerings
Write-Host "Auto-enrolling students to course offerings..."
Write-Host "This will enroll each student in all available course offerings."
Write-Host ""

$confirm = Read-Host "Continue with auto-enrollment? (y/n)"

if ($confirm -ne "y") {
    Write-Host "Auto-enrollment cancelled."
    exit 0
}

try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/enrollments/auto/"

    Write-Host ""
    Write-Host "Auto-enrollment complete!"
    Write-Host $response.message
    Write-Host ""
} catch {
    Write-Host "Error during auto-enrollment: $_"
    exit 1
}

# Option 2: Manual enrollment example (commented out)
# Uncomment and modify this section for custom enrollment logic

<#
Write-Host ""
Write-Host "Manual enrollment example..."
Write-Host ""

# Fetch student groups to match students with offerings
$groups = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/student-groups/"

# Create a mapping of group_id to students in that group
$groupStudents = @{}
foreach ($student in $students) {
    if ($student.group_id) {
        if (-not $groupStudents.ContainsKey($student.group_id)) {
            $groupStudents[$student.group_id] = @()
        }
        $groupStudents[$student.group_id] += $student
    }
}

# Enroll students in offerings that match their group
$enrollmentsCreated = 0
$enrollmentsSkipped = 0

foreach ($offering in $offerings) {
    if ($groupStudents.ContainsKey($offering.group_id)) {
        foreach ($student in $groupStudents[$offering.group_id]) {
            try {
                $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/enrollments/" `
                  -ContentType "application/json" `
                  -Body "{""offering_id"": $($offering.offering_id), ""u_id"": $($student.u_id)}"

                Write-Host "  Enrolled: $($student.fname) $($student.lname) in offering $($offering.offering_id)"
                $enrollmentsCreated++
            } catch {
                if ($_.Exception.Response.StatusCode -eq 409 -or $_.Exception.Message -like "*duplicate*") {
                    Write-Host "  Skipped: $($student.fname) $($student.lname) already enrolled"
                    $enrollmentsSkipped++
                } else {
                    Write-Host "  Error enrolling $($student.fname) $($student.lname): $_"
                }
            }
        }
    }
}

Write-Host ""
Write-Host "Manual enrollment complete!"
Write-Host "  Created: $enrollmentsCreated"
Write-Host "  Skipped (duplicates): $enrollmentsSkipped"
#>

Write-Host ""
Write-Host "Note: Enrollments link students to specific course offerings."
Write-Host "      Each enrollment represents a student's registration in a course for a specific semester and group."
