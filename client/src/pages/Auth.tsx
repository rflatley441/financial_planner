import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { TrendingUp, Mail, Lock, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'

type Mode = 'signin' | 'signup'

function authErrorMessage(raw: string): string {
  const t = raw.trim().toLowerCase()
  if (t === 'failed to fetch' || t.includes('networkerror') || raw.includes('Load failed')) {
    return (
      'Could not reach Supabase. Check VITE_SUPABASE_URL in client/.env.local (cloud: https://YOUR_REF.supabase.co; ' +
      'local CLI: http://127.0.0.1:54321), ensure the project is not paused and `supabase start` is running if local, ' +
      'then restart npm run dev.'
    )
  }
  return raw
}

export default function Auth() {
  const { signIn, signUp } = useAuth()
  const [mode,    setMode]    = useState<Mode>('signin')
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [password,setPassword]= useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    if (mode === 'signup') {
      const { error } = await signUp(email, password, name)
      if (error) {
        setError(authErrorMessage(error.message))
      } else {
        setSuccess('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
      }
    } else {
      const { error } = await signIn(email, password)
      if (error) setError(authErrorMessage(error.message))
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <TrendingUp size={20} className="text-white" />
          </div>
          <span className="text-white font-bold text-2xl tracking-tight">Finwise</span>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-white text-xl font-semibold mb-1">
            {mode === 'signin' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-slate-400 text-sm mb-6">
            {mode === 'signin'
              ? 'Sign in to your Finwise dashboard.'
              : 'Start tracking your full financial picture.'}
          </p>

          {!isSupabaseConfigured && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 mb-4">
              <AlertCircle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-amber-100/90 space-y-1.5 leading-relaxed">
                <p className="font-medium text-amber-50">Supabase is not configured</p>
                <p>
                  Add <code className="rounded bg-black/25 px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code> and{' '}
                  <code className="rounded bg-black/25 px-1 py-0.5 text-xs">VITE_SUPABASE_ANON_KEY</code> to{' '}
                  <code className="rounded bg-black/25 px-1 py-0.5 text-xs">client/.env.local</code> (same folder as the
                  client&apos;s <code className="rounded bg-black/25 px-1 py-0.5 text-xs">package.json</code> — not the repo
                  root). Use the <strong>publishable</strong> key (<code className="rounded bg-black/25 px-0.5 text-[11px]">sb_publishable_…</code>) or legacy <strong>anon</strong> JWT (<code className="rounded bg-black/25 px-0.5 text-[11px]">eyJ…</code>) from Supabase → Project Settings → API — not the <strong>secret</strong> key.
                </p>
                <p className="text-xs text-amber-200/70">
                  Remove quotes around values if you added them, then restart <code className="rounded bg-black/25 px-0.5">npm run dev</code>.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4">
              <AlertCircle size={15} className="text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
              <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <p className="text-emerald-300 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Johnson"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white
                               placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                               focus:border-transparent transition"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white
                             placeholder-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500
                             focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700
                         text-white font-semibold text-sm rounded-xl transition-colors shadow-lg
                         shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-60
                         disabled:cursor-not-allowed mt-2"
            >
              {loading && <Loader2 size={15} className="animate-spin" />}
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); setSuccess(null) }}
              className="text-indigo-400 font-medium hover:text-indigo-300 transition-colors"
            >
              {mode === 'signin' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Your data is protected with Row Level Security.
        </p>
      </div>
    </div>
  )
}
