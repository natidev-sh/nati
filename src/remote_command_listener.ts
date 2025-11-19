/**
 * Remote Command Listener - Polls Supabase for remote commands from web
 * Enables website to send chat messages that get processed by the desktop IDE
 */

import { createClient } from '@supabase/supabase-js'
import { readSettings } from './main/settings'
import { IpcClient } from './ipc/ipc_client'
import log from 'electron-log'
import { BrowserWindow } from 'electron'

const logger = log.scope('remote_command_listener')

const SUPABASE_URL = 'https://cvsqiyjfqvdptjnxefbk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo'

let supabase: ReturnType<typeof createClient> | null = null
let pollInterval: NodeJS.Timeout | null = null
let realtimeChannel: any = null

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabase
}

/**
 * Start listening for remote commands from the web
 */
export async function startRemoteCommandListener() {
  try {
    const settings = readSettings()
    const user = settings?.natiUser

    if (!user?.id) {
      logger.warn('Cannot start remote command listener: user not logged in')
      return
    }

    const supabase = getSupabaseClient()

    // Set auth session
    if (user.accessToken?.value) {
      await supabase.auth.setSession({
        access_token: user.accessToken.value,
        refresh_token: user.refreshToken?.value || '',
      })
    }

    // Get current session ID from desktop_app_state
    const { data: appState } = await (supabase
      .from('desktop_app_state') as any)
      .select('session_id')
      .eq('user_id', user.id)
      .order('last_heartbeat', { ascending: false })
      .limit(1)
      .single()

    if (!appState?.session_id) {
      logger.warn('No session_id found in desktop_app_state')
      return
    }

    const sessionId = appState.session_id

    logger.info(`Starting remote command listener for session: ${sessionId}`)

    // Try using Realtime first (more efficient)
    try {
      realtimeChannel = supabase
        .channel('remote_commands')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'remote_commands',
            filter: `target_session_id=eq.${sessionId}`,
          },
          (payload: any) => {
            logger.info('Received realtime command:', payload.new.command_type)
            processCommand(payload.new)
          }
        )
        .subscribe((status: string) => {
          if (status === 'SUBSCRIBED') {
            logger.info('✅ Realtime subscription active')
          } else if (status === 'CHANNEL_ERROR') {
            logger.warn('Realtime subscription error, falling back to polling')
            startPolling(sessionId)
          }
        })
    } catch (error) {
      logger.warn('Realtime not available, using polling:', error)
      startPolling(sessionId)
    }

    logger.info('Remote command listener started')
  } catch (error) {
    logger.error('Error starting remote command listener:', error)
  }
}

/**
 * Fallback polling mechanism
 */
function startPolling(sessionId: string) {
  if (pollInterval) {
    clearInterval(pollInterval)
  }

  pollInterval = setInterval(async () => {
    try {
      const supabase = getSupabaseClient()

      // Get pending commands
      const { data: commands, error } = await (supabase
        .from('remote_commands') as any)
        .select('*')
        .eq('target_session_id', sessionId)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (commands && commands.length > 0) {
        logger.info(`Processing ${commands.length} pending commands`)
        for (const command of commands) {
          await processCommand(command)
        }
      }
    } catch (error) {
      logger.error('Error polling remote commands:', error)
    }
  }, 5000) // Poll every 5 seconds
}

/**
 * Process a remote command
 */
async function processCommand(command: any) {
  try {
    const supabase = getSupabaseClient()

    // Mark as processing
    await (supabase
      .from('remote_commands') as any)
      .update({ status: 'processing' })
      .eq('id', command.id)

    logger.info(`Processing command: ${command.command_type}`, command.command_data)

    switch (command.command_type) {
      case 'start_chat':
        await handleStartChat(command)
        break
      default:
        logger.warn(`Unknown command type: ${command.command_type}`)
    }

    // Mark as completed
    await (supabase
      .from('remote_commands') as any)
      .update({ status: 'completed' })
      .eq('id', command.id)
  } catch (error) {
    logger.error('Error processing command:', error)

    // Mark as failed
    try {
      const supabase = getSupabaseClient()
      await (supabase
        .from('remote_commands') as any)
        .update({
          status: 'failed',
          error_message: (error as Error)?.message || String(error),
        })
        .eq('id', command.id)
    } catch (updateError) {
      logger.error('Failed to update command status:', updateError)
    }
  }
}

/**
 * Handle start_chat command from web
 */
async function handleStartChat(command: any) {
  const { prompt, model, attachments } = command.command_data || {}

  if (!prompt || typeof prompt !== 'string') {
    throw new Error('Invalid prompt in command_data')
  }

  logger.info(`Starting chat from web: "${prompt.slice(0, 50)}..."`)

  // Get or create IpcClient instance
  const { db } = await import('./db')
  const { apps } = await import('./db/schema')
  const { generateCuteAppName } = await import('./lib/utils')

  // Create a new app
  const [newApp] = await db
    .insert(apps)
    .values({
      name: generateCuteAppName(),
    })
    .returning()

  logger.info(`Created app: ${newApp.name} (ID: ${newApp.id})`)

  // Create a chat for the app
  const { chats } = await import('./db/schema')
  const [newChat] = await db
    .insert(chats)
    .values({
      appId: newApp.id,
    })
    .returning()

  logger.info(`Created chat: ${newChat.id}`)

  // Get the main window and navigate to the chat
  const mainWindow = BrowserWindow.getAllWindows()[0]
  if (mainWindow) {
    // Focus the window
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()

    // Navigate to the chat page
    mainWindow.webContents.send('navigate-to-chat', {
      chatId: newChat.id,
      appId: newApp.id,
    })

    // Wait a bit for navigation, then trigger the chat
    setTimeout(async () => {
      // Trigger the chat stream via IPC
      mainWindow.webContents.send('remote-chat-message', {
        prompt,
        chatId: newChat.id,
        model,
        attachments: attachments || [],
      })

      logger.info('✅ Chat started from web successfully')
    }, 1000)
  } else {
    logger.error('No main window found')
    throw new Error('Desktop app window not found')
  }
}

/**
 * Stop listening for remote commands
 */
export function stopRemoteCommandListener() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }

  if (realtimeChannel) {
    realtimeChannel.unsubscribe()
    realtimeChannel = null
  }

  logger.info('Remote command listener stopped')
}
