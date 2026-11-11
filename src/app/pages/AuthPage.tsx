import { ArrowLeft, ArrowRight, LoaderCircle, MailCheck } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'

import { BrandMark } from '../components/BrandMark'
import { Alert, Field, Input } from '../components/ui'
import { ThemeToggle } from '../components/ThemeProvider'
import { safeNext } from '../lib/auth'
import { supabase } from '../lib/supabase'
import './auth.css'

type Mode = 'login' | 'signup' | 'forgot' | 'reset'

const COPY: Record<Mode, { title: string; description: string; submit: string; step: string }> = {
  login: {
    title: 'Welcome back.',
    description: 'Your subjects, sources and plan are exactly where you left them.',
    submit: 'Sign in',
    step: 'Welcome back',
  },
  signup: {
    title: 'Start with one chapter.',
    description: 'Create a workspace, add the reading you already have, and leave with cards and a plan.',
    submit: 'Create account',
    step: 'New workspace',
  },
  forgot: {
    title: 'Reset your password.',
    description: 'We will email you a link to set a new one. The link only works once.',
    submit: 'Send reset link',
    step: 'Account recovery',
  },
  reset: {
    title: 'Choose a new password.',
    description: 'Something you have not used here before.',
    submit: 'Save password',
    step: 'Account recovery',
  },
}

const POINTS = [
  {
    title: 'Your own material',
    copy: 'A PDF, a Word document or a photo of the handout becomes the source — not a generic textbook.',
  },
  {
    title: 'Practice, not highlighting',
    copy: 'Cards and questions are written from the chapter you choose, then marked as you answer.',
  },
  {
    title: 'A week you can keep',
    copy: 'Book short sessions around your deadlines, and keep the minutes you actually focused.',
  },
]

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

function AsideArt() {
  return (
    <div className="auth-aside-art" aria-hidden="true">
      <div className="auth-card">
        <span className="auth-card-tag">Organic chemistry</span>
        <strong>What is activation energy?</strong>
        <span className="auth-card-hint">Tap to reveal</span>
        <div className="auth-card-bar">
          <i />
        </div>
        <span className="auth-card-foot">4 / 12</span>
      </div>

      <div className="auth-plan">
        <span className="auth-plan-time">18:30</span>
        <span className="auth-plan-text">
          <strong>Alkenes — review</strong>
          <small>25 min · Flashcards</small>
        </span>
        <span className="auth-plan-check">✓</span>
      </div>
    </div>
  )
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/" className="auth-aside-brand" aria-label="Studium home">
          <span className="auth-aside-mark">
            <BrandMark className="size-6" />
          </span>
          <span>Studium</span>
        </Link>

        <div className="auth-aside-copy">
          <p className="auth-kicker">The study workspace</p>
          <h2>
            Reading is the easy part. <em>Remembering</em> is the work.
          </h2>
          <ol className="auth-points">
            {POINTS.map((point, index) => (
              <li key={point.title}>
                <span className="auth-point-num">{String(index + 1).padStart(2, '0')}</span>
                <span>
                  <strong>{point.title}</strong>
                  <span>{point.copy}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <AsideArt />

        <p className="auth-aside-foot">
          Your sources stay in your workspace. Remove them whenever you want, from Settings.
        </p>
      </aside>

      <main className="auth-main">
        <div className="auth-main-top">
          <Link to="/" className="auth-mobile-brand">
            <BrandMark className="size-7" />
            Studium
          </Link>
          <ThemeToggle />
        </div>

        <div className="auth-form-wrap">{children}</div>

        <div className="auth-main-foot">
          <Link to="/privacy">Privacy</Link>
          <span aria-hidden="true">·</span>
          <Link to="/terms">Terms</Link>
        </div>
      </main>
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
        <div className="auth-form">
          <p className="auth-form-step">Setup needed</p>
          <h1>{copy.title}</h1>
          <p className="auth-form-desc">
            Supabase is not configured in this build, so email accounts are unavailable.
          </p>
          <a href={`/auth/freebuff/signin?returnTo=${encodeURIComponent(next)}`} className="auth-submit">
            Continue with Freebuff
            <ArrowRight size={15} aria-hidden="true" />
          </a>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout>
      <div className="auth-form">
        <p className="auth-form-step">{copy.step}</p>
        <h1>{copy.title}</h1>
        <p className="auth-form-desc">{copy.description}</p>

        {mode === 'reset' && recoveryReady === false ? (
          <>
            <Alert tone="warning" title="That link is no longer valid">
              Password reset links expire and only work once. Request a new one to continue.
            </Alert>
            <div className="auth-inline-action">
              <Link to="/forgot-password">
                Request a new link
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </>
        ) : (
          <form onSubmit={submit} className="auth-fields">
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

            <button type="submit" className="auth-submit" disabled={busy} aria-busy={busy || undefined}>
              {busy && <LoaderCircle size={16} className="auth-spin" aria-hidden="true" />}
              {copy.submit}
              {!busy && <ArrowRight size={15} aria-hidden="true" />}
            </button>

            {mode === 'signup' && (
              <p className="auth-legal">
                By creating an account you agree to the <Link to="/terms">Terms of use</Link>. Read the{' '}
                <Link to="/privacy">Privacy notice</Link> to see how your data is handled.
              </p>
            )}
          </form>
        )}

        <div className="auth-alt">
          {mode === 'login' && (
            <>
              <Link to="/forgot-password">Forgot your password?</Link>
              <p>
                New to Studium? <Link to={`/signup?next=${encodeURIComponent(next)}`}>Create an account</Link>
              </p>
            </>
          )}
          {mode === 'signup' && (
            <p>
              {subtitle}
              <Link to={`/login?next=${encodeURIComponent(next)}`}>Sign in</Link>
            </p>
          )}
          {mode === 'forgot' && (
            <Link to="/login" className="auth-back">
              <ArrowLeft size={14} aria-hidden="true" />
              Back to sign in
            </Link>
          )}
          {mode === 'reset' && <Link to="/login">Back to sign in</Link>}
        </div>
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
      <div className="auth-form">
        <p className="auth-form-step">Account</p>
        <h1>{error ? 'That did not work.' : 'Finishing sign-in.'}</h1>
        {error ? (
          <>
            <div className="auth-alert">
              <Alert tone="danger">{error}</Alert>
            </div>
            <div className="auth-callback-actions">
              <Link to="/login" className="auth-submit">
                Back to sign in
              </Link>
              <Link to="/forgot-password" className="auth-secondary">
                Request a new link
              </Link>
            </div>
          </>
        ) : (
          <p className="auth-form-desc auth-verifying">
            <MailCheck size={16} aria-hidden="true" />
            Verifying your link…
          </p>
        )}
      </div>
    </AuthLayout>
  )
}
