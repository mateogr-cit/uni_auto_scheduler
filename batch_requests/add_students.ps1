# Batch API Requests for Adding Students to Groups
# API Base URL: http://localhost:8000

# Groups with 10 students only
$limitedGroups = @("IFE", "FI", "RME", "TE", "EE")

Write-Host "Adding students to student groups..."
Write-Host ""

# Fetch all student groups
$groups = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/student-groups/"

if ($groups.Count -eq 0) {
    Write-Host "Error: No student groups found. Please create student groups first."
    exit 1
}

Write-Host "Found $($groups.Count) student groups."
Write-Host ""

$studentsCreated = 0

foreach ($group in $groups) {
    # Extract degree abbreviation from group name (format: {abbr}1_{year})
    $abbr = ($group.group_name -split '_')[0] -replace '\d+$', ''

    # Determine number of students based on abbreviation
    if ($limitedGroups -contains $abbr) {
        $numStudents = 10
    } else {
        $numStudents = 30
    }

    Write-Host "Group: $($group.group_name) - Adding $numStudents students..."

    for ($i = 1; $i -le $numStudents; $i++) {
        $fname = "Student"
        $lname = "$($abbr)$i"
        $username = "$($lname.ToLower()).$($fname.ToLower())"
        $email = "$username@cit.edu.al"
        $password = "$($lname.ToLower()).123"

        try {
            # Create user
            $userResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/users/" `
              -ContentType "application/json" `
              -Body "{""fname"": ""$fname"", ""lname"": ""$lname"", ""email"": ""$email"", ""username"": ""$username"", ""password"": ""$password"", ""u_role"": ""student""}"

            # Create student record
            $studentResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/students/" `
              -ContentType "application/json" `
              -Body "{""u_id"": $($userResponse.u_id), ""s_status"": ""active"", ""group_id"": $($group.group_id)}"

            $studentsCreated++
        } catch {
            Write-Host "  Error creating student ${i}: $_"
        }
    }

    Write-Host "  Created $numStudents students for group $($group.group_name)"
    Write-Host ""
}

Write-Host "Successfully created $studentsCreated students!"
Write-Host ""
Write-Host "Summary:"
Write-Host "  - Groups with 10 students: IFE, FI, RME, TE, EE"
Write-Host "  - All other groups: 30 students each"
Write-Host "  - Total students created: $studentsCreated"
