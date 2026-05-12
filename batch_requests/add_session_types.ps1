# Batch API Requests for Adding Session Types
# API Base URL: http://localhost:8000

Write-Host "Adding session types..."

# Define session types to create
# Format: type_name, duration_hours
$sessionTypes = @(
    @{ name = "Lecture"; duration = 2 },
    @{ name = "Seminar"; duration = 2 }
)

$sessionTypesCreated = 0

Write-Host "Creating $($sessionTypes.Count) session types..."
Write-Host ""

foreach ($st in $sessionTypes) {
    try {
        $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/session-types/" `
          -ContentType "application/json" `
          -Body "{""type_name"": ""$($st.name)"", ""duration_hours"": $($st.duration)}"

        Write-Host "  Created: $($st.name) ($($st.duration) hours)"
        $sessionTypesCreated++
    } catch {
        Write-Host "  Error creating $($st.name): $_"
    }
}

Write-Host ""
Write-Host "Successfully created $sessionTypesCreated session types!"
Write-Host ""
Write-Host "Note: Session types are required for auto-scheduling."
Write-Host "      Each course offering needs both Lecture and Seminar sessions."
