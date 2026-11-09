import { animate, stagger } from 'animejs'
import { ArrowRight, BarChart, CalendarCheck, Check, Clock, Sparkles, Target, WandSparkles, Layers, NotebookPen, ScanLine, Upload } from 'lucide-react'
import { motion } from 'motion/react'
import { BrandMark } from '../components/BrandMark'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'

import { TAGLINE } from '../../shared/types'
import { ThemeToggle } from '../components/ThemeProvider'

const FEATURES = [
  { icon: Layers, title: 'AI flashcards', detail: 'Turn your course material into active-recall cards, reveal the answers, and keep track of what you have learned.' },
  { icon: ScanLine, title: 'AI quizzes', detail: 'Check your understanding with questions from your sources, scored attempts, and explanations you can verify.' },
  { icon: NotebookPen, title: 'AI notebooks', detail: 'Explore summaries and ask questions grounded in your own sources, with quotations linked to the original text.' },
  { icon: Upload, title: 'One study library', detail: 'Bring PDFs, Word documents, pictures and pasted notes together. Reuse a source across all your study tools.' },
  { icon: WandSparkles, title: 'AI-assisted planning', detail: 'Studium reads your subjects, deadlines and difficulty ratings, then recommends what deserves the next hour.' },
  { icon: CalendarCheck, title: 'Adaptive scheduling', detail: 'Skip a session or add an exam and the plan is recalculated around the work that is left, never over your history.' },
  { icon: Target, title: 'Deadlines that matter', detail: 'Assessments and due dates pull work forward automatically, so urgent tasks finish before they are due.' },
  { icon: Clock, title: 'Focus sessions', detail: 'A timer that survives refreshes and background tabs, and records only the minutes you actually study.' },
  { icon: BarChart, title: 'Honest analytics', detail: 'Planned versus actual minutes, completion rate and subject balance, all computed from your real sessions.' },
]

const STEPS = [
  { title: 'Add your subjects', detail: 'Colour, priority and difficulty — plus the topics and tasks you actually have to get through.' },
  { title: 'Tell Studium when you are free', detail: 'Weekly windows, session length, breaks and a daily ceiling. Real life included.' },
  { title: 'Generate and start studying', detail: 'Review the proposed week, accept it, and start your first focus session.' },
]

export function Landing() {
  const bars = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const target = bars.current
    if (!target) return
    const animation = animate(target.querySelectorAll('[data-bar]'), {
      opacity: [0, 1],
      translateY: [14, 0],
      delay: stagger(55),
      duration: 700,
      ease: 'out(3)',
    })
    return () => {
      animation.pause()
    }
  }, [])

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1100px] items-center justify-between px-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-2.5">
            <BrandMark className="size-9" />
            <span className="font-semibold tracking-tight text-[20px]">Studium</span>
          </Link>
          <nav className="hidden items-center gap-6 text-[15px] text-muted sm:flex">
            <a href="#features" className="transition-colors hover:text-fg">
              Features
            </a>
            <a href="#how" className="transition-colors hover:text-fg">
              How it works
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="inline-flex h-9 items-center gap-1.5 rounded-control bg-fg px-4 text-[15px] font-medium text-bg transition-opacity hover:opacity-90">
              Sign in
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-[1100px] items-center gap-12 px-5 pb-16 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-line bg-panel px-3 py-1 text-[14px] font-medium text-muted">
              <Sparkles className="size-3.5 text-accent" />
              {TAGLINE}
            </p>
            <h1 className="mt-5 text-balance text-[40px] font-semibold leading-[1.03] tracking-[-0.035em] sm:text-[58px]">
              Your materials. A better way to learn.
            </h1>
            <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
              Turn course materials into flashcards, quizzes and source-grounded notebooks. Make a study plan, then put it into practice.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/signup" className="inline-flex h-11 items-center gap-2 rounded-control bg-accent px-5 text-[14.5px] font-medium text-on-accent shadow-float transition-colors hover:bg-accent-deep">
                Start planning for free
                <ArrowRight className="size-4" />
              </Link>
              <a href="#features" className="inline-flex h-11 items-center rounded-control border border-line-strong bg-panel px-5 text-[14.5px] font-medium transition-colors hover:bg-surface-2">
                Explore Features
              </a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[14px] text-faint">
              {['No calendar to maintain', 'Works with your real availability', 'Your data stays yours'].map((item) => (
                <li key={item} className="inline-flex items-center gap-1.5">
                  <Check className="size-3.5 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -1.5 }}
            animate={{ opacity: 1, y: 0, rotate: -1.5 }}
            transition={{ duration: 0.75, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative mx-auto w-full max-w-[460px]"
          >
            <div className="absolute inset-0 translate-x-3 translate-y-3 rotate-[3deg] rounded-[24px] bg-accent-soft" />
            <div className="relative rounded-[22px] border border-line bg-panel p-5 shadow-float">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-faint">This week</p>
                  <p className="mt-0.5 text-[15px] font-semibold">Six sessions, 4h 30m</p>
                </div>
                <span className="rounded-tile bg-success-soft px-2 py-1 text-[13px] font-medium text-success">On track</span>
              </div>

              <div className="mt-4 space-y-2">
                {[
                  { title: 'Calculus revision', time: 'Today · 5:00 PM', color: '#635BFF' },
                  { title: "Newton's laws", time: 'Tomorrow · 6:00 PM', color: '#2F77D1' },
                  { title: 'Chemical bonding', time: 'Thu · 5:30 PM', color: '#1F9D72' },
                ].map((session) => (
                  <div key={session.title} className="flex items-center gap-3 rounded-card border border-line px-3 py-2.5">
                    <span className="h-8 w-1 rounded-full" style={{ background: session.color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{session.title}</span>
                      <span className="block text-[13px] text-faint">{session.time}</span>
                    </span>
                    <span className="rounded-tile bg-surface-2 px-2 py-0.5 text-[11px] text-muted">50m</span>
                  </div>
                ))}
              </div>

              <div ref={bars} className="mt-5 flex h-[86px] items-end gap-2">
                {[42, 70, 54, 88, 60, 34, 76].map((height, index) => (
                  <div key={index} data-bar className="flex h-full w-full flex-col justify-end gap-1">
                    <div className="w-full rounded-t-[4px] bg-accent/30" style={{ height: `${height}%` }} />
                    <span className="text-center text-[9.5px] text-faint">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][index]}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-faint">Illustrative preview — your plan is built from your own subjects and availability.</p>
            </div>
          </motion.div>
        </section>

        <section id="features" className="border-t border-line bg-panel/40">
          <div className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8 sm:py-20">
            <div className="max-w-xl">
              <p className="text-[14px] font-medium text-accent">What it does</p>
              <h2 className="mt-2 text-balance text-[28px] font-semibold tracking-[-0.025em] sm:text-[34px]">An intelligent study workspace, not another task list.</h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className={index === 0 ? 'rounded-card border border-accent/20 bg-accent-soft/60 p-5 sm:col-span-2 lg:col-span-1' : 'rounded-card border border-line bg-panel p-5'}
                >
                  <span className="grid size-9 place-items-center rounded-tile bg-panel text-accent shadow-card">
                    <feature.icon className="size-4" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold">{feature.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{feature.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="mx-auto max-w-[1100px] px-5 py-16 sm:px-8 sm:py-20">
          <div className="max-w-xl">
            <p className="text-[14px] font-medium text-accent">How it works</p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] sm:text-[34px]">Three steps to a week you can actually follow.</h2>
          </div>
          <ol className="mt-10 grid gap-4 lg:grid-cols-3">
            {STEPS.map((step, index) => (
              <li key={step.title} className="rounded-card border border-line bg-panel p-6">
                <span className="font-serif text-[40px] leading-none text-accent/35">0{index + 1}</span>
                <h3 className="mt-4 text-[16px] font-semibold">{step.title}</h3>
                <p className="mt-2 text-[15px] leading-relaxed text-muted">{step.detail}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="border-y border-line bg-fg text-bg">
          <div className="mx-auto flex max-w-[1100px] flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 sm:py-16 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-balance text-[32px] font-semibold tracking-[-0.03em] sm:text-[40px]">Less planning. More learning.</h2>
              <p className="mt-2 max-w-xl text-[14.5px] text-white/65">Build your study profile once, then let the plan keep up with your week.</p>
            </div>
            <Link to="/signup" className="inline-flex h-11 shrink-0 items-center gap-2 rounded-control bg-white px-5 text-[14.5px] font-medium text-fg transition-opacity hover:opacity-90">
              Create Your Study Plan
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <div className="inline-flex items-center gap-2.5">
              <BrandMark className="size-8" />
              <span className="font-serif text-[19px]">Studium</span>
            </div>
            <p className="mt-2.5 text-[14px] leading-relaxed text-muted">An AI study planner that turns academic workload into a realistic schedule you can follow.</p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-2 text-[15px] text-muted">
            <a href="#features" className="hover:text-fg">
              Features
            </a>
            <a href="#how" className="hover:text-fg">
              How it works
            </a>
            <a href="https://github.com/rayyanallii/studium" target="_blank" rel="noreferrer noopener" className="hover:text-fg">
              GitHub
            </a>
            <Link to="/login" className="hover:text-fg">
              Sign in
            </Link>
          </nav>
        </div>
        <p className="mt-8 border-t border-line pt-5 text-[14px] text-faint">© {new Date().getFullYear()} Studium. A personal study project.</p>
      </footer>
    </div>
  )
}
