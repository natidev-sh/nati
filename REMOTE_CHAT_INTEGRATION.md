# Remote Chat Integration - Website to IDE

## Overview

This integration allows users to send chat messages from the nati.dev website directly to their desktop IDE, enabling seamless cross-device AI assistance.

## Architecture

```
Website (nati.dev3) → Supabase → Desktop IDE (dyad-main)
                    remote_commands table
```

## Components Added

### IDE Side (Desktop App)

1. **`src/remote_command_listener.ts`** - NEW
   - Polls/subscribes to Supabase `remote_commands` table
   - Processes `start_chat` commands from website
   - Creates new app + chat automatically
   - Brings IDE window to focus
   - Triggers chat stream with user's prompt

2. **`src/desktop_heartbeat.ts`** - MODIFIED
   - Now starts remote command listener on login
   - Stops listener when heartbeat stops

3. **`src/renderer.tsx`** - MODIFIED
   - Added IPC event listeners for `navigate-to-chat` and `remote-chat-message`
   - Handles navigation and chat initiation from remote commands

### Website Side (nati.dev3)

1. **`src/components/WebChatInput.jsx`** - NEW
   - Beautiful chat input styled like IDE's HomeChatInput
   - Model selection dropdown (GPT-4, Claude, Gemini)
   - Animated placeholders and premium UI effects
   - Disabled state when no device selected

2. **`src/pages/AIChat.jsx`** - NEW
   - Device selection interface
   - Shows online/offline status
   - Sends messages to `remote_commands` table
   - Displays command history with status updates
   - Real-time polling for command completion

3. **`src/Dashboard.jsx`** - MODIFIED
   - Added "AI Chat" tab with MessageSquare icon
   - Integrated AIChat component

## Database Schema

Uses existing Supabase table: `remote_commands`

```sql
CREATE TABLE remote_commands (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES auth.users,
  target_session_id uuid,
  command_type text, -- 'start_chat'
  command_data jsonb, -- { prompt, model, attachments }
  status text, -- 'pending', 'processing', 'completed', 'failed'
  error_message text,
  created_at timestamp,
  updated_at timestamp
);
```

## Flow

1. **User logs into website** → Profile data synced to Supabase
2. **User opens IDE** → Desktop heartbeat starts → Remote command listener activates
3. **User types message on website** → Selects device and model
4. **Website inserts into `remote_commands`** → Status: 'pending'
5. **IDE polls/receives command** → Status: 'processing'
6. **IDE creates app + chat** → Navigates to chat → Starts AI stream
7. **Command completes** → Status: 'completed' (or 'failed')
8. **Website shows status** → User sees "Completed" badge

## Features

### Website Features
- ✅ Device selection with online/offline status
- ✅ AI model selection (GPT-4, Claude, Gemini)
- ✅ Animated premium UI matching IDE design
- ✅ Command history with real-time status updates
- ✅ Auto-polling every 5 seconds

### IDE Features
- ✅ Realtime subscription (with polling fallback)
- ✅ Automatic app creation
- ✅ Window focus and navigation
- ✅ Chat stream initiation
- ✅ Error handling and status updates

## Testing Checklist

### Prerequisites
- [ ] User logged into website (nati.dev3)
- [ ] IDE running and user logged in
- [ ] IDE device shows as "Online" in website dashboard

### Test Cases

1. **Basic Flow**
   - [ ] Open website → Dashboard → AI Chat tab
   - [ ] Verify device shows as "Online"
   - [ ] Select device
   - [ ] Type prompt: "Build me a todo app"
   - [ ] Select model: "GPT-4o"
   - [ ] Click Send
   - [ ] Verify IDE window comes to focus
   - [ ] Verify new app created in IDE
   - [ ] Verify chat starts with prompt
   - [ ] Verify command status updates to "Completed" on website

2. **Model Selection**
   - [ ] Test with different models (GPT-4, Claude, Gemini)
   - [ ] Verify selected model is used in IDE

3. **Multiple Devices**
   - [ ] Open IDE on two machines
   - [ ] Verify both show in website device list
   - [ ] Select specific device
   - [ ] Verify only selected device receives command

4. **Offline Handling**
   - [ ] Close IDE
   - [ ] Wait 60+ seconds
   - [ ] Verify device shows as "Offline" on website
   - [ ] Verify send button is disabled
   - [ ] Reopen IDE
   - [ ] Verify device comes back online

5. **Error Handling**
   - [ ] Send invalid prompt (empty)
   - [ ] Verify error handling
   - [ ] Check error message display

6. **Command History**
   - [ ] Send multiple messages
   - [ ] Verify all appear in history
   - [ ] Verify status badges update correctly
   - [ ] Verify recent commands show first

## Configuration

### Supabase Connection
Both IDE and website use the same Supabase instance:
- URL: `https://cvsqiyjfqvdptjnxefbk.supabase.co`
- Defined in:
  - IDE: `src/api_usage_tracker.ts`
  - Website: `src/integrations/supabase/client.ts`

### Polling Intervals
- **IDE**: Polls every 5 seconds (with realtime fallback)
- **Website**: Polls every 5 seconds for device/command updates

## Troubleshooting

### IDE doesn't receive commands
1. Check if user is logged in (IDE menu → Settings)
2. Check desktop_heartbeat logs: `logs/main.log`
3. Verify `desktop_app_state` table has recent heartbeat
4. Check `remote_command_listener` logs

### Website shows device as offline
1. IDE must be running and logged in
2. Wait for heartbeat (up to 30 seconds)
3. Check `last_heartbeat` timestamp in `desktop_app_state`

### Commands stuck in "Pending"
1. Check IDE logs for errors
2. Verify `session_id` matches between device and command
3. Check network connectivity to Supabase

## Future Enhancements

- [ ] File attachments from website
- [ ] Chat history sync from IDE to website
- [ ] Multiple messages in queue
- [ ] Push notifications when command completes
- [ ] Select specific app in IDE to chat with
- [ ] Voice input on website
- [ ] WebSocket for instant delivery (zero latency)

## Security Notes

- Commands are scoped to user_id
- Session IDs are UUID-based
- Supabase RLS policies should restrict access
- No sensitive data in command_data
- User must be authenticated on both website and IDE
