# Batch API Requests for Adding Semesters
# API Base URL: http://localhost:8000

Write-Host "Adding semesters..."

# Define semesters to create
# Format: name, start_date (YYYY-MM-DD), end_date (YYYY-MM-DD), is_special_semester, week_count
$semesters = @(
    # Academic Year 2024-2025
    @{ name = "Fall 2024"; start = "2024-09-01"; end = "2025-01-15"; special = $false; weeks = 15 },
    @{ name = "Spring 2025"; start = "2025-02-01"; end = "2025-06-15"; special = $false; weeks = 15 },

    # Academic Year 2025-2026
    @{ name = "Fall 2025"; start = "2025-09-01"; end = "2026-01-15"; special = $false; weeks = 15 },
    @{ name = "Spring 2026"; start = "2026-02-01"; end = "2026-06-15"; special = $false; weeks = 15 },

    # Academic Year 2026-2027
    @{ name = "Fall 2026"; start = "2026-09-01"; end = "2027-01-15"; special = $false; weeks = 15 },
    @{ name = "Spring 2027"; start = "2027-02-01"; end = "2027-06-15"; special = $false; weeks = 15 }
)

$semestersCreated = 0

Write-Host "Creating $($semesters.Count) semesters..."
Write-Host ""

foreach ($sem in $semesters) {
    try {
        $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/semesters/" `
          -ContentType "application/json" `
          -Body "{""sem_name"": ""$($sem.name)"", ""start_date"": ""$($sem.start)"", ""end_date"": ""$($sem.end)"", ""is_special_semester"": $($sem.special.ToString().ToLower()), ""week_count"": $($sem.weeks)}"

        Write-Host "  Created: $($sem.name) ($($sem.start) to $($sem.end))"
        $semestersCreated++
    } catch {
        Write-Host "  Error creating $($sem.name): $_"
    }
}

Write-Host ""
Write-Host "Successfully created $semestersCreated semesters!"
Write-Host ""
