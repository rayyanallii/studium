import { LogOut, Sparkles, Trash } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import type { AcademicContext, PlanningStyle, Theme } from '../../shared/types'
import { ACADEMIC_CONTEXTS } from '../../shared/types'
import { AvailabilityEditor, type DraftWindow } from '../components/AvailabilityEditor'
import { signOut } from '../components/Shell'
import { ThemeToggle } from '../components/ThemeProvider'
import { Alert, Badge, Button, Card, ConfirmDialog, Field, Input, PageHeader, Segmented, Select, Switch, Textarea, useFieldId, useToast } from '../components/ui'
import {
  api,
  useAvailability,
  useDeleteAccount,
  useMe,
  useSaveAvailability,
  useSeedDemo,
  useUpdatePreferences,
  useUpdateProfile,
} from '../lib/api'
import { humanTimezone } from '../lib/format'

function FieldInput(props: React.ComponentPropsWithoutRef<typeof Input>) {
  const id = useFieldId()
  return <Input id={id} {...props} />
}
function FieldTextarea(props: React.ComponentPropsWithoutRef<typeof Textarea>) {
  const id = useFieldId()
  return <Textarea id={id} {...props} />
}

const FALLBACK_ZONES = ['UTC', 'Europe/London', 'Europe/Berlin', 'Europe/Paris', 'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles', 'Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney']

export function Settings() {
  const { data: me } = useMe()
  const { data: availability } = useAvailability()
  const updateProfile = useUpdateProfile()
  const updatePreferences = useUpdatePreferences()
  const saveAvailability = useSaveAvailability()
  const seed = useSeedDemo()
  const deleteAccount = useDeleteAccount()
  const toast = useToast()

  const [profile, setProfile] = useState({ displayName: '', academicContext: 'university' as AcademicContext, learningGoal: '', timezone: 'UTC' })
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [prefs, setPrefs] = useState({
    preferredSessionMinutes: 50,
    breakMinutes: 10,
    maxDailyMinutes: 240,
    planningHorizonDays: 7,
    planningStyle: 'balanced' as PlanningStyle,
    urgentFirst: false,
  })
  const [prefsLoaded, setPrefsLoaded] = useState(false)
  const [rules, setRules] = useState<DraftWindow[]>([])
  const [rulesLoaded, setRulesLoaded] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (me && !profileLoaded) {
      setProfile({
        displayName: me.profile.displayName,
        academicContext: me.profile.academicContext ?? 'university',
        learningGoal: me.profile.learningGoal ?? '',
        timezone: me.profile.timezone,
      })
      setProfileLoaded(true)
    }
  }, [me, profileLoaded])

  useEffect(() => {
    if (me && !prefsLoaded) {
      setPrefs({
        preferredSessionMinutes: me.preferences.preferredSessionMinutes,
        breakMinutes: me.preferences.breakMinutes,
        maxDailyMinutes: me.preferences.maxDailyMinutes,
        planningHorizonDays: me.preferences.planningHorizonDays,
        planningStyle: me.preferences.planningStyle,
        urgentFirst: me.preferences.urgentFirst,
      })
      setPrefsLoaded(true)
    }
  }, [me, prefsLoaded])

  useEffect(() => {
    if (availability && !rulesLoaded) {
      setRules(availability.rules.map((rule) => ({ weekday: rule.weekday, startLocalTime: rule.startLocalTime, endLocalTime: rule.endLocalTime })))
      setRulesLoaded(true)
    }
  }, [availability, rulesLoaded])

  const zones = useMemo(() => {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone')
    return supported && supported.length > 0 ? supported : FALLBACK_ZONES
  }, [])

  if (!me) return null

  const saveProfile = () =>
    updateProfile.mutate(
      { displayName: profile.displayName.trim(), academicContext: profile.academicContext, learningGoal: profile.learningGoal.trim() || null, timezone: profile.timezone },
      { onSuccess: () => toast('Profile saved') },
    )

  const savePrefs = () => updatePreferences.mutate(prefs, { onSuccess: () => toast('Study preferences saved') })
  const saveRules = () =>
    saveAvailability.mutate(rules, {
      onSuccess: () => toast('Availability saved'),
      onError: (error) => toast(error.message, 'danger'),
    })

  const setTheme = (theme: Theme) => {
    void api('/me/preferences', { method: 'PATCH', json: { theme } }).catch(() => undefined)
    updatePreferences.reset()
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Settings" subtitle="Your profile, study defaults, availability and account." />

      <div className="flex flex-col gap-4">
        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Display name">
              <FieldInput value={profile.displayName} onChange={(event) => setProfile({ ...profile, displayName: event.target.value })} />
            </Field>
            <Field label="Email" hint="Managed by your sign-in provider.">
              <FieldInput value={me.user.email ?? 'Not shared'} disabled />
            </Field>
            <Field label="What are you studying for?">
              <Select value={profile.academicContext} onValueChange={(value) => setProfile({ ...profile, academicContext: value as AcademicContext })}>
                {ACADEMIC_CONTEXTS.map((context) => (
                  <option key={context.value} value={context.value}>
                    {context.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Timezone" hint={humanTimezone(profile.timezone)}>
              <Select value={profile.timezone} onValueChange={(value) => setProfile({ ...profile, timezone: value })}>
                {zones.includes(profile.timezone) ? null : <option value={profile.timezone}>{profile.timezone}</option>}
                {zones.map((zone) => (
                  <option key={zone} value={zone}>
                    {humanTimezone(zone)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Learning goal" hint="Optional." className="sm:col-span-2">
              <FieldTextarea value={profile.learningGoal} onChange={(event) => setProfile({ ...profile, learningGoal: event.target.value })} className="min-h-[70px]" />
            </Field>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={saveProfile} loading={updateProfile.isPending} disabled={!profile.displayName.trim()}>
              Save profile
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Study preferences</h2>
          <p className="mt-0.5 text-[14px] text-muted">Defaults used whenever a plan is generated.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <Field label="Session length" hint="Minutes">
              <FieldInput type="number" min={15} max={120} step={5} value={prefs.preferredSessionMinutes} onChange={(event) => setPrefs({ ...prefs, preferredSessionMinutes: Number(event.target.value) })} />
            </Field>
            <Field label="Break" hint="Minutes">
              <FieldInput type="number" min={0} max={45} step={5} value={prefs.breakMinutes} onChange={(event) => setPrefs({ ...prefs, breakMinutes: Number(event.target.value) })} />
            </Field>
            <Field label="Daily maximum" hint="Minutes">
              <FieldInput type="number" min={30} max={720} step={15} value={prefs.maxDailyMinutes} onChange={(event) => setPrefs({ ...prefs, maxDailyMinutes: Number(event.target.value) })} />
            </Field>
            <Field label="Planning horizon">
              <Select value={prefs.planningHorizonDays} onValueChange={(value) => setPrefs({ ...prefs, planningHorizonDays: Number(value) })}>
                <option value={7}>One week</option>
                <option value={10}>Ten days</option>
                <option value={14}>Two weeks</option>
                <option value={21}>Three weeks</option>
              </Select>
            </Field>
            <Field label="Planning style" className="sm:col-span-2">
              <Select value={prefs.planningStyle} onValueChange={(value) => setPrefs({ ...prefs, planningStyle: value as PlanningStyle })}>
                <option value="balanced">Balanced coverage</option>
                <option value="deadline">Deadline focused</option>
                <option value="difficult">Difficult subjects first</option>
              </Select>
            </Field>
          </div>
          <div className="mt-4">
            <Switch checked={prefs.urgentFirst} onChange={(urgentFirst) => setPrefs({ ...prefs, urgentFirst })} label="Prioritise urgent deadlines" description="Nearest deadlines get the earliest slots." />
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={savePrefs} loading={updatePreferences.isPending}>
              Save preferences
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold">Weekly availability</h2>
              <p className="mt-0.5 text-[14px] text-muted">The planner never schedules outside these windows.</p>
            </div>
          </div>
          <div className="mt-4">
            <AvailabilityEditor rules={rules} onChange={setRules} />
          </div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-faint">Changes apply to the next plan you generate.</p>
            <Button variant="primary" onClick={saveRules} loading={saveAvailability.isPending}>
              Save availability
            </Button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Appearance</h2>
          <p className="mt-0.5 text-[14px] text-muted">Saved to your account and applied everywhere.</p>
          <div className="mt-3 flex items-center gap-2">
            <Segmented
              value={me.preferences.theme}
              onChange={setTheme}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'System' },
              ]}
            />
            <ThemeToggle />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Connections</h2>
          <ul className="mt-3 divide-y divide-line">
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="block text-[15px] font-medium">AI planning</span>
                <span className="block text-[13px] text-faint">{me.capabilities.ai ? `${me.capabilities.aiModel} via the server-side gateway` : 'No API key configured — deterministic planning only'}</span>
              </span>
              <Badge tone={me.capabilities.ai ? 'success' : 'warning'} dot>
                {me.capabilities.ai ? 'Connected' : 'Offline'}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="block text-[15px] font-medium">Database</span>
                <span className="block text-[13px] text-faint">Cloudflare D1</span>
              </span>
              <Badge tone={me.capabilities.database ? 'success' : 'danger'} dot>
                {me.capabilities.database ? 'Connected' : 'Missing'}
              </Badge>
            </li>
            <li className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="block text-[15px] font-medium">Sign in</span>
                <span className="block text-[13px] text-faint">{me.capabilities.auth !== 'development' ? (me.capabilities.auth === 'supabase' ? 'Supabase' : 'Sign in with Freebuff') : 'Local development user'}</span>
              </span>
              <Badge tone={me.capabilities.auth !== 'development' ? 'success' : 'neutral'} dot>
                {me.capabilities.auth !== 'development' ? 'Active' : 'Dev'}
              </Badge>
            </li>
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Sample workspace</h2>
          <p className="mt-0.5 text-[14px] text-muted">Three subjects, five tasks, three exams and a planned week. Only added when you ask.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button onClick={() => setConfirmDemo(true)} loading={seed.isPending}>
              <Sparkles />
              Load sample workspace
            </Button>
          </div>
          {seed.error && <Alert tone="warning" title="Could not load the sample">{seed.error.message}</Alert>}
        </Card>

        <Card className="p-5">
          <h2 className="text-[14px] font-semibold">Account</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {me.capabilities.auth !== 'development' ? (
              <Button onClick={signOut}>
                <LogOut />
                Sign out
              </Button>
            ) : (
              <Badge tone="neutral">Signed in as the local development user</Badge>
            )}
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash />
              Delete my study data
            </Button>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-faint">
            Deletes every subject, task, plan, session and focus run in Studium. Your Freebuff identity is managed by your sign-in provider.
          </p>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDemo}
        onClose={() => setConfirmDemo(false)}
        onConfirm={() =>
          seed.mutate(true, {
            onSuccess: (result) => {
              setConfirmDemo(false)
              toast(`Sample workspace loaded (${result.seeded.sessions} sessions)`)
            },
          })
        }
        loading={seed.isPending}
        title="Load the sample workspace?"
        description="This replaces your current subjects, tasks, plans and sessions with demo data. Completed study history is removed. You can delete it again any time."
        confirmLabel="Replace with sample"
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() =>
          deleteAccount.mutate(undefined, {
            onSuccess: () => {
              toast('Study data deleted')
              if (me.capabilities.auth === 'freebuff') signOut()
              else window.location.href = '/'
            },
          })
        }
        loading={deleteAccount.isPending}
        title="Delete all study data?"
        description="Every subject, task, exam, plan, session and focus run will be permanently deleted. This cannot be undone."
        confirmLabel="Delete everything"
      />
    </div>
  )
}
