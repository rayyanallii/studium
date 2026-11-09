import { ArrowRight, CalendarCheck, Sparkles, Target } from 'lucide-react'
import { motion } from 'motion/react'
import { Link } from 'react-router'

import { TAGLINE } from '../../shared/types'
import { supabase } from '../lib/supabase'
import { SupabaseSignIn } from './SupabaseSignIn'

export function SignIn() {
  if (supabase) return <SupabaseSignIn />
  const returnTo = encodeURIComponent('/dashboard')
  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <header className="mx-auto flex h-16 w-full max-w-[1100px] items-center px-5 sm:px-8">
        <Link to="/" className="inline-flex items-center gap-2.5">
          <span className="relative grid size-8 place-items-center rounded-[10px] bg-accent">
            <span className="absolute left-[7px] top-[8px] h-[13px] w-[7px] rounded-l-[2px] bg-on-accent/55" />
            <span className="relative ml-[7px] h-[13px] w-[7px] rounded-r-[2px] bg-on-accent" />
          </span>
          <span className="font-semibold tracking-tight text-[20px]">Studium</span>
        </Link>
      </header>

      <main className="mx-auto grid w-full max-w-[1100px] flex-1 items-center gap-12 px-5 pb-16 sm:px-8 lg:grid-cols-[1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="max-w-md">
          <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 text-[12px] font-medium text-muted">
            <Sparkles className="size-3.5 text-accent" />
            {TAGLINE}
          </p>
          <h1 className="mt-5 text-balance text-[38px] font-semibold leading-[1.05] tracking-[-0.03em] sm:text-[46px]">
            Your studies, intelligently planned.
          </h1>
          <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
            Sign in to open your study workspace: today&apos;s plan, upcoming deadlines, focus sessions and honest progress.
          </p>
          <a
            href={`/auth/freebuff/signin?returnTo=${returnTo}`}
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-control bg-fg px-5 text-[14.5px] font-medium text-bg transition-colors hover:opacity-90"
          >
            <span className="grid size-5 place-items-center rounded-[6px] bg-white text-[11px] font-bold text-fg">F</span>
            Continue with Freebuff
            <ArrowRight className="size-4" />
          </a>
          <p className="mt-4 text-[12.5px] leading-relaxed text-faint">
            Uses your Freebuff account, so there is no new password to remember. Everything in Studium stays scoped to you.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto hidden w-full max-w-[420px] lg:block"
        >
          <div className="rounded-[22px] border border-line bg-surface p-5 shadow-float">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-semibold">This week</p>
              <span className="rounded-tile bg-success-soft px-2 py-1 text-[11.5px] font-medium text-success">On track</span>
            </div>
            <div className="mt-4 space-y-2.5">
              {[
                { icon: CalendarCheck, title: 'Calculus revision', detail: 'Today · 5:00 PM', color: '#635BFF' },
                { icon: Target, title: 'Physics problem set', detail: 'Tomorrow · 6:00 PM', color: '#2F77D1' },
                { icon: Sparkles, title: 'Chemistry flashcards', detail: 'Thu · 5:30 PM', color: '#1F9D72' },
              ].map((item) => (
                <div key={item.title} className="flex items-center gap-3 rounded-card border border-line px-3 py-2.5">
                  <span className="grid size-8 place-items-center rounded-tile" style={{ background: `${item.color}1a`, color: item.color }}>
                    <item.icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-medium">{item.title}</span>
                    <span className="block text-[11.5px] text-faint">{item.detail}</span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-end justify-between gap-2">
              {[38, 62, 45, 80, 55, 90, 70].map((value, index) => (
                <div key={index} className="flex w-full flex-col items-center gap-1">
                  <div className="w-full rounded-t-[3px] bg-accent/25" style={{ height: `${value}px` }} />
                  <span className="text-[9.5px] text-faint">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
