-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    bio TEXT,
    student_since_year INTEGER,
    is_muffled BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    echoes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create professors table
CREATE TABLE professors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    lab VARCHAR(255),
    review_summary TEXT,
    review_count INTEGER DEFAULT 0,
    average_rating NUMERIC(3, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create professor social media table
CREATE TABLE professor_social_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    credits INTEGER,
    description TEXT,
    official_document_url TEXT,
    review_summary TEXT,
    review_count INTEGER DEFAULT 0,
    average_rating NUMERIC(3, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create course_instructors table
CREATE TABLE course_instructors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    professor_id UUID NOT NULL REFERENCES professors(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    semester VARCHAR(20) CHECK (semester IN ('SPRING', 'MONSOON')),
    year INTEGER,
    summary TEXT,
    review_count INTEGER DEFAULT 0,
    average_rating NUMERIC(3, 2) DEFAULT 0.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(professor_id, course_id, semester, year)
);
-- Create reviews table
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    professor_id UUID REFERENCES professors(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (
        rating >= 1
        AND rating <= 5
    ),
    content TEXT,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (course_id IS NULL)
        OR (professor_id IS NULL)
    )
);
-- Create course_instructor-review table
CREATE TABLE course_instructor_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    course_instructor_id UUID NOT NULL REFERENCES course_instructors(id) ON DELETE CASCADE,
    UNIQUE(review_id, course_instructor_id)
);
-- Create replies table
CREATE TABLE replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    is_edited BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
    vote_type BOOLEAN NOT NULL,
    -- TRUE for upvote, FALSE for downvote
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (
            review_id IS NOT NULL
            AND reply_id IS NULL
        )
        OR (
            review_id IS NULL
            AND reply_id IS NOT NULL
        )
    ),
    UNIQUE(user_id, review_id),
    UNIQUE(user_id, reply_id)
);
-- Create user_followers table
CREATE TABLE user_followers (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    followed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, followed_id),
    CHECK (follower_id != followed_id)
);
-- Create used_emails table - just to keep track of which emails have been used for verification
CREATE TABLE used_emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create verification_sessions table for temporary CAS verification flow
CREATE TABLE verification_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) NOT NULL REFERENCES users(username) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (
        type IN (
            'MENTION',
            'VOTE',
            'REPLY',
            'RANK_CHANGE',
            'SYSTEM',
            'FOLLOW'
        )
    ),
    content TEXT NOT NULL,
    source_id UUID,
    source_type VARCHAR(50),
    actor_username VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Create reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    review_id UUID REFERENCES reviews(id) ON DELETE CASCADE,
    reply_id UUID REFERENCES replies(id) ON DELETE CASCADE,
    reported_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    report_type VARCHAR(50) NOT NULL CHECK (
        report_type IN (
            'spam',
            'harassment',
            'inappropriate',
            'misinformation',
            'other'
        )
    ),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (
        status IN (
            'pending',
            'reviewed',
            'resolved',
            'dismissed'
        )
    ),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (
        (
            review_id IS NOT NULL
            AND reply_id IS NULL
            AND reported_user_id IS NULL
        )
        OR (
            review_id IS NULL
            AND reply_id IS NOT NULL
            AND reported_user_id IS NULL
        )
        OR (
            review_id IS NULL
            AND reply_id IS NULL
            AND reported_user_id IS NOT NULL
        )
    )
);
-- Add indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_professors_name ON professors(name);
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_name ON courses(name);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_course_id ON reviews(course_id);
CREATE INDEX idx_reviews_professor_id ON reviews(professor_id);
CREATE INDEX idx_replies_review_id ON replies(review_id);
CREATE INDEX idx_replies_user_id ON replies(user_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_votes_review_id ON votes(review_id);
CREATE INDEX idx_votes_reply_id ON votes(reply_id);
CREATE INDEX idx_user_followers_follower_id ON user_followers(follower_id);
CREATE INDEX idx_user_followers_followed_id ON user_followers(followed_id);
CREATE INDEX idx_notifications_username ON notifications(username);
CREATE INDEX idx_notifications_actor_username ON notifications(actor_username);
CREATE INDEX idx_notifications_source ON notifications(source_id, source_type);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_used_emails_email ON used_emails(email);
CREATE INDEX idx_verification_sessions_session_token ON verification_sessions(session_token);
CREATE INDEX idx_verification_sessions_user_id ON verification_sessions(user_id);
CREATE INDEX idx_professor_social_media_professor_id ON professor_social_media(professor_id);
CREATE INDEX idx_course_instructors_professor_id ON course_instructors(professor_id);
CREATE INDEX idx_course_instructors_course_id ON course_instructors(course_id);
CREATE INDEX idx_course_instructor_reviews_review_id ON course_instructor_reviews(review_id);
CREATE INDEX idx_course_instructor_reviews_course_instructor_id ON course_instructor_reviews(course_instructor_id);
-- Add some trigger functions to handle updated_at timestamps
CREATE OR REPLACE FUNCTION update_modified_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Add triggers for tables with updated_at columns
CREATE TRIGGER update_users_modtime BEFORE
UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_professors_modtime BEFORE
UPDATE ON professors FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_courses_modtime BEFORE
UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_reviews_modtime BEFORE
UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_replies_modtime BEFORE
UPDATE ON replies FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_votes_modtime BEFORE
UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_modified_column();
CREATE TRIGGER update_professor_social_media_modtime BEFORE
UPDATE ON professor_social_media FOR EACH ROW EXECUTE FUNCTION update_modified_column();