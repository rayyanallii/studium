# How Studium is meant to be used

Studium is a study workspace, not a todo list with a calendar attached. Every
screen serves one loop:

> **Set up what you are studying → bring the material → turn it into something
> you can practise → plan the week around it → do the work → see what actually
> happened.**

If a feature does not help that loop, it does not belong in the rail.

---

## 1. First run

1. **Create account** with an email and password. There is no confirmation email:
   the account is ready immediately and the password is saved so you can sign in
   again on any device.
2. **Onboarding, six steps:**
   1. *Your learning profile* — name, what you are studying for, one-line goal.
      (There is also a shortcut to skip straight to the study tools.)
   2. *Subjects* — add at least one. Subject colour and difficulty feed the planner.
   3. *Deadlines* — optional exams and due dates; the plan works backwards from them.
   4. *Availability* — the hours you can realistically study, plus session length,
      break and daily cap. Leave days empty if you do not study then.
   5. *Preferences* — balanced / deadline-first / difficult-first planning.
   6. *Review* — generate a plan proposal. Nothing is on the calendar until you
      accept it; "Finish without a plan" is allowed.
3. **Overview** is the landing page after onboarding.

---

## 2. The navigation, and why it is grouped

| Group | Page | What it is for |
| --- | --- | --- |
| — | **Overview** | Today's schedule, quick counts, the three study shortcuts. |
| Study | **Subjects** | The backbone. Every task, material, set and session belongs to one. |
| Study | **Study library** | Sources you upload or paste, and the sets made from them. |
| Plan | **Planner** | The week grid: planned sessions, Generate plan, manual sessions. |
| Plan | **Tasks** | Concrete pieces of work with a subject, topic, estimate and due date. |
| Plan | **Focus** | The timer. Start from a planned session or from anything. |
| Progress | **Analytics** | Confirmed study time, per subject, from real sessions. |
| — | **Settings** | Profile, study preferences, availability, account. |

Flashcards, quizzes and notebooks are not separate rails: they are the
**three outputs of the library**, so they live inside *Study library* (and on each
subject page). Their direct routes (`/flashcards`, `/quizzes`, `/notebooks`) still
work when linked from those places. On a phone the bottom bar keeps Overview,
Subjects, Study library and Planner; everything else is under **More**.

---

## 3. Subject workflow (the core habit)

1. Open **Subjects** and pick the subject you are working on.
2. On the subject page:
   - **Topics** break it into units ("Chemical bonding", "Integration techniques").
   - **Tasks** are the work to get through, optionally attached to a topic.
   - **Assessments** are exams or deadlines for that subject.
   - **Study material** lists the sources and the sets built for that subject.
3. Add material from **Study library → Add material**: upload a PDF, DOCX or image,
   or paste notes, and pick the subject. Each source needs a title and at least 40
   characters of readable text (10 MB max, 80,000 characters).
4. In the library, tick up to four sources, choose **Flashcards**, **Quiz** or
   **AI Notebook**, and create. The set inherits the subject of its first source,
   so it appears on that subject page too.
5. Study the set:
   - *Flashcards*: flip, mark cards learned.
   - *Quiz*: answer, submit, see the score and explanations, retry.
   - *Notebook*: ask questions; answers cite the sources.
6. Every set keeps citations back to the original material.

---

## 4. Planning and doing the work

1. **Planner** shows the week. *Generate plan* proposes sessions from open tasks,
   deadlines, subject difficulty and your availability. Review the proposal, then
   accept or discard it.
2. Sessions appear on the planner and on Overview for today.
3. **Focus** starts a timer. Starting from a planned session links the time to that
   session; a standalone session can pick any subject. Time only counts once the
   session is completed.
4. **Tasks** is where work is captured and closed: filters, inline complete,
   subject/topic/priority/due date.
5. **Analytics** reads confirmed time only — planned minutes are not "studied".

---

## 5. Settings and data

- Profile (name, study context, goal, timezone), study preferences, availability
  and account actions live in **Settings**.
- Account and sessions: Supabase Auth. Workspace data (subjects, tasks, plans,
  materials, sets): the app database behind the Worker.
- Source files are stored privately; only the signed-in owner can download them.

## 6. Limits worth knowing

- 4 sources per generated set; 100,000 characters across them.
- 100 sources per library.
- AI generation has a daily cap; failures never consume a source.
- A source cited by a set cannot be deleted until the set is deleted.
