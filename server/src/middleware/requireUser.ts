import type { Request, Response, NextFunction } from 'express'
import {
  getSupabaseAdmin,
  isSupabaseServiceConfigured,
  missingSupabaseServiceEnvHint,
} from '../lib/supabaseAdmin.js'

export async function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!isSupabaseServiceConfigured()) {
    return res.status(503).json({
      error: missingSupabaseServiceEnvHint() || 'Supabase service credentials are not configured on the API server.',
    })
  }
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' })
  }
  const jwt = header.slice(7).trim()
  if (!jwt) {
    return res.status(401).json({ error: 'Missing access token' })
  }
  const supabase = getSupabaseAdmin()
  const { data: { user }, error } = await supabase.auth.getUser(jwt)
  if (error || !user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
  req.userId = user.id
  next()
}
