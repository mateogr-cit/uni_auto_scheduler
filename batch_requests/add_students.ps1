# Adds students to all groups. Supports both naming formats:
#   New: SE_Y1S1_2026  -> abbr=SE, year=1, sem=1  -> username sey1s1u1
#   Old: SE1_2026      -> abbr=SE1                 -> username se1gu{id}u1
#
# 8 students per group. With 66 groups that is 528 students total.
# Username pattern: {abbr}y{year}s{sem}u{n}   e.g. sey1s1u1
# Password pattern: {username}.123             e.g. sey1s1u1.123

$studentsPerGroup = 8

Write-Host "Adding students to student groups ($studentsPerGroup per group)..."
Write-Host ""

$groups = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/student-groups/"

if ($groups.Count -eq 0) {
    Write-Host "Error: No student groups found. Please create student groups first."
    exit 1
}

Write-Host "Found $($groups.Count) student groups."
Write-Host ""

$studentsCreated = 0

foreach ($group in $groups) {
    # Extract degree abbreviation (handles both SE1_2026 and SE_Y1S1_2026)
    $abbr = ($group.group_name -split '_')[0] -replace '\d+$', ''

    # Extract year/semester from new-style names (SE_Y1S1_2026)
    $yearNum = ""
    $semNum  = ""
    if ($group.group_name -match '_Y(\d+)S(\d+)_') {
        $yearNum = $Matches[1]
        $semNum  = $Matches[2]
    }

    Write-Host "Group: $($group.group_name)  (abbr=$abbr)"

    for ($i = 1; $i -le $studentsPerGroup; $i++) {
        $fname = "Student"
        if ($yearNum -ne "") {
            $lname    = "${abbr}Y${yearNum}S${semNum}U$i"          # e.g. SEY1S1U1
            $username = "$($abbr.ToLower())y${yearNum}s${semNum}u$i"  # sey1s1u1
        } else {
            $lname    = "${abbr}G$($group.group_id)U$i"
            $username = "$($abbr.ToLower())g$($group.group_id)u$i"
        }
        $email    = "$username@cit.edu.al"
        $password = "$username.123"

        try {
            $userResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/users/" `
              -ContentType "application/json" `
              -Body "{""fname"": ""$fname"", ""lname"": ""$lname"", ""email"": ""$email"", ""username"": ""$username"", ""password"": ""$password"", ""u_role"": ""student""}"

            $null = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/students/" `
              -ContentType "application/json" `
              -Body "{""u_id"": $($userResponse.u_id), ""s_status"": ""active"", ""group_id"": $($group.group_id)}"

            $studentsCreated++
        } catch {
            Write-Host "  Error creating student ${i}: $_"
        }
    }
    Write-Host "  Created $studentsPerGroup students."
}

Write-Host ""
Write-Host "Successfully created $studentsCreated students!"
Write-Host "  $studentsPerGroup per group  x  $($groups.Count) groups"
Write-Host "  Username: {abbr}y{year}s{sem}u{n}   e.g. sey1s1u1"
Write-Host "  Password: {username}.123             e.g. sey1s1u1.123"
