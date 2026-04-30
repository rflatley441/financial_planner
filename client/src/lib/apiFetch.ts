/** Parse `{ error: string }` from our API or explain HTML error pages (stale server / wrong port). */
export async function readApiErrorMessage(r: Response): Promise<string> {
  const ct = r.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    const j = await r.json().catch(() => ({})) as { error?: unknown }
    if (typeof j.error === 'string' && j.error) return j.error
    return r.statusText || `HTTP ${r.status}`
  }
  const text = await r.text()
  if (/cannot post\s+\/api\/plaid/i.test(text) || text.includes('Cannot POST')) {
    return (
      'The API server does not expose Plaid routes (404). From the repo root run `npm run dev` '
      + 'so both UI and API restart, or confirm port 3001 is running the latest server code.'
    )
  }
  if (r.status === 502 || r.status === 503) {
    return text.slice(0, 280) || `Server error (${r.status})`
  }
  return text.slice(0, 280) || r.statusText || `HTTP ${r.status}`
}
