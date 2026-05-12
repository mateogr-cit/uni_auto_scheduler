# Batch API Requests for Adding Course Offerings
# API Base URL: http://localhost:8000

Write-Host "Adding course offerings..."

# Fetch all courses
$courses = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/courses/"

if ($courses.Count -eq 0) {
    Write-Host "Error: No courses found. Please create courses first."
    exit 1
}

Write-Host "Found $($courses.Count) courses."

# Fetch all semesters
$semesters = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/semesters/"

if ($semesters.Count -eq 0) {
    Write-Host "Error: No semesters found. Please create semesters first."
    exit 1
}

Write-Host "Found $($semesters.Count) semesters."

# Fetch all student groups
$groups = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/student-groups/"

if ($groups.Count -eq 0) {
    Write-Host "Error: No student groups found. Please create student groups first."
    exit 1
}

Write-Host "Found $($groups.Count) student groups."
Write-Host ""

# Create course offerings
# Logic: For each semester, create offerings for courses that match the semester type
# Fall = semester 1, Spring = semester 2
$offeringsCreated = 0
$offeringsSkipped = 0

Write-Host "Creating course offerings..."
Write-Host ""

foreach ($semester in $semesters) {
    # Determine semester number from semester name
    $semNameLower = $semester.sem_name.ToLower()
    if ($semNameLower -like "*fall*" -or $semNameLower -like "*autumn*") {
        $semesterNumber = 1
    } elseif ($semNameLower -like "*spring*") {
        $semesterNumber = 2
    } else {
        # Default to checking month
        $startDate = [DateTime]::Parse($semester.start_date)
        $semesterNumber = if ($startDate.Month -ge 8) { 1 } else { 2 }
    }

    Write-Host "Processing semester: $($semester.sem_name) (Semester $semesterNumber)"

    # Get courses for this semester number
    $semesterCourses = $courses | Where-Object { $_.c_semester -eq $semesterNumber -and $_.is_active }

    Write-Host "  Found $($semesterCourses.Count) courses for this semester"

    foreach ($course in $semesterCourses) {
        # Get student groups matching the course's year level
        $matchingGroups = $groups | Where-Object { $_.year_level -eq $course.c_year }

        foreach ($group in $matchingGroups) {
            try {
                $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/course-offerings/" `
                  -ContentType "application/json" `
                  -Body "{""c_id"": $($course.c_id), ""sem_id"": $($semester.sem_id), ""max_students"": $($group.capacity), ""group_id"": $($group.group_id), ""hrs_per_week"": 4}"

                Write-Host "    Created: $($course.c_abbr) - $($course.c_name) for $($group.group_name)"
                $offeringsCreated++
            } catch {
                # Check if it's a duplicate (409) or other error
                if ($_.Exception.Response.StatusCode -eq 409 -or $_.Exception.Message -like "*duplicate*") {
                    Write-Host "    Skipped: $($course.c_abbr) for $($group.group_name) (already exists)"
                    $offeringsSkipped++
                } else {
                    Write-Host "    Error creating offering for $($course.c_abbr): $_"
                }
            }
        }
    }

    Write-Host ""
}

Write-Host "Course offerings creation complete!"
Write-Host "  Created: $offeringsCreated"
Write-Host "  Skipped (duplicates): $offeringsSkipped"
Write-Host ""
Write-Host "Note: Course offerings link courses to semesters and student groups."
Write-Host "      Each offering represents a specific instance of a course for a group in a semester."
