import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Menu,
  Pause,
  Play,
  X,
} from 'lucide-react'

import { BrandMark } from '../components/BrandMark'
import { DotHands } from '../components/DotHands'
import { FigureTriptych } from '../components/landing/FigureTriptych'
import { SessionTimeline } from '../components/landing/SessionTimeline'
import { BlurText } from '../components/reactbits/BlurText'
import { ScrollReveal } from '../components/reactbits/ScrollReveal'
import { StarBorder } from '../components/reactbits/StarBorder'
import { cx } from '../lib/cx'
import './landing.css'
import './study-features.css'

const LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Demo', href: '#demo' },
  { label: 'How it works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#questions' },
]

const FEATURES = [
  {
    title: 'AI flashcards',
    copy: 'Turn your course material into active-recall cards, reveal the answers, and keep track of what you have learned.',
    art: '',
  },
  {
    title: 'AI quizzes',
    copy: 'Check your understanding with questions from your sources, scored attempts, and explanations you can verify.',
    art: 'study-feature-quiz',
  },
  {
    title: 'AI notebooks',
    copy: 'Explore summaries and ask questions grounded in your own sources, with quotations linked to the original text.',
    art: 'study-feature-notebook',
  },
  {
    title: 'AI-assisted planning',
    copy: 'Studium reads your subjects, deadlines and difficulty ratings, then recommends what deserves the next hour.',
    art: 'study-feature-planner',
  },
  {
    title: 'Focus sessions',
    copy: 'A timer that survives refreshes and background tabs, and records only the minutes you actually study.',
    art: 'study-feature-focus',
  },
]

const FAQS: [string, string][] = [
  [
    'What can I upload?',
    'PDFs, Word documents (.docx), PNG, JPEG and WebP images, or pasted notes. Files can be up to 10 MB, and PDFs can run to 50 pages.',
  ],
  [
    'Can I make cards for just one chapter?',
    'Yes. Select your sources, choose between 3 and 20 cards, and name the chapter or topic you want to review. The material for that chapter becomes the only source.',
  ],
  [
    'Can I see what the AI used to answer?',
    'Every notebook answer carries citations. Open one to compare the explanation with the excerpt from your selected source — and check the original when accuracy matters.',
  ],
  [
    'Can I use the planner on its own?',
    'Yes. Add a session yourself, move it on the calendar when the week changes, and use the focus timer to record the time you actually studied.',
  ],
  [
    'What happens to my uploaded material?',
    'Your sources stay in your workspace. AI requests can send relevant source content to the configured provider. You can remove saved material or delete your study data from Settings.',
  ],
  [
    'Can I delete a source I have already used?',
    'Yes. Delete any study sets that cite the source first, then remove it from your library. Settings has a single action for removing all study data.',
  ],
]

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <header className={cx('lp-nav', scrolled && 'is-scrolled')}>
      <div className="lp-nav-inner">
        <Link to="/" className="lp-brand" aria-label="Studium home">
          <BrandMark src="/brand/studium-wordmark-tight.png" className="lp-brand-mark" />
        </Link>

        <nav className="lp-nav-links" aria-label="Main navigation">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="lp-nav-link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="lp-nav-actions">
          <Link to="/login" className="lp-nav-signin">
            Sign in
          </Link>
          <Link to="/signup" className="lp-nav-cta">
            Start studying
            <ArrowRight size={13} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="lp-nav-burger"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
        </div>
      </div>

      {open && (
        <div className="lp-menu" role="dialog" aria-modal="true" aria-label="Site menu">
          <div className="lp-menu-panel">
            <div className="lp-menu-top">
              <Link to="/" className="lp-brand" onClick={() => setOpen(false)}>
                <BrandMark src="/brand/studium-wordmark-tight.png" className="lp-brand-mark" />
              </Link>
              <button type="button" className="lp-nav-burger" aria-label="Close menu" onClick={() => setOpen(false)}>
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <nav className="lp-menu-links" aria-label="Sections">
              {LINKS.map((link) => (
                <a key={link.href} href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </a>
              ))}
            </nav>
            <div className="lp-menu-actions">
              <Link to="/login" className="lp-menu-signin" onClick={() => setOpen(false)}>
                Sign in
              </Link>
              <Link to="/signup" className="lp-menu-cta" onClick={() => setOpen(false)}>
                Start studying
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

function Hero({ paused, onToggle }: { paused: boolean; onToggle: () => void }) {
  return (
    <section className="lp-hero lp-hero-hands" id="top" aria-labelledby="landing-title">
      <div className="lp-hero-bg" aria-hidden="true">
        <span className="lp-hero-glow" />
        <span className="lp-hero-mesh" />
      </div>

      <DotHands paused={paused} dotColor="#a48ff0" className="lp-hero-hands-art" />

      <div className="lp-wrap lp-hero-hands-inner">
        <h1 className="lp-hero-title" id="landing-title">
          <span>From first read</span>
          <span>
            to <em>full recall.</em>
          </span>
        </h1>
        <p className="lp-hero-copy">
          Studium turns the notes, PDFs and photos you already have into flashcards, quizzes and a revision
          plan — and shows you the page every answer came from.
        </p>
        <div className="lp-hero-cta">
          <Link to="/signup" className="lp-btn lp-btn-primary">
            <StarBorder>
              Start studying
              <ArrowRight size={15} aria-hidden="true" />
            </StarBorder>
          </Link>
          <a href="#features" className="lp-btn lp-btn-ghost">
            Explore features
            <ArrowDown size={14} aria-hidden="true" />
          </a>
        </div>
      </div>

      <button
        type="button"
        className="lp-cta-pause"
        onClick={onToggle}
        aria-label={paused ? 'Resume background animation' : 'Pause background animation'}
        title={paused ? 'Resume background animation' : 'Pause background animation'}
      >
        {paused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
      </button>
    </section>
  )
}

export function Landing() {
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    document.body.classList.add('landing-body')
    const previous = document.documentElement.style.scrollBehavior
    document.documentElement.style.scrollBehavior = 'smooth'
    return () => {
      document.body.classList.remove('landing-body')
      document.documentElement.style.scrollBehavior = previous
    }
  }, [])

  return (
    <main className="landing">
      <Nav />

      <Hero paused={paused} onToggle={() => setPaused((value) => !value)} />

      <section className="lp-section lp-statement-section" aria-labelledby="statement-title">
        <div className="lp-wrap">
          <h2 className="lp-statement-text" id="statement-title">
            Most study apps give you another place to <span className="is-dim">put notes.</span> Studium gives
            you <em>something to do with them.</em>
          </h2>
        </div>
      </section>

      <section className="lp-section lp-features-section" id="features" aria-labelledby="features-title">
        <div className="lp-wrap">
          <div className="lp-features-head">
            <h2 className="lp-h2" id="features-title">
              An intelligent study workspace, not another task list.
            </h2>
            <p className="lp-section-lede">
              Flashcards, quizzes, notebooks and a plan, all built from the material you already uploaded.
            </p>
          </div>

          <ScrollReveal>
            <div className="study-feature-grid">
              {FEATURES.map((feature, index) => (
                <article
                  key={feature.title}
                  className={cx('study-feature-card', index === 0 && 'study-feature-cards', feature.art)}
                >
                  <div className="study-feature-art" aria-hidden="true" />
                  <div className="study-feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                  </div>
                </article>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      <section className="lp-section lp-demo-section" id="demo" aria-labelledby="demo-title">
        <div className="lp-wrap">
          <div className="lp-features-head">
            <h2 className="lp-h2" id="demo-title">
              See the workspace <em>in motion.</em>
            </h2>
            <p className="lp-section-lede">
              A minute inside Studium: the overview, flashcards, a quiz, a notebook, tasks, the planner —
              rescheduling and marking a session done — a focus timer, and analytics. Recorded straight
              through, nothing staged.
            </p>
          </div>

          <ScrollReveal>
            <figure className="lp-demo-frame">
              <div className="lp-demo-chrome" aria-hidden="true">
                <span className="lp-demo-dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="lp-demo-url">app.studium — a sample workspace</span>
              </div>
              <video
                className="lp-demo-video"
                controls
                playsInline
                preload="metadata"
                poster="/demo/studium-demo-poster.jpg"
                width={1440}
                height={900}
                aria-label="Screen recording of a Studium study session: overview, flashcards, quiz, notebook, tasks, planner, focus timer and analytics"
              >
                <source src="/demo/studium-demo.mp4" type="video/mp4" />
                Your browser cannot play this video.{' '}
                <Link to="/signup">Create an account to try the workspace.</Link>
              </video>
            </figure>
            <p className="lp-demo-caption">
              Recorded in a sample workspace — no mockups, no staged screens. Press play and follow the cursor.
            </p>
          </ScrollReveal>
        </div>
      </section>

      <section className="lp-section lp-how" id="how" aria-labelledby="how-title">
        <div className="lp-wrap">
          <div className="lp-features-head">
            <h2 className="lp-h2" id="how-title">
              Three moves, then <em>you are studying.</em>
            </h2>
            <p className="lp-section-lede">
              Add the material you already have, practise it, then decide when you will come back to it.
            </p>
          </div>
          <FigureTriptych />
        </div>
      </section>

      <section className="lp-section lp-session" id="session" aria-labelledby="session-title">
        <div className="lp-wrap lp-session-grid">
          <div className="lp-session-intro">
            <h2 className="lp-h2" id="session-title">
              What a study session <em>actually looks like.</em>
            </h2>
            <p className="lp-section-lede">
              One chapter, two passes, a quiz, and a time booked for next week.
            </p>
            <Link to="/signup" className="lp-inline-link">
              Try it with your own notes
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <SessionTimeline />
        </div>
      </section>

      <section className="lp-section lp-diff-section" aria-labelledby="diff-title">
        <div className="lp-wrap">
          <h2 className="lp-h2" id="diff-title">
            The difference is <em>the follow-through.</em>
          </h2>

          <div className="lp-diff">
            <div className="lp-diff-col is-old">
              <h3 className="lp-diff-label">Without a system</h3>
              <ul>
                <li>Notes in four apps, half of them screenshots</li>
                <li>Cards made the night before</li>
                <li>A plan you abandon by the end of the week</li>
                <li>No idea what you actually retained</li>
              </ul>
            </div>
            <div className="lp-diff-col is-new">
              <h3 className="lp-diff-label">With Studium</h3>
              <ul>
                <li>The reading you already have, as the source</li>
                <li>Cards and questions from that same chapter</li>
                <li>Short sessions you can move when the week changes</li>
                <li>Recall per subject, next to your focus minutes</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="lp-section lp-pricing-section" id="pricing" aria-labelledby="pricing-title">
        <div className="lp-wrap">
          <div className="lp-features-head">
            <h2 className="lp-h2" id="pricing-title">
              Start free. Upgrade when <em>the term gets heavy.</em>
            </h2>
            <p className="lp-section-lede">
              The free workspace covers an ordinary week. Plus is for the weeks when every subject has a
              deadline on the same day.
            </p>
          </div>

          <div className="lp-pricing">
            <article className="lp-plan">
              <div className="lp-plan-top">
                <h3 className="lp-plan-name">Free</h3>
              </div>
              <p className="lp-plan-price">
                £0 <span>forever</span>
              </p>
              <p className="lp-plan-copy">Everything you need to turn one term of reading into a routine.</p>
              <ul>
                <li>Upload notes, PDFs and photos</li>
                <li>Flashcards, quizzes and notebooks</li>
                <li>Weekly planner and focus timer</li>
                <li>Study history and analytics</li>
              </ul>
              <Link to="/signup" className="lp-btn lp-btn-ghost">
                Start free
              </Link>
            </article>

            <article className="lp-plan is-featured">
              <div className="lp-plan-top">
                <h3 className="lp-plan-name">Plus</h3>
                <span className="lp-plan-badge">For exam terms</span>
              </div>
              <p className="lp-plan-price">
                £6 <span>per month</span>
              </p>
              <p className="lp-plan-copy">More room for every subject, and more AI for the revision weeks.</p>
              <ul>
                <li>Everything in Free</li>
                <li>Higher AI limits through exam season</li>
                <li>More sources and study sets in your library</li>
                <li>Priority help when something breaks</li>
              </ul>
              <Link to="/signup" className="lp-btn lp-btn-primary">
                <StarBorder>
                  Get Plus
                  <ArrowRight size={15} aria-hidden="true" />
                </StarBorder>
              </Link>
            </article>
          </div>

          <p className="lp-pricing-note">
            No card needed to start. Cancel Plus whenever you like — your notes and study history stay yours.
          </p>
        </div>
      </section>

      <section className="lp-section lp-faq-section" id="questions" aria-labelledby="faq-title">
        <div className="lp-wrap">
          <div className="lp-faq-head">
            <h2 className="lp-h2" id="faq-title">
              Questions, <em>answered plainly.</em>
            </h2>
            <p className="lp-section-lede">
              The detail on files, citations and deletion lives in the{' '}
              <Link to="/privacy" className="lp-text-link">
                privacy notice
              </Link>
              .
            </p>
          </div>

          <div className="lp-faq">
            <h3 className="lp-visually-hidden">Frequently asked questions</h3>
            {FAQS.map(([question, answer]) => (
              <details className="lp-faq-item" key={question} name="lp-faq">
                <summary>
                  <span className="lp-faq-q">{question}</span>
                  <span className="lp-faq-icon" aria-hidden="true">
                    <PlusIcon />
                  </span>
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-cta" aria-labelledby="lp-cta-title">
        <div className="lp-cta-inner">
          <h2 className="lp-cta-title" id="lp-cta-title">
            <BlurText text="Bring the reading." />
            <br />
            <em>
              <BlurText text="Leave with a plan." delay={0.12} />
            </em>
          </h2>
          <div className="lp-cta-actions">
            <Link to="/signup" className="lp-btn lp-btn-primary">
              <StarBorder>
                Start studying
                <ArrowRight size={15} aria-hidden="true" />
              </StarBorder>
            </Link>
            <Link to="/login" className="lp-btn lp-btn-ghost">
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-main">
            <div className="lp-footer-brand">
              <Link to="/" aria-label="Studium home">
                <BrandMark src="/brand/studium-wordmark-tight.png" className="lp-footer-logo" />
              </Link>
              <p>Practice questions from your own notes, and a plan for when to come back to them.</p>
            </div>

            <nav className="lp-footer-col" aria-label="Study tools">
              <h2>Study</h2>
              <Link to="/flashcards">Flashcards</Link>
              <Link to="/quizzes">Quizzes</Link>
              <Link to="/notebooks">Notebooks</Link>
              <Link to="/planner">Planner</Link>
              <Link to="/focus">Focus timer</Link>
            </nav>

            <nav className="lp-footer-col" aria-label="Explore">
              <h2>Explore</h2>
              <a href="#features">Features</a>
              <a href="#demo">Demo</a>
              <a href="#how">How it works</a>
              <a href="#pricing">Pricing</a>
              <a href="#questions">FAQ</a>
            </nav>

            <nav className="lp-footer-col" aria-label="Account">
              <h2>Account</h2>
              <Link to="/signup">Create an account</Link>
              <Link to="/login">Sign in</Link>
              <Link to="/forgot-password">Reset password</Link>
            </nav>
          </div>

          <div className="lp-footer-bottom">
            <nav className="lp-footer-legal" aria-label="Legal">
              <Link to="/privacy">Privacy notice</Link>
              <Link to="/terms">Terms of use</Link>
              <Link to="/accessibility">Accessibility</Link>
              <Link to="/cookies">Cookie statement</Link>
            </nav>
            <p>© {new Date().getFullYear()} Studium</p>
            <a href="#top">
              Back to top
              <ArrowUpRight size={13} aria-hidden="true" />
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}
