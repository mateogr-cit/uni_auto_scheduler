# Batch API Requests for Adding Courses
# API Base URL: http://localhost:8000

Write-Host "Adding courses..."

# Fetch all degrees
$degrees = Invoke-RestMethod -Method Get -Uri "http://localhost:8000/degrees/"

if ($degrees.Count -eq 0) {
    Write-Host "Error: No degrees found. Please create degrees first."
    exit 1
}

Write-Host "Found $($degrees.Count) degrees."
Write-Host ""

# Create degree abbreviation to ID mapping
$degreeMap = @{}
foreach ($degree in $degrees) {
    $degreeMap[$degree.degree_abbr] = $degree.d_id
}

# Shared courses (assigned to multiple degrees)
$sharedCourses = @(
    # Mathematics/Calculus - Engineering degrees
    @{ name = "Calculus I"; abbr = "MATH101"; weight = 4; year = 1; semester = 1; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE") },
    @{ name = "Calculus II"; abbr = "MATH102"; weight = 4; year = 1; semester = 2; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE") },
    @{ name = "Linear Algebra"; abbr = "MATH201"; weight = 3; year = 2; semester = 1; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE") },
    @{ name = "Discrete Mathematics"; abbr = "MATH202"; weight = 3; year = 2; semester = 2; degrees = @("SE", "CEIT", "AID") },

    # Physics - Engineering degrees
    @{ name = "Physics I"; abbr = "PHYS101"; weight = 4; year = 1; semester = 1; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE") },
    @{ name = "Physics II"; abbr = "PHYS102"; weight = 4; year = 1; semester = 2; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE") },

    # English/Communication - All degrees
    @{ name = "Academic Writing"; abbr = "ENG101"; weight = 2; year = 1; semester = 1; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE", "DM", "FI", "BA", "IFE", "BAIT") },
    @{ name = "Business Communication"; abbr = "ENG102"; weight = 2; year = 1; semester = 2; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE", "DM", "FI", "BA", "IFE", "BAIT") },

    # Statistics - Engineering, Economics, Business Analytics
    @{ name = "Probability and Statistics"; abbr = "STAT101"; weight = 3; year = 1; semester = 1; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE", "BA", "FI", "IFE") },
    @{ name = "Applied Statistics"; abbr = "STAT201"; weight = 3; year = 2; semester = 1; degrees = @("SE", "CEIT", "AID", "BA", "FI", "IFE") },

    # Computer Literacy - All degrees
    @{ name = "Computer Literacy"; abbr = "COMP101"; weight = 2; year = 1; semester = 1; degrees = @("SE", "CEIT", "AID", "TE", "RME", "EE", "DM", "FI", "BA", "IFE", "BAIT") },

    # Economics - Economics degrees
    @{ name = "Microeconomics"; abbr = "ECON101"; weight = 3; year = 1; semester = 1; degrees = @("DM", "FI", "BA", "IFE", "BAIT") },
    @{ name = "Macroeconomics"; abbr = "ECON102"; weight = 3; year = 1; semester = 2; degrees = @("DM", "FI", "BA", "IFE", "BAIT") },

    # Business Fundamentals - Economics and Business degrees
    @{ name = "Introduction to Business"; abbr = "BUS101"; weight = 3; year = 1; semester = 1; degrees = @("DM", "FI", "BA", "IFE", "BAIT") },
    @{ name = "Business Law"; abbr = "BUS102"; weight = 3; year = 1; semester = 2; degrees = @("DM", "FI", "BA", "IFE", "BAIT") }
)

# Degree-specific courses
$degreeSpecificCourses = @{
    # Engineering degrees
    "SE" = @(
        @{ name = "Introduction to Programming"; abbr = "CS101"; weight = 3; year = 1; semester = 1 },
        @{ name = "Data Structures and Algorithms"; abbr = "CS201"; weight = 4; year = 1; semester = 2 },
        @{ name = "Object-Oriented Programming"; abbr = "CS102"; weight = 3; year = 2; semester = 1 },
        @{ name = "Software Engineering Principles"; abbr = "SE301"; weight = 4; year = 2; semester = 2 },
        @{ name = "Database Systems"; abbr = "CS202"; weight = 3; year = 3; semester = 1 },
        @{ name = "Software Project Management"; abbr = "SE302"; weight = 3; year = 3; semester = 2 }
    )
    "CEIT" = @(
        @{ name = "Computer Architecture"; abbr = "CE101"; weight = 4; year = 1; semester = 1 },
        @{ name = "Digital Logic Design"; abbr = "CE102"; weight = 3; year = 1; semester = 2 },
        @{ name = "Operating Systems"; abbr = "CE201"; weight = 4; year = 2; semester = 1 },
        @{ name = "Computer Networks"; abbr = "CE202"; weight = 3; year = 2; semester = 2 },
        @{ name = "Cloud Computing"; abbr = "CE301"; weight = 3; year = 3; semester = 1 },
        @{ name = "Cybersecurity Fundamentals"; abbr = "CE302"; weight = 3; year = 3; semester = 2 }
    )
    "AID" = @(
        @{ name = "Machine Learning Fundamentals"; abbr = "AI101"; weight = 4; year = 1; semester = 1 },
        @{ name = "Data Science with Python"; abbr = "AI102"; weight = 3; year = 1; semester = 2 },
        @{ name = "Deep Learning"; abbr = "AI201"; weight = 4; year = 2; semester = 1 },
        @{ name = "Natural Language Processing"; abbr = "AI202"; weight = 3; year = 2; semester = 2 },
        @{ name = "Computer Vision"; abbr = "AI301"; weight = 3; year = 3; semester = 1 },
        @{ name = "AI Ethics and Society"; abbr = "AI302"; weight = 2; year = 3; semester = 2 }
    )
    "TE" = @(
        @{ name = "Signals and Systems"; abbr = "TE101"; weight = 4; year = 1; semester = 1 },
        @{ name = "Digital Communications"; abbr = "TE102"; weight = 3; year = 1; semester = 2 },
        @{ name = "Wireless Networks"; abbr = "TE201"; weight = 4; year = 2; semester = 1 },
        @{ name = "Mobile Communications"; abbr = "TE202"; weight = 3; year = 2; semester = 2 },
        @{ name = "5G Technologies"; abbr = "TE301"; weight = 3; year = 3; semester = 1 },
        @{ name = "Network Security"; abbr = "TE302"; weight = 3; year = 3; semester = 2 }
    )
    "RME" = @(
        @{ name = "Introduction to Robotics"; abbr = "RM101"; weight = 3; year = 1; semester = 1 },
        @{ name = "Mechatronics Systems"; abbr = "RM102"; weight = 4; year = 1; semester = 2 },
        @{ name = "Control Systems"; abbr = "RM201"; weight = 4; year = 2; semester = 1 },
        @{ name = "Industrial Automation"; abbr = "RM202"; weight = 3; year = 2; semester = 2 },
        @{ name = "Advanced Robotics"; abbr = "RM301"; weight = 3; year = 3; semester = 1 },
        @{ name = "Robotics Project"; abbr = "RM302"; weight = 4; year = 3; semester = 2 }
    )
    "EE" = @(
        @{ name = "Circuit Analysis"; abbr = "EE101"; weight = 4; year = 1; semester = 1 },
        @{ name = "Electronics Fundamentals"; abbr = "EE102"; weight = 3; year = 1; semester = 2 },
        @{ name = "Digital Electronics"; abbr = "EE201"; weight = 4; year = 2; semester = 1 },
        @{ name = "Power Systems"; abbr = "EE202"; weight = 3; year = 2; semester = 2 },
        @{ name = "Embedded Systems"; abbr = "EE301"; weight = 3; year = 3; semester = 1 },
        @{ name = "Renewable Energy Systems"; abbr = "EE302"; weight = 3; year = 3; semester = 2 }
    )
    # Economics degrees
    "DM" = @(
        @{ name = "Digital Marketing Fundamentals"; abbr = "DM101"; weight = 3; year = 1; semester = 1 },
        @{ name = "Social Media Marketing"; abbr = "DM102"; weight = 3; year = 1; semester = 2 },
        @{ name = "SEO and Content Strategy"; abbr = "DM201"; weight = 3; year = 2; semester = 1 },
        @{ name = "Email Marketing Automation"; abbr = "DM202"; weight = 3; year = 2; semester = 2 },
        @{ name = "Analytics and Performance"; abbr = "DM301"; weight = 3; year = 3; semester = 1 },
        @{ name = "Digital Marketing Campaign"; abbr = "DM302"; weight = 4; year = 3; semester = 2 }
    )
    "FI" = @(
        @{ name = "Financial Markets and Institutions"; abbr = "FI101"; weight = 3; year = 1; semester = 1 },
        @{ name = "Investment Analysis"; abbr = "FI102"; weight = 4; year = 1; semester = 2 },
        @{ name = "Fintech and Blockchain"; abbr = "FI201"; weight = 4; year = 2; semester = 1 },
        @{ name = "Risk Management"; abbr = "FI202"; weight = 3; year = 2; semester = 2 },
        @{ name = "Algorithmic Trading"; abbr = "FI301"; weight = 3; year = 3; semester = 1 },
        @{ name = "Portfolio Management"; abbr = "FI302"; weight = 3; year = 3; semester = 2 }
    )
    "BA" = @(
        @{ name = "Business Analytics Fundamentals"; abbr = "BA101"; weight = 3; year = 1; semester = 1 },
        @{ name = "Statistical Methods for Business"; abbr = "BA102"; weight = 4; year = 1; semester = 2 },
        @{ name = "Data Visualization"; abbr = "BA201"; weight = 3; year = 2; semester = 1 },
        @{ name = "Predictive Analytics"; abbr = "BA202"; weight = 4; year = 2; semester = 2 },
        @{ name = "Big Data Technologies"; abbr = "BA301"; weight = 3; year = 3; semester = 1 },
        @{ name = "Business Intelligence Systems"; abbr = "BA302"; weight = 3; year = 3; semester = 2 }
    )
    "IFE" = @(
        @{ name = "International Economics"; abbr = "IFE101"; weight = 3; year = 1; semester = 1 },
        @{ name = "Global Finance"; abbr = "IFE102"; weight = 4; year = 1; semester = 2 },
        @{ name = "International Trade"; abbr = "IFE201"; weight = 3; year = 2; semester = 1 },
        @{ name = "Cross-Border Transactions"; abbr = "IFE202"; weight = 3; year = 2; semester = 2 },
        @{ name = "Emerging Markets"; abbr = "IFE301"; weight = 3; year = 3; semester = 1 },
        @{ name = "International Finance Law"; abbr = "IFE302"; weight = 3; year = 3; semester = 2 }
    )
    "BAIT" = @(
        @{ name = "Business Administration"; abbr = "BAIT101"; weight = 3; year = 1; semester = 1 },
        @{ name = "IT for Business"; abbr = "BAIT102"; weight = 3; year = 1; semester = 2 },
        @{ name = "Enterprise Systems"; abbr = "BAIT201"; weight = 4; year = 2; semester = 1 },
        @{ name = "Business Process Automation"; abbr = "BAIT202"; weight = 3; year = 2; semester = 2 },
        @{ name = "Digital Transformation"; abbr = "BAIT301"; weight = 3; year = 3; semester = 1 },
        @{ name = "IT Project Management"; abbr = "BAIT302"; weight = 4; year = 3; semester = 2 }
    )
}

$coursesCreated = 0
$sharedCoursesCreated = 0

# Add shared courses first
Write-Host "Adding shared courses (assigned to multiple degrees)..."
Write-Host ""

foreach ($course in $sharedCourses) {
    # Get degree IDs for this course
    $degreeIds = @()
    foreach ($abbr in $course.degrees) {
        if ($degreeMap.ContainsKey($abbr)) {
            $degreeIds += $degreeMap[$abbr]
        }
    }

    if ($degreeIds.Count -eq 0) {
        Write-Host "  Warning: No valid degrees found for $($course.name)"
        continue
    }

    try {
        $degreeIdsJson = $degreeIds -join ','
        $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/courses/" `
          -ContentType "application/json" `
          -Body "{""c_name"": ""$($course.name)"", ""c_abbr"": ""$($course.abbr)"", ""c_difficulty_weight"": $($course.weight), ""c_year"": $($course.year), ""c_semester"": $($course.semester), ""degree_ids"": [$degreeIdsJson]}"

        Write-Host "  Created: $($course.name) ($($course.abbr)) - Assigned to: $($course.degrees -join ', ')"
        $sharedCoursesCreated++
        $coursesCreated++
    } catch {
        Write-Host "  Error creating $($course.name): $_"
    }
}

Write-Host ""
Write-Host "Adding degree-specific courses..."
Write-Host ""

# Add degree-specific courses
foreach ($degree in $degrees) {
    $abbr = $degree.degree_abbr

    if ($degreeSpecificCourses.ContainsKey($abbr)) {
        Write-Host "Adding courses for $($degree.d_name) ($abbr)..."

        foreach ($course in $degreeSpecificCourses[$abbr]) {
            try {
                $response = Invoke-RestMethod -Method Post -Uri "http://localhost:8000/courses/" `
                  -ContentType "application/json" `
                  -Body "{""c_name"": ""$($course.name)"", ""c_abbr"": ""$($course.abbr)"", ""c_difficulty_weight"": $($course.weight), ""c_year"": $($course.year), ""c_semester"": $($course.semester), ""degree_ids"": [$($degree.d_id)]}"

                Write-Host "  Created: $($course.name) ($($course.abbr))"
                $coursesCreated++
            } catch {
                Write-Host "  Error creating $($course.name): $_"
            }
        }
    } else {
        Write-Host "Warning: No course data defined for $abbr"
    }
}

Write-Host ""
Write-Host "Successfully created $coursesCreated courses!"
Write-Host "  - Shared courses: $sharedCoursesCreated"
Write-Host "  - Degree-specific courses: $($coursesCreated - $sharedCoursesCreated)"
Write-Host ""
Write-Host "Note: Shared courses are assigned to multiple degrees to test the system."
