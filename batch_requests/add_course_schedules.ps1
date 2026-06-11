# Batch API Requests for Adding Course Schedules
# API Base URL: http://localhost:8000
#
# The auto-scheduler operates per (year_level, semester_number) pair, so this
# script loops over the active curriculum range (years 1-3, semesters 1-2) and
# calls POST /auto-schedule/generate for each combination.

Write-Host "Generating course schedules across all year/semester pairs..."

$BaseUrl = "http://localhost:8000"
$years     = 1..3
$semesters = 1..2

$totalCreated = 0
$totalSkipped = 0
$anyFailures  = $false

foreach ($year in $years) {
    foreach ($sem in $semesters) {
        $uri = "$BaseUrl/auto-schedule/generate?year=$year&semester_number=$sem"
        Write-Host ""
        Write-Host "Year $year, Semester $sem  ->  POST $uri" -ForegroundColor Cyan
        try {
            $response = Invoke-RestMethod -Method Post -Uri $uri -ContentType "application/json"

            $created = if ($response.created_count) { $response.created_count } else { 0 }
            $skipped = if ($response.skipped_count) { $response.skipped_count } else { 0 }
            $totalCreated += $created
            $totalSkipped += $skipped

            Write-Host "  Created: $created   Skipped: $skipped" -ForegroundColor Green

            if ($response.skipped_schedules -and $skipped -gt 0) {
                foreach ($skip in $response.skipped_schedules | Select-Object -First 5) {
                    Write-Host "    - $skip" -ForegroundColor DarkYellow
                }
                if ($skipped -gt 5) {
                    Write-Host "    (+ $($skipped - 5) more)" -ForegroundColor DarkYellow
                }
            }
        } catch {
            $status = $null
            if ($_.Exception.Response) { $status = [int]$_.Exception.Response.StatusCode }
            # 404 = no curriculum for this (year, sem), which is fine; everything else is a real error.
            if ($status -eq 404) {
                Write-Host "  No active curriculum for Y$year S$sem (skipping)" -ForegroundColor DarkGray
            } else {
                Write-Host "  Error: $_" -ForegroundColor Red
                $anyFailures = $true
            }
        }
    }
}

Write-Host ""
Write-Host "----------------------------------------"
Write-Host "Total created: $totalCreated   Total skipped: $totalSkipped"

if ($anyFailures) {
    exit 1
}
