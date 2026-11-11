import { useState } from 'react'
import { Link } from 'react-router'
import { BrandMark } from './BrandMark'
import { ArrowRight, ArrowUpRight, CalendarDays, FileText, Layers, Upload } from 'lucide-react'
import './LandingStudyDemos.css'

const steps = [
  { title: 'Add a source', description: 'Upload a PDF, Word document or photo, or paste your notes.', icon: Upload },
  { title: 'Practise a topic', description: 'Make flashcards from one topic in your material.', icon: Layers },
  { title: 'Plan a session', description: 'Set aside time to revisit what you missed.', icon: CalendarDays },
]

const questions = [
  ['What can I upload?', 'You can add PDFs, Word documents (.docx), PNG, JPEG and WebP images, or paste notes. Files can be up to 10 MB. PDFs can have up to 50 pages.'],
  ['Can I make cards for just one chapter?', 'Yes. Select your sources, choose 3 to 20 cards, and enter the chapter or topic you want to review.'],
  ['Can I see what the AI used to answer?', 'Open the citations in a notebook answer to compare its explanation with excerpts from the selected sources. Check the original material when accuracy matters.'],
  ['Can I use the planner on its own?', 'Yes. Add a study session yourself, move it on the calendar when plans change, and use the focus timer to record your study time.'],
  ['What happens to my uploaded material?', 'Studium stores your sources in your workspace. AI requests can send relevant source content to the configured provider. You can remove saved material or delete your study data from Settings.'],
  ['Can I delete a source I’ve already used?', 'Yes. Delete any study sets that cite the source first, then remove it from your library. If you want to remove all your study data, use Settings.'],
]

export function LandingStudyDemos() {
  const [step, setStep] = useState(0)
  const [flipped, setFlipped] = useState(false)

  return <>
    <section id="interactive-veil" className="studium-section landing-study-section" aria-labelledby="source-example-title">
      <h2 id="source-example-title">Check where an answer came from</h2>
      <p className="studium-section-desc">Notebook answers include excerpts you can compare with your material.</p>
      <div className="landing-source-demo">
        <div className="landing-demo-pane">
          <p className="landing-demo-label">Example notebook conversation</p>
          <h3>Why does a catalyst speed up a reaction?</h3>
          <p>It provides a reaction pathway that requires less activation energy.</p>
          <details>
            <summary><FileText size={16} aria-hidden="true" /> View cited passage</summary>
            <blockquote>“A catalyst provides an alternative reaction pathway with a lower activation energy.”</blockquote>
          </details>
        </div>
        <div className="landing-demo-pane landing-demo-paper">
          <p className="landing-demo-label"><FileText size={16} aria-hidden="true" /> Sample chemistry notes</p>
          <h3>Reaction rates</h3>
          <p>Reactants need enough energy to reach the transition state. This threshold is called the activation energy.</p>
          <p><mark>A catalyst provides an alternative reaction pathway with a lower activation energy.</mark> It is regenerated during the reaction.</p>
        </div>
      </div>
    </section>

    <section id="how-it-works" className="studium-section landing-study-section" aria-labelledby="study-workflow-title">
      <h2 id="study-workflow-title">How a study session starts</h2>
      <div className="landing-workflow">
        <div className="landing-step-picker" aria-label="Study workflow">
          {steps.map(({ title, description, icon: Icon }, index) => <button key={title} type="button" aria-pressed={step === index} onClick={() => { setStep(index); setFlipped(false) }}>
            <Icon size={20} aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span>
          </button>)}
        </div>
        <div className="landing-demo-pane landing-workflow-preview">
          <p className="landing-demo-label">Example · Chemistry</p>
          {step === 0 && <div className="landing-sample-file"><FileText size={24} aria-hidden="true" /><div><h3>Reaction rates.pdf</h3><p>Source for your flashcards and notebook</p></div></div>}
          {step === 1 && <button className="landing-flip-card" type="button" onClick={() => setFlipped(value => !value)}><strong>{flipped ? 'The energy needed to reach the transition state.' : 'What is activation energy?'}</strong><small>{flipped ? 'Show question' : 'Reveal answer'}</small></button>}
          {step === 2 && <div className="landing-sample-file"><CalendarDays size={24} aria-hidden="true" /><div><h3>Review reaction rates</h3><p>Thursday · 4:00–4:25 pm</p></div></div>}
        </div>
      </div>
    </section>

    <section id="faq" className="studium-section landing-study-section landing-faq-section" aria-labelledby="faq-title">
      <div className="landing-faq-intro">
        <h2 id="faq-title">Common questions</h2>
        <p>What you can upload, how answers cite your sources, and how to remove your study data.</p>
        <Link className="landing-privacy-link" to="/privacy">Read the privacy notice <ArrowUpRight size={14} aria-hidden="true" /></Link>
      </div>
      <div className="landing-faq">{questions.map(([question, answer]) => <details name="landing-questions" key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div>
    </section>

    <section id="get-started" className="studium-section landing-study-section" aria-labelledby="workspace-start-title">
      <div className="landing-start-panel">
        <div><h2 id="workspace-start-title">Set up your study workspace</h2><p className="studium-section-desc">Create an account and add the material you’re studying this week.</p></div>
        <Link className="studium-plan-btn studium-plan-btn-primary" to="/signup">Create an account <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>
    </section>
  </>
}

export function LandingStudyFooter() {
  return <footer className="landing-footer">
    <div className="landing-footer-main">
      <div className="landing-footer-brand">
        <Link to="/" aria-label="Studium home"><BrandMark alt="" className="landing-footer-logo" /></Link>
        <p>Make practice questions from your notes and plan when to review them.</p>
      </div>
      <nav className="landing-footer-nav" aria-label="Footer navigation">
        <div><h2>Study tools</h2><Link to="/flashcards">Flashcards</Link><Link to="/quizzes">Quizzes</Link><Link to="/notebooks">Notebooks</Link><Link to="/planner">Study planner</Link><Link to="/focus">Focus timer</Link></div>
        <div><h2>Explore</h2><a href="#features">All features</a><a href="#interactive-veil">Notebook example</a><a href="#how-it-works">How it works</a><a href="#faq">Common questions</a></div>
        <div><h2>Account</h2><Link to="/signup">Create an account</Link><Link to="/login">Sign in</Link><Link to="/forgot-password">Reset password</Link></div>
      </nav>
    </div>
    <div className="landing-footer-bottom">
      <nav aria-label="Legal links"><Link to="/privacy">Privacy notice</Link><Link to="/terms">Terms of use</Link><Link to="/accessibility">Accessibility statement</Link><Link to="/cookies">Cookie statement</Link></nav>
      <a href="#landing-title">Back to top <ArrowUpRight size={14} aria-hidden="true" /></a>
    </div>
  </footer>
}
