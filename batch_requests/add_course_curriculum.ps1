# Batch API Requests for Adding Course Curriculum
# API Base URL: http://localhost:8000

Write-Host "Adding course curriculum..."

# Fetch all courses
$courses = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/courses/"

if ($courses.Count -eq 0) {
    Write-Host "Error: No courses found. Please create courses first."
    exit 1
}

Write-Host "Found $($courses.Count) courses."

# Fetch all degrees
$degrees = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/degrees/"

if ($degrees.Count -eq 0) {
    Write-Host "Error: No degrees found. Please create degrees first."
    exit 1
}

Write-Host "Found $($degrees.Count) degrees."
Write-Host ""

# Create course curriculum entries
# Logic: For each course, create curriculum entries for each degree it's assigned to
# based on the course's year and semester
$curriculumCreated = 0

Write-Host "Creating course curriculum entries..."
Write-Host ""

foreach ($course in $courses) {
    # Get degrees for this course
    $courseDegrees = @()

    # Check if course has degree_ids (from the API response)
    if ($course.degrees -and $course.degrees.Count -gt 0) {
        foreach ($deg in $course.degrees) {
            $courseDegrees += $deg.d_id
        }
    } elseif ($course.degree_id) {
        $courseDegrees += $course.degree_id
    }

    if ($courseDegrees.Count -eq 0) {
        Write-Host "  Warning: No degrees found for $($course.c_name)"
        continue
    }

    foreach ($degId in $courseDegrees) {
        $degree = $degrees | Where-Object { $_.d_id -eq $degId }

        if ($degree) {
            try {
                $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/course-curriculum/" `
                  -ContentType "application/json" `
                  -Body "{""c_id"": $($course.c_id), ""degree_id"": $($degree.d_id), ""year_level"": $($course.c_year), ""is_active"": true, ""semester_number"": $($course.c_semester)}"

                Write-Host "  Created: $($course.c_abbr) - $($course.c_name) for $($degree.d_name) (Year $($course.c_year), Semester $($course.c_semester))"
                $curriculumCreated++
            } catch {
                Write-Host "  Error creating curriculum for $($course.c_abbr) in $($degree.d_name): $_"
            }
        }
    }
}

Write-Host ""
Write-Host "Successfully created $curriculumCreated curriculum entries!"
Write-Host ""
Write-Host "Note: Course curriculum links courses to degrees and defines"
Write-Host "      which courses are taught in which year and semester."
Write-Host "      This is required for auto-scheduling."
