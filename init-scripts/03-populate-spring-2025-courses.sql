-- Populate Spring 2025 courses
-- This script extracts data from CourseOfferings-S25-V5.pdf

-- Function to get or create professor
-- Re-defining this here to ensure the script can run standalone or sequentially
CREATE OR REPLACE FUNCTION get_or_create_professor(prof_name VARCHAR(255))
RETURNS UUID AS $$
DECLARE
    prof_id UUID;
    prof_lab VARCHAR(255);
BEGIN
    -- Check if professor exists
    SELECT id INTO prof_id FROM professors WHERE name = prof_name;
    
    -- If professor doesn't exist, create new one
    IF prof_id IS NULL THEN
        prof_id := uuid_generate_v4();
        -- Assign lab based on professor name (using the known mapping from previous scripts)
        prof_lab := CASE
            WHEN prof_name = 'Bapi Raju S' THEN 'CogSci'
            WHEN prof_name = 'Girish Varma' THEN 'CSTAR'
            WHEN prof_name = 'Anoop M Namboodiri' THEN 'CVIT'
            WHEN prof_name = 'Avinash Sharma' THEN 'CVIT'
            WHEN prof_name = 'Jawahar C V' THEN 'CVIT'
            WHEN prof_name = 'Makarand Tapaswi' THEN 'CVIT'
            WHEN prof_name = 'Narayanan P J' THEN 'CVIT'
            WHEN prof_name = 'Ravi Kiran Sarvadevabhatla' THEN 'CVIT'
            WHEN prof_name = 'Vineet Gandhi' THEN 'CVIT'
            WHEN prof_name = 'Kamalakar Karlapalem' THEN 'DSAC'
            WHEN prof_name = 'Vikram Pudi' THEN 'DSAC'
            WHEN prof_name = 'Krishna Reddy P.' THEN 'DSAC'
            WHEN prof_name = 'Anil Kumar Vuppala' THEN 'SPCRC'
            WHEN prof_name = 'Dipti Misra Sharma' THEN 'LTRC'
            WHEN prof_name = 'Manish Shrivastava' THEN 'LTRC'
            WHEN prof_name = 'Radhika Mamidi' THEN 'LTRC'
            WHEN prof_name = 'Charu Sharma' THEN 'MLL'
            WHEN prof_name = 'Naresh Manwani' THEN 'MLL'
            WHEN prof_name = 'Praveen Paruchuri' THEN 'MLL'
            WHEN prof_name = 'Karthik Vaidhyanathan' THEN 'SERC'
            WHEN prof_name = 'Raghu Babu Reddy Y.' THEN 'SERC'
            WHEN prof_name = 'Raman Saxena' THEN 'SERC'
            WHEN prof_name = 'Vasudeva Varma' THEN 'IREL'
            WHEN prof_name = 'Venkatesh Choppella' THEN 'SERC'
            WHEN prof_name = 'Parameswari Krishnamurthy' THEN 'LTRC'
            WHEN prof_name = 'Ponnurangam Kumaraguru (PK)' THEN 'LTRC'
            WHEN prof_name = 'Aditi Mukherjee' THEN 'LTRC'
            WHEN prof_name = 'Lini Teresa Thomas' THEN 'DSAC'
            WHEN prof_name = 'Rajakrishnan P Rajkumar' THEN 'LTRC'
            WHEN prof_name = 'Yegnanarayana B' THEN 'LTRC'
            WHEN prof_name = 'Viswanath K.' THEN 'SERC'
            WHEN prof_name = 'Ramesh Loganathan' THEN 'CIE'
            WHEN prof_name = 'Chiranjeevi Yarra' THEN 'LTRC'
            WHEN prof_name = 'Bhaktee Dongaonkar' THEN 'CogSci'
            WHEN prof_name = 'Priyanka Srivastava' THEN 'CogSci'
            WHEN prof_name = 'Vinoo Alluri' THEN 'CogSci'
            WHEN prof_name = 'Vishnu Sreekumar' THEN 'CogSci'
            WHEN prof_name = 'Deepak Gangadharan' THEN 'CSG'
            WHEN prof_name = 'Suresh Purini' THEN 'CSG'
            WHEN prof_name = 'Tejas Bodas' THEN 'CSG'
            WHEN prof_name = 'Nimmi Rangaswamy' THEN 'C2S2'
            WHEN prof_name = 'Sujit P. Gujar' THEN 'CDE'
            WHEN prof_name = 'Kavita Vemuri' THEN 'CogSci'
            WHEN prof_name = 'Aakansha Natani' THEN 'HSRG'
            WHEN prof_name = 'Aniket Alam' THEN 'HSRG'
            WHEN prof_name = 'Anirban Dasgupta' THEN 'HSRG'
            WHEN prof_name = 'Ashwin Jayanti' THEN 'HSRG'
            WHEN prof_name = 'Isha Dubey' THEN 'HSRG'
            WHEN prof_name = 'Nazia Akhtar' THEN 'HSRG'
            WHEN prof_name = 'Radhika Krishnan' THEN 'HSRG'
            WHEN prof_name = 'Saurabh Todariya' THEN 'HSRG'
            WHEN prof_name = 'Sushmita Banerji' THEN 'HSRG'
            WHEN prof_name = 'Arun Kumar Pati' THEN 'CQST'
            WHEN prof_name = 'Indranil Chakrabarty' THEN 'CQST'
            WHEN prof_name = 'Samyadeb Bhattacharya' THEN 'CQST'
            WHEN prof_name = 'Shantanav Chakraborty' THEN 'CQST'
            WHEN prof_name = 'Uttam Singh' THEN 'CQST'
            WHEN prof_name = 'Ankit Gangwal' THEN 'CSTAR'
            WHEN prof_name = 'Ashok Kumar Das' THEN 'CSTAR'
            WHEN prof_name = 'Kannan Srinathan' THEN 'CSTAR'
            WHEN prof_name = 'Kishore Kothapalli' THEN 'CSTAR'
            WHEN prof_name = 'Pawan Kumar' THEN 'CSTAR'
            WHEN prof_name = 'Shatrunjay Rawat' THEN 'CSTAR'
            WHEN prof_name = 'Siddhartha Das' THEN 'CSTAR'
            WHEN prof_name = 'Suryajith Chillara' THEN 'CSTAR'
            WHEN prof_name = 'Harikumar Kandath' THEN 'RRC'
            WHEN prof_name = 'K. Madhava Krishna' THEN 'RRC'
            WHEN prof_name = 'Nagamanikandan Govindan' THEN 'RRC'
            WHEN prof_name = 'Spandan Roy' THEN 'RRC'
            WHEN prof_name = 'Jayanthi Sivaswamy' THEN 'CVIT'
            WHEN prof_name = 'Arti Yardi' THEN 'SPCRC'
            WHEN prof_name = 'Gowtham Raghunath Kurri' THEN 'SPCRC'
            WHEN prof_name = 'Lalitha Vadlamani' THEN 'SPCRC'
            WHEN prof_name = 'Praful Mankar' THEN 'SPCRC'
            WHEN prof_name = 'Prasad Krishnan' THEN 'SPCRC'
            WHEN prof_name = 'Sachin Chaudhari' THEN 'SPCRC'
            WHEN prof_name = 'Santosh Nannuru' THEN 'SPCRC'
            WHEN prof_name = 'Sarma K. R.' THEN 'SPCRC'
            WHEN prof_name = 'Ubaidulla P' THEN 'SPCRC'
            WHEN prof_name = 'Abhishek Srivastava' THEN 'CVEST'
            WHEN prof_name = 'Aftab M. Hussain' THEN 'CVEST'
            WHEN prof_name = 'Anshu Sarje' THEN 'CVEST'
            WHEN prof_name = 'Zia Abbas' THEN 'CVEST'
            WHEN prof_name = 'P. Pravin Kumar Venkat Rao' THEN 'EERC'
            WHEN prof_name = 'Sunitha Palissery' THEN 'EERC'
            WHEN prof_name = 'Nagaraja Ravoori' THEN 'LSI'
            WHEN prof_name = 'Shaik Rehana' THEN 'LSI'
            WHEN prof_name = 'Ramachandra Prasad P.' THEN 'LSI'
            WHEN prof_name = 'Rajan K. S.' THEN 'EERC LSI'
            WHEN prof_name = 'Venkateshwarlu M' THEN 'EERC'
            WHEN prof_name = 'Abhishek Deshpande' THEN 'CCNSB'
            WHEN prof_name = 'Bhaswar Ghosh' THEN 'CCNSB'
            WHEN prof_name = 'Chittaranjan Hens' THEN 'CCNSB'
            WHEN prof_name = 'Deva Priyakumar U' THEN 'CCNSB'
            WHEN prof_name = 'Diganta Das' THEN 'CCNSB'
            WHEN prof_name = 'Harjinder Singh' THEN 'CCNSB'
            WHEN prof_name = 'Marimuthu Krishnan' THEN 'CCNSB'
            WHEN prof_name = 'Nita Parekh' THEN 'CCNSB'
            WHEN prof_name = 'Prabhakar Bhimalapuram' THEN 'CCNSB'
            WHEN prof_name = 'Semparithi Aravindan' THEN 'CCNSB'
            WHEN prof_name = 'Subhadip Mitra' THEN 'CCNSB'
            WHEN prof_name = 'Tapan Kumar Sau' THEN 'CCNSB'
            WHEN prof_name = 'Vinod P K' THEN 'CCNSB'
            WHEN prof_name = 'Saroja T K' THEN 'CEH'
            WHEN prof_name = 'Yalla Veera Prakash' THEN 'CIE'
            ELSE 'TBD'
        END;
        INSERT INTO professors (id, name, lab, review_count, average_rating)
        VALUES (prof_id, prof_name, prof_lab, 0, 0.0);
    END IF;
    
    RETURN prof_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create Spring 2025 courses and instructors
CREATE OR REPLACE FUNCTION create_spring_2025_course(
    course_code VARCHAR(20),
    course_name VARCHAR(255),
    course_credits INTEGER,
    faculty_list TEXT
)
RETURNS VOID AS $$
DECLARE
    course_id UUID;
    faculty_name VARCHAR(255);
    professor_id UUID;
    faculty_array TEXT[];
BEGIN
    -- Check if course already exists (by code)
    SELECT id INTO course_id FROM courses WHERE code = course_code;

    -- If course doesn't exist, create it
    IF course_id IS NULL THEN
        course_id := uuid_generate_v4();
        INSERT INTO courses (id, code, name, credits, description, review_count, average_rating)
        VALUES (course_id, course_code, course_name, course_credits, 
                'Spring 2025 course: ' || course_name, 0, 0.0);
    END IF;
    
    -- Split faculty list by '+' and process each faculty member
    faculty_array := string_to_array(faculty_list, '+');
    
    FOREACH faculty_name IN ARRAY faculty_array
    LOOP
        -- Clean faculty name
        faculty_name := trim(faculty_name);
        faculty_name := replace(faculty_name, '(Coordinator)', '');
        faculty_name := replace(faculty_name, '(Guest Faculty)', '');
        faculty_name := trim(faculty_name);
        
        -- Skip if empty or contains TBD (if minimal data)
        IF faculty_name != '' AND faculty_name NOT LIKE '%TBD%' AND faculty_name != 'Guest Speakers' THEN
            professor_id := get_or_create_professor(faculty_name);
            
            -- Create course instructor relationship for Spring 2025
            -- Uses ON CONFLICT DO NOTHING to prevent duplicates if script is run twice
            INSERT INTO course_instructors (id, professor_id, course_id, semester, year, review_count, average_rating)
            VALUES (uuid_generate_v4(), professor_id, course_id, 'SPRING', 2025, 0, 0.0)
            ON CONFLICT (professor_id, course_id, semester, year) DO NOTHING;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Populate B.Tech Core / Institute Requirements
SELECT create_spring_2025_course('CS6.201', 'Introduction to Software Systems (H)', 2, 'Sai Anirudh Karre');
SELECT create_spring_2025_course('CS1.201', 'Data Structures and Algorithms', 5, 'Lini Thomas + Kshitij Gajjar');
SELECT create_spring_2025_course('CS2.201', 'Computer Systems Organization', 4, 'Praveen Paruchuri + Deepak Gangadharan');
SELECT create_spring_2025_course('CS3.303', 'Introduction to IoT', 3, 'Kavitha Vemuri + Suresh Purini');
SELECT create_spring_2025_course('MA2.101', 'Linear Algebra', 4, 'Siddhartha Das + Indranil Chakrabarty');
SELECT create_spring_2025_course('OC2.102', 'Arts-2 (H1&H2)', 2, 'Saroja TK');
SELECT create_spring_2025_course('OC1.102', 'Sports-2', 1, 'Physical Education Centre');
SELECT create_spring_2025_course('EC2.103', 'Analog Electronic Circuits', 5, 'Zia Abbas');
SELECT create_spring_2025_course('EC5.102', 'Information and Communication', 4, 'Arti Yardi + Lalitha Vadlamani');
SELECT create_spring_2025_course('SC4.102', 'Computing in Sciences II (H2)', 2, 'Prabhakar B');
SELECT create_spring_2025_course('SC1.102', 'Classical Mechanics (H1)', 2, 'Diganta Das');
SELECT create_spring_2025_course('SC1.101', 'Electrodynamics (H2)', 2, 'Diganta Das');
SELECT create_spring_2025_course('SC2.101', 'General and Structural Chemistry', 4, 'Tapan Kumar Sau');
SELECT create_spring_2025_course('CL1.102', 'Introduction to Linguistics II', 4, 'Aditi Mukherjee');
SELECT create_spring_2025_course('CL3.101', 'Computational Linguistics 1', 4, 'Parameswari Krishnamurthy');
SELECT create_spring_2025_course('HS8.101', 'Making of Contemporary World', 4, 'Anirban Dasgupta + Isha Dubey');
SELECT create_spring_2025_course('HS0.201', 'Thinking and Knowing in the Human Sciences-I', 4, 'Saurabh Todariya + Subha Chakraburtty');
SELECT create_spring_2025_course('GS0.301', 'Introduction to Spatial Sciences (H2)', 2, 'RC Prasad + KS Rajan');
SELECT create_spring_2025_course('CS6.301', 'Design and Analysis of Software Systems', 4, 'Raghu Reddy');
SELECT create_spring_2025_course('CS7.301', 'Machine, Data and Learning', 4, 'Praveen Paruchuri + Sujit Gujar');
SELECT create_spring_2025_course('HS8.102', 'Intro to Human Sciences', 4, 'Aakansha Natani + Ashwin Jayanti');
SELECT create_spring_2025_course('SC1.111', 'Science II', 4, 'Nita Parekh + Chittaranjan Hens');
SELECT create_spring_2025_course('OC3.102', 'Value Education II (H)', 2, 'Shatrunjay Rawat');
SELECT create_spring_2025_course('OC1.104', 'Sports-4', 1, 'Physical Education Centre');

-- Populate Theory/Foundations and Systems/Applications Electives
SELECT create_spring_2025_course('CS8.301', 'Introduction to Information Security (H1)', 2, 'Ankit Gangwal');
SELECT create_spring_2025_course('EC5.205', 'Introduction to Coding Theory (H1)', 2, 'Lalitha Vadlamani');
SELECT create_spring_2025_course('CS1.305', 'Introduction to Algorithms Engineering (H2)', 2, 'Kishore Kothapalli');
SELECT create_spring_2025_course('CS9.312', 'Introduction to Quantum Information and Computation (H1)', 2, 'Uttam Singh');
SELECT create_spring_2025_course('CS1.306', 'Numerical Algorithms (H2)', 2, 'Pawan Kumar');
SELECT create_spring_2025_course('CS7.303', 'Digital Signal Analysis (H1)', 2, 'Anil Kumar Vuppala');
SELECT create_spring_2025_course('CS4.302', 'Data Visualisation (H1)', 2, 'Kamal Karlapalem');
SELECT create_spring_2025_course('CS9.311', 'Introduction to Brain and Cognition (H2)', 2, 'Kavitha Vemuri');
SELECT create_spring_2025_course('CS7.302', 'Computer Graphics (H2)', 2, 'PJ Narayanan');
SELECT create_spring_2025_course('CS3.307', 'Performance Modeling of Computer Systems (H1)', 2, 'Tejas Bodas');
SELECT create_spring_2025_course('CS3.302', 'Software Programming for Performance (H2)', 2, 'Suresh Purini');

-- Populate ECE/ECD Electives
SELECT create_spring_2025_course('EC5.203', 'Communication Theory', 4, 'Sachin Chaudhari');
SELECT create_spring_2025_course('EC2.202', 'Electronics Workshop II', 4, 'Arti Yardi + Spandan Roy');
SELECT create_spring_2025_course('EC2.204', 'Intro to Processor Architecture (H1)', 2, 'Deepak Gangadharan');
SELECT create_spring_2025_course('EC5.206', 'Introduction to Statistical Signal Processing (H2)', 2, 'Santosh Nannuru');
SELECT create_spring_2025_course('EC4.201', 'Mechatronics System Design-1 (H1)', 2, 'Nagamanikandan + Harikumar K');
SELECT create_spring_2025_course('EC2.205', 'Radio Frequency Based Sensors design: Principles and Applications (H2)', 2, 'Andleeb Zahra');

-- Populate Science/CND/CLD/CHD Specifics
SELECT create_spring_2025_course('SC1.204', 'Thermodynamics (H1)', 2, 'Harjinder Singh');
SELECT create_spring_2025_course('SC1.205', 'Statistical Mechanics (H2)', 2, 'Harjinder Singh');
SELECT create_spring_2025_course('SC2.203', 'Biomolecular Structures (H1)', 2, 'Deva Priyakumar');
SELECT create_spring_2025_course('SC2.202', 'Organic Chemistry (H2)', 2, 'Prabhakar B');
SELECT create_spring_2025_course('SC4.111', 'Science Lab II (H)', 2, 'Tapan Kumar Sau + Chittaranjan Hens');
SELECT create_spring_2025_course('CL2.204', 'Language Typology and Universals', 4, 'Radhika Mamidi');
SELECT create_spring_2025_course('CS7.401', 'Introduction to NLP', 4, 'Manish Shrivastava');
SELECT create_spring_2025_course('HS0.302', 'Research Methods in Human Sciences', 4, 'Isha Dubey + Anirban Dasgupta');
SELECT create_spring_2025_course('HS7.301', 'Science, Technology and Society', 4, 'Radhika Krishnan');
SELECT create_spring_2025_course('HS2.303', 'Ethnography in praxis: An investigation into Field, Scales and Theory (H2)', 2, 'Rajorshi Ray');
SELECT create_spring_2025_course('SC9.600', 'CCNSB Seminar', 0, 'Abhishek Deshpande');

-- Populate Ethics & Humanities Electives
SELECT create_spring_2025_course('HS8.302', 'Classical Text Readings II', 4, 'Radhika Krishnan');
SELECT create_spring_2025_course('HS0.203a', 'Basics of Ethics (H1)', 2, 'Yusuf Indorewala');
SELECT create_spring_2025_course('HS0.220', 'Language and Power (H2)', 2, 'Priya Prithiviraj');
SELECT create_spring_2025_course('HS0.217', 'Ethics and the Digital Society (H1)', 2, 'Nimmi Rangaswamy');
SELECT create_spring_2025_course('HS0.219', 'Governance of AI: Ethics and Regulation (H2)', 2, 'Amber Sinha');
SELECT create_spring_2025_course('HS0.218a', 'Ethics in Research (H1)', 2, 'Bhaktee Dongaonkar + Vinoo Alluri + Priyanka Srivastava');
SELECT create_spring_2025_course('HS0.218b', 'Ethics in Research (H2)', 2, 'Bhaktee Dongaonkar + Vinoo Alluri + Priyanka Srivastava');
SELECT create_spring_2025_course('HS0.207', 'Science and Technology: Critical Perspectives (H1)', 2, 'Yusuf Indorewala');

-- Populate PG/M.Tech Specifics
SELECT create_spring_2025_course('CS8.403', 'System and Network Security', 4, 'Ashok Kumar Das');
SELECT create_spring_2025_course('CS8.401', 'Principles of Information Security', 4, 'Kannan Srinathan');
SELECT create_spring_2025_course('CS8.402', 'Information Security Audit and Assurance', 4, 'Shatrunjay Rawat');
SELECT create_spring_2025_course('CS0.302', 'Computing Tools', 4, 'Sriranjani K');
SELECT create_spring_2025_course('PD2.422', 'Business Finance', 4, 'Sarath Babu');

-- Populate Major Electives (CS, AI, Systems, etc.)
SELECT create_spring_2025_course('CS1.404', 'Optimization Methods', 4, 'Naresh Manwani');
SELECT create_spring_2025_course('CS1.406', 'Advanced Algorithms', 4, 'Suryajith Ch');
SELECT create_spring_2025_course('CS4.401', 'Data Systems', 4, 'Kamal Karlapalem');
SELECT create_spring_2025_course('CS6.401', 'Software Engineering', 4, 'Karthik Vaidhyanathan');
SELECT create_spring_2025_course('CS3.401', 'Distributed Systems', 4, 'Lini Thomas');
SELECT create_spring_2025_course('CS1.403', 'Compilers', 4, 'Ziaul Haque Choudhury');
SELECT create_spring_2025_course('CS7.403', 'Statistical Methods in AI', 4, 'Vineet Gandhi + CV Jawahar');
SELECT create_spring_2025_course('CS7.505', 'Computer Vision', 4, 'Makarand Tapaswi + Ravi Kiran');
SELECT create_spring_2025_course('EC4.404', 'Mechatronics System Design', 4, 'Nagamanikandan + Harikumar K');
SELECT create_spring_2025_course('GS2.503', 'Spatial Data Sciences', 4, 'KS Rajan');

-- Populate Science Electives
SELECT create_spring_2025_course('SC4.411', 'Machine Learning for Natural Sciences', 4, 'Prabhakar B + Vinod PK');
SELECT create_spring_2025_course('SC2.301', 'Physics of Soft Condensed Matter', 4, 'Marimuthu Krishnan');
SELECT create_spring_2025_course('SC2.316', 'Molecular Modeling and Simulations', 4, 'Deva Priyakumar + Marimuthu Krishnan');
SELECT create_spring_2025_course('SC2.315', 'Molecular Symmetry and Quantum Mechanics', 4, 'Harjinder Singh');
SELECT create_spring_2025_course('SC3.303', 'Advanced Bioinformatics', 4, 'Nita Parekh');
SELECT create_spring_2025_course('SC3.326', 'Algebraic Methods in Reaction Networks', 4, 'Abhishek Deshpande');

-- Populate CL/NLP Electives
SELECT create_spring_2025_course('CL2.404', 'Computational Psycholinguistics', 4, 'Rajakrishnan P Rajkumar');
SELECT create_spring_2025_course('CL5.401', 'Topics in SSMT', 4, 'Chiranjeevi Yerra + Parameswari Krishnamurthy');
SELECT create_spring_2025_course('EC5.408', 'Speech Signal Processing', 4, 'Anil Kumar Vuppala');
SELECT create_spring_2025_course('CL3.408', 'Applications of Language Models (H)', 2, 'Vasudeva Varma');
SELECT create_spring_2025_course('CL3.409', 'Evaluation Methods for NLP (H1)', 2, 'Manish Shrivastava + Parameswari Krishnamurthy');

-- Populate ECE Stream Electives
SELECT create_spring_2025_course('EC5.402', 'Time Frequency Analysis', 4, 'Anil Kumar Vuppala + Chiranjeevi Yerra');
SELECT create_spring_2025_course('CS8.502', 'Topics in Information-Theoretic Privacy', 4, 'Gowtham Kurri + Prasad Krishnan');
SELECT create_spring_2025_course('EC2.401', 'Analog IC Design', 4, 'Abhishek Srivastava');
SELECT create_spring_2025_course('EC2.502', 'Flexible Electronics', 4, 'Aftab Hussain');
SELECT create_spring_2025_course('EC2.411', 'Advanced Devices', 4, 'Anshu Sarje');
SELECT create_spring_2025_course('EC4.402', 'Intro to UAV Design', 4, 'Harikumar K');
SELECT create_spring_2025_course('EC4.501', 'Advances in Robotics & Control', 4, 'Spandan Roy');
SELECT create_spring_2025_course('EC4.403', 'Robotics: Planning and Navigation', 4, 'Madhava Krishna K');

-- Populate Civil/CASE Electives
SELECT create_spring_2025_course('CE1.603', 'Advanced Structural Analysis', 4, 'Pravin Kumar Venkat Rao');
SELECT create_spring_2025_course('CE1.608', 'Analysis & Design of Precast and Prestressed Structures', 4, 'Shubham Singhal');
SELECT create_spring_2025_course('CE1.609', 'Analysis and Design of Bridge Structures', 4, 'Jofin George');
SELECT create_spring_2025_course('CE5.501', 'Design of Hydraulic Structures', 4, 'Shaik Rehana');
SELECT create_spring_2025_course('CE1.601', 'Earthquake Engineering', 4, 'Sunitha P');

-- Populate Product Design & Other Electives
SELECT create_spring_2025_course('PD1.411', 'Product Design Workshop', 4, 'Prakash Yalla + Raghu Reddy');
SELECT create_spring_2025_course('CS5.401', 'User Interaction and Usability of Digital Products', 4, 'Raman Saxena');
SELECT create_spring_2025_course('CS9.424', 'Technology Product Entrepreneurship', 4, 'Ramesh Loganathan + Prakash Yalla');
SELECT create_spring_2025_course('PD2.502', 'Product Lifecycle Management', 4, 'Ravi Warrier');
SELECT create_spring_2025_course('CS1.408', 'Introduction to Game Theory', 4, 'Sujit Gujar');
SELECT create_spring_2025_course('CS3.404', 'Internals of Application Servers', 4, 'Ramesh Loganathan + Arjun Rajashekar');
SELECT create_spring_2025_course('CG3.501', 'Cognitive Science and AI', 4, 'Bapi Raju S');
SELECT create_spring_2025_course('CG3.403', 'Behavioral Research: Statistical Methods', 4, 'Vishnu Sreekumar + Bapi Raju S');
SELECT create_spring_2025_course('CG4.401', 'Music, Mind, and Technology', 4, 'Vinoo Alluri');
SELECT create_spring_2025_course('CE8.401', 'Disaster Management', 4, 'Jofin George + Shubham Singhal');
SELECT create_spring_2025_course('CG2.401', 'Cognitive Neuroscience', 4, 'Bhaktee Dongaonkar');
SELECT create_spring_2025_course('CS7.603', 'Topics in Reinforcement Learning', 4, 'Tejas Bodas + Harikumar K');
SELECT create_spring_2025_course('CS1.409', 'Quantum Algorithms', 4, 'Shantanav Chakraborty');
SELECT create_spring_2025_course('CS7.405', 'Responsible & Safe AI Systems', 4, 'Ponnurangam Kumaraguru');
SELECT create_spring_2025_course('MA7.501', 'Continuous Variable Quantum Information Theory and Computation', 4, 'Uttam Singh');
SELECT create_spring_2025_course('CS9.433', 'Hydro Informatics', 4, 'Shaik Rehana');
SELECT create_spring_2025_course('CS9.441', 'Applied Attention Theory', 4, 'Priyanka Srivastava');
SELECT create_spring_2025_course('CS1.503', 'Mathematical Foundations of Data Science', 4, 'Suryajith Ch + Girish Verma');
SELECT create_spring_2025_course('GS1.401', 'Optical Remote Sensing', 4, 'RC Prasad');
SELECT create_spring_2025_course('CS1.501', 'Advanced Optimization: Theory and Applications', 4, 'Pawan Kumar');
SELECT create_spring_2025_course('CS1.505', 'Quantum aspects of Cryptography', 4, 'Atul Singh Arora');
SELECT create_spring_2025_course('MA4.303', 'Linear Partial Differential Equations and Variational Calculus', 4, 'Samyadeb Bhattacharya');
SELECT create_spring_2025_course('SC1.308', 'The Universe Across Scales', 4, 'Subhadip Mitra + Chittaranjan Hens + Diganta Das');

-- Populate Final Humanities Electives
SELECT create_spring_2025_course('HS3.304', 'The Gutenberg Parenthesis', 4, 'Aniket Alam');
SELECT create_spring_2025_course('HS0.204', 'Introduction to Philosophy of Technology', 4, 'Ashwin Jayanti');
SELECT create_spring_2025_course('HS3.305', 'Migrants and Migrations in Modern South Asia', 4, 'Isha Dubey');
SELECT create_spring_2025_course('HS1.209', 'Music Language Creativity', 4, 'TK Saroja');
SELECT create_spring_2025_course('HS8.202', 'Gender, Culture and Representation', 4, 'Subha Chakraburtty');
SELECT create_spring_2025_course('HS8.303', 'Environmental & Social Governance in Mineral Extraction', 4, 'Radhika Krishnan');
SELECT create_spring_2025_course('HS4.303', 'Digital Democracy and Data Governance in the European Union', 4, 'Aakansha Natani');
SELECT create_spring_2025_course('HS0.304', 'Mind, Body and Cognition', 4, 'Saurabh Todariya');
SELECT create_spring_2025_course('HS2.304', 'Sociology of Platform Economies', 4, 'Rajorshi Ray');

-- Clean up functions
DROP FUNCTION IF EXISTS get_or_create_professor(VARCHAR);
DROP FUNCTION IF EXISTS create_spring_2025_course(VARCHAR, VARCHAR, INTEGER, TEXT);