import { ArrowLeft, ArrowRight, MailCheck } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'

import { BrandMark } from '../components/BrandMark'
import { Alert, Button, Field, Input } from '../components/ui'
import { ThemeToggle } from '../components/ThemeProvider'
import { safeNext } from '../lib/auth'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'

const COPY: Record<Mode, { title: string; description: string; submit: string }> = {
  login: { title: 'Welcome back', description: 'Your subjects, schedule and focus. In one place.', submit: 'Sign in' },
  signup: { title: 'Create your workspace', description: 'Build a study plan from your own subjects, deadlines and materials.', submit: 'Create account' },
  forgot: { title: 'Reset your password', description: 'We will email you a link to set a new password.', submit: 'Send reset link' },
  reset: { title: 'Choose a new password', description: 'Pick something you have not used before.', submit: 'Save password' },
}

const SUPABASE_HOST = (() => {
  try {
    return new URL(import.meta.env.VITE_SUPABASE_URL).host
  } catch {
    return 'Supabase'
  }
})()

function friendly(message: string): string {
  const text = message.toLowerCase()
  if (text.includes('failed to fetch') || text.includes('networkerror') || text.includes('load failed')) {
    return `Could not reach the Supabase project at ${SUPABASE_HOST}. Check your connection, VPN or ad blocker, then try again.`
  }
  if (text.includes('invalid login credentials')) return 'That email and password combination does not match an account.'
  if (text.includes('email not confirmed')) return 'Confirm your email address first — check your inbox for the link.'
  if (text.includes('user already registered')) return 'An account already exists for this email. Sign in instead.'
  if (text.includes('password should be at least')) return 'Use a password with at least 8 characters.'
  if (text.includes('rate limit') || text.includes('too many')) return 'Too many attempts. Wait a minute and try again.'
  if (text.includes('pkce') || text.includes('code verifier')) return 'Open the reset link in the same browser you requested it from.'
  return message
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <Link to="/" className="inline-flex items-center gap-2.5 text-[17px] font-semibold tracking-tight">
          <BrandMark className="size-9" />
          Studium
        </Link>
        <ThemeToggle />
      </header>
      <main className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center px-6 pb-24">{children}</main>
    </div>
  )
}

export function AuthPage({ mode }: { mode: Mode }) {
  const [params] = useSearchParams()
  const next = safeNext(params.get('next'))
  const copy = COPY[mode]

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [recoveryReady, setRecoveryReady] = useState<boolean | null>(mode === 'reset' ? null : true)

  const configured = Boolean(supabase)

  useEffect(() => {
    if (!supabase) return
    if (mode === 'reset') {
      // The recovery link establishes a session before this page loads.
      void supabase.auth.getSession().then(({ data }) => setRecoveryReady(Boolean(data.session)))
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' || session) setRecoveryReady(true)
      })
      return () => data.subscription.unsubscribe()
    }
    if (mode === 'forgot') return
    // Already signed in: go straight to the workspace (or the page they wanted).
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace(next)
    })
  }, [mode, next])

  const subtitle = useMemo(() => {
    if (mode === 'signup') return `Already have an account? `
    if (mode === 'login') return `New to Studium? `
    if (mode === 'forgot') return `Remembered it? `
    return null
  }, [mode])

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!supabase) return
    setBusy(true)
    setError('')
    setMessage('')
    try {
      if (mode === 'forgot') {
        const { error: problem } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        })
        if (problem) throw problem
        setMessage('If an account exists for that address, a reset link is on its way.')
      } else if (mode === 'signup') {
        const { data, error: problem } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
          },
        })
        if (problem) throw problem
        if (data.session) {
          window.location.replace('/onboarding')
          return
        }
        setMessage('Check your inbox to confirm your email, then sign in.')
      } else if (mode === 'reset') {
        const { error: problem } = await supabase.auth.updateUser({ password })
        if (problem) throw problem
        setMessage('Password updated. Opening your workspace…')
        window.setTimeout(() => window.location.replace('/dashboard'), 800)
      } else {
        const { error: problem } = await supabase.auth.signInWithPassword({ email, password })
        if (problem) throw problem
        window.location.replace(next)
        return
      }
    } catch (problem) {
      setError(problem instanceof Error ? friendly(problem.message) : 'Something went wrong. Try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!configured) {
    return (
      <AuthLayout>
        <h1 className="text-[30px] font-semibold leading-tight tracking-tight">{copy.title}</h1>
        <p className="mb-8 mt-3 text-[15px] leading-relaxed text-muted">
          Supabase is not configured in this build, so email accounts are unavailable.
        </p>
        <a
          href={`/auth/freebuff/signin?returnTo=${encodeURIComponent(next)}`}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-control bg-accent px-5 text-[14.5px] font-medium text-on-accent hover:bg-accent-deep"
        >
          Continue with Freebuff
          <ArrowRight className="size-4" />
        </a>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <h1 className="text-[30px] font-semibold leading-tight tracking-tight">{copy.title}</h1>
      <p className="mb-8 mt-3 text-[15px] leading-relaxed text-muted">{copy.description}</p>

      {mode === 'reset' && recoveryReady === false ? (
        <>
          <Alert tone="warning" title="That link is no longer valid">
            Password reset links expire and only work once. Request a new one to continue.
          </Alert>
          <div className="mt-5">
            <Link to="/forgot-password" className="inline-flex items-center gap-2 text-[15px] font-medium text-fg underline underline-offset-4">
              Request a new link
            </Link>
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          {mode === 'signup' && (
            <Field label="Your name">
              <Input autoComplete="name" required maxLength={60} value={name} onChange={(event) => setName(event.target.value)} />
            </Field>
          )}
          {mode !== 'reset' && (
            <Field label="Email address">
              <Input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
          )}
          {mode !== 'forgot' && (
            <Field label="Password" hint={mode === 'login' ? undefined : 'At least 8 characters.'}>
              <Input
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'login' ? 1 : 8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </Field>
          )}
          {error && <Alert tone="danger">{error}</Alert>}
          {message && (
            <div role="status">
              <Alert tone="success">{message}</Alert>
            </div>
          )}
          <Button type="submit" variant="primary" loading={busy} className="h-11 w-full">
            {copy.submit}
          </Button>
        </form>
      )}

      <div className="mt-6 flex flex-col items-center gap-2 text-[14.5px]">
        {mode === 'login' && (
          <>
            <Link to="/forgot-password" className="text-muted underline-offset-4 hover:text-fg hover:underline">
              Forgot your password?
            </Link>
            <p className="text-muted">
              New to Studium?{' '}
              <Link to={`/signup?next=${encodeURIComponent(next)}`} className="font-medium text-fg underline underline-offset-4">
                Create an account
              </Link>
            </p>
          </>
        )}
        {mode === 'signup' && (
          <p className="text-muted">
            {subtitle}
            <Link to={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-fg underline underline-offset-4">
              Sign in
            </Link>
          </p>
        )}
        {mode === 'forgot' && (
          <Link to="/login" className="inline-flex items-center gap-2 text-muted underline-offset-4 hover:text-fg hover:underline">
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        )}
        {mode === 'reset' && (
          <Link to="/login" className="text-muted underline-offset-4 hover:text-fg hover:underline">
            Back to sign in
          </Link>
        )}
      </div>
    </AuthLayout>
  )
}

/**
 * Supabase sends email links here. PKCE links arrive with `?code=`, older
 * implicit links with a URL hash; supabase-js already consumes the hash, so we
 * only exchange the code and then wait for the session it creates.
 */
export function AuthCallback() {
  const [params] = useSearchParams()
  const [error, setError] = useState('')
  const next = safeNext(params.get('next'))

  useEffect(() => {
    const client = supabase
    if (!client) {
      window.location.replace('/login')
      return
    }
    let cancelled = false
    const finish = async () => {
      const url = new URL(window.location.href)
      const code = url.searchParams.get('code')
      if (code) {
        const { error: problem } = await client.auth.exchangeCodeForSession(code)
        if (problem && !cancelled) setError(friendly(problem.message))
      }
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const { data } = await client.auth.getSession()
        if (data.session) {
          if (!cancelled) window.location.replace(next)
          return
        }
        await new Promise((resolve) => window.setTimeout(resolve, 250))
      }
      if (!cancelled && !code) setError('That sign-in link has expired or was already used. Request a new one.')
    }
    void finish()
    return () => {
      cancelled = true
    }
  }, [next])

  return (
    <AuthLayout>
      <h1 className="text-[28px] font-semibold tracking-tight">Finishing sign-in</h1>
      {error ? (
        <>
          <div className="mt-4">
            <Alert tone="danger">{error}</Alert>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/login" className="inline-flex h-10 items-center rounded-control bg-accent px-4 text-[14.5px] font-medium text-on-accent">
              Back to sign in
            </Link>
            <Link to="/forgot-password" className="inline-flex h-10 items-center rounded-control border border-line-strong px-4 text-[14.5px] font-medium">
              Request a new link
            </Link>
          </div>
        </>
      ) : (
        <p className="mt-3 inline-flex items-center gap-2 text-[15px] text-muted">
          <MailCheck className="size-4" />
          Verifying your link…
        </p>
      )}
    </AuthLayout>
  )
}
