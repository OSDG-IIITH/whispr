-- Notification Cleanup Migration
-- This migration sets up automatic deletion of old notifications (older than 30 days)

-- Enable pg_cron extension if not already enabled
-- Note: pg_cron requires Supabase Pro plan or higher
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily cleanup job at 3 AM UTC
-- Deletes notifications older than 30 days
SELECT cron.schedule(
  'cleanup-old-notifications',
  '0 3 * * *',
  $$DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days'$$
);

-- To unschedule this job, run:
-- SELECT cron.unschedule('cleanup-old-notifications');

-- To check scheduled jobs:
-- SELECT * FROM cron.job;
