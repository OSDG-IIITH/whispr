-- Fix professor data issues
-- Run this script AFTER the populate scripts to clean up data

-- =====================================================================
-- PART 1: FIX TYPOS IN PROFESSOR NAMES
-- =====================================================================

-- Fix common typos
UPDATE professors SET name = 'Nita Parekh' WHERE name = 'Nita Parkeh';
UPDATE professors SET name = 'Girish Varma' WHERE name = 'Girish Verma';
UPDATE professors SET name = 'Chiranjeevi Yarra' WHERE name = 'Chiranjeevi Yerra';
UPDATE professors SET name = 'Kavita Vemuri' WHERE name = 'Kavitha Vemuri';

-- =====================================================================
-- PART 2: FIX LAB ASSIGNMENTS
-- =====================================================================

-- PK is in Precog (part of C2S2), not LTRC
UPDATE professors SET lab = 'Precog' WHERE name LIKE '%Ponnurangam Kumaraguru%';

-- Bapi Raju is in CogSci but also known as Bapiraju Surampudi
UPDATE professors SET lab = 'CogSci' WHERE name LIKE '%Bapi%' OR name LIKE '%Bapiraju%';

-- =====================================================================
-- PART 3: MERGE DUPLICATE PROFESSORS
-- This section consolidates professors that appear with different name formats
-- =====================================================================

-- Function to merge professor duplicates
CREATE OR REPLACE FUNCTION merge_professors(canonical_name VARCHAR, variant_name VARCHAR)
RETURNS VOID AS $$
DECLARE
    canonical_id UUID;
    variant_id UUID;
BEGIN
    -- Get IDs
    SELECT id INTO canonical_id FROM professors WHERE name = canonical_name LIMIT 1;
    SELECT id INTO variant_id FROM professors WHERE name = variant_name LIMIT 1;
    
    -- If both exist and are different, merge
    IF canonical_id IS NOT NULL AND variant_id IS NOT NULL AND canonical_id != variant_id THEN
        -- Update course_instructors to point to canonical professor
        UPDATE course_instructors SET professor_id = canonical_id WHERE professor_id = variant_id;
        
        -- Delete the variant professor
        DELETE FROM professors WHERE id = variant_id;
        
        RAISE NOTICE 'Merged % into %', variant_name, canonical_name;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Merge duplicates (canonical name first, variant second)
SELECT merge_professors('Suryajith Chillara', 'Suryajith Ch');
SELECT merge_professors('Prabhakar Bhimalapuram', 'Prabhakar B');
SELECT merge_professors('Saroja T K', 'TK Saroja');
SELECT merge_professors('Ravi Kiran Sarvadevabhatla', 'Ravi Kiran S');
SELECT merge_professors('Ravi Kiran Sarvadevabhatla', 'Ravi Kiran');
SELECT merge_professors('P. Krishna Reddy', 'Krishna Reddy P.');
SELECT merge_professors('P. Krishna Reddy', 'Krishna Reddy Polepalli');
SELECT merge_professors('Raghu Reddy', 'Raghu Babu Reddy Y.');
SELECT merge_professors('Raghu Reddy', 'Raghu Reddy Y');
SELECT merge_professors('K. Madhava Krishna', 'Madhava Krishna');
SELECT merge_professors('K. Madhava Krishna', 'Madhava Krishna K');
SELECT merge_professors('Vinod P K', 'Vinod PK');
SELECT merge_professors('Bapi Raju S', 'Bapiraju Surampudi');
SELECT merge_professors('Aftab M. Hussain', 'Aftab M Hussain');
SELECT merge_professors('Aftab M. Hussain', 'Aftab Hussain');
SELECT merge_professors('Srinathan K', 'Kannan Srinathan');
SELECT merge_professors('Harikumar Kandath', 'Harikumar K');
SELECT merge_professors('Gowtham Raghunath Kurri', 'Gowtham Kurri');
SELECT merge_professors('Ramachandra Prasad P.', 'RC Prasad');
SELECT merge_professors('Rajan K. S.', 'KS Rajan');
SELECT merge_professors('Pravin Kumar Venkat Rao', 'P. Pravin Kumar Venkat Rao');
SELECT merge_professors('Tapan Kumar Sau', 'Tapan Sau');
SELECT merge_professors('Marimuthu Krishnan', 'M Krishnan');
SELECT merge_professors('Deva Priyakumar U', 'Deva Priyakumar');
SELECT merge_professors('Sunitha Palissery', 'Sunitha P');
SELECT merge_professors('Sujit P. Gujar', 'Sujit Gujar');
SELECT merge_professors('Sujit P. Gujar', 'Sujit P Gujar');
SELECT merge_professors('Nagamanikandan Govindan', 'Nagamanikandan');
SELECT merge_professors('Jawahar C V', 'CV Jawahar');
SELECT merge_professors('Narayanan P J', 'PJ Narayanan');

-- Clean up function
DROP FUNCTION IF EXISTS merge_professors(VARCHAR, VARCHAR);

-- =====================================================================
-- PART 4: REMOVE PROFESSORS WITH NO COURSES (cleanup orphans)
-- =====================================================================

DELETE FROM professors 
WHERE id NOT IN (SELECT DISTINCT professor_id FROM course_instructors)
  AND review_count = 0;

-- =====================================================================
-- VERIFICATION QUERIES (run these to check the results)
-- =====================================================================

-- Check for remaining potential duplicates (similar names)
-- SELECT name, lab, id FROM professors ORDER BY name;

-- Check professors with TBD lab
-- SELECT name FROM professors WHERE lab = 'TBD';

-- Count professors and course relationships
-- SELECT COUNT(*) as professor_count FROM professors;
-- SELECT COUNT(*) as course_instructor_count FROM course_instructors;
