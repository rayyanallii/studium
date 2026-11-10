import { Sparkles } from 'lucide-react'
import { useState } from 'react'

import type { PlanProposal, PlanningStyle } from '../../shared/types'
import { useAcceptPlan, useGeneratePlan, useMe, useSubjects, useUpdatePreferences } from '../lib/api'
import { cx } from '../lib/cx'
import { Alert, Button, Dialog, Progress, Segmented, Switch, useToast } from './ui'
import { PlanReview } from './PlanReview'

export function GeneratePlanDialog({ open, onClose, replan = false }: { open: boolean; onClose: () => void; replan?: boolean }) {
  const toast = useToast()
  const { data: me } = useMe()
  const { data: subjects } = useSubjects()
  const generate = useGeneratePlan()
  const accept = useAcceptPlan()
  const updatePreferences = useUpdatePreferences()
  const timezone = me?.profile.timezone ?? 'UTC'

  const [requestId, setRequestId] = useState(() => crypto.randomUUID())
  const [proposal, setProposal] = useState<PlanProposal | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [options, setOptions] = useState(() => ({
    planningStyle: (me?.preferences.planningStyle ?? 'balanced') as PlanningStyle,
    horizonDays: me?.preferences.planningHorizonDays ?? 7,
    subjectIds: [] as string[],
    useAi: true,
  }))

  const reset = () => {
    setProposal(null)
    setError(null)
    setRequestId(crypto.randomUUID())
  }

  const close = () => {
    reset()
    onClose()
  }

  const run = async () => {
    setError(null)
    try {
      if (options.planningStyle !== me?.preferences.planningStyle || options.horizonDays !== me?.preferences.planningHorizonDays) {
        await updatePreferences.mutateAsync({ planningStyle: options.planningStyle, planningHorizonDays: options.horizonDays })
      }
      const result = await generate.mutateAsync({
        requestId,
        planningStyle: options.planningStyle,
        horizonDays: options.horizonDays,
        subjectIds: options.subjectIds.length > 0 ? options.subjectIds : undefined,
        useAi: options.useAi,
      })
      if (!result.proposal) {
        setError(result.message ?? 'Nothing to schedule yet. Add a task, or set a weekly target on a subject.')
        return
      }
      setProposal(result.proposal)
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Could not generate a plan.')
    }
  }

  const apply = () => {
    if (!proposal) return
    accept.mutate(proposal.id, {
      onSuccess: (result) => {
        toast(`${result.plan?.sessions.length ?? 0} sessions added to your plan`)
        close()
      },
      onError: (problem) => setError(problem.message),
    })
  }

  const busy = generate.isPending || accept.isPending

  return (
    <Dialog
      open={open}
      onClose={close}
      title={proposal ? 'Review your plan' : replan ? 'Replan the week' : 'Generate a study plan'}
      description={proposal ? 'Nothing is saved until you apply it.' : 'Studium ranks your open work, then places every session inside your availability.'}
      width={660}
      footer={
        proposal ? (
          <>
            <Button onClick={reset} disabled={busy}>
              Adjust
            </Button>
            <Button variant="primary" onClick={apply} loading={accept.isPending} disabled={proposal.sessions.length === 0}>
              Apply updated plan
            </Button>
          </>
        ) : (
          <>
            <Button onClick={close} disabled={busy}>
              Cancel
            </Button>
            <Button variant="primary" onClick={run} loading={generate.isPending}>
              <Sparkles />
              {replan ? 'Replan' : 'Generate plan'}
            </Button>
          </>
        )
      }
    >
      {!proposal && (
        <div className="flex flex-col gap-5">
          {generate.isPending && (
            <div>
              <p className="text-[15px] font-medium">Creating your study plan…</p>
              <p className="mt-0.5 text-[14px] text-muted">
                {options.useAi
                  ? 'Ranking your work with AI, then fitting it into real calendar slots.'
                  : 'Fitting your work into real calendar slots.'}
              </p>
              <Progress value={80} className="mt-3 animate-pulse" />
            </div>
          )}

          <div>
            <p className="text-[15px] font-medium">Planning emphasis</p>
            <Segmented
              className="mt-2 w-full"
              value={options.planningStyle}
              onChange={(planningStyle) => setOptions({ ...options, planningStyle })}
              options={[
                { value: 'balanced', label: 'Balanced' },
                { value: 'deadline', label: 'Deadlines' },
                { value: 'difficult', label: 'Difficult first' },
              ]}
            />
          </div>

          <div>
            <p className="text-[15px] font-medium">Horizon</p>
            <Segmented
              className="mt-2 w-full"
              value={String(options.horizonDays) as '7' | '10' | '14' | '21'}
              onChange={(value) => setOptions({ ...options, horizonDays: Number(value) })}
              options={[
                { value: '7', label: '7 days' },
                { value: '10', label: '10 days' },
                { value: '14', label: '14 days' },
                { value: '21', label: '21 days' },
              ]}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[15px] font-medium">Subjects</p>
              <button
                type="button"
                className="text-[14px] text-accent hover:underline"
                onClick={() => setOptions({ ...options, subjectIds: options.subjectIds.length === 0 ? (subjects?.items ?? []).map((s) => s.id) : [] })}
              >
                {options.subjectIds.length === 0 ? 'Select all' : 'Clear'}
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(subjects?.items ?? []).map((subject) => {
                const active = options.subjectIds.length === 0 || options.subjectIds.includes(subject.id)
                return (
                  <button
                    key={subject.id}
                    type="button"
                    onClick={() =>
                      setOptions({
                        ...options,
                        subjectIds: options.subjectIds.includes(subject.id)
                          ? options.subjectIds.filter((id) => id !== subject.id)
                          : [...options.subjectIds, subject.id],
                      })
                    }
                    className={cx(
                      'inline-flex h-8 items-center gap-1.5 rounded-control border px-2.5 text-[14px] transition-colors',
                      active ? 'border-accent/40 bg-accent-soft text-accent' : 'border-line text-muted hover:bg-surface-2',
                    )}
                  >
                    <span className="round size-2 rounded-full" style={{ background: subject.color }} />
                    {subject.name}
                  </button>
                )
              })}
              {(subjects?.items ?? []).length === 0 && <p className="text-[14px] text-muted">No subjects yet.</p>}
            </div>
            <p className="mt-1.5 text-[15px] text-faint">Leave everything unselected to plan across all subjects.</p>
          </div>

          <div className="rounded-card border border-line px-3 py-3">
            <Switch
              checked={options.useAi}
              onChange={(useAi) => setOptions({ ...options, useAi })}
              label="Use AI recommendations"
              description={
                me?.capabilities.ai
                  ? `Ranks priorities with ${me.capabilities.aiModel}. Timestamps are always produced by the scheduler.`
                  : 'No AI key is configured on the server, so Studium will prioritise deterministically.'
              }
            />
          </div>

          <div className="rounded-tile bg-surface-2 px-3 py-2.5 text-[15px] leading-relaxed text-muted">
            Considers {me?.preferences.preferredSessionMinutes ?? 50}-minute sessions, {me?.preferences.breakMinutes ?? 10}-minute breaks, a{' '}
            {Math.round((me?.preferences.maxDailyMinutes ?? 240) / 60)}h daily ceiling, your weekly availability, subject difficulty and every open deadline.
          </div>

          {error && <Alert tone="warning" title="Plan not generated">{error}</Alert>}
        </div>
      )}

      {proposal && <PlanReview proposal={proposal} timezone={timezone} />}
      {proposal && error && <Alert tone="danger" title="Could not apply the plan">{error}</Alert>}
    </Dialog>
  )
}
