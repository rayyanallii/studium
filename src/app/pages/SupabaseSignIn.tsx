import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, BookOpen } from 'lucide-react'
import { Alert, Button, Field, Input } from '../components/ui'
import { ThemeToggle } from '../components/ThemeProvider'
import { supabase } from '../lib/supabase'

type Mode = 'login' | 'register' | 'reset' | 'update'

export function SupabaseSignIn() {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const { data } = supabase!.auth.onAuthStateChange(event => {
      if (event === 'PASSWORD_RECOVERY') setMode('update')
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const changeMode = (next: Mode) => { setMode(next); setError(''); setMessage(''); setPassword('') }
  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true); setError(''); setMessage('')
    try {
      if (mode === 'reset') {
        const result = await supabase!.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` })
        if (result.error) throw result.error
        setMessage('Check your email for a password reset link.')
      } else if (mode === 'register') {
        const result = await supabase!.auth.signUp({ email, password, options: { data: { display_name: name.trim() }, emailRedirectTo: `${window.location.origin}/dashboard` } })
        if (result.error) throw result.error
        if (result.data.session) window.location.assign('/dashboard')
        else setMessage('Check your email to confirm your account, then sign in.')
      } else if (mode === 'update') {
        const result = await supabase!.auth.updateUser({ password })
        if (result.error) throw result.error
        window.location.assign('/dashboard')
      } else {
        const result = await supabase!.auth.signInWithPassword({ email, password })
        if (result.error) throw result.error
        window.location.assign('/dashboard')
      }
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not sign in. Please try again.')
    } finally { setBusy(false) }
  }

  const title = { login: 'Welcome back', register: 'Make room for better study', reset: 'Reset your password', update: 'Choose a new password' }[mode]
  return <div className="flex min-h-dvh flex-col bg-bg">
    <header className="flex items-center justify-between px-6 py-5 sm:px-10"><Link to="/" className="flex items-center gap-2 text-[18px] font-semibold tracking-tight"><BookOpen className="size-5" />Studium</Link><ThemeToggle /></header>
    <main className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center px-6 pb-24">
      <h1 className="text-[30px] font-semibold leading-tight tracking-tight">{title}</h1>
      <p className="mb-8 mt-3 text-[14px] leading-relaxed text-muted">{mode === 'reset' ? 'We will email you a link to get back into your workspace.' : 'Your subjects, schedule and focus. In one place.'}</p>
      <form onSubmit={submit} className="flex flex-col gap-5">
        {mode === 'register' && <Field label="Your name"><Input autoComplete="name" required maxLength={60} value={name} onChange={event => setName(event.target.value)} /></Field>}
        {mode !== 'update' && <Field label="Email address"><Input type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} /></Field>}
        {mode !== 'reset' && <Field label="Password" hint={mode !== 'login' ? 'Use at least 8 characters.' : undefined}><Input type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 8} required value={password} onChange={event => setPassword(event.target.value)} /></Field>}
        {error && <Alert tone="danger">{error}</Alert>}
        {message && <div role="status"><Alert tone="success">{message}</Alert></div>}
        <Button type="submit" variant="primary" loading={busy} className="w-full">{{ login: 'Sign in', register: 'Create account', reset: 'Send reset link', update: 'Save password' }[mode]}</Button>
      </form>
      <div className="mt-5 flex flex-col items-center gap-2 text-[13px]">
        {mode === 'login' ? <><Button variant="ghost" onClick={() => changeMode('reset')}>Forgot password?</Button><p className="text-muted">New to Studium? <button className="text-fg underline underline-offset-4" onClick={() => changeMode('register')}>Create an account</button></p></> : <Button variant="ghost" onClick={() => changeMode('login')}><ArrowLeft />Back to sign in</Button>}
      </div>
    </main>
  </div>
}
