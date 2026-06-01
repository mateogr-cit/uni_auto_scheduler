# Run all batch scripts sequentially with proper dependencies
# Dependencies:
# - add_faculties must run before add_degrees
# - add_degrees must run before add_student_groups, add_courses
# - add_student_groups must run before add_students
# - add_courses must run before add_course_schedules
# - add_professors must run before add_professor_availability

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Define scripts in order with their dependencies
$scripts = @(
    @{ name = "add_faculties.ps1"; description = "Add faculties" },
    @{ name = "add_degrees.ps1"; description = "Add degrees (requires faculties)" },
    @{ name = "add_rooms.ps1"; description = "Add rooms" },
    @{ name = "add_student_groups.ps1"; description = "Add student groups (requires degrees)" },
    @{ name = "add_students.ps1"; description = "Add students (requires student groups)" },
    @{ name = "add_courses.ps1"; description = "Add courses (requires degrees)" },
    @{ name = "add_professors.ps1"; description = "Add professors" },
    @{ name = "add_session_types.ps1"; description = "Add session types" },
    @{ name = "add_time_slots.ps1"; description = "Add time slots" },
    @{ name = "add_professor_availability.ps1"; description = "Add professor availability (requires professors)" },
    @{ name = "add_course_curriculum.ps1"; description = "Add course curriculum (requires courses)" },
    @{ name = "add_course_schedules.ps1"; description = "Add course schedules (requires courses, groups, professors)" }
)

Write-Host "Running all batch scripts sequentially..." -ForegroundColor Green
Write-Host ""

$failedScripts = @()

foreach ($script in $scripts) {
    $scriptPath = Join-Path $scriptDir $script.name
    if (Test-Path $scriptPath) {
        Write-Host "Running: $($script.name) - $($script.description)" -ForegroundColor Cyan
        Write-Host "----------------------------------------" -ForegroundColor Gray

        try {
            & $scriptPath
            if ($LASTEXITCODE -ne 0) {
                throw "Script exited with code $LASTEXITCODE"
            }
            Write-Host "Completed: $($script.name)" -ForegroundColor Green
        } catch {
            Write-Host "Failed: $($script.name)" -ForegroundColor Red
            Write-Host "  Error: $_" -ForegroundColor Red
            $failedScripts += $script.name
        }

        Write-Host ""
    } else {
        Write-Host "Warning: $($script.name) not found" -ForegroundColor Yellow
        Write-Host ""
    }
}

# Create the admin user using the backend venv Python
Write-Host "Creating admin user..." -ForegroundColor Cyan
Write-Host "----------------------------------------" -ForegroundColor Gray
$pythonPath = Join-Path $scriptDir "../backend/venv/bin/python"
$adminScript = Join-Path $scriptDir "../backend/create_admin.py"
if (Test-Path $pythonPath) {
    try {
        & $pythonPath $adminScript
        Write-Host "Admin user created." -ForegroundColor Green
    } catch {
        Write-Host "Warning: Could not create admin user: $_" -ForegroundColor Yellow
        Write-Host "  Run manually: cd backend && python create_admin.py" -ForegroundColor Yellow
        $failedScripts += "create_admin.py"
    }
} else {
    Write-Host "Warning: venv Python not found at $pythonPath" -ForegroundColor Yellow
    Write-Host "  Run manually: cd backend && python create_admin.py" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Gray
if ($failedScripts.Count -eq 0) {
    Write-Host "All scripts completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login credentials:" -ForegroundColor Cyan
    Write-Host "  Admin:     username=admin       password=admin123" -ForegroundColor White
    Write-Host "  Professor: username=johnson.robert  password=johnson.123" -ForegroundColor White
    Write-Host "  Student:   username=se11.student    password=se11.123" -ForegroundColor White
} else {
    Write-Host "Some scripts failed:" -ForegroundColor Red
    foreach ($script in $failedScripts) {
        Write-Host "  - $script" -ForegroundColor Red
    }
}
