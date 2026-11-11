import { Link } from 'react-router'
import { BrandMark } from '../components/BrandMark'

const privacy = [
  ['Where this notice applies', 'This notice covers the Studium website, sign-in screens and personal study workspace. It describes the data the product uses and the controls currently available. Your school, identity provider and other services you use separately may handle information under their own notices.'],
  ['Account and workspace', 'Studium uses your sign-in details to connect you to your workspace. Your profile, subjects, tasks, availability, study sessions and progress are stored so you can return to them.'],
  ['Where the information comes from', 'Most information comes from what you enter or upload. The sign-in provider supplies an account identifier and may supply email or profile details. The app creates records as you study, such as session duration, quiz attempts and flashcard review progress.'],
  ['Why the app uses this information', 'Account information lets you sign in and access your saved workspace. Study records let the app organise subjects, schedule sessions and show progress. Files and extracted text let you read and reuse sources. When you request AI assistance, relevant inputs are processed to answer that request. The app also tracks AI requests to apply usage limits.'],
  ['Files and notes', 'When you add a file, Studium stores the original and the text extracted from it. Text from a PDF or Word document is normally extracted in your browser before upload. Scanned pages and images may be sent to the configured AI service for transcription.'],
  ['AI requests', 'When you generate a study set or ask a notebook question, the selected source text and relevant conversation can be sent to the AI provider. The workspace assistant may send the records needed to answer your request, such as subjects, tasks or schedules. AI study sets and chats are saved so you can reopen them.'],
  ['What deleting a conversation changes', 'Deleting a conversation removes the saved conversation from Studium where the feature provides a delete control. It does not undo changes you already applied to your workspace. It also does not control copies of previous requests that a service provider may retain.'],
  ['Service providers', 'Supabase handles sign-in and supports workspace storage. Cloudflare hosts the application and provides database and file storage. AI requests go to the service configured for the deployment, which defaults to Experiential Labs. These services process the information needed to carry out their part of the request.'],
  ['Where providers process information', 'The regions used for storage, requests and backups depend on the deployment and its provider settings. Processing can take place outside your country. The app does not expose the operator’s transfer arrangements or provider retention settings in the workspace.'],
  ['Browser storage and network requests', 'Studium uses browser storage for sign-in state and preferences such as your theme and notebook layout. Your browser also makes network requests to load the app and its assets. Hosting and authentication providers may record technical information such as request times and IP addresses.'],
  ['Keeping and deleting study data', 'Study data remains available while it is saved in your workspace. You can delete individual items from the library. If a study set cites a source, delete the linked set before removing the source. Settings lets you delete your study data and uploaded files. This does not delete the separate sign-in identity held by the authentication provider or set the retention period for provider logs and backups.'],
  ['Retention by record type', 'Saved files, notes, chats and study history remain in the workspace until you remove them using the available controls or delete your study data. Authentication records, provider request logs and backups are managed separately. Deleting an item in Studium does not guarantee immediate removal of those separate records.'],
  ['Privacy requests', 'Depending on the law that applies, you may have rights to access, correct, delete or obtain a copy of your information, to object to or restrict processing, or to complain to a data protection authority. Workspace settings cover some of these actions. For requests the app cannot handle, contact the operator of the deployment you use. If an organisation provided your access, ask it who handles privacy requests.'],
  ['Your choices', 'You can edit your profile and study records from the workspace. You can use the planner and focus timer without generating AI study materials. Only upload material you are permitted to share with the services that process it.'],
  ['Study activity and recommendations', 'Studium uses session times and completion records to show your progress. When you ask it to generate a plan, it uses information such as availability, deadlines and study priorities to propose a schedule for you to review.'],
  ['Information about other people', 'Before uploading class notes, screenshots or documents, remove names, grades and other personal information that you do not need for your study task. Avoid uploading confidential or sensitive records.'],
  ['Use by students under the age of majority', 'If you are a parent, guardian or educator arranging access for a child, check with the operator about eligibility, parental permission and handling of student records before the child signs up or submits information. The standard sign-up screen does not include a separate parental consent flow.'],
  ['Deleting local information', 'Clearing your browser’s site data removes local preferences and may sign you out. It does not remove material saved in your workspace. Use the workspace deletion controls for that. The Cookie statement explains what stays in your browser.'],
]

const terms = [
  ['Using Studium', 'Studium provides tools for personal study, including a planner, focus timer, flashcards, quizzes and notebooks. Keep your sign-in credentials private and use an account you are authorised to access.'],
  ['Account access and eligibility', 'Use accurate account information and keep your recovery email current. If applicable law or your institution requires permission to use this service, obtain it before signing up. If you think someone else has accessed your account, reset your password and notify the operator.'],
  ['Your material', 'You keep the rights you already have in the material you add. By adding material or using an AI feature, you allow Studium and its service providers to store and process the material as needed to provide the requested feature. Upload only material you have permission to use this way.'],
  ['AI answers and study plans', 'Generated explanations, citations, questions and plans can contain errors or omit important information. Check the original source before relying on an answer. Review dates and availability before following a generated plan. Follow your school or institution’s rules for AI use and academic work.'],
  ['Acceptable use', 'Respect other people’s privacy and intellectual property. Do not access accounts or files without permission, upload malicious software, interfere with the service or bypass its limits.'],
  ['Classroom and assessment rules', 'Check whether your school allows AI assistance for a given assignment or exam. Do not present generated work as your own where disclosure is required. You are responsible for checking sources and following any rules on collaboration and citation.'],
  ['Third-party services', 'Authentication and AI features depend on external providers. A provider outage or a change to its service can affect access or generation. The Privacy notice explains which information can be sent to those providers.'],
  ['Availability and limits', 'AI features depend on provider availability and may be subject to usage limits. Keep your own copies of material you need outside Studium. The service and its features can change as the product develops.'],
  ['Charges and subscriptions', 'The current sign-up flow creates an account without a payment step. A paid subscription would require a separate offer that explains its price, billing period, renewal and cancellation terms before purchase.'],
  ['Reports about content or account use', 'If you report material you believe infringes your rights, identify the work, explain the problem and provide enough information for the operator to locate it. Do not include account credentials or unrelated private material.'],
  ['Leaving Studium', 'You can stop using Studium or delete your workspace data in Settings. Deleting that data removes saved study records and uploads from the workspace. Read the Privacy notice for details on your separate sign-in identity and provider records.'],
  ['Your rights', 'These terms do not override rights that applicable law gives you.'],
  ['Reviewing assistant changes', 'Read proposed changes to tasks, sessions and other workspace records before applying them. Check dates, times and the affected records, especially when approving a deletion.'],
  ['Keeping copies', 'Download original uploads you want to keep before deleting them or clearing your workspace. Removing a study set may also remove its saved review progress or conversation.'],
  ['Changes to these terms', 'Review the terms when the service changes. Any notice or consent required by applicable law must be handled separately from posting an updated page.'],
]

const accessibility = [
  ['Scope', 'Studium aims to make its public pages and study workspace usable by people with disabilities. This statement covers the landing page, account screens and study tools. A full accessibility audit has not been completed, so Studium does not claim WCAG conformance.'],
  ['Keyboard controls', 'Use Tab and Shift+Tab to move between links and controls, and Enter or Space to activate buttons. The landing FAQ uses expandable questions that work without a pointer. To move a planner session without dragging, open it and edit its date and times.'],
  ['Motion and appearance', 'The landing animation has a pause control. Some effects respond to your device’s reduced motion setting. The workspace offers light and dark themes, and the public pages adapt to narrow screens.'],
  ['Visual study material', 'A diagram or scanned document may not have a usable text description. Notebook mind maps include a text outline. For an uploaded diagram, use any available source text or ask for a written explanation and check it against the original.'],
  ['Files and assistive technology', 'Accessibility depends partly on the material you upload. A scanned PDF or photo may have no text your screen reader can read. Where available, use a text-based PDF or paste a text version. Extracted text can contain errors or miss information shown visually.'],
  ['How accessibility was checked', 'Public pages have been checked for narrow-screen layout and basic navigation. Those checks do not cover every workspace workflow, browser, screen reader or keyboard interaction.'],
  ['Reporting a barrier', 'When reporting a problem to the person or team who provided your Studium access, include the page or feature, what you were trying to do, and any browser or assistive technology you used. Leave out passwords and private study material.'],
]

const cookies = [
  ['What this statement covers', 'Cookies and browser storage can remember information on your device. Cookies can travel with web requests. Local storage keeps values in your browser for the site that wrote them.'],
  ['Sign-in', 'The authentication service can store session information in your browser to keep you signed in and complete account flows. Session lifetimes depend on the authentication configuration. Signing out ends your current app session.'],
  ['Sign-in and recovery links', 'Account confirmation, password reset and sign-in redirects may use temporary values to complete the request. These are distinct from your saved display preferences. Avoid sharing account recovery links or copying them into support messages.'],
  ['Theme preference', 'Studium stores your display preference under studium-theme in local storage. The page reads it when it opens so your preferred appearance can load immediately. It stays there until the preference changes or you clear the site’s data.'],
  ['Notebook layout', 'Studium stores the width of your notebook panels under studium-notebook-split in local storage. This value stays in the same browser until you resize the panels again or clear the site’s data.'],
  ['Advertising and analytics', 'Studium’s app code does not set advertising cookies or add a visitor analytics tracker. Hosting and authentication providers may still process technical request information as described in the Privacy notice.'],
  ['Managing site data', 'Use your browser’s site settings to inspect, clear or block cookies and local storage. Blocking storage can prevent sign-in from persisting and reset your display and notebook layout preferences. Clearing browser data does not delete your saved study workspace.'],
  ['Shared devices', 'Sign out after studying on a shared device. You can also clear site data to remove locally stored preferences. Each browser keeps its own copy of these settings.'],
]

export const legalPages = {
  privacy: { title: 'Privacy notice', description: 'How Studium handles your account, study materials and AI requests.', sections: privacy },
  terms: { title: 'Terms of use', description: 'What to expect when you use Studium and what you are responsible for.', sections: terms },
  accessibility: { title: 'Accessibility statement', description: 'Ways to use Studium and alternatives for some visual or pointer-based features.', sections: accessibility },
  cookies: { title: 'Cookie statement', description: 'What Studium stores in your browser and how to manage it.', sections: cookies },
}

export type LegalKind = keyof typeof legalPages

export function Legal({ kind }: { kind: LegalKind }) {
  const { title, description, sections } = legalPages[kind]
  return <main className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
    <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-line pb-5">
      <Link to="/" aria-label="Studium home"><BrandMark alt="" className="h-12 w-28" /></Link>
      <nav aria-label="Legal navigation" className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">{Object.entries(legalPages).map(([path, page]) => <Link key={path} to={`/${path}`} aria-current={kind === path ? 'page' : undefined} className="aria-[current=page]:font-semibold aria-[current=page]:text-fg">{page.title}</Link>)}</nav>
    </header>
    <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
    <p className="mt-4 leading-7 text-muted">{description}</p>
    <nav aria-label="On this page" className="my-8 rounded-card border border-line p-5"><ul className="grid gap-2 sm:grid-cols-2">{sections.map(([heading], index) => <li key={heading}><a className="text-sm underline underline-offset-4" href={`#legal-${index}`}>{heading}</a></li>)}</ul></nav>
    <div className="space-y-8">{sections.map(([heading, body], index) => <section className="scroll-mt-6" id={`legal-${index}`} key={heading}><h2 className="text-xl font-semibold">{heading}</h2><p className="mt-2 leading-7 text-muted">{body}</p></section>)}</div>
    <footer className="mt-12 flex flex-wrap gap-4 border-t border-line pt-5 text-sm"><Link className="underline underline-offset-4" to="/">Back to Studium</Link>{kind !== 'privacy' && <Link className="underline underline-offset-4" to="/privacy">Privacy notice</Link>}{kind === 'privacy' && <Link className="underline underline-offset-4" to="/cookies">Cookie statement</Link>}</footer>
  </main>
}
