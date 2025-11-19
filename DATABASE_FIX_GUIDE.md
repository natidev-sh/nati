# Database Fix Guide - Remote Chat Integration

## Error: `remote_commands_command_type_check` Constraint Violation

### Problem
The `remote_commands` table has a CHECK constraint that only allows these command types:
- `'start_app'`
- `'stop_app'`
- `'build'`
- `'deploy'`
- `'sync_settings'`

But our implementation uses `'start_chat'`, which is not in the allowed list.

### Solution: Update Database Constraint

## Step 1: Open Supabase SQL Editor

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `cvsqiyjfqvdptjnxefbk`
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

## Step 2: Run the Fix Script

Copy and paste this SQL into the editor and click **Run**:

```sql
-- Drop the existing constraint
ALTER TABLE public.remote_commands 
  DROP CONSTRAINT IF EXISTS remote_commands_command_type_check;

-- Add the new constraint with 'start_chat' included
ALTER TABLE public.remote_commands 
  ADD CONSTRAINT remote_commands_command_type_check 
  CHECK (command_type IN ('start_app', 'stop_app', 'build', 'deploy', 'sync_settings', 'start_chat'));

-- Update status constraint to include 'processing'
ALTER TABLE public.remote_commands 
  DROP CONSTRAINT IF EXISTS remote_commands_status_check;

ALTER TABLE public.remote_commands 
  ADD CONSTRAINT remote_commands_status_check 
  CHECK (status IN ('pending', 'processing', 'sent', 'completed', 'failed'));

-- Add error_message column if it doesn't exist
ALTER TABLE public.remote_commands 
  ADD COLUMN IF NOT EXISTS error_message TEXT;
```

## Step 3: Verify the Changes

Run this query to verify:

```sql
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.remote_commands'::regclass
  AND contype = 'c';
```

You should see:
- `remote_commands_command_type_check` with `'start_chat'` in the list
- `remote_commands_status_check` with `'processing'` in the list

## Step 4: Test the Integration

1. **Refresh your website** (Dashboard → AI Chat)
2. **Select your online device**
3. **Type a test prompt**: "Build me a simple counter"
4. **Click Send**
5. **Check**: Should work without constraint error!

## Alternative: Quick Migration File

The SQL script is also available in your project:
```
C:\Users\user\nati-apps\nati.dev3\FIX_REMOTE_COMMANDS_CONSTRAINT.sql
```

---

## API Keys - Do I Need Them?

### Short Answer: **No API keys needed on the website!**

The website only sends commands to Supabase. The **desktop IDE** uses its own configured API keys to actually run the AI models.

### How It Works:

```
Website (No API keys needed)
   ↓
   Sends command to Supabase
   ↓
Desktop IDE (Has API keys configured)
   ↓
   Receives command
   ↓
   Uses its own API keys to call OpenAI/Anthropic/etc.
```

### To Configure API Keys in IDE:

1. Open Nati IDE
2. Go to **Settings → AI Providers**
3. Configure your provider keys:
   - OpenAI API Key
   - Anthropic API Key
   - Google AI API Key
   - etc.

The IDE will use these keys when processing commands from the website.

---

## Troubleshooting

### Still Getting Constraint Error?

1. **Check you ran the SQL** in the correct project
2. **Verify the constraint** was actually updated (Step 3 above)
3. **Try inserting manually** to test:
   ```sql
   INSERT INTO public.remote_commands (user_id, command_type)
   VALUES (auth.uid(), 'start_chat');
   ```
   - If this works, the constraint is fixed!

### Error: "column error_message does not exist"

The old schema didn't have this column. The fix script adds it. Make sure you ran the full script.

### Status Stuck on "Pending"

This is a different issue - see [REMOTE_CHAT_INTEGRATION.md](./REMOTE_CHAT_INTEGRATION.md#troubleshooting) for IDE-side debugging.

---

## What Changed in the Database?

### Before:
```sql
command_type IN ('start_app', 'stop_app', 'build', 'deploy', 'sync_settings')
status IN ('pending', 'sent', 'completed', 'failed')
-- error_message column didn't exist
```

### After:
```sql
command_type IN ('start_app', 'stop_app', 'build', 'deploy', 'sync_settings', 'start_chat')
status IN ('pending', 'processing', 'sent', 'completed', 'failed')
-- error_message column added
```

---

## For Future Reference

If you add more command types, update the constraint:

```sql
ALTER TABLE public.remote_commands 
  DROP CONSTRAINT remote_commands_command_type_check;

ALTER TABLE public.remote_commands 
  ADD CONSTRAINT remote_commands_command_type_check 
  CHECK (command_type IN ('start_app', 'stop_app', 'build', 'deploy', 'sync_settings', 'start_chat', 'your_new_command'));
```

---

## Need Help?

- Check IDE logs: `logs/main.log`
- Check Supabase logs: Dashboard → Logs → Postgres Logs
- Check browser console: F12 → Console tab
