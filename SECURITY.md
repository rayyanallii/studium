# Security Policy — Studium

Studium is an AI-powered academic study workspace and deterministic planner designed for students, educators, and researchers. Because Studium manages personal study materials, notes, syllabi, and academic schedules, data privacy, cryptographic access control, and model execution safety are fundamental to the project's engineering.

This document details our security architecture, vulnerability reporting procedures, and disclosure policy.

---

## 1. Supported Versions

Security updates and patches are continuously applied to the primary codebase and deployed instances.

| Branch / Target | Environment | Supported |
| :--- | :--- | :---: |
| `main` | Production (`studiumaistudy.netlify.app`) | :white_check_mark: |
| Feature / Development branches | Local development | :x: |
| Historical releases (< 0.1.0) | Deprecated | :x: |

---

## 2. Security Architecture & Threat Model

Studium implements a layered defense-in-depth model across the browser client, edge API serverless functions, database, and AI gateway.

### 2.1 Zero Client-Side Secret Exposure
* **Server-Only API Keys:** Third-party LLM credentials (`EXPLABS_API_KEY`), Supabase secret keys (`SUPABASE_SECRET_KEY`), and server configurations exist exclusively within encrypted serverless execution environments (Netlify Functions / Cloudflare Workers).
* **Public Key Segregation:** The browser client only receives public identifiers (`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`), which have zero administrative access and cannot read or write data without passing through database security policies.

### 2.2 Multi-Tenant Row-Level Security (RLS)
* **Postgres RLS on Supabase:** Every workspace, subject, topic, assessment, schedule, and study artifact is owned by an explicit `workspace_id`.
* **Security Definer Function:** Row access is evaluated at the database engine level via `is_workspace_owner(workspace_id) = auth.uid()`. Even if an attacker manipulates API requests, the database rejects queries across tenant boundaries.
* **Token-Scoped Database Queries:** API handlers communicate with Postgres using the user's validated JWT bearer token, ensuring the database enforces RLS rather than relying on application `WHERE` clauses alone.

### 2.3 Authentication & Session Management
* **Cryptographic Token Verification:** All protected `/api/*` endpoints require a Supabase-issued Bearer JWT verified on every request via `auth.getUser`.
* **Secure Cookie / Header Storage:** Tokens are handled according to browser security best practices, preventing XSS-based credential hijacking.
* **Automatic Session Restoration:** Tokens are validated against expiry timestamps and refreshed without storing long-lived plain credentials on the client.

### 2.4 Same-Origin & Transport Security
* **Same-Origin Enforcement:** All mutating API endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) verify same-origin request headers to prevent Cross-Site Request Forgery (CSRF).
* **Strict Transport Security:** All traffic is enforced over HTTPS with TLS 1.3 encryption in transit.
* **Cache Control:** Authenticated API responses return `Cache-Control: private, no-store, no-cache, must-revalidate` to prevent intermediate proxies or browser history from caching private student data.

### 2.5 File Upload & Content Extraction Safety
* **Magic Byte Header Inspection:** Uploaded documents (PDFs, DOCX files, PNG/JPEG notes) are inspected for genuine file magic signatures (e.g., `%PDF-` for PDFs, `PK\x03\x04` for DOCX, byte markers for images). Files that fail header verification are rejected regardless of file extension to eliminate MIME-sniffing exploits.
* **Strict Size Envelopes:** File uploads are capped at 10 MB, and extracted text characters are bounded (maximum 80,000 characters per single document) to prevent Denial of Service (DoS) and memory exhaustion.
* **Client-Side Document Parsing:** PDFs and DOCX files extract text via sandboxed parsers (`pdfjs-dist` and `mammoth`) without executing embedded macros or active scripts.

### 2.6 Deterministic State Machines & Anti-Tamper
* **Server-Persisted Focus Timer:** Elapsed focus time is calculated on the server from validated timestamps (`started_at`, `accumulated_focus_seconds`). Clients cannot fabricate focus streaks or falsify study analytics by manipulating local device clocks.
* **Idempotent Scheduling Engine:** Calendar acceptance endpoints (`/api/plans/:id/accept`) and timer transitions follow idempotent state machines, preventing duplicate calendar writes or corrupted session states during network retries.

### 2.7 AI Gateway & Structured Output Validation
* **Strict Schema Adherence:** All responses from the LLM gateway (`gpt-6-luna`) are validated against rigid Zod schemas before being accepted by the backend or saved to database tables.
* **Prompt-Injection Mitigation:** Student source material is delineated in explicit system/user context blocks. The model is constrained to extract and cite exact character segments from uploaded sources rather than following arbitrary instructions embedded inside user documents.

---

## 3. Reporting a Vulnerability

We appreciate the responsible security research community and welcome vulnerability disclosures.

If you believe you have discovered a security vulnerability in Studium, please report it privately:

### How to Report:
* **Primary Contact:** Email **`alwaysrayyanali@gmail.com`** with the subject line:  
  `[SECURITY VULNERABILITY] Studium - <Brief Vulnerability Description>`
* **GitHub Private Advisory:** Alternatively, use [GitHub's Private Vulnerability Reporting](https://github.com/rayyanallii/studium/security/advisories/new) if enabled on the repository.

> [!CAUTION]
> **Please do not report security vulnerabilities via public GitHub issues, pull requests, or public discussions.** Public reports expose all active users to potential exploitation before a patch can be deployed.

### What to Include in Your Report:
To help us triage and resolve the issue quickly, please provide:
1. **Description:** A detailed explanation of the vulnerability and its potential impact.
2. **Reproduction Steps:** Step-by-step instructions or a minimal Proof of Concept (PoC) demonstrating how to reproduce the issue.
3. **Affected Endpoints/Files:** Target URLs, routes, or source files involved.
4. **Environment Details:** Browser version, operating system, and whether local or live deployment was tested.
5. **Remediation Suggestions:** (Optional) Any recommendations or fixes you propose.

---

## 4. Response & Remediation Process

When a security vulnerability is reported, we follow this coordinated disclosure schedule:

1. **Initial Acknowledgment:** Within **48 hours** of receiving your report, we will acknowledge receipt and initiate triage.
2. **Assessment & Verification:** Within **5 business days**, we will verify the vulnerability, evaluate its CVSS severity, and determine the remediation path.
3. **Patch Development & Deployment:** Critical vulnerabilities (e.g., unauthorized data access, RLS bypass, key exposure) will be prioritized and resolved within **7 business days**.
4. **Public Disclosure:** Once a fix is verified in production, a coordinated advisory and acknowledgement will be published with credit to the reporter (unless anonymity is requested).

---

## 5. Security Best Practices for Self-Hosters

If you fork or self-host Studium:
* **Never commit secrets:** Ensure `.dev.vars` and `.env.local` remain in `.gitignore`.
* **Rotate Exposed Credentials:** If you accidentally publish a secret key, immediately revoke and rotate it in your Supabase and Experiential Labs dashboards.
* **Enforce RLS:** When running database migrations, verify all migrations in `supabase/migrations/` have been executed to guarantee Row-Level Security policies are active.
