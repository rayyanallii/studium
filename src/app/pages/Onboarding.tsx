import { ArrowLeft, ArrowRight, Check, Clock, Plus, Sparkles, Trash } from 'lucide-react'
import { BrandMark } from '../components/BrandMark'
import { motion } from 'motion/react'
import { useEffect, useMemo, useState } from 'react'

import { ACADEMIC_CONTEXTS, WEEKDAYS, type PlanProposal } from '../../shared/types'
import { AvailabilityEditor, type DraftWindow } from '../components/AvailabilityEditor'
import { AssessmentDialog } from '../components/AssessmentDialog'
import { PlanReview } from '../components/PlanReview'
import { SubjectDialog } from '../components/SubjectDialog'
import { FieldInput, FieldTextarea, NumberInput } from '../components/fields'
import { Alert, Badge, Button, Card, Field, Select, Switch } from '../components/ui'
import {
  useAcceptPlan,
  useAssessments,
  useAvailability,
  useDeleteAssessment,
  useDeleteSubject,
  useGeneratePlan,
  useMe,
  useSaveAvailability,
  useSaveOverrides,
  useSubjects,
  useUpdatePreferences,
  useUpdateProfile,
} from '../lib/api'
import { browserTimezone, dateLabel, minutesLabel } from '../lib/format'

const STEPS = [
  { title: 'Welcome', detail: 'Your learning profile' },
  { title: 'Subjects', detail: 'What you are studying' },
  { title: 'Deadlines', detail: 'Exams and due dates' },
  { title: 'Availability', detail: 'When you can study' },
  { title: 'Preferences', detail: 'How you like to plan' },
  { title: 'Your plan', detail: 'Review and start' },
]

export function Onboarding() {
  const { data: me } = useMe()
  const { data: subjectData } = useSubjects()
  const { data: availability } = useAvailability()
  const { data: assessmentData } = useAssessments()
  const updateProfile = useUpdateProfile()
  const updatePreferences = useUpdatePreferences()
  const saveAvailability = useSaveAvailability()
  const saveOverrides = useSaveOverrides()
  const generate = useGeneratePlan()
  const accept = useAcceptPlan()
  const removeSubject = useDeleteSubject()
  const removeAssessment = useDeleteAssessment()

  const timezone = me?.profile.timezone && me.profile.timezone !== 'UTC' ? me.profile.timezone : browserTimezone()
  const [step, setStep] = useState(() => Math.min(6, Math.max(1, me?.profile.onboardingStep ?? 1)))
  const [form, setForm] = useState({
    displayName: me?.profile.displayName ?? '',
    academicContext: me?.profile.academicContext ?? 'university',
    learningGoal: me?.profile.learningGoal ?? '',
  })
  const [rules, setRules] = useState<DraftWindow[]>([])
  const [rulesLoaded, setRulesLoaded] = useState(false)
  const [planning, setPlanning] = useState({
    preferredSessionMinutes: me?.preferences.preferredSessionMinutes ?? 50,
    breakMinutes: me?.preferences.breakMinutes ?? 10,
    maxDailyMinutes: me?.preferences.maxDailyMinutes ?? 240,
  })
  const [planStyle, setPlanStyle] = useState({
    planningStyle: me?.preferences.planningStyle ?? 'balanced',
    planningHorizonDays: me?.preferences.planningHorizonDays ?? 7,
    urgentFirst: me?.preferences.urgentFirst ?? false,
  })
  const [subjectOpen, setSubjectOpen] = useState(false)
  const [assessmentOpen, setAssessmentOpen] = useState(false)
  const [proposal, setProposal] = useState<PlanProposal | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (availability && !rulesLoaded) {
      setRules(availability.rules.map((rule) => ({ weekday: rule.weekday, startLocalTime: rule.startLocalTime, endLocalTime: rule.endLocalTime })))
      setRulesLoaded(true)
    }
  }, [availability, rulesLoaded])

  const subjects = subjectData?.items ?? []
  const assessments = assessmentData?.items ?? []
  const weeklyMinutes = useMemo(() => rules.reduce((sum, rule) => sum + Math.max(0, toMinutes(rule.endLocalTime) - toMinutes(rule.startLocalTime)), 0), [rules])
  const invalidRules = rules.some((rule) => rule.endLocalTime <= rule.startLocalTime)

  if (!me) return null

  const saveStep = async (next: number) => {
    setError(null)
    try {
      await updateProfile.mutateAsync({ displayName: form.displayName.trim() || me.profile.displayName, academicContext: form.academicContext, learningGoal: form.learningGoal.trim() || null, timezone, onboardingStep: next })
      if (next >= 5) {
        await updatePreferences.mutateAsync(planning)
        await updatePreferences.mutateAsync(planStyle)
      }
      setStep(next)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not save your progress.')
    }
  }

  const continueFromAvailability = async () => {
    if (invalidRules) {
      setError('Every availability window must end after it starts.')
      return
    }
    setError(null)
    try {
      await saveAvailability.mutateAsync(rules)
      await saveOverrides.mutateAsync([])
      await saveStep(5)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not save your availability.')
    }
  }

  const generatePlan = async () => {
    setError(null)
    try {
      const result = await generate.mutateAsync({ requestId: crypto.randomUUID(), planningStyle: planStyle.planningStyle, horizonDays: planStyle.planningHorizonDays })
      if (!result.proposal) {
        setError(result.message ?? 'Nothing to schedule yet. Add a task, or set a weekly target on a subject.')
        return
      }
      setProposal(result.proposal)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not generate a plan.')
    }
  }

  const finish = async () => {
    setError(null)
    try {
      if (proposal) await accept.mutateAsync(proposal.id)
      await updateProfile.mutateAsync({ onboardingCompleted: true, onboardingStep: 6, timezone, displayName: form.displayName.trim() || me.profile.displayName })
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not finish onboarding.')
    }
  }

  const canContinue =
    step === 1 ? form.displayName.trim().length > 0 : step === 2 ? subjects.length > 0 : step === 3 ? true : step === 4 ? !invalidRules : true

  return (
    <div className="min-h-screen bg-bg px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto w-full max-w-[720px]">
        <div className="flex items-center gap-2.5">
          <BrandMark className="size-9" />
          <span className="font-semibold tracking-tight text-[20px]">Studium</span>
          <span className="ml-auto text-[14px] text-faint">
            Step {step} of 6
          </span>
        </div>

        {step === 1 && <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-card bg-accent-soft p-4"><p className="text-[15px] text-muted">Here for flashcards, quizzes or notebooks?</p><Button onClick={finish} loading={updateProfile.isPending}>Explore study tools first</Button></div>}

        <div className="mt-5 flex gap-1" aria-hidden>
          {STEPS.map((item, index) => (
            <div key={item.title} className={`h-1 flex-1 rounded-full transition-colors ${index + 1 <= step ? 'bg-accent' : 'bg-raised'}`} />
          ))}
        </div>

        <div className="mt-6">
          <p className="text-[14px] font-medium text-accent">{STEPS[step - 1].detail}</p>
          <h1 className="mt-1 text-[24px] font-semibold tracking-[-0.025em] sm:text-[28px]">{stepTitle(step)}</h1>
        </div>

        <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-5">
          {step === 1 && (
            <Card className="p-5 sm:p-6">
              <div className="flex flex-col gap-4">
                <Field label="What should we call you?">
                  <FieldInput value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="Alex" autoFocus />
                </Field>
                <div>
                  <p className="text-[15px] font-medium">What are you studying for?</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {ACADEMIC_CONTEXTS.map((context) => (
                      <button
                        key={context.value}
                        type="button"
                        onClick={() => setForm({ ...form, academicContext: context.value })}
                        className={`rounded-card border p-3 text-left transition-colors ${
                          form.academicContext === context.value ? 'border-accent bg-accent-soft/60' : 'border-line hover:bg-surface-2'
                        }`}
                      >
                        <span className="flex items-center justify-between text-[15px] font-medium">
                          {context.label}
                          {form.academicContext === context.value && <Check className="size-4 text-accent" />}
                        </span>
                        <span className="mt-0.5 block text-[14px] text-muted">{context.detail}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Field label="What is your goal this term?" hint="Optional — a sentence is enough.">
                  <FieldTextarea value={form.learningGoal} onChange={(event) => setForm({ ...form, learningGoal: event.target.value })} className="min-h-[70px]" placeholder="Stay ahead in calculus and pass the physics midterm without cramming." />
                </Field>
                <div className="flex items-center gap-2 rounded-tile bg-surface-2 px-3 py-2 text-[14px] text-muted">
                  <Clock className="size-3.5" />
                  Times are stored in {timezone.replace(/_/g, ' ')}. You can change this later.
                </div>
              </div>
            </Card>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-3">
              <p className="text-[15px] leading-relaxed text-muted">Add each subject you are studying. The colour and difficulty help the planner balance your week.</p>
              {subjects.map((subject) => (
                <div key={subject.id} className="flex items-center gap-3 rounded-card border border-line bg-panel px-4 py-3">
                  <span className="round size-3 rounded-full" style={{ background: subject.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{subject.name}</p>
                    <p className="text-[14px] text-faint">
                      {subject.priority} priority · difficulty {subject.difficulty}/5
                      {subject.weeklyTargetMinutes ? ` · ${subject.weeklyTargetMinutes / 60}h target` : ''}
                    </p>
                  </div>
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${subject.name}`} onClick={() => removeSubject.mutate(subject.id)}>
                    <Trash />
                  </Button>
                </div>
              ))}
              <Button variant="secondary" className="h-12 border-dashed" onClick={() => setSubjectOpen(true)}>
                <Plus />
                Add a subject
              </Button>
              {subjects.length === 0 && <p className="text-[14px] text-faint">Your study workspace starts with a subject.</p>}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-3">
              <p className="text-[15px] leading-relaxed text-muted">Exams and deadlines make the plan work backwards from what matters. This step is optional.</p>
              {assessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center gap-3 rounded-card border border-line bg-panel px-4 py-3">
                  <span className="round size-3 rounded-full" style={{ background: assessment.subjectColor ?? '#635BFF' }} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-medium">{assessment.title}</p>
                    <p className="text-[14px] text-faint">
                      {assessment.subjectName} · {dateLabel(new Date(assessment.dueAt).toISOString().slice(0, 10), { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <Button size="icon-sm" variant="ghost" aria-label={`Remove ${assessment.title}`} onClick={() => removeAssessment.mutate(assessment.id)}>
                    <Trash />
                  </Button>
                </div>
              ))}
              <Button variant="secondary" className="h-12 border-dashed" disabled={subjects.length === 0} onClick={() => setAssessmentOpen(true)}>
                <Plus />
                Add an exam or deadline
              </Button>
              {subjects.length === 0 && <Alert tone="info">Add a subject first so the deadline can belong to it.</Alert>}
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-4">
              <p className="text-[15px] leading-relaxed text-muted">Tell Studium when you can actually study. Leave days empty when you are not available.</p>
              <AvailabilityEditor rules={rules} onChange={setRules} />
              <Card className="grid gap-4 p-4 sm:grid-cols-3">
                <Field label="Session length" hint="Minutes">
                  <NumberInput
                    min={15}
                    max={120}
                    step={5}
                    value={String(planning.preferredSessionMinutes)}
                    onValueChange={(value) => setPlanning({ ...planning, preferredSessionMinutes: Number(value) || 15 })}
                  />
                </Field>
                <Field label="Break" hint="Minutes between sessions">
                  <NumberInput min={0} max={45} step={5} value={String(planning.breakMinutes)} onValueChange={(value) => setPlanning({ ...planning, breakMinutes: Number(value) || 0 })} />
                </Field>
                <Field label="Daily maximum" hint="Minutes per day">
                  <NumberInput
                    min={30}
                    max={720}
                    step={15}
                    value={String(planning.maxDailyMinutes)}
                    onValueChange={(value) => setPlanning({ ...planning, maxDailyMinutes: Number(value) || 30 })}
                  />
                </Field>
              </Card>
              <p className="text-[14px] text-faint">{weeklyMinutes > 0 ? `${minutesLabel(weeklyMinutes)} of availability per week.` : 'No availability yet — you can add it later in Settings.'}</p>
            </div>
          )}

          {step === 5 && (
            <Card className="flex flex-col gap-5 p-5">
              <div>
                <p className="text-[15px] font-medium">What matters most right now?</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {[
                    { value: 'balanced', label: 'Balanced', detail: 'Steady coverage across subjects' },
                    { value: 'deadline', label: 'Deadlines', detail: 'Urgent work comes first' },
                    { value: 'difficult', label: 'Difficult first', detail: 'Hard subjects get more time' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPlanStyle({ ...planStyle, planningStyle: option.value as typeof planStyle.planningStyle })}
                      className={`rounded-card border p-3 text-left transition-colors ${
                        planStyle.planningStyle === option.value ? 'border-accent bg-accent-soft/60' : 'border-line hover:bg-surface-2'
                      }`}
                    >
                      <span className="block text-[15px] font-medium">{option.label}</span>
                      <span className="mt-0.5 block text-[13px] leading-relaxed text-muted">{option.detail}</span>
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Planning horizon">
                <Select value={planStyle.planningHorizonDays} onValueChange={(value) => setPlanStyle({ ...planStyle, planningHorizonDays: Number(value) })}>
                  <option value={7}>One week</option>
                  <option value={10}>Ten days</option>
                  <option value={14}>Two weeks</option>
                  <option value={21}>Three weeks</option>
                </Select>
              </Field>
              <Switch
                checked={planStyle.urgentFirst}
                onChange={(urgentFirst) => setPlanStyle({ ...planStyle, urgentFirst })}
                label="Prioritise urgent deadlines"
                description="Push work with the nearest deadline to the front of the queue."
              />
            </Card>
          )}

          {step === 6 && (
            <div className="flex flex-col gap-4">
              {!proposal && (
                <>
                  <Card className="flex flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-[15px] font-semibold">Your study profile</p>
                      <Badge tone="accent" dot>
                        Ready
                      </Badge>
                    </div>
                    <dl className="grid grid-cols-2 gap-3 text-[15px] sm:grid-cols-4">
                      {[
                        { label: 'Subjects', value: String(subjects.length) },
                        { label: 'Deadlines', value: String(assessments.length) },
                        { label: 'Availability', value: minutesLabel(weeklyMinutes) },
                        { label: 'Horizon', value: `${planStyle.planningHorizonDays} days` },
                      ].map((item) => (
                        <div key={item.label}>
                          <dt className="text-[13px] text-faint">{item.label}</dt>
                          <dd className="mt-0.5 font-medium">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <ul className="flex flex-wrap gap-1.5">
                      {subjects.map((subject) => (
                        <li key={subject.id} className="rounded-tile bg-surface-2 px-2 py-1 text-[13px]">
                          {subject.name}
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button variant="primary" className="h-11 flex-1" onClick={generatePlan} loading={generate.isPending}>
                      <Sparkles />
                      Generate my first study plan
                    </Button>
                    <Button className="h-11" onClick={finish} loading={updateProfile.isPending}>
                      Finish without a plan
                    </Button>
                  </div>
                  <p className="text-[14px] leading-relaxed text-faint">
                    Your plan is a proposal until you accept it. Nothing is added to your calendar before that.
                  </p>
                </>
              )}

              {proposal && (
                <Card className="p-4 sm:p-5">
                  <PlanReview
                    proposal={proposal}
                    timezone={timezone}
                    onAccept={finish}
                    onDiscard={() => setProposal(null)}
                    accepting={accept.isPending || updateProfile.isPending}
                    acceptLabel="Accept and start"
                  />
                </Card>
              )}
            </div>
          )}
        </motion.div>

        {error && <Alert tone="danger" title="Something went wrong">{error}</Alert>}

        <div className="mt-6 flex items-center justify-between gap-3">
          <Button variant="ghost" className={step === 1 ? 'invisible' : ''} onClick={() => setStep(Math.max(1, step - 1))}>
            <ArrowLeft />
            Back
          </Button>
          <div className="flex items-center gap-4">
            {step === 3 && (
              <button type="button" onClick={() => saveStep(4)} className="text-[14px] text-muted underline-offset-2 hover:underline">
                Skip for now
              </button>
            )}
            {step < 6 && (
              <Button
                variant="primary"
                onClick={() => (step === 4 ? continueFromAvailability() : saveStep(step + 1))}
                disabled={!canContinue}
                loading={updateProfile.isPending || saveAvailability.isPending}
              >
                Continue
                <ArrowRight />
              </Button>
            )}
          </div>
        </div>
      </div>

      <SubjectDialog open={subjectOpen} onClose={() => setSubjectOpen(false)} />
      <AssessmentDialog open={assessmentOpen} onClose={() => setAssessmentOpen(false)} />
    </div>
  )
}

function stepTitle(step: number): string {
  switch (step) {
    case 1:
      return 'Let’s set up your study workspace'
    case 2:
      return 'Add your subjects'
    case 3:
      return 'Any exams or deadlines?'
    case 4:
      return 'When do you study?'
    case 5:
      return 'How should Studium plan?'
    default:
      return 'Review your first plan'
  }
}

function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

export const ONBOARDING_STEPS = STEPS.length
export { WEEKDAYS }
