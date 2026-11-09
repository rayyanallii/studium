# Spacing audit — November 9, 2026

Kept the existing Frosted UI palette, icons and typography. Corrected:

- Sidebar links shrinking vertically on short desktop windows.
- Header search centering and inconsistent utility-button dimensions.
- Extra borders and uneven padding in dashboard statistics.
- Dropdown icon/label alignment and menu item padding.
- Missing flex layouts that prevented study-card gaps from taking effect.
- Mobile task badges squeezing titles and metadata; session title wrapping.
- Input heights, field gaps, availability inputs and wrapping form actions.
- Dialog title/description margins and long forms exceeding the mobile viewport.
- Flashcard review controls on narrow screens and the notebook composer covering source text.

## Verification

Playwright captured the 11 main routes at 1440×1000 and 390×844. No page-level
horizontal overflow was found. The planner intentionally scrolls horizontally
inside its calendar container on phones.

Account menus, search, task/subject/session/plan/upload dialogs and subject detail
were checked at 1440×900, 1280×720 and 360×800. Sidebar links retain a minimum
48px height. Long dialogs remain inside the viewport and their footer is reachable
by scrolling. Populated flashcard, quiz and notebook layouts were checked at
desktop/mobile widths using browser-only responses from the earlier integration
fixtures; this visual check creates no study records or AI requests.

Task creation/deletion, select interaction, keyboard focus containment, mobile
navigation and light/dark persistence passed the existing browser workflow.
Typecheck and production build passed. Screenshots are in `output/playwright/`.

Audit runners: `scripts/audit-spacing.js`, `scripts/audit-spacing-overlays.js`,
and `scripts/spacing-final-check.js`, using the Playwright CLI `run-code` command.
For populated study screens, first run `scripts/prepare-study-visual-check.py`
against saved integration fixtures, then run the generated
`output/study-check/visual-check.js` through the CLI.
