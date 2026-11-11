import { useState } from 'react'
import {
  Bell,
  BookOpen,
  CalendarDays,
  Check,
  Flame,
  LayoutGrid,
  Layers,
  ScanLine,
  Search,
  Timer,
} from 'lucide-react'

import { cx } from '../../lib/cx'
import { BrandMark } from '../BrandMark'

const nav = [
  { label: 'Today', icon: LayoutGrid, active: true },
  { label: 'Flashcards', icon: Layers },
  { label: 'Quizzes', icon: ScanLine },
  { label: 'Notebooks', icon: BookOpen },
  { label: 'Planner', icon: CalendarDays },
  { label: 'Focus', icon: Timer },
]

const subjects = [
  { name: 'Organic chemistry', color: '#b9a3ff', count: 42 },
  { name: 'Statistics', color: '#7fd6b0', count: 18 },
  { name: 'Macroeconomics', color: '#e9b07c', count: 26 },
]

const sessions = [
  { time: '18:30', title: 'Alkenes — elimination reactions', meta: 'Flashcards · 25 min', tone: 'lilac' },
  { time: '19:05', title: 'Problem set 4', meta: 'Statistics · 40 min', tone: 'mint' },
  { time: '20:00', title: 'Demand curves', meta: 'Quiz · 15 min', tone: 'amber' },
]

const recall = [
  { day: 'M', value: 58 },
  { day: 'T', value: 71 },
  { day: 'W', value: 64 },
  { day: 'T', value: 79 },
  { day: 'F', value: 74 },
  { day: 'S', value: 86 },
  { day: 'S', value: 88 },
]

/** Product window for the hero. Real DOM, light interactivity, no screenshot. */
export function AppWindow({ className }: { className?: string }) {
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState<number[]>([0])

  const toggle = (index: number) =>
    setDone((current) =>
      current.includes(index) ? current.filter((item) => item !== index) : [...current, index],
    )

  return (
    <div className={cx('aw', className)}>
      <div className="aw-chrome">
        <span className="aw-dots" aria-hidden="true">
          <i /> <i /> <i />
        </span>
        <span className="aw-url">
          <span className="aw-url-dot" aria-hidden="true" />
          studium.app / today
        </span>
        <span className="aw-chrome-actions" aria-hidden="true">
          <Search size={13} />
          <Bell size={13} />
        </span>
      </div>

      <div className="aw-body">
        <aside className="aw-side">
          <div className="aw-brand">
            <BrandMark className="size-6" />
            <span>Studium</span>
          </div>

          <nav className="aw-nav" aria-hidden="true">
            {nav.map(({ label, icon: Icon, active }) => (
              <span key={label} className={cx('aw-nav-item', active && 'is-active')}>
                <Icon size={14} strokeWidth={1.7} />
                {label}
              </span>
            ))}
          </nav>

          <p className="aw-side-label">This week</p>
          <ul className="aw-subjects">
            {subjects.map((subject) => (
              <li key={subject.name}>
                <span className="aw-subject-dot" style={{ background: subject.color }} />
                <span className="aw-subject-name">{subject.name}</span>
                <span className="aw-subject-count">{subject.count}</span>
              </li>
            ))}
          </ul>

          <div className="aw-side-foot" aria-hidden="true">
            <span className="aw-side-meter">
              <i style={{ width: '72%' }} />
            </span>
            <p>Weekly goal</p>
            <strong>4h 12m / 6h</strong>
          </div>
        </aside>

        <div className="aw-main">
          <header className="aw-head">
            <div>
              <p className="aw-date">Tuesday, 12 November</p>
              <h3>Good evening.</h3>
            </div>

          </header>

          <div className="aw-grid">
            <section className="aw-panel aw-plan">
              <header className="aw-panel-head">
                <span>Today’s plan</span>
                <em>3 sessions · 80 min</em>
              </header>
              <ul className="aw-sessions">
                {sessions.map((session, index) => (
                  <li key={session.title} className={cx('aw-session', done.includes(index) && 'is-done')}>
                    <span className="aw-session-time">{session.time}</span>
                    <span className={cx('aw-session-bar', `tone-${session.tone}`)} aria-hidden="true" />
                    <span className="aw-session-text">
                      <strong>{session.title}</strong>
                      <small>{session.meta}</small>
                    </span>
                    <button
                      type="button"
                      className="aw-check"
                      aria-label={`Mark ${session.title} ${done.includes(index) ? 'not done' : 'done'}`}
                      aria-pressed={done.includes(index)}
                      onClick={() => toggle(index)}
                    >
                      <Check size={11} strokeWidth={2.6} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="aw-plan-foot" aria-hidden="true">
                <span className="aw-plan-streak">
                  <Flame size={9} /> 12 day streak
                </span>
                <span className="aw-plan-add">+ Add session</span>
              </div>
            </section>

            <section className="aw-panel aw-flash">
              <header className="aw-panel-head">
                <span>Flashcards</span>
                <em>1 / 12</em>
              </header>
              <button
                type="button"
                className={cx('aw-flip', flipped && 'is-flipped')}
                onClick={() => setFlipped((value) => !value)}
                aria-label={flipped ? 'Show the question' : 'Show the answer'}
              >
                <span className="aw-flip-face aw-flip-front">
                  <small>Organic chemistry</small>
                  <strong>What is activation energy?</strong>
                  <span className="aw-flip-hint">Tap to reveal</span>
                </span>
                <span className="aw-flip-face aw-flip-back">
                  <small>Answer</small>
                  <strong>
                    The minimum energy reactants need before they can reach the transition state.
                  </strong>
                  <span className="aw-flip-hint">Tap to go back</span>
                </span>
              </button>
            </section>

            <section className="aw-panel aw-recall">
              <header className="aw-panel-head">
                <span>Recall this week</span>
                <em>+14%</em>
              </header>
              <div className="aw-bars" aria-hidden="true">
                {recall.map((bar, index) => (
                  <span key={`${bar.day}-${index}`} className="aw-bar-col">
                    <i style={{ height: `${bar.value}%` }} className={index > 4 ? 'is-hot' : undefined} />
                    <small>{bar.day}</small>
                  </span>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
