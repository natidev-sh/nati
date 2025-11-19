# Quick Start: Remote Chat Integration

## 🚀 How to Use

### Step 1: Start the IDE
1. Open the Nati IDE on your desktop
2. Make sure you're logged in (if not, go to Settings → Login)
3. The IDE will automatically start sending heartbeats to sync with the website

### Step 2: Open the Website
1. Go to [nati.dev](https://nati.dev) (or your local dev site)
2. Log in with the same account
3. Navigate to **Dashboard → AI Chat** tab

### Step 3: Select Your Device
- You should see your desktop device listed
- Status should show **"Online"** with a green indicator
- Click on your device to select it

### Step 4: Send a Message
1. Type your prompt in the chat input (e.g., "Build me a todo app with React")
2. Select an AI model from the dropdown (GPT-4, Claude, etc.)
3. Click the **Send** button

### Step 5: Watch the Magic ✨
1. Your IDE window will automatically come to focus
2. A new app and chat will be created
3. The AI will start building based on your prompt
4. Check the website for command status updates

## 📋 What Happens Behind the Scenes

```
1. Website → Inserts command into Supabase (remote_commands table)
2. IDE → Polls Supabase every 5 seconds
3. IDE → Detects new command
4. IDE → Creates app + chat
5. IDE → Opens chat window
6. IDE → Starts AI conversation
7. Website → Shows "Completed" status
```

## 🎯 Use Cases

### Work from Anywhere
- Start a project from your phone/tablet browser
- IDE on your desktop starts building
- Come back to a ready project

### Quick Iterations
- Send multiple prompts from website
- IDE processes them sequentially
- Monitor progress from website dashboard

### Team Collaboration
- Share your desktop device link
- Team members send prompts
- All chats appear in your IDE

### Model Testing
- Try same prompt with different models
- Compare GPT-4 vs Claude vs Gemini
- All in one interface

## 🔍 Monitoring

### Device Status
- **Green** = Online (heartbeat < 60 seconds ago)
- **Gray** = Offline (no recent heartbeat)

### Command Status
- **Pending** (⏱️) = Waiting for IDE to pick up
- **Processing** (⚙️) = IDE is working on it
- **Completed** (✅) = Done! Check your IDE
- **Failed** (❌) = Something went wrong (see error message)

## ⚙️ Configuration

### Change Polling Interval
Edit `src/remote_command_listener.ts`:
```typescript
}, 5000) // Change from 5000ms to your preference
```

### Change Models Available
Edit `src/components/WebChatInput.jsx`:
```javascript
const AVAILABLE_MODELS = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  // Add your custom models here
]
```

## 🐛 Troubleshooting

### Device Not Showing Up
- **Check:** Is IDE running?
- **Check:** Are you logged in on IDE?
- **Wait:** Up to 30 seconds for first heartbeat
- **Refresh:** Website dashboard page

### Device Shows Offline
- **Check:** IDE is actually running
- **Check:** Network connection
- **Wait:** 60 seconds timeout
- **Restart:** IDE and wait for heartbeat

### Message Stuck on Pending
- **Check:** IDE logs at `logs/main.log`
- **Check:** Session ID matches in Supabase
- **Verify:** `remote_commands` table has the entry
- **Try:** Restart IDE

### Command Failed
- **Check:** Error message in command history
- **Common:** Invalid prompt or missing permissions
- **Logs:** Check IDE `logs/main.log` for details

## 📊 Database Tables

### `desktop_app_state`
Stores your desktop device info:
- `user_id` - Your user ID
- `device_name` - Computer name
- `session_id` - Unique session UUID
- `is_online` - Calculated online status
- `last_heartbeat` - Last ping timestamp
- `running_apps` - List of apps in IDE

### `remote_commands`
Stores commands from website:
- `user_id` - Your user ID
- `target_session_id` - Which device to send to
- `command_type` - Type of command ('start_chat')
- `command_data` - Prompt, model, attachments
- `status` - Current status
- `error_message` - If failed, why

## 🔒 Security

- ✅ Commands scoped to your user_id only
- ✅ Session IDs are random UUIDs
- ✅ Requires login on both website and IDE
- ✅ Supabase RLS policies enforce permissions
- ✅ No API keys or secrets in command data

## 🎨 Customization

### Change UI Colors
Edit `src/components/WebChatInput.jsx`:
```javascript
// Change gradient colors
from-indigo-500 via-purple-500 to-pink-500
// to
from-blue-500 via-cyan-500 to-teal-500
```

### Add New Command Types
1. Add to `command_type` in website
2. Add handler in `src/remote_command_listener.ts`:
```typescript
case 'your-new-command':
  await handleYourCommand(command)
  break
```

## 📈 Future Ideas

- Real-time notifications (WebSocket)
- File upload from website
- Voice input on website
- Chat history sync
- Select specific app to chat with
- Mobile app support
- Collaborative sessions
- Command scheduling
- Bulk operations

## 🤝 Contributing

Found a bug? Have an idea?
1. Open an issue on GitHub
2. Submit a PR with your fix
3. Join the Discord community

---

**Enjoy building from anywhere! 🚀**
