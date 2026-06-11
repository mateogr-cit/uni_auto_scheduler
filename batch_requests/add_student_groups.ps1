# Creates student groups for all degrees across 3 years x 2 semesters (66 total).
# Naming: {ABBR}_Y{year}S{semester}_{currentYear}  e.g. SE_Y1S1_2026
# The auto-scheduler matches groups by (deg_id, year_level, semester_number) so
# a separate group must exist for every (year, semester) pair you want to schedule.

$currentYear = 2026
$years       = @(1, 2, 3)
$semesters   = @(1, 2)
$capacity    = 30

Write-Host "Adding student groups..."
Write-Host "Format : {ABBR}_Y{year}S{semester}_${currentYear}"
Write-Host "Coverage: $($years.Count) years x $($semesters.Count) semesters = $($years.Count * $semesters.Count) groups per degree"
Write-Host ""

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
    Write-Host "Degree: $abbr ($($degree.d_name))"

    foreach ($year in $years) {
        foreach ($semester in $semesters) {
            $groupName = "${abbr}_Y${year}S${semester}_${currentYear}"
            try {
                $null = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/student-groups/" `
                  -ContentType "application/json" `
                  -Body "{""group_name"": ""$groupName"", ""deg_id"": $($degree.d_id), ""year_level"": $year, ""semester_number"": $semester, ""capacity"": $capacity}"
                Write-Host "  + $groupName  (Y$year S$semester)"
                $groupsCreated++
            } catch {
                Write-Host "  Error creating $groupName : $_"
            }
        }
    }
    Write-Host ""
}

Write-Host "Successfully created $groupsCreated student groups!"
Write-Host "  Degrees: $($degrees.Count)  |  Years: 1-3  |  Semesters: 1-2  |  Capacity: $capacity"
Write-Host "  Expected total: $($degrees.Count * $years.Count * $semesters.Count)"
