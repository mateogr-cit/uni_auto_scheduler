# Batch API Requests for Adding Student Groups
# API Base URL: http://localhost:8000

$currentYear = 2026

Write-Host "Adding student groups..."
Write-Host "Format: {degree_abbr}1_{current_year}"
Write-Host ""

# Fetch all degrees
$degrees = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/degrees/"

if ($degrees.Count -eq 0) {
    Write-Host "Error: No degrees found. Please create degrees first."
    exit 1
}

Write-Host "Found $($degrees.Count) degrees."
Write-Host ""

$groupsCreated = 0

foreach ($degree in $degrees) {
    $abbr = $degree.degree_abbr
    $groupName = "${abbr}1_${currentYear}"

    try {
        $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/student-groups/" `
          -ContentType "application/json" `
          -Body "{""group_name"": ""$groupName"", ""deg_id"": $($degree.d_id), ""year_level"": 1, ""semester_number"": 1, ""capacity"": 40}"

        Write-Host "Created group: $groupName (Degree: $($degree.d_name))"
        $groupsCreated++
    } catch {
        Write-Host "Error creating group for $($degree.d_name): $_"
    }
}

Write-Host ""
Write-Host "Successfully created $groupsCreated student groups!"
Write-Host ""
Write-Host "Note: Each group has been set with:"
Write-Host "  - Year Level: 1"
Write-Host "  - Semester: 1"
Write-Host "  - Capacity: 40"
Write-Host ""
Write-Host "You can add more groups manually as needed."
