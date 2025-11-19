/**
 * Desktop App Heartbeat - Syncs app state to web for remote control
 */

import { updateDesktopHeartbeat } from './api_usage_tracker'
import { readSettings } from './main/settings'
import { db } from './db'
import { apps } from './db/schema'
import { syncAppsToWeb } from './sync_apps'
import { startRemoteCommandListener } from './remote_command_listener'
import log from 'electron-log'
import os from 'os'

const logger = log.scope('desktop_heartbeat')

let heartbeatInterval: NodeJS.Timeout | null = null

/**
 * Start sending heartbeats to the web
 */
export function startDesktopHeartbeat() {
  // Send initial heartbeat and sync apps immediately
  sendHeartbeat()
  syncAppsToWeb()
  
  // Start listening for remote commands from web
  startRemoteCommandListener()
  
  let heartbeatCount = 0
  
  // Then send every 30 seconds
  heartbeatInterval = setInterval(() => {
    sendHeartbeat()
    heartbeatCount++
    
    // Sync apps every 5 minutes (10 heartbeats)
    if (heartbeatCount % 10 === 0) {
      syncAppsToWeb()
    }
  }, 30000) // 30 seconds
  
  logger.info('Desktop heartbeat started')
}

/**
 * Stop sending heartbeats
 */
export function stopDesktopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval)
    heartbeatInterval = null
    logger.info('Desktop heartbeat stopped')
  }
  
  // Stop remote command listener
  const { stopRemoteCommandListener } = require('./remote_command_listener')
  stopRemoteCommandListener()
}

/**
 * Send a single heartbeat
 */
async function sendHeartbeat() {
  try {
    const settings = readSettings()
    const user = settings?.natiUser
    
    if (!user?.id) {
      logger.debug('Skipping heartbeat: user not logged in')
      return
    }
    
    // Get all apps from database
    const allApps = await db.query.apps.findMany({
      orderBy: (apps, { desc }) => [desc(apps.createdAt)],
      limit: 50 // Limit to recent apps
    })
    
    // Format running apps for the web
    const runningApps = allApps.map(app => ({
      name: app.name,
      path: app.path,
      status: 'available', // Could track if dev server is running
      created_at: app.createdAt
    }))
    
    await updateDesktopHeartbeat({
      deviceName: os.hostname() || 'Nati Desktop',
      runningApps: runningApps,
      systemInfo: {
        platform: os.platform(),
        release: os.release(),
        arch: os.arch(),
        cpus: os.cpus().length,
        totalMemory: os.totalmem(),
        freeMemory: os.freemem()
      }
    })
    
    logger.debug(`Heartbeat sent: ${runningApps.length} apps`)
  } catch (error) {
    logger.warn('Failed to send heartbeat:', error)
  }
}
