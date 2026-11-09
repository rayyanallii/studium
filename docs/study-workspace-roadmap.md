# Studium: AI study workspace

This scope update reflects the November 9, 2026 product direction. It supersedes
the original PRD's exclusions for AI flashcards, source-based Q&A, and document
analysis. Studium helps students understand, practice, remember, and plan.
The planner remains one part of that workflow.

## Implemented in this increment

| Area | Behavior |
| --- | --- |
| Frosted UI | Official Whop buttons, fields, selects, checkboxes, switches, segmented controls, dropdowns and dialogs; HeroUI removed |
| Appearance | Whop-inspired neutral near-black/white surfaces, blue primary actions, larger Inter typography, full-width header and 280px sidebar; subtle colored tool icons |
| Search | Ctrl/Cmd+K opens searchable pages and saved study sets |
| Study library | Paste notes or upload PDF, DOCX, PNG, JPEG, WebP; inspect extracted text; download originals; delete unused sources |
| AI flashcards | Generate a saved deck, reveal answers, navigate cards, mark learned or study again; progress persists |
| AI quiz | Generate multiple-choice questions; submit all answers; deterministic server scoring; explanations and saved attempts |
| AI notebook | Generate a source guide; ask follow-up questions; save conversation; inspect cited quotations and full source text |
| Navigation | Library, Flashcards, Quizzes and AI Notebook sit alongside planning tools; first-time users may skip planner setup |

Sources and generated sets are private to the signed-in identity. Original
files use the existing R2 binding; extracted text, generated content, progress,
and conversations use D1. All AI calls remain server-side through the configured
Experiential gateway. This does not complete the separate Next.js/Supabase
PostgreSQL migration documented in `implementation-status.md`.

The notebook is a source-grounded product feature, not an integration with or
clone of Google's NotebookLM service. It currently uses up to four whole source
texts per request; vector retrieval is a future scaling improvement.

## Limits and product behavior

- Files: 10 MB each. PDFs: up to 50 text-based pages. A scanned PDF gets an
  actionable message to upload the pages as images. Embedded DOCX images and
  complex equations are not reconstructed by raw-text extraction.
- Each source supports up to 80,000 characters; a generation can use four
  sources totaling up to 100,000 characters. Sources are not silently truncated.
- Images use AI transcription. Users can inspect the extracted text; unclear
  fragments are marked. Image understanding depends on gateway/model support.
- Study AI calls are capped at 30 per identity per rolling 24 hours, adjustable
  with `STUDY_AI_DAILY_LIMIT`. Failed requests count toward the limit.
- Quizzes are self-study tools, not secure examinations. Their answer key is
  stored in the study set and can be inspected by a technical user.
- Citation validation verifies the source ID and quoted text. It does not prove
  that every generated explanation is logically correct. Every set exposes its
  sources for checking. Missing evidence is an explicit notebook response.
- Sources used by saved sets cannot be deleted until those sets are removed.
  Deleting a set also removes its reviews, quiz attempts, and conversation.
- Live generation uses real AI; errors do not silently produce fabricated decks.

## Next features, in priority order

### 1. Spaced repetition and a daily review queue

Record recall grades and review dates per card. Use a deterministic scheduling
algorithm to choose the next review; show due reviews in the planner. Include
manual correction of cards and a reset option. Success: a learner returns to
the right cards rather than repeating an entire deck.

### 2. Weak-topic practice

Tag quiz questions and flashcards with source-supported concepts. Aggregate
incorrect answers and low-confidence reviews. Generate targeted practice only
for those concepts and let students add a revision session to their planner.
Success: students can trace a recommended session to a specific learning gap.

### 3. Revision guides and comparison tables

Offer concise chapter guides, key terms, worked-example explanations, and
side-by-side concept comparisons. Every section should cite the source. Let
the student edit and export a guide, then convert selected sections to cards.

### 4. Larger notebooks and scanned-document processing

Move ingestion into a durable background queue with progress, cancellation,
retries, and OCR for scanned PDFs. Add page-aware chunks, PostgreSQL/pgvector
retrieval, source versioning, and exact page citations. Preserve isolation and
source deletion semantics. This follows the Supabase storage migration.

### 5. Explain-back practice

Ask a student to explain a concept in their own words. Compare that explanation
against a cited rubric from their sources; identify missing ideas without
overstating a model's grading confidence. Save their revisions and progress.

### 6. Audio revision

Generate an optional spoken revision guide from an approved, cited script.
Show transcript and citations, duration and generation cost before creating
audio. Keep this behind the reliable text workflows and explicit user action.

## Verification for this increment

- TypeScript and production build.
- Unit tests: source ownership/quote validation, missing evidence, generated
  quiz schema, correct scoring and malformed answer rejection.
- Live gateway checks: all three set types, notebook follow-up, persisted
  reviews and attempts, unavailable source rejection, source deletion guard.
- Browser checks: pasted notes and real PDF/DOCX/PNG fixtures, persisted uploads,
  card review, quiz submission, notebook rendering, light/dark and mobile views.
- Original planner interactions rechecked after the shared component migration.

Implementation references: [Frosted UI](https://heroui.com/docs/react/getting-started/quick-start),
[PDF.js](https://mozilla.github.io/pdf.js/examples/),
[Mammoth](https://github.com/mwilliamson/mammoth.js).
