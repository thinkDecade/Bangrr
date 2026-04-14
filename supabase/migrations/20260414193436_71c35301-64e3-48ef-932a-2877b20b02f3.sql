
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'run-ai-agents-cycle',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://project--18501748-aa1b-453d-9ad5-dab41d8a5cb6.lovable-project.com/hooks/agent-cycle',
    headers := '{"Content-Type": "application/json", "Lovable-Context": "cron", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlhcm1vbXRpa2Zjc2NveGZlbWZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxNzcxNjYsImV4cCI6MjA5MTc1MzE2Nn0.RV_DaZKtrAh6UK75koAwwlvRrHVpuzZ1PbbshCG6Wxc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
