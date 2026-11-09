import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { lazy, Suspense } from 'react'
import { MotionConfig } from 'motion/react'

import type { Me } from '../shared/types'
import { Shell } from './components/Shell'
import { Spinner, ToastProvider } from './components/ui'
import { ThemeProvider } from './components/ThemeProvider'
import { api, ApiError, useMe } from './lib/api'
import { useSession } from './lib/auth'
import { supabase } from './lib/supabase'
import { AuthCallback, AuthPage } from './pages/AuthPage'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { Onboarding } from './pages/Onboarding'
import { SubjectDetail } from './pages/SubjectDetail'
import { Subjects } from './pages/Subjects'
import { Tasks } from './pages/Tasks'

const Analytics = lazy(() => import('./pages/Analytics').then(module => ({ default: module.Analytics })))
const Planner = lazy(() => import('./pages/Planner').then(module => ({ default: module.Planner })))
const Focus = lazy(() => import('./pages/Focus').then(module => ({ default: module.Focus })))
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })))
const StudyLibrary = lazy(() => import('./pages/StudyLibrary').then(module => ({ default: module.StudyLibrary })))
const StudySet = lazy(() => import('./pages/StudySet').then(module => ({ default: module.StudySet })))

const client = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false, staleTime: 15_000 } },
})

function Splash() {
  return (
    <div className="grid min-h-screen place-items-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <span className="grid size-10 place-items-center rounded-[12px] bg-accent">
          <span className="ml-1.5 h-4 w-2 rounded-r-[3px] bg-white" />
        </span>
        <Spinner />
      </div>
    </div>
  )
}

function SetupNeeded({ message }: { message: string }) {
  return (
    <div className="grid min-h-screen place-items-center px-5">
      <div className="w-full max-w-md rounded-card border border-line bg-panel p-6 text-center shadow-card">
        <h1 className="text-[18px] font-semibold">Workspace unavailable</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">{message}</p>
      </div>
    </div>
  )
}

/** A private URL while signed out keeps its destination for after sign-in. */
function SignInRedirect() {
  const location = useLocation()
  const next = encodeURIComponent(`${location.pathname}${location.search}`)
  return <Navigate to={`/login?next=${next}`} replace />
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
      <Route path="/reset-password" element={<AuthPage mode="reset" />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="*" element={<SignInRedirect />} />
    </Routes>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Shell />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/library" element={<StudyLibrary />} />
        <Route path="/flashcards" element={<StudyLibrary key="flashcards" kind="flashcards" />} />
        <Route path="/quizzes" element={<StudyLibrary key="quiz" kind="quiz" />} />
        <Route path="/notebooks" element={<StudyLibrary key="notebook" kind="notebook" />} />
        <Route path="/study/:id" element={<StudySet />} />
        <Route path="/planner" element={<Planner />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/subjects/:id" element={<SubjectDetail />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

function Gate() {
  const { session, loading } = useSession()
  const me = useMe()

  // With Supabase configured, the browser session decides public vs private.
  if (supabase) {
    if (loading) return <Splash />
    if (!session) return <PublicRoutes />
  }

  if (me.isLoading) return <Splash />
  if (me.error instanceof ApiError && me.error.status === 401) {
    if (supabase && session) {
      return (
        <SetupNeeded message="Your session is valid but the workspace API rejected it. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY for the Worker to the same Supabase project as VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then reload." />
      )
    }
    return <PublicRoutes />
  }
  if (me.error) return <SetupNeeded message={me.error.message} />
  if (!me.data) return <Splash />

  if (!me.data.profile.onboardingCompleted) {
    return (
      <Routes>
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  return <AppRoutes />
}

function Themed() {
  const me = useMe()
  const queryClient = useQueryClient()
  const preference = me.data?.preferences.theme ?? 'dark'

  const changeTheme = (theme: Me['preferences']['theme']) => {
    if (!me.data) return
    queryClient.setQueryData<Me>(['me'], { ...me.data, preferences: { ...me.data.preferences, theme } })
    void api('/me/preferences', { method: 'PATCH', json: { theme } }).catch(() => undefined)
  }

  return (
    <ThemeProvider preference={preference} onChange={changeTheme}>
      <Suspense fallback={<Splash />}>
        <Gate />
      </Suspense>
    </ThemeProvider>
  )
}

export function App() {
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={client}>
        <ToastProvider>
          <BrowserRouter>
            <Themed />
          </BrowserRouter>
        </ToastProvider>
      </QueryClientProvider>
    </MotionConfig>
  )
}
