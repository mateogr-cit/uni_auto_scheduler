# Batch API Requests for Adding Faculties
# API Base URL: http://localhost:8000

# Add Faculty - Engineering
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/faculty/" `
  -ContentType "application/json" `
  -Body '{"f_name": "Faculty of Engineering", "f_abbr": "FE"}'

# Add Faculty - Economics
Invoke-RestMethod -Method Post -Uri "http://localhost:8000/faculty/" `
  -ContentType "application/json" `
  -Body '{"f_name": "Faculty of Economics", "f_abbr": "FEc"}'
