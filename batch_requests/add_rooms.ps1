# Batch API Requests for Adding Rooms
# API Base URL: http://localhost:8000

Write-Host "Adding rooms..."

# Large rooms
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/rooms/" `
  -ContentType "application/json" `
  -Body '{"room_id": "A1", "capacity": 100}'

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/rooms/" `
  -ContentType "application/json" `
  -Body '{"room_id": "Auditorium", "capacity": 150}'

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/rooms/" `
  -ContentType "application/json" `
  -Body '{"room_id": "E2", "capacity": 80}'

# LAB1 through LAB5 (40 capacity each)
Write-Host "Adding LAB1 through LAB5..."
for ($i = 1; $i -le 5; $i++) {
    Invoke-RestMethod -Method Post -Uri "http://localhost:8000/rooms/" `
      -ContentType "application/json" `
      -Body "{""room_id"": ""LAB$i"", ""capacity"": 40}"
}

# LAB6 (10 capacity)
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/rooms/" `
  -ContentType "application/json" `
  -Body '{"room_id": "LAB6", "capacity": 10}'

# A2 through D2 (30 capacity each)
Write-Host "Adding A2 through D2..."
$rooms = @("A2", "B2", "C2", "D2")
foreach ($room in $rooms) {
    Invoke-RestMethod -Method Post -Uri "http://localhost:8000/rooms/" `
      -ContentType "application/json" `
      -Body "{""room_id"": ""$room"", ""capacity"": 30}"
}

Write-Host ""
Write-Host "All rooms added successfully!"
Write-Host "Summary:"
Write-Host "  - A1: 100"
Write-Host "  - Auditorium: 150"
Write-Host "  - E2: 80"
Write-Host "  - LAB1-LAB5: 40 each"
Write-Host "  - LAB6: 10"
Write-Host "  - A2-D2: 30 each"
