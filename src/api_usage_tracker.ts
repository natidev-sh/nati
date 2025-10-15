/**
 * API Usage Tracker - Syncs token usage to Supabase for web analytics
 */

import { createClient } from '@supabase/supabase-js'
import { readSettings } from './main/settings'
import log from 'electron-log'

const logger = log.scope('api_usage_tracker')

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
 * Log API usage to Supabase for web analytics
 */
export async function trackAPIUsage(params: {
  projectName?: string
  model: string
  provider?: string
  promptTokens?: number
  completionTokens?: number
  totalTokens: number
  cost?: number
  responseTimeMs?: number
  status?: 'success' | 'error' | 'timeout'
  errorMessage?: string
}) {
  try {
    const settings = readSettings()
    const user = settings?.natiUser

    if (!user?.id) {
      logger.warn('Cannot track API usage: user not logged in')
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

    const { error } = await (supabase.from('api_usage') as any).insert({
      user_id: user.id,
      project_name: params.projectName,
      model: params.model,
      provider: params.provider || guessProvider(params.model),
      prompt_tokens: params.promptTokens || 0,
      completion_tokens: params.completionTokens || 0,
      total_tokens: params.totalTokens,
      cost: params.cost || estimateCost(params.model, params.totalTokens),
      response_time_ms: params.responseTimeMs,
      status: params.status || 'success',
      error_message: params.errorMessage,
    })

    if (error) {
      logger.error('Failed to track API usage:', error)
    } else {
      logger.info(`Tracked ${params.totalTokens} tokens for ${params.model}`)
    }
  } catch (error) {
    logger.error('Error tracking API usage:', error)
  }
}

/**
 * Guess provider from model name
 */
function guessProvider(model: string): string {
  const modelLower = model.toLowerCase()
  if (modelLower.includes('gpt')) return 'openai'
  if (modelLower.includes('claude')) return 'anthropic'
  if (modelLower.includes('gemini')) return 'google'
  if (modelLower.includes('llama')) return 'meta'
  return 'unknown'
}

/**
 * Estimate cost based on model and tokens
 * Using approximate pricing as of Oct 2024
 */
function estimateCost(model: string, tokens: number): number {
  const modelLower = model.toLowerCase()
  let costPerMillion = 0

  // OpenAI pricing (approximate)
  if (modelLower.includes('gpt-4')) {
    costPerMillion = 30 // $30 per 1M tokens (blended input/output)
  } else if (modelLower.includes('gpt-3.5')) {
    costPerMillion = 1.5 // $1.50 per 1M tokens
  } else if (modelLower.includes('claude-3')) {
    costPerMillion = 15 // $15 per 1M tokens (blended)
  } else if (modelLower.includes('claude')) {
    costPerMillion = 8 // $8 per 1M tokens
  } else {
    costPerMillion = 5 // Default estimate
  }

  return (tokens / 1000000) * costPerMillion
}

/**
 * Update desktop app heartbeat
 */
export async function updateDesktopHeartbeat(params: {
  deviceName: string
  runningApps: any[]
  systemInfo?: any
}) {
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

    // Find or create desktop app state
    const { data: existing } = await (supabase
      .from('desktop_app_state') as any)
      .select('id')
      .eq('user_id', user.id)
      .eq('device_name', params.deviceName)
      .single()

    const payload = {
      user_id: user.id,
      device_name: params.deviceName,
      is_online: true,
      last_heartbeat: new Date().toISOString(),
      running_apps: params.runningApps,
      system_info: params.systemInfo || {},
    }

    if (existing) {
      await (supabase
        .from('desktop_app_state') as any)
        .update(payload)
        .eq('id', existing.id)
    } else {
      await (supabase.from('desktop_app_state') as any).insert(payload)
    }

    logger.info('Updated desktop heartbeat')
  } catch (error) {
    logger.error('Error updating heartbeat:', error)
  }
}
