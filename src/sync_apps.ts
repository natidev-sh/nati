/**
 * Sync Apps to Supabase - Allows web dashboard to view/manage desktop apps
 */

import { createClient } from '@supabase/supabase-js'
import { readSettings } from './main/settings'
import { db } from './db'
import log from 'electron-log'

const logger = log.scope('sync_apps')

const SUPABASE_URL = 'https://cvsqiyjfqvdptjnxefbk.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3FpeWpmcXZkcHRqbnhlZmJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAwNDU5NTYsImV4cCI6MjA3NTYyMTk1Nn0.uc-wEsnkKtZjscmmJUIJ64qZJXGHQpp8cYwjEhWBivo'

let supabase: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (!supabase) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  }
  return supabase
}

/**
 * Sync all apps to Supabase for web access
 */
export async function syncAppsToWeb() {
  try {
    const settings = readSettings()
    const user = settings?.natiUser

    if (!user?.id) {
      logger.debug('Skipping app sync: user not logged in')
      return
    }

    const supabase = getSupabaseClient()

    // Set auth token
    if (user.accessToken?.value) {
      await supabase.auth.setSession({
        access_token: user.accessToken.value,
        refresh_token: user.refreshToken?.value || '',
      })
    }

    // Get all apps from local database
    const apps = await db.query.apps.findMany({
      orderBy: (apps, { desc }) => [desc(apps.createdAt)],
    })

    logger.info(`Syncing ${apps.length} apps to web...`)

    // Upsert each app to Supabase
    for (const app of apps) {
      const appData = {
        user_id: user.id,
        desktop_app_id: app.id,
        name: app.name,
        path: app.path,
        description: null,
        framework: null,
        tech_stack: {},
        github_repo: app.githubRepo || null,
        vercel_project_id: app.vercelProjectId || null,
        supabase_project_id: app.supabaseProjectId || null,
        neon_project_id: app.neonProjectId || null,
        is_capacitor: false,
        created_at: app.createdAt,
        updated_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      }

      const { error } = await (supabase.from('user_apps') as any).upsert(appData, {
        onConflict: 'user_id,desktop_app_id'
      })

      if (error) {
        logger.error(`Failed to sync app ${app.name}:`, error)
      } else {
        logger.debug(`Synced app: ${app.name}`)
      }
    }

    logger.info(`App sync complete: ${apps.length} apps synced`)
  } catch (error) {
    logger.error('Error syncing apps:', error)
  }
}

/**
 * Sync a single app after creation/update
 */
export async function syncSingleApp(appId: number) {
  try {
    const settings = readSettings()
    const user = settings?.natiUser

    if (!user?.id) return

    const supabase = getSupabaseClient()

    if (user.accessToken?.value) {
      await supabase.auth.setSession({
        access_token: user.accessToken.value,
        refresh_token: user.refreshToken?.value || '',
      })
    }

    const app = await db.query.apps.findFirst({
      where: (apps, { eq }) => eq(apps.id, appId),
    })

    if (!app) return

    const appData = {
      user_id: user.id,
      desktop_app_id: app.id,
      name: app.name,
      path: app.path,
      github_repo: app.githubRepo || null,
      vercel_project_id: app.vercelProjectId || null,
      supabase_project_id: app.supabaseProjectId || null,
      neon_project_id: app.neonProjectId || null,
      created_at: app.createdAt,
      updated_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
    }

    await (supabase.from('user_apps') as any).upsert(appData, {
      onConflict: 'user_id,desktop_app_id'
    })

    logger.info(`Synced single app: ${app.name}`)
  } catch (error) {
    logger.error('Error syncing single app:', error)
  }
}
