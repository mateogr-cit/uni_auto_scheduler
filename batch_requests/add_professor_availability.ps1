# Batch API Requests for Adding Professor Availability
# API Base URL: http://localhost:8000

Write-Host "Adding professor availability..."

# Fetch all professors
$professors = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/professors/"

if ($professors.Count -eq 0) {
    Write-Host "Error: No professors found. Please create professors first."
    exit 1
}

Write-Host "Found $($professors.Count) professors."
Write-Host ""

# Define availability for each professor
# Each professor is available Monday-Friday, 8:00-18:00
$availabilityCreated = 0

foreach ($prof in $professors) {
    Write-Host "Setting availability for $($prof.fname) $($prof.lname)..."

    $availabilities = @(
        @{ day = "Monday"; start = "08:00"; end = "18:00"; available = $true },
        @{ day = "Tuesday"; start = "08:00"; end = "18:00"; available = $true },
        @{ day = "Wednesday"; start = "08:00"; end = "18:00"; available = $true },
        @{ day = "Thursday"; start = "08:00"; end = "18:00"; available = $true },
        @{ day = "Friday"; start = "08:00"; end = "18:00"; available = $true }
    )

    foreach ($avail in $availabilities) {
        try {
            $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/professor-availability/" `
              -ContentType "application/json" `
              -Body "{""u_id"": $($prof.u_id), ""day_of_week"": ""$($avail.day)"", ""start_time"": ""$($avail.start)"", ""end_time"": ""$($avail.end)"", ""is_available"": $($avail.available.ToString().ToLower())}"

            Write-Host "  Created: $($avail.day) $($avail.start)-$($avail.end)"
            $availabilityCreated++
        } catch {
            Write-Host "  Error creating availability for $($avail.day): $_"
        }
    }

    Write-Host ""
}

Write-Host "Successfully created $availabilityCreated availability records!"
Write-Host ""
Write-Host "Note: Professor availability is required for auto-scheduling."
Write-Host "      Each professor needs availability for each day they can teach."
