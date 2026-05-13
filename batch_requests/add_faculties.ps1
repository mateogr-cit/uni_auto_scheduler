# Batch API Requests for Adding Faculties
# API Base URL: http://localhost:8000

Write-Host "Adding faculties..."

try {
    # Add Faculty - Engineering
    $engResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/faculty/" `
      -ContentType "application/json" `
      -Body '{"f_name": "Faculty of Engineering", "f_abbr": "FE"}'
    Write-Host "  Created: $($engResponse.f_name) (ID: $($engResponse.f_id))"

    # Add Faculty - Economics
    $econResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/faculty/" `
      -ContentType "application/json" `
      -Body '{"f_name": "Faculty of Economics", "f_abbr": "FEc"}'
    Write-Host "  Created: $($econResponse.f_name) (ID: $($econResponse.f_id))"

    Write-Host ""
    Write-Host "Successfully created 2 faculties!"
} catch {
    Write-Host "Error creating faculties: $_" -ForegroundColor Red
    exit 1
}
