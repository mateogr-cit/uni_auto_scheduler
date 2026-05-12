# Run all batch scripts in parallel
$scripts = @(
    "add_faculties.ps1",
    "add_degrees.ps1",
    "add_rooms.ps1",
    "add_student_groups.ps1",
    "add_students.ps1",
    "add_courses.ps1",
    "add_professors.ps1",
    "add_semesters.ps1",
    "add_session_types.ps1",
    "add_time_slots.ps1",
    "add_professor_availability.ps1",
    "add_course_curriculum.ps1",
    "add_course_offerings.ps1",
    "add_enrollments.ps1"
)

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$jobs = @()

Write-Host "Starting all batch scripts in parallel..." -ForegroundColor Green

foreach ($script in $scripts) {
    $scriptPath = Join-Path $scriptDir $script
    if (Test-Path $scriptPath) {
        Write-Host "Starting: $script" -ForegroundColor Cyan
        $job = Start-Job -ScriptBlock {
            param($path)
            & $path
        } -ArgumentList $scriptPath
        $jobs += $job
    } else {
        Write-Host "Warning: $script not found" -ForegroundColor Yellow
    }
}

Write-Host "`nWaiting for all scripts to complete..." -ForegroundColor Green

foreach ($job in $jobs) {
    $job | Wait-Job | Out-Null
    $result = Receive-Job -Job $job
    $job | Remove-Job
}

Write-Host "`nAll scripts completed!" -ForegroundColor Green
