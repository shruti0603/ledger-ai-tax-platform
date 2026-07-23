# Ledger — AI Tax Platform Prototype

A working, clickable prototype for the AI Engineer case study. It's a dependency-free
static web app (plain HTML/CSS/JS, no build step, no framework) covering **all ten
challenges** in one connected product rather than ten disconnected screens.

## Links

Live Demo:
https://taxplatform.netlify.app/

GitHub:
https://github.com/shruti0603/ledger-ai-tax-platform

## Run it (pick any one)

**Fastest — no install:** double-click `index.html`. Everything is a relative file
reference, so it works straight from the filesystem in any modern browser.

**To actually host it as a URL:**
- Drag the whole folder onto [app.netlify.com/drop](https://app.netlify.com/drop) — done in ~10 seconds, gives you a public link.
- Or `npx serve .` from inside the folder for a local server.
- Or push the folder to a GitHub repo and turn on GitHub Pages.

There's no backend, no build step, and no API keys — it's genuinely just these four files:
`index.html`, `styles.css`, `data.js`, `app.js`.

## How to explore it

Use the role selector at the top of the sidebar to switch between a client (**Maria
Chen**), a business-owner client (**Devon Brooks**), a preparer (**Sam Rivera**), a
reviewer (**Jill Okafor**), a firm admin (**Omar Haddad**), and seasonal staff (**Tara
Lin**). The same shell adapts to each. Two reference pages — **Role Architecture** and
**How AI Works Here** — are always in the sidebar and explain the underlying design
regardless of who you're viewing as.

Start on **Maria Chen's return (`ret_1001`)** — it's the one with real, deep data behind
every tab (Overview, Documents, Traceability, Messages, AI Insights). That's the richest
path through Challenges 01, 02, 06, 08, and 10 at once.

## Where each challenge lives

| # | Challenge | Where |
|---|---|---|
| 01 | Source Document Traceability | Return → **Traceability** tab: click any field on the left, see the source document, page, section, and calculation on the right |
| 02 | Client & CPA Collaboration | Return → **Messages** tab, and global **Messages**; internal notes are visually distinct and only preparers/reviewers can post them |
| 03 | Where to Start | **First-Time Client Demo** in the sidebar — a fictional new client, independent of the role switcher |
| 04 | Getting Lost Between Parts | Persistent breadcrumbs + a **Back** button that returns to *where you came from* (not a generic parent page), plus "Connected to this return" chip panels linking documents ↔ tasks ↔ messages ↔ returns everywhere |
| 05 | Role-Aware Experiences | **Role Architecture** page + the live role switcher; see Sam Rivera's dual client/preparer identity |
| 06 | Return Status & Progress | The status rail (same component, client and firm view) on the Dashboard and every Return → Overview |
| 07 | An Actionable Dashboard | Preparer/reviewer/admin **Dashboard** — ranked queue, filters, "My queue" vs. firm-wide, tested against 150 mock returns |
| 08 | Clickable vs. Editable | The `.val` badge system (dot + icon + dashed border for editable) used consistently in Traceability, AI Insights, and Overview |
| 09 | Complexity Made Navigable | **Documents** page — search + type filters + "show more" paging across ~370 generated documents |
| 10 | Trustworthy AI | AI Insight cards (confidence bar, evidence list, suggested action, Approve/Flag) in Return → AI Insights, and the conceptual model on **How AI Works Here** |

## What's real vs. simulated

**Genuinely working, wired up UI:**
- Full client-side router with deep-linkable URLs for every screen (return tabs, tasks, documents, search results all get their own `#/...` address)
- Role switching that changes navigation, visible data, and permissions live
- Traceability click-through (field → document → highlighted region → calculation)
- Messaging: reply, and toggle a message internal vs. client-visible before sending
- Inline field correction (click an editable value, it updates and flips to "verified")
- AI Insight actions (Approve marks the underlying field verified; Flag adds a note)
- Search/filter across a generated dataset of 150 mock returns and ~370 mock documents
- A breadcrumb + back-stack that tracks actual navigation history, not a fixed hierarchy

**Fabricated / hardcoded (per the assignment's "keep it quick and dirty" instructions):**
- All documents, extracted values, confidence scores, and AI recommendations are hand-written
  fake data in `data.js` — there is no OCR, no document parsing, and no real AI model
  anywhere in this codebase
- The "document viewer" is a stylized facsimile with a CSS-positioned highlight box, not a
  real PDF renderer
- The 146 generated filler returns/documents (used to stress-test search, filtering, and
  the dashboard at scale) are produced by a seeded random generator in `data.js`, not real
  client records
- There's no backend, no auth, and no persistence — reloading the page resets any inline
  edits or sent messages back to the hardcoded defaults

## A few decisions worth explaining

- **Numbers are always monospace with tabular figures**, and every dollar amount carries a
  small colored dot + icon showing its provenance (AI-extracted / verified / needs review /
  locked). That one visual rule is reused everywhere instead of inventing a new pattern per
  screen — it's the answer to Challenge 08, but it's also what makes Challenges 01 and 10
  feel consistent rather than bolted on.
- **Internal notes use a visually distinct amber bubble**, not just a small tag, because the
  cost of a client seeing an internal note by accident is high — it shouldn't rely on
  someone reading a label carefully.
- **Sam Rivera is both a preparer and a client** with a personal return. Rather than writing
  a policy that says "don't review your own return," the return itself is cross-assigned to
  a different preparer/reviewer in the data model — the constraint is structural, not a
  reminder.
- **The dashboard ranks by urgency and blocking status, not recency or alphabetical order**,
  and defaults to "My queue" rather than firm-wide, because the question it answers is "what
  should I work on right now," not "show me everything."
- **The AI model page draws a line on purpose**: no raw model output, no token-level
  confidence. Three well-chosen pieces of evidence build more trust than twelve technical
  details would.

## What a production version would still need

Real OCR/extraction, a real backend and auth, real-time message delivery, audit logging for
every AI correction, and accessibility passes beyond the basics (focus states and reduced-
motion are respected here, but a full audit wasn't in scope for a quick prototype).
