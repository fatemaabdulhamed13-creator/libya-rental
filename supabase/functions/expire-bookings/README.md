# Expire Bookings Edge Function

This Supabase Edge Function automatically expires pending bookings that have passed their 48-hour expiration window.

## How It Works

- Runs every 30 minutes via Supabase Cron
- Calls the `expire_pending_bookings()` database function
- Updates bookings with `status = 'pending'` and `expires_at < NOW()` to `status = 'expired'`
- Frees up dates for new bookings

## Setup Instructions

### 1. Deploy the Edge Function

```bash
npx supabase functions deploy expire-bookings
```

### 2. Set Up Cron Trigger in Supabase Dashboard

Go to **Database** → **Extensions** → Enable **pg_cron**

Then run this SQL in the SQL Editor:

```sql
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run every 30 minutes
SELECT cron.schedule(
  'expire-pending-bookings',           -- Job name
  '*/30 * * * *',                      -- Every 30 minutes
  $$
    SELECT net.http_post(
        url:='https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
    ) as request_id;
  $$
);
```

**Important:** Replace:
- `YOUR_PROJECT_REF` with your Supabase project reference
- `YOUR_ANON_KEY` with your Supabase anon/public key

### 3. Verify Cron Jobs

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Check cron job run history
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;
```

### 4. Manual Trigger (for testing)

You can manually trigger the function:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/expire-bookings \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Alternative: Using Supabase Cron (Beta)

If your Supabase project has the new Cron feature enabled:

1. Go to **Edge Functions** → **expire-bookings** → **Settings**
2. Enable "Scheduled Execution"
3. Set schedule: `*/30 * * * *` (every 30 minutes)

## Monitoring

Check the function logs in Supabase Dashboard:
- **Edge Functions** → **expire-bookings** → **Logs**

The function returns:
```json
{
  "success": true,
  "expired_count": 3,
  "timestamp": "2026-02-16T10:30:00.000Z"
}
```
