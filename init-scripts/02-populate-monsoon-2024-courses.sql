-- Populate Monsoon 2024 courses
-- This script will be automatically executed by PostgreSQL when the container is first created

-- Function to get or create professor
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
        -- Assign lab based on professor name
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

-- Function to create course and instructor relationships
CREATE OR REPLACE FUNCTION create_course_with_instructors(
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
    -- Create course
    course_id := uuid_generate_v4();
    INSERT INTO courses (id, code, name, credits, description, review_count, average_rating)
    VALUES (course_id, course_code, course_name, course_credits, 
            'Monsoon course: ' || course_name, 0, 0.0);
    
    -- Split faculty list by '+' and process each faculty member
    faculty_array := string_to_array(faculty_list, '+');
    
    FOREACH faculty_name IN ARRAY faculty_array
    LOOP
        -- Clean faculty name
        faculty_name := trim(faculty_name);
        faculty_name := replace(faculty_name, '(Coordinator)', '');
        faculty_name := replace(faculty_name, '(Guest Faculty)', '');
        faculty_name := trim(faculty_name);
        
        -- Skip if empty or contains TBD
        IF faculty_name != '' AND faculty_name NOT LIKE '%TBD%' THEN
            professor_id := get_or_create_professor(faculty_name);
            
            -- Create course instructor relationship
            INSERT INTO course_instructors (id, professor_id, course_id, semester, year, review_count, average_rating)
            VALUES (uuid_generate_v4(), professor_id, course_id, 'MONSOON', 2024, 0, 0.0);
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Populate courses
SELECT create_course_with_instructors('CS2.501', 'Advanced Computer Architecture', 4, 'Suresh Purini');
SELECT create_course_with_instructors('CS3.402', 'Advanced Computer Networks', 4, 'Ankit Gangwal');
SELECT create_course_with_instructors('CE1.604', 'Advanced Design of Steel Structures', 4, 'Sunitha Palissery');
SELECT create_course_with_instructors('CS7.501', 'Advanced NLP', 4, 'Manish Shrivastava');
SELECT create_course_with_instructors('CS3.304', 'Advanced Operating Systems', 4, 'P. Krishna Reddy');
SELECT create_course_with_instructors('CS1.301', 'Algorithm Analysis and Design', 4, 'Suryajith Chillara');
SELECT create_course_with_instructors('CS3.306', 'Algorithms and Operating Systems', 4, 'Lini Teresa Thomas');
SELECT create_course_with_instructors('HS0.303', 'Applied Ethics', 4, 'Ashwin Jayanti');
SELECT create_course_with_instructors('OC2.101', 'Arts-1 (H1)', 2, 'Saroja T K (Coordinator)');
SELECT create_course_with_instructors('CS1.302', 'Automata Theory (H1)', 2, 'Shantanav Chakraborty');
SELECT create_course_with_instructors('HS0.203', 'Basics of Ethics (H2)', 2, 'Ashwin Jayanti + Guest Faculty');
SELECT create_course_with_instructors('CG3.402', 'Behavioral Research & Experimental Design', 4, 'Vinoo Alluri');
SELECT create_course_with_instructors('SC3.202', 'Bioinformatics (H1)', 2, 'Nita Parkeh');
SELECT create_course_with_instructors('EC1.202', 'Bioinstrumentation and Devices', 4, 'Anshu Sarje');
SELECT create_course_with_instructors('SC3.321', 'Biomolecular Structure Interaction & Dynamics', 4, 'B. Gopalakrishnan');
SELECT create_course_with_instructors('CS3.403', 'Blockchain and Web3 Development', 4, 'Ankit Gangwal');
SELECT create_course_with_instructors('PD2.421', 'Business Fundamentals', 4, 'Himanshu');
SELECT create_course_with_instructors('SC2.305', 'Chemical Kinetics and Reaction Dynamics (H2)', 2, 'Harjinder Singh');
SELECT create_course_with_instructors('SC2.309', 'Chemistry Topics for Engineers', 4, 'Tapan Kumar Sau + Prabhakar B');
SELECT create_course_with_instructors('CL3.202', 'Computational Linguistics II: Comp Semantics and Discourse parsing', 4, 'Rajakrishnan P Rajkumar + Parameswari Krishnamurthy');
SELECT create_course_with_instructors('CS0.301', 'Computer Problem Solving', 4, 'Shatrunjay Rawat');
SELECT create_course_with_instructors('CS0.101', 'Computer Programming', 5, 'Girish Varma + Charu Sharma + TBD');
SELECT create_course_with_instructors('SC4.101', 'Computing in Sciences-1 (H2)', 2, 'Deva Priyakumar');
SELECT create_course_with_instructors('CS4.405', 'Data Analytics I', 4, 'Krishna Reddy Polepalli');
SELECT create_course_with_instructors('CS4.301', 'Data and Applications (H2)', 2, 'Ponnurangam Kumaraguru');
SELECT create_course_with_instructors('CS1.304', 'Data Structures & Algorithms for Problem Solving', 6, 'Kshitij Gajjar + Lini Thomas');
SELECT create_course_with_instructors('CS7.601', 'Deep Learning: Theory and Practices', 4, 'Naresh Manwani');
SELECT create_course_with_instructors('CS9.429', 'Design for Social Innovation', 4, 'Ramesh Loganathan + Ramana Gogula');
SELECT create_course_with_instructors('EC2.407', 'Design for Testability', 4, 'Usha Gogineni (Guest Faculty)');
SELECT create_course_with_instructors('PD1.401', 'Design Thinking - Idea to Evaluate (H2)', 2, 'Raman Saxena');
SELECT create_course_with_instructors('PD1.301', 'Design Thinking - Research to Define (H1)', 2, 'Raman Saxena');
SELECT create_course_with_instructors('CS7.404', 'Digital Image Processing', 4, 'Anoop M Namboodiri');
SELECT create_course_with_instructors('EC2.101', 'Digital Systems and Microcontrollers', 5, 'Madhava Krishna + Harikumar K + Anil Kumar Vuppala');
SELECT create_course_with_instructors('EC2.408', 'Digital VLSI Design', 4, 'Zia Abbas');
SELECT create_course_with_instructors('MA5.101', 'Discrete Structures', 4, 'Srinathan K + Shantanav Chakraborty');
SELECT create_course_with_instructors('CS3.401', 'Distributed Systems', 4, 'Kishore Kothapalli');
SELECT create_course_with_instructors('CE1.607', 'Earthquake Resistant Design of Masonry Structures', 4, 'P Pravin Kumar Venkat Rao');
SELECT create_course_with_instructors('EC2.102', 'Electronic Workshop-1 (H2)', 2, 'Praful Mankar + Sachin Chaudhari');
SELECT create_course_with_instructors('EC3.202', 'Embedded Systems Workshop (H)', 3, 'Abhishek Srivastava + Zia Abbas');
SELECT create_course_with_instructors('CS1.407', 'Entropy and Information', 4, 'Indranil Chakrabarty');
SELECT create_course_with_instructors('CS9.428', 'Environmental Science & Technology', 4, 'Ramachandra Prasad Pillutla');
SELECT create_course_with_instructors('CS7.504', 'Fairness, Privacy and Ethics in AI', 4, 'Sujit P Gujar');
SELECT create_course_with_instructors('CE4.501', 'Finite Element Methods', 4, 'Jofin George');
SELECT create_course_with_instructors('EC5.412', 'Foundations for Signal Processing and Communication', 4, 'Praful Mankar + Arti Yardi');
SELECT create_course_with_instructors('HS8.201', 'Gender and Society', 4, 'Sushmita Banerji');
SELECT create_course_with_instructors('CE5.503', 'Geospatial Technology for Disaster Risk Modelling', 4, 'Kiran Chand Thumaty and Rehana Shaik');
SELECT create_course_with_instructors('PD1.501', 'Human Computer Interaction (H2)', 2, 'Raman Saxena');
SELECT create_course_with_instructors('HS7.101', 'Human Sciences Lab-1 (H2)', 2, 'Anirban Dasgupta');
SELECT create_course_with_instructors('CE5.502', 'Hydrological modelling and Software Development', 4, 'Rehana Shaik');
SELECT create_course_with_instructors('CS4.406', 'Information Retrieval & Extraction', 4, 'Rahul Mishra');
SELECT create_course_with_instructors('EC5.410', 'Information Theory', 4, 'Arti Yardi');
SELECT create_course_with_instructors('CG1.402', 'Intro to Cognitive Science', 4, 'Vishnu Sreekumar');
SELECT create_course_with_instructors('HS2.202', 'Intro to Psychology', 4, 'Priyanka Srivastava');
SELECT create_course_with_instructors('SC3.101', 'Introduction to Biology', 4, 'Vinod PK');
SELECT create_course_with_instructors('HS5.202', 'Introduction to Economics', 4, 'Anirban Dasgupta');
SELECT create_course_with_instructors('HS1.208', 'Introduction to Film Studies', 4, 'Sushmita Banerji');
SELECT create_course_with_instructors('HS3.201', 'Introduction to History', 4, 'Isha Dubey');
SELECT create_course_with_instructors('CL1.101', 'Introduction to Linguistics-1', 4, 'Rajakrishnan P Rajkumar');
SELECT create_course_with_instructors('CG3.401', 'Introduction to Neural and Cognitive Modeling', 4, 'Bapiraju Surampudi');
SELECT create_course_with_instructors('HS0.214', 'Introduction to Philosophy', 4, 'Saurabh Todariya');
SELECT create_course_with_instructors('HS4.201', 'Introduction to Politics', 4, 'Aakansha Natani');
SELECT create_course_with_instructors('SC1.421', 'Introduction to Quantum Field Theory', 4, 'Diganta Das + Monalisa Patra');
SELECT create_course_with_instructors('CS9.440', 'Introduction to Remote Sensing', 4, 'RC Prasad');
SELECT create_course_with_instructors('CE9.609', 'IoT Workshop', 4, 'Sachin Chaudhari + Nagamanikandan Govindan + TBD');
SELECT create_course_with_instructors('CL2.203', 'Language and Society', 4, 'Aditi Mukherjee');
SELECT create_course_with_instructors('CG1.403', 'Learning and Memory', 4, 'Bhaktee Dongaonkar');
SELECT create_course_with_instructors('HS4.102', 'Making of the Contemporary India', 4, 'Aniket Alam');
SELECT create_course_with_instructors('MA6.301', 'Maths for Computer Science 1 - Probability and Statistics (H1)', 2, 'Naresh Manwani');
SELECT create_course_with_instructors('MA6.302', 'Maths for Computer Science 2 - Linear Algebra (H2)', 2, 'Pawan Kumar');
SELECT create_course_with_instructors('CS7.503', 'Mobile Robotics', 4, 'K Madhava Krishna');
SELECT create_course_with_instructors('EC5.411', 'Modern Coding Theory', 4, 'Prasad Krishnan');
SELECT create_course_with_instructors('CS1.405', 'Modern Complexity Theory', 4, 'Ashok Kumar Das');
SELECT create_course_with_instructors('HS1.210', 'Music Workshop', 4, 'Saroja T K');
SELECT create_course_with_instructors('EC5.101', 'Networks, Signals and Systems', 4, 'Prasad Krishnan + Aftab Hussain');
SELECT create_course_with_instructors('SC1.310', 'Open Quantum Systems and Quantum Thermodynamics', 4, 'Samyadeb Bhattacharya');
SELECT create_course_with_instructors('CS3.301', 'Operating Systems and Networks', 4, 'Karthik Vaidhyanathan');
SELECT create_course_with_instructors('SC1.415', 'Physics of Early Universe', 4, 'Diganta Das');
SELECT create_course_with_instructors('CS1.402', 'Principles of Programming Languages', 4, 'Mrityunjay + Venkatesh Choppella');
SELECT create_course_with_instructors('EC2.409', 'Principles of Semiconductor Devices', 4, 'Aftab Hussain');
SELECT create_course_with_instructors('MA6.102', 'Probability and Random Processes', 4, 'Gowtham Kurri');
SELECT create_course_with_instructors('MA6.101', 'Probability and Statistics', 4, 'Tejas Bodas');
SELECT create_course_with_instructors('PD2.401', 'Product Management 101 (H1)', 2, 'Ramesh Swaminathan');
SELECT create_course_with_instructors('PD2.501', 'Product Marketing', 4, 'Ravi Warrior');
SELECT create_course_with_instructors('SC1.422', 'Quantum Information Theory', 4, 'Siddhartha Das');
SELECT create_course_with_instructors('SC1.203', 'Quantum Mechanics', 4, 'Subhadip Mitra');
SELECT create_course_with_instructors('HS1.303', 'Readings from Hindi Literature', 4, 'Harjinder Singh');
SELECT create_course_with_instructors('MA4.101', 'Real Analysis', 4, 'Samyadeb Bhattacharya + Abhishek Deshpande');
SELECT create_course_with_instructors('CS3.502', 'Real-Time Embedded Systems', 4, 'Deepak Gangadharan');
SELECT create_course_with_instructors('CS8.501', 'Research in Information Security', 4, 'Ashok Kumar Das + Srinathan K');
SELECT create_course_with_instructors('CE1.608', 'Retrofit of Existing Infrastructure', 2, 'Shubham Singhal');
SELECT create_course_with_instructors('EC4.401', 'Robotics: Dynamics and Control', 4, 'Nagamanikandan Govindan');
SELECT create_course_with_instructors('SC1.110', 'Science 1', 4, 'Prabhakar B (Harjinder Singh)');
SELECT create_course_with_instructors('SC4.110', 'Science Lab I (H1)', 2, 'Tapan Sau + Prabhakar B');
SELECT create_course_with_instructors('EC5.406', 'Signal Detection and Estimation Theory', 4, 'Santosh Nannuru');
SELECT create_course_with_instructors('EC5.201', 'Signal Processing', 5, 'Chiranjeevi Yarra + Santosh Nannuru');
SELECT create_course_with_instructors('CS6.301', 'Software Quality Engineering', 4, 'Raghu Reddy Y');
SELECT create_course_with_instructors('CS6.302', 'Software Systems Development', 4, 'Deepak Gangadharan + Rahul Mishra');
SELECT create_course_with_instructors('CS4.408', 'Spatial Informatics', 4, 'Rajan Krishnan Sundara');
SELECT create_course_with_instructors('CS9.441', 'Spatial Thinking and Practice', 4, 'KS Rajan');
SELECT create_course_with_instructors('SC2.304', 'Spectroscopy(H1)', 2, 'M Krishnan');
SELECT create_course_with_instructors('CL2.405', 'Speech Analysis and Linguistics', 4, 'Chiranjeevi Yarra');
SELECT create_course_with_instructors('EC5.408', 'Speech Signal Processing', 4, 'Anil Kumar Vuppala');
SELECT create_course_with_instructors('CS7.403', 'Statistical Methods in AI', 4, 'Ravi Kiran S');
SELECT create_course_with_instructors('CE1.501', 'Structural Dynamics', 4, 'Sunitha Palissery');
SELECT create_course_with_instructors('CE1.502', 'Structural Engineering Design Studio', 4, 'Shubham Singhal');
SELECT create_course_with_instructors('CE1.503', 'Structural Safety of Built Infrastructure (H1)', 2, 'Jofin George');
SELECT create_course_with_instructors('SC3.203', 'Systems Biology (H2)', 2, 'Vinod PK');
SELECT create_course_with_instructors('EC5.202', 'Systems Thinking', 4, 'Spandan Roy + Vinod PK');
SELECT create_course_with_instructors('CE0.501', 'Theory of Elasticity', 4, 'Pravin Kumar Venkat Rao');
SELECT create_course_with_instructors('HS0.202', 'Thinking and Knowing in the Human Sciences - II', 4, 'Aniket Alam');
SELECT create_course_with_instructors('HS0.204', 'Thinking and Knowing in the Human Sciences - III', 4, 'Anirban Dasgupta + Aakansha Natani');
SELECT create_course_with_instructors('MA8.401', 'Topics in Applied Optimization', 4, 'Pawan Kumar');
SELECT create_course_with_instructors('SC2.401', 'Topics in Nanosciences', 4, 'Tapan Kumar Sau');
SELECT create_course_with_instructors('CS9.501', 'User Research Methods (H2)', 2, 'Priyanka Srivastava');
SELECT create_course_with_instructors('OC3.101', 'Value Education-1 (H)', 2, 'Shatrunjay Rawat (Coordinator)');
SELECT create_course_with_instructors('EC2.201', 'VLSI Design', 4, 'Abhishek Srivastava');
SELECT create_course_with_instructors('HS2.303', 'Work, Entrepreneurship and Technology in Contemporary Societies', 3, 'Rajorshi Ray');
SELECT create_course_with_instructors('EC5.407', 'Wireless Communications', 4, 'Praful Mankar');

-- Clean up functions
DROP FUNCTION IF EXISTS get_or_create_professor(VARCHAR);
DROP FUNCTION IF EXISTS create_course_with_instructors(VARCHAR, VARCHAR, INTEGER, TEXT); 