# Batch API Requests for Adding Professors
# API Base URL: http://localhost:8000

Write-Host "Adding professors..."

# Professors for Engineering Faculty
$engineeringProfessors = @(
    # Software Engineering
    @{ fname = "Robert"; lname = "Johnson"; email = "robert.johnson@cit.edu.al"; username = "johnson.robert"; courses = @("CS101", "CS201", "CS102", "SE301", "CS202", "SE302") },
    @{ fname = "Kevin"; lname = "Wilson"; email = "kevin.wilson@cit.edu.al"; username = "wilson.kevin"; courses = @("CS101", "CS201", "CS102", "SE301", "CS202", "SE302") },

    # Computer Engineering
    @{ fname = "Maria"; lname = "Garcia"; email = "maria.garcia@cit.edu.al"; username = "garcia.maria"; courses = @("CE101", "CE102", "CE201", "CE202", "CE301", "CE302") },
    @{ fname = "Jennifer"; lname = "Davis"; email = "jennifer.davis@cit.edu.al"; username = "davis.jennifer"; courses = @("CE101", "CE102", "CE201", "CE202", "CE301", "CE302") },

    # AI
    @{ fname = "David"; lname = "Chen"; email = "david.chen@cit.edu.al"; username = "chen.david"; courses = @("AI101", "AI102", "AI201", "AI202", "AI301", "AI302") },
    @{ fname = "Alex"; lname = "Kim"; email = "alex.kim@cit.edu.al"; username = "kim.alex"; courses = @("AI101", "AI102", "AI201", "AI202", "AI301", "AI302") },

    # Telecommunications
    @{ fname = "Sarah"; lname = "Williams"; email = "sarah.williams@cit.edu.al"; username = "williams.sarah"; courses = @("TE101", "TE102", "TE201", "TE202", "TE301", "TE302") },
    @{ fname = "Brian"; lname = "Lee"; email = "brian.lee@cit.edu.al"; username = "lee.brian"; courses = @("TE101", "TE102", "TE201", "TE202", "TE301", "TE302") },

    # Robotics
    @{ fname = "James"; lname = "Anderson"; email = "james.anderson@cit.edu.al"; username = "anderson.james"; courses = @("RM101", "RM102", "RM201", "RM202", "RM301", "RM302") },
    @{ fname = "Carol"; lname = "Nguyen"; email = "carol.nguyen@cit.edu.al"; username = "nguyen.carol"; courses = @("RM101", "RM102", "RM201", "RM202", "RM301", "RM302") },

    # Electrical Engineering
    @{ fname = "Emily"; lname = "Brown"; email = "emily.brown@cit.edu.al"; username = "brown.emily"; courses = @("EE101", "EE102", "EE201", "EE202", "EE301", "EE302") },
    @{ fname = "Frank"; lname = "Miller"; email = "frank.miller@cit.edu.al"; username = "miller.frank"; courses = @("EE101", "EE102", "EE201", "EE202", "EE301", "EE302") },

    # Mathematics (shared - need 3 professors)
    @{ fname = "Michael"; lname = "Taylor"; email = "michael.taylor@cit.edu.al"; username = "taylor.michael"; courses = @("MATH101", "MATH102", "MATH201", "MATH202") },
    @{ fname = "Susan"; lname = "Moore"; email = "susan.moore@cit.edu.al"; username = "moore.susan"; courses = @("MATH101", "MATH102", "MATH201", "MATH202") },
    @{ fname = "Richard"; lname = "Jackson"; email = "richard.jackson@cit.edu.al"; username = "jackson.richard"; courses = @("MATH101", "MATH102", "MATH201", "MATH202") },

    # Physics (shared - need 2 professors)
    @{ fname = "Lisa"; lname = "Martinez"; email = "lisa.martinez@cit.edu.al"; username = "martinez.lisa"; courses = @("PHYS101", "PHYS102") },
    @{ fname = "Paul"; lname = "Garcia"; email = "paul.garcia@cit.edu.al"; username = "garcia.paul"; courses = @("PHYS101", "PHYS102") }
)

# Professors for Economics Faculty
$economicsProfessors = @(
    # Digital Marketing
    @{ fname = "Thomas"; lname = "Miller"; email = "thomas.miller@cit.edu.al"; username = "miller.thomas"; courses = @("DM101", "DM102", "DM201", "DM202", "DM301", "DM302") },
    @{ fname = "Nancy"; lname = "Clark"; email = "nancy.clark@cit.edu.al"; username = "clark.nancy"; courses = @("DM101", "DM102", "DM201", "DM202", "DM301", "DM302") },

    # Finance
    @{ fname = "Amanda"; lname = "Thompson"; email = "amanda.thompson@cit.edu.al"; username = "thompson.amanda"; courses = @("FI101", "FI102", "FI201", "FI202", "FI301", "FI302") },
    @{ fname = "George"; lname = "Harris"; email = "george.harris@cit.edu.al"; username = "harris.george"; courses = @("FI101", "FI102", "FI201", "FI202", "FI301", "FI302") },

    # Business Analytics
    @{ fname = "Christopher"; lname = "White"; email = "christopher.white@cit.edu.al"; username = "white.christopher"; courses = @("BA101", "BA102", "BA201", "BA202", "BA301", "BA302") },
    @{ fname = "Diana"; lname = "Lewis"; email = "diana.lewis@cit.edu.al"; username = "lewis.diana"; courses = @("BA101", "BA102", "BA201", "BA202", "BA301", "BA302") },

    # International Economics
    @{ fname = "Jessica"; lname = "Harris"; email = "jessica.harris@cit.edu.al"; username = "harris.jessica"; courses = @("IFE101", "IFE102", "IFE201", "IFE202", "IFE301", "IFE302") },
    @{ fname = "Edward"; lname = "Walker"; email = "edward.walker@cit.edu.al"; username = "walker.edward"; courses = @("IFE101", "IFE102", "IFE201", "IFE202", "IFE301", "IFE302") },

    # Business Administration & IT
    @{ fname = "Daniel"; lname = "Clark"; email = "daniel.clark@cit.edu.al"; username = "clark.daniel"; courses = @("BAIT101", "BAIT102", "BAIT201", "BAIT202", "BAIT301", "BAIT302") },
    @{ fname = "Fiona"; lname = "Hall"; email = "fiona.hall@cit.edu.al"; username = "hall.fiona"; courses = @("BAIT101", "BAIT102", "BAIT201", "BAIT202", "BAIT301", "BAIT302") },

    # Economics (shared - need 2 professors)
    @{ fname = "Michelle"; lname = "Lewis"; email = "michelle.lewis@cit.edu.al"; username = "lewis.michelle"; courses = @("ECON101", "ECON102") },
    @{ fname = "Henry"; lname = "Young"; email = "henry.young@cit.edu.al"; username = "young.henry"; courses = @("ECON101", "ECON102") },

    # Business (shared - need 2 professors)
    @{ fname = "Robert"; lname = "Walker"; email = "robert.walker@cit.edu.al"; username = "walker.robert"; courses = @("BUS101", "BUS102") },
    @{ fname = "Irene"; lname = "King"; email = "irene.king@cit.edu.al"; username = "king.irene"; courses = @("BUS101", "BUS102") },

    # Statistics (shared - need 2 professors)
    @{ fname = "Patricia"; lname = "Hall"; email = "patricia.hall@cit.edu.al"; username = "hall.patricia"; courses = @("STAT101", "STAT201") },
    @{ fname = "Jack"; lname = "Wright"; email = "jack.wright@cit.edu.al"; username = "wright.jack"; courses = @("STAT101", "STAT201") },

    # English (shared - need 2 professors)
    @{ fname = "Mark"; lname = "Young"; email = "mark.young@cit.edu.al"; username = "young.mark"; courses = @("ENG101", "ENG102") },
    @{ fname = "Karen"; lname = "Scott"; email = "karen.scott@cit.edu.al"; username = "scott.karen"; courses = @("ENG101", "ENG102") },

    # Computer Literacy (shared - need 2 professors)
    @{ fname = "Elizabeth"; lname = "King"; email = "elizabeth.king@cit.edu.al"; username = "king.elizabeth"; courses = @("COMP101") },
    @{ fname = "Larry"; lname = "Green"; email = "larry.green@cit.edu.al"; username = "green.larry"; courses = @("COMP101") }
)

$allProfessors = $engineeringProfessors + $economicsProfessors
$professorsCreated = 0

Write-Host "Creating $($allProfessors.Count) professors..."
Write-Host ""

# Fetch all courses to get course IDs
try {
    $courses = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/courses/"
    Write-Host "Found $($courses.Count) courses."

    # Create course abbreviation to ID mapping
    $courseMap = @{}
    foreach ($course in $courses) {
        $courseMap[$course.c_abbr] = $course.c_id
    }
} catch {
    Write-Host "Error: Could not fetch courses. Please create courses first."
    exit 1
}

foreach ($prof in $allProfessors) {
    try {
        # Create the professor user
        $password = "$($prof.lname).123"
        $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/users/" `
          -ContentType "application/json" `
          -Body "{""fname"": ""$($prof.fname)"", ""lname"": ""$($prof.lname)"", ""email"": ""$($prof.email)"", ""username"": ""$($prof.username)"", ""password"": ""$password"", ""u_role"": ""professor""}"

        $u_id = $response.u_id
        Write-Host "  Created: $($prof.fname) $($prof.lname) (ID: $u_id)"

        # Assign courses to professor
        $courseIds = @()
        foreach ($abbr in $prof.courses) {
            if ($courseMap.ContainsKey($abbr)) {
                $courseIds += $courseMap[$abbr]
            }
        }

        if ($courseIds.Count -gt 0) {
            $courseIdsJson = $courseIds -join ','
            try {
                $profResponse = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/professors/" `
                  -ContentType "application/json" `
                  -Body "{""u_id"": $u_id, ""course_ids"": [$courseIdsJson]}"

                Write-Host "    Assigned courses: $($prof.courses -join ', ')"
            } catch {
                Write-Host "    Warning: Could not assign courses to professor"
            }
        }

        $professorsCreated++
    } catch {
        Write-Host "  Error creating $($prof.fname) $($prof.lname): $_"
    }
}

Write-Host ""
Write-Host "Successfully created $professorsCreated professors!"
Write-Host ""
Write-Host "Course coverage:"
Write-Host "  - Each degree-specific course: 2 professors"
Write-Host "  - Shared courses (Math, Physics, English, Stats, Econ, Business, Comp): 2-3 professors"
Write-Host ""
Write-Host "This ensures every course has at least 1 professor, with shared courses having"
Write-Host "multiple professors to support different class sections."
