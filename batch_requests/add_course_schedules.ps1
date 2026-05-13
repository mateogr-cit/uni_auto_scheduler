# Batch API Requests for Adding Course Schedules
# API Base URL: http://localhost:8000

Write-Host "Adding course schedules..."

try {
    $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/course-schedules/auto-generate"

    Write-Host "Successfully generated $($response.created_count) course schedules!"
    Write-Host ""
    Write-Host "Created schedules:"
    foreach ($schedule in $response.created_schedules) {
        Write-Host "  - $($schedule.course) ($($schedule.course_abbr)) for $($schedule.group)"
        Write-Host "    Professor: $($schedule.professor)"
        Write-Host "    Room: $($schedule.room)"
    }

    if ($response.skipped_count -gt 0) {
        Write-Host ""
        Write-Host "Skipped ($($response.skipped_count)):"
        foreach ($skip in $response.skipped_schedules) {
            Write-Host "  - $skip"
        }
    }
} catch {
    Write-Host "Error generating course schedules: $_" -ForegroundColor Red
    exit 1
}
