-- Performance optimization indexes for Whispr
-- Run this migration in Supabase SQL Editor

-- Faster notification lookups for unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
ON notifications(username) WHERE is_read = false;

-- Faster review feeds (sorted by date, filtered by upvotes)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_created_upvotes 
ON reviews(created_at DESC, upvotes DESC);

-- Faster user follower lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_followers_follower 
ON user_followers(follower_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_followers_followed 
ON user_followers(followed_id);

-- Faster review lookups by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reviews_user_id 
ON reviews(user_id);

-- Faster reply lookups by review
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_replies_review_id 
ON replies(review_id);
