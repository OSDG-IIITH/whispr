"""
Model for storing the professors.

Fields:
- id: The unique identifier for the professor.
- name: The name of the professor.
- lab: The lab of the professor.
- socials: [list of] -> (platform, link) -> The social media links of the professor.
- reviewSummary: [composite] -> (count, overall rating) -> The summary of the reviews for the professor.

Future Improvements: 
- textSummary to the reviewSummary attribute
"""