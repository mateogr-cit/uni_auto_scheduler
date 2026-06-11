# Adds 22 rooms total.
# Original 14: A1(100), Auditorium(150), E2(80), LAB1-5(40), LAB6(10), A2-D2(30)
# Added 8 for full-school capacity: B1(60), C1(60), E3(80), F1(35), G1(35), H1(30), LAB7(40), LAB8(40)
# Total slot space: 22 rooms x 25 time slots = 550 room-slot combos
# Full-school need: ~66 groups x 6 courses x 2 sessions = 792 -> spread across semesters, ~130/run

Write-Host "Adding rooms..."
Write-Host ""

$rooms = @(
    # Large lecture halls
    @{ id = "A1";         capacity = 100 },
    @{ id = "Auditorium"; capacity = 150 },
    @{ id = "E2";         capacity = 80  },
    @{ id = "E3";         capacity = 80  },
    @{ id = "B1";         capacity = 60  },
    @{ id = "C1";         capacity = 60  },

    # Mid-size classrooms (30-45)
    @{ id = "A2";         capacity = 30  },
    @{ id = "B2";         capacity = 30  },
    @{ id = "C2";         capacity = 30  },
    @{ id = "D2";         capacity = 30  },
    @{ id = "F1";         capacity = 35  },
    @{ id = "G1";         capacity = 35  },
    @{ id = "H1";         capacity = 30  },

    # Labs (40 capacity)
    @{ id = "LAB1";       capacity = 40  },
    @{ id = "LAB2";       capacity = 40  },
    @{ id = "LAB3";       capacity = 40  },
    @{ id = "LAB4";       capacity = 40  },
    @{ id = "LAB5";       capacity = 40  },
    @{ id = "LAB7";       capacity = 40  },
    @{ id = "LAB8";       capacity = 40  },

    # Small lab (10) and specialist room (10)
    @{ id = "LAB6";       capacity = 10  },
    @{ id = "SEM1";       capacity = 15  }
)

$created = 0
foreach ($room in $rooms) {
    try {
        $null = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/rooms/" `
          -ContentType "application/json" `
          -Body "{""room_id"": ""$($room.id)"", ""capacity"": $($room.capacity)}"
        Write-Host "  $($room.id): $($room.capacity) seats"
        $created++
    } catch {
        Write-Host "  Error adding $($room.id): $_"
    }
}

Write-Host ""
Write-Host "Added $created rooms ($($rooms.Count) attempted)."
Write-Host "Total slot space: $created rooms x 25 time slots = $($created * 25) combos"
