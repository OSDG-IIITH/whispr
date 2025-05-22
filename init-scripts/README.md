# Whispr Database Schema

This directory contains the initialization scripts for the PostgreSQL database.

## Schema Overview

The database schema supports a course and professor review platform with social features, privacy, and robust data integrity.

### Entity Relationship Diagram (Conceptual)

```
┌────────────┐      ┌───────────┐      ┌────────────┐
│   Users    │──────│ Following │──────│   Users    │
└────────────┘      └───────────┘      └────────────┘
      │                                       │
      │                                       │
      ▼                                       ▼
┌────────────┐      ┌───────────┐      ┌────────────┐
│  Reviews   │◄─────│   Votes   │─────►│  Replies   │
└────────────┘      └───────────┘      └────────────┘
      │
      │
      │       ┌──────────────────┐
      ├───────┤ CourseInstructors│
      │       └──────────────────┘
      │                │
      │                │
┌────────────┐         │            ┌────────────┐
│  Courses   │◄────────┴───────────►│ Professors │
└────────────┘                      └────────────┘

┌──────────────────────┐
│ ProfessorSocialMedia │
└──────────────────────┘

┌────────────┐
│ UsedEmails │ (Not connected to users to maintain privacy)
└────────────┘

┌──────────────┐
│ Notifications│
└──────────────┘
```

## Tables

### users

Stores user account information and profile data. Email information is not stored with the user for privacy reasons.

| Column             | Type         | Description                              |
| ------------------ | ------------ | ---------------------------------------- |
| id                 | UUID         | Primary key                              |
| username           | VARCHAR(50)  | Unique username                          |
| hashed_password    | VARCHAR(255) | Bcrypt hashed password                   |
| avatar_url         | TEXT         | Profile picture URL                      |
| bio                | TEXT         | User biography                           |
| student_since_year | INTEGER      | Year user became a student               |
| is_muffled         | BOOLEAN      | Can't post until verified (default TRUE) |
| is_admin           | BOOLEAN      | Has admin privileges (default FALSE)     |
| echoes             | INTEGER      | Reputation points                        |
| created_at         | TIMESTAMP    | Account creation time                    |
| updated_at         | TIMESTAMP    | Last update time                         |

### professors

Stores information about professors.

| Column         | Type         | Description          |
| -------------- | ------------ | -------------------- |
| id             | UUID         | Primary key          |
| name           | VARCHAR(255) | Professor's name     |
| lab            | VARCHAR(255) | Lab affiliation      |
| review_summary | TEXT         | Summary of reviews   |
| review_count   | INTEGER      | Number of reviews    |
| average_rating | NUMERIC(3,2) | Average rating (1-5) |
| created_at     | TIMESTAMP    | Record creation time |
| updated_at     | TIMESTAMP    | Last update time     |

### professor_social_media

Stores social media links for professors.

| Column       | Type        | Description               |
| ------------ | ----------- | ------------------------- |
| id           | UUID        | Primary key               |
| professor_id | UUID        | Foreign key to professors |
| platform     | VARCHAR(50) | Social media platform     |
| url          | TEXT        | Social media URL          |
| created_at   | TIMESTAMP   | Record creation time      |
| updated_at   | TIMESTAMP   | Last update time          |

### courses

Stores information about courses.

| Column                | Type         | Description               |
| --------------------- | ------------ | ------------------------- |
| id                    | UUID         | Primary key               |
| code                  | VARCHAR(20)  | Unique course code        |
| name                  | VARCHAR(255) | Course name               |
| credits               | INTEGER      | Number of credits         |
| description           | TEXT         | Course description        |
| official_document_url | TEXT         | Link to official document |
| review_summary        | TEXT         | Summary of reviews        |
| review_count          | INTEGER      | Number of reviews         |
| average_rating        | NUMERIC(3,2) | Average rating (1-5)      |
| created_at            | TIMESTAMP    | Record creation time      |
| updated_at            | TIMESTAMP    | Last update time          |

### course_instructors

Links professors to courses they teach, with semester information.

| Column         | Type         | Description               |
| -------------- | ------------ | ------------------------- |
| id             | UUID         | Primary key               |
| professor_id   | UUID         | Foreign key to professors |
| course_id      | UUID         | Foreign key to courses    |
| semester       | VARCHAR(20)  | Semester (SPRING/MONSOON) |
| year           | INTEGER      | Year taught               |
| summary        | TEXT         | Summary of teaching       |
| review_count   | INTEGER      | Number of reviews         |
| average_rating | NUMERIC(3,2) | Average rating (1-5)      |
| created_at     | TIMESTAMP    | Record creation time      |

### reviews

Stores reviews for courses and professors.

| Column               | Type      | Description                                  |
| -------------------- | --------- | -------------------------------------------- |
| id                   | UUID      | Primary key                                  |
| user_id              | UUID      | Foreign key to users                         |
| course_id            | UUID      | Foreign key to courses (nullable)            |
| professor_id         | UUID      | Foreign key to professors (nullable)         |
| course_instructor_id | UUID      | Foreign key to course_instructors (nullable) |
| rating               | INTEGER   | Rating (1-5)                                 |
| content              | TEXT      | Review content                               |
| upvotes              | INTEGER   | Number of upvotes                            |
| downvotes            | INTEGER   | Number of downvotes                          |
| is_edited            | BOOLEAN   | Whether the review is edited                 |
| created_at           | TIMESTAMP | Record creation time                         |
| updated_at           | TIMESTAMP | Last update time                             |

### replies

Stores replies to reviews.

| Column     | Type      | Description                 |
| ---------- | --------- | --------------------------- |
| id         | UUID      | Primary key                 |
| review_id  | UUID      | Foreign key to reviews      |
| user_id    | UUID      | Foreign key to users        |
| content    | TEXT      | Reply content               |
| upvotes    | INTEGER   | Number of upvotes           |
| downvotes  | INTEGER   | Number of downvotes         |
| is_edited  | BOOLEAN   | Whether the reply is edited |
| created_at | TIMESTAMP | Record creation time        |
| updated_at | TIMESTAMP | Last update time            |

### votes

Tracks user votes on reviews and replies.

| Column     | Type      | Description                         |
| ---------- | --------- | ----------------------------------- |
| id         | UUID      | Primary key                         |
| user_id    | UUID      | Foreign key to users                |
| review_id  | UUID      | Foreign key to reviews (nullable)   |
| reply_id   | UUID      | Foreign key to replies (nullable)   |
| vote_type  | BOOLEAN   | TRUE for upvote, FALSE for downvote |
| created_at | TIMESTAMP | Record creation time                |
| updated_at | TIMESTAMP | Last update time                    |

### user_followers

Tracks which users follow other users.

| Column      | Type      | Description                                  |
| ----------- | --------- | -------------------------------------------- |
| follower_id | UUID      | Foreign key to users (who is following)      |
| followed_id | UUID      | Foreign key to users (who is being followed) |
| created_at  | TIMESTAMP | Record creation time                         |

### used_emails

Tracks used email addresses for verification without linking them to specific user accounts. This maintains privacy while preventing duplicate email usage.

| Column      | Type         | Description          |
| ----------- | ------------ | -------------------- |
| id          | UUID         | Primary key          |
| email       | VARCHAR(255) | Used email address   |
| verified_at | TIMESTAMP    | Time of verification |
| created_at  | TIMESTAMP    | Record creation time |

### notifications

Stores user notifications.

| Column         | Type        | Description                        |
| -------------- | ----------- | ---------------------------------- |
| id             | UUID        | Primary key                        |
| username       | VARCHAR(50) | Foreign key to users (username)    |
| type           | VARCHAR(50) | Notification type                  |
| content        | TEXT        | Notification content               |
| source_id      | UUID        | Related entity ID                  |
| source_type    | VARCHAR(50) | Type of source entity              |
| actor_username | VARCHAR(50) | Foreign key to users (username)    |
| is_read        | BOOLEAN     | Whether notification has been read |
| created_at     | TIMESTAMP   | Record creation time               |

## Privacy Considerations

The database design is privacy-focused:

1. **Email Separation**: Email addresses are stored in a separate table (`used_emails`) not linked to user accounts.
2. **Verification Flow**: Email verification is tracked without storing which user it belongs to.
3. **Authentication**: Authentication is done via username only, not email.

## Constraints and Indexes

- Foreign key constraints to enforce relationships
- Uniqueness constraints (e.g., unique usernames)
- Check constraints (e.g., rating must be between 1 and 5)
- Validation constraints (e.g., a review must be for a course, professor, or course-instructor pair)
- Indexes on all foreign keys and commonly searched fields
- Composite and partial indexes for performance where appropriate

## Triggers

- `update_modified_column()`: Updates the `updated_at` column on record modification for all relevant tables via triggers.

## Automatic Timestamp Updates

All tables with an `updated_at` column have a trigger to automatically update the timestamp on modification.

---

For details, see `01-init.sql` in this directory.
