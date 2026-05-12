# Batch API Requests for Adding Time Slots
# API Base URL: http://localhost:8000

Write-Host "Adding time slots..."

# Define time slots for each day
# Format: day_of_week, start_time (HH:MM), end_time (HH:MM)
$timeSlots = @(
    # Monday
    @{ day = "Monday"; start = "08:00"; end = "10:00" },
    @{ day = "Monday"; start = "10:00"; end = "12:00" },
    @{ day = "Monday"; start = "12:00"; end = "14:00" },
    @{ day = "Monday"; start = "14:00"; end = "16:00" },
    @{ day = "Monday"; start = "16:00"; end = "18:00" },

    # Tuesday
    @{ day = "Tuesday"; start = "08:00"; end = "10:00" },
    @{ day = "Tuesday"; start = "10:00"; end = "12:00" },
    @{ day = "Tuesday"; start = "12:00"; end = "14:00" },
    @{ day = "Tuesday"; start = "14:00"; end = "16:00" },
    @{ day = "Tuesday"; start = "16:00"; end = "18:00" },

    # Wednesday
    @{ day = "Wednesday"; start = "08:00"; end = "10:00" },
    @{ day = "Wednesday"; start = "10:00"; end = "12:00" },
    @{ day = "Wednesday"; start = "12:00"; end = "14:00" },
    @{ day = "Wednesday"; start = "14:00"; end = "16:00" },
    @{ day = "Wednesday"; start = "16:00"; end = "18:00" },

    # Thursday
    @{ day = "Thursday"; start = "08:00"; end = "10:00" },
    @{ day = "Thursday"; start = "10:00"; end = "12:00" },
    @{ day = "Thursday"; start = "12:00"; end = "14:00" },
    @{ day = "Thursday"; start = "14:00"; end = "16:00" },
    @{ day = "Thursday"; start = "16:00"; end = "18:00" },

    # Friday
    @{ day = "Friday"; start = "08:00"; end = "10:00" },
    @{ day = "Friday"; start = "10:00"; end = "12:00" },
    @{ day = "Friday"; start = "12:00"; end = "14:00" },
    @{ day = "Friday"; start = "14:00"; end = "16:00" },
    @{ day = "Friday"; start = "16:00"; end = "18:00" }
)

$timeSlotsCreated = 0

Write-Host "Creating $($timeSlots.Count) time slots..."
Write-Host ""

foreach ($slot in $timeSlots) {
    try {
        $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/time-slots/" `
          -ContentType "application/json" `
          -Body "{""day_of_week"": ""$($slot.day)"", ""start_time"": ""$($slot.start)"", ""end_time"": ""$($slot.end)""}"

        Write-Host "  Created: $($slot.day) $($slot.start)-$($slot.end)"
        $timeSlotsCreated++
    } catch {
        Write-Host "  Error creating $($slot.day) $($slot.start)-$($slot.end): $_"
    }
}

Write-Host ""
Write-Host "Successfully created $timeSlotsCreated time slots!"
Write-Host ""
Write-Host "Note: Time slots are required for auto-scheduling."
Write-Host "      Each time slot represents a 2-hour block on a specific day."
