# Batch API Requests for Adding Degrees
# API Base URL: http://localhost:8000

# First, fetch existing faculties to get their IDs
$faculties = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/faculty/"

# Find faculty IDs
$engineeringFaculty = $faculties | Where-Object { $_.f_abbr -eq "FE" }
$economicsFaculty = $faculties | Where-Object { $_.f_abbr -eq "FEc" }

if (-not $engineeringFaculty) {
    Write-Host "Error: Faculty of Engineering (FE) not found. Please create it first."
    exit 1
}

if (-not $economicsFaculty) {
    Write-Host "Error: Faculty of Economics (FEc) not found. Please create it first."
    exit 1
}

$engineeringId = $engineeringFaculty.f_id
$economicsId = $economicsFaculty.f_id

Write-Host "Found Faculty of Engineering with ID: $engineeringId"
Write-Host "Found Faculty of Economics with ID: $economicsId"
Write-Host ""

# Add Degrees for Faculty of Economics
Write-Host "Adding degrees for Faculty of Economics..."

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Digital Marketing"", ""f_id"": $economicsId, ""degree_abbr"": ""DM""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Fintech and Investments"", ""f_id"": $economicsId, ""degree_abbr"": ""FI""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Business Analytics"", ""f_id"": $economicsId, ""degree_abbr"": ""BA""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""International Finance and Economics"", ""f_id"": $economicsId, ""degree_abbr"": ""IFE""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Business Administration and IT"", ""f_id"": $economicsId, ""degree_abbr"": ""BAIT""}"

Write-Host "Added 5 degrees for Faculty of Economics."
Write-Host ""

# Add Degrees for Faculty of Engineering
Write-Host "Adding degrees for Faculty of Engineering..."

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Software Engineering"", ""f_id"": $engineeringId, ""degree_abbr"": ""SE""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Computer Engineering & IT"", ""f_id"": $engineeringId, ""degree_abbr"": ""CEIT""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Artificial Intelligence and Data Science"", ""f_id"": $engineeringId, ""degree_abbr"": ""AID""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Telecommunication Engineering"", ""f_id"": $engineeringId, ""degree_abbr"": ""TE""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Robotics & Mechatronics Engineering"", ""f_id"": $engineeringId, ""degree_abbr"": ""RME""}"

Invoke-RestMethod -Method Post -Uri "http://localhost:8000/degrees/" `
  -ContentType "application/json" `
  -Body "{""d_name"": ""Electronics Engineering"", ""f_id"": $engineeringId, ""degree_abbr"": ""EE""}"

Write-Host "Added 6 degrees for Faculty of Engineering."
Write-Host ""
Write-Host "All degrees added successfully!"
