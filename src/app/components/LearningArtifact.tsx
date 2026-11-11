import { useState } from 'react'
import { learningArtifactSchema } from '../../shared/learning-artifact'
import { StudyMath } from './StudyMath'
import { Button } from './ui'

/** Interactive HTML built from validated content, without executing model-written code. */
export function LearningArtifact({ json }: { json: string }) {
  const [step, setStep] = useState(0), [answer, setAnswer] = useState<number | null>(null)
  let value: unknown
  try { value = JSON.parse(json) } catch { return <p className="text-sm text-muted">This interactive explanation could not be displayed. Ask for a new explanation.</p> }
  const result = learningArtifactSchema.safeParse(value)
  if (!result.success) return <p className="text-sm text-muted">This interactive explanation could not be displayed. Ask for a new explanation.</p>
  const artifact = result.data
  return <section aria-label="Interactive explanation" className="my-4 min-w-0 rounded-xl border border-line bg-surface-2 p-4">
    <p className="mb-2 text-xs font-medium text-muted">EXPLORE & PRACTISE</p><h3 className="font-semibold"><StudyMath text={artifact.title} /></h3>
    <div className="my-4 flex flex-wrap gap-2" aria-label="Explanation steps">{artifact.steps.map((entry, index) => <button key={index} aria-pressed={step === index} onClick={() => setStep(index)} className={`rounded-control border px-3 py-2 text-sm ${step === index ? 'border-blue-500 bg-blue-500/10' : 'border-line'}`}>{index + 1}. {entry.title}</button>)}</div>
    <div aria-live="polite" className="min-h-24 text-sm leading-7"><StudyMath text={artifact.steps[step].explanation} /></div>
    <div className="mt-4 border-t border-line pt-4"><p className="mb-3 text-sm font-semibold"><StudyMath text={artifact.check.question} /></p><div className="flex flex-col gap-2">{artifact.check.options.map((option, index) => <Button key={index} className="!h-auto min-h-10 whitespace-normal py-2 text-left" aria-pressed={answer === index} onClick={() => setAnswer(index)}><StudyMath text={option} /></Button>)}</div>
      {answer !== null && <p role="status" className="mt-3 text-sm leading-6"><strong>{answer === artifact.check.correctIndex ? 'Correct. ' : 'Try again. '}</strong><StudyMath text={artifact.check.explanation} /></p>}
    </div>
  </section>
}

