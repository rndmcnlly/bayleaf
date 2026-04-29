# VPAT and BayLeaf API

**Service:** BayLeaf API ([`api.bayleaf.dev`](https://api.bayleaf.dev)), a surface of the BayLeaf AI Playground  
**Operator:** Adam Smith, Associate Professor, Dept. of Computational Media, UC Santa Cruz  
**Status:** Working draft. Not a signed ACR. The public landing is a candidate for direct source inspection; the authenticated dashboard's interactive elements want a live keyboard and screen-reader pass.  
**Template:** [VPAT® 2.5 INT](https://www.itic.org/policy/accessibility/vpat), covering [WCAG 2.1](https://www.w3.org/TR/WCAG21/) Level A and AA, [Revised Section 508](https://www.access-board.gov/ict/), and [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/).

> This is a per-surface ACR. Framing, inheritance map, evaluation methodology, open questions, and references live in [VPAT-overview.md](VPAT-overview.md). Read that document first for the posture; read this one for surface-specific findings and the conformance table.

---

## 1. Surface description

**UI origin.** BayLeaf-authored JSX rendered server-side by [Hono](https://hono.dev/) on Cloudflare Workers. The `api.bayleaf.dev` surface has two views that share the same template stack:

- **Public landing** at [`api.bayleaf.dev`](https://api.bayleaf.dev): a heading, a paragraph of copy, a "sign in" link styled as a button, and a conditional card announcing whether the visitor is on-campus (eligible for keyless access). No forms, no interactive widgets beyond the link-styled button.
- **Authenticated dashboard** at [`api.bayleaf.dev/dashboard`](https://api.bayleaf.dev/dashboard): reachable only after OIDC sign-in (CILogon via UCSC CruzID). Displays the user's API key (or a provisioning button), sandbox status, tool-integration credentials, and copy-to-clipboard controls. This is the richest BayLeaf-owned surface in terms of interactive elements.

When the unauthenticated visitor lands on the dashboard route, the same route handler renders the landing page, so the two views are interleaved in the source rather than living in separate code paths.

**Source files (small, directly inspectable).**

- [`api/src/templates/layout.tsx`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/api/src/templates/layout.tsx): shared `BaseLayout`, `cardStyle`, `btnStyle`, `RecommendedModelHint`.
- [`api/src/templates/landing.tsx`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/api/src/templates/landing.tsx): the public landing page.
- [`api/src/templates/dashboard.tsx`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/api/src/templates/dashboard.tsx): the authenticated dashboard.
- [`api/src/routes/dashboard.tsx`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/api/src/routes/dashboard.tsx): route handler, including the auth gate and key-provisioning flow; renders `LandingPage` when unauthenticated.

**Why the public landing is tractable for direct evaluation.** The entire rendered DOM is produced from ~50 lines of JSX with inline styles. A source-inspection pass covering WCAG 2.1 AA can be completed in a single sitting and verified with a browser view. A live audit with [axe DevTools](https://www.deque.com/axe/devtools/) and a keyboard pass completes the picture.

**Why the dashboard is harder than the landing.** Interactive widgets (copy-to-clipboard buttons, collapsible sections, key-rotation forms) want a live keyboard-only pass and a screen-reader pass. Source inspection alone can verify semantic structure and static labels but cannot verify focus management, live-region announcements, or the keyboard-reachability of dynamically-inserted content.

**Known concerns to check in evaluation.**

Landing (and anything sharing the layout):

- The "sign in" link uses `<a>` styled as a button via `btnStyle`. [WCAG 4.1.2 (Name, Role, Value)](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value) is satisfied as long as the role remains "link" and the text is descriptive; the visual styling alone does not create a conformance issue.
- Inline style colors need [1.4.3 (Contrast Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) verification against their backgrounds. The same accent colors (`#2a5298`, `#2d8659`, etc.) appear on the static landing at [`docs/index.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/index.html); a single contrast check covers both.
- Conditional copy ("You're on the UCSC network") is content that changes based on request IP. The copy itself should remain a static string, not dependent on dynamic styling that would fail [1.4.1 (Use of Color)](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color).

Dashboard criteria that want explicit attention:

- [2.1.1 Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard): every action must be keyboard-reachable.
- [2.4.3 Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order): logical tab order through the key management sections.
- [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible): custom-styled buttons must retain a visible focus ring.
- [3.3.1 Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification) and [3.3.3 Error Suggestion](https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion): error messaging on key provisioning.
- [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages): success/failure announcements after key operations should use ARIA live regions.

**Links for the future evaluation pass.**

- Live pages: [api.bayleaf.dev](https://api.bayleaf.dev) (public) and [api.bayleaf.dev/dashboard](https://api.bayleaf.dev/dashboard) (requires sign-in).
- Source: [`api/src/templates/`](https://github.com/bayleaf-ucsc/bayleaf/tree/main/api/src/templates).
- Rendering: Hono JSX runtime, [hono/jsx docs](https://hono.dev/docs/guides/jsx).

---

## 2. WCAG 2.1 Level A conformance

The full Level A criterion set is defined by the [W3C WCAG 2.1 Recommendation](https://www.w3.org/TR/WCAG21/#conformance-reqs). Each row below links to the *Understanding* document for the criterion.

The table merges the pre-split draft's `API-L` (public landing) and `API-D` (authenticated dashboard) columns into a single `api.bayleaf.dev` column. Where the two views previously diverged, the more conservative rating is used (Not Evaluated wins, then Partially Supports, then Supports). Remarks have been trimmed to the `api.bayleaf.dev` surface: sentences that addressed Chat or the bayleaf.dev landing have been removed; abbreviations like `API-L` and `API-D` have been expanded to "the public landing" and "the authenticated dashboard".

| # | Criterion | api.bayleaf.dev | Remarks |
|---|---|---|---|
| 1.1.1 | [Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content) | N/E | Public landing: same (no images). |
| 1.2.1 | [Audio-only and Video-only (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-only-and-video-only-prerecorded) | N/A | No prerecorded media on any BayLeaf surface. |
| 1.2.2 | [Captions (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded) | N/A | No prerecorded media. |
| 1.2.3 | [Audio Description or Media Alternative (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-description-or-media-alternative-prerecorded) | N/A | No prerecorded media. |
| 1.3.1 | [Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.3.2 | [Meaningful Sequence](https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.3.3 | [Sensory Characteristics](https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.4.1 | [Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.4.2 | [Audio Control](https://www.w3.org/WAI/WCAG21/Understanding/audio-control) | N/A | No auto-playing audio. |
| 2.1.1 | [Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard) | N/E | The authenticated dashboard wants explicit live-audit confirmation. |
| 2.1.2 | [No Keyboard Trap](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 2.1.4 | [Character Key Shortcuts](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts) | N/A | Not applicable to this surface. |
| 2.2.1 | [Timing Adjustable](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable) | N/E | Sessions on the authenticated dashboard expire; verify whether session timeouts can be extended or warned about. |
| 2.2.2 | [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide) | N/A | Not applicable to this surface. |
| 2.3.1 | [Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold) | Supports | No flashing content on any BayLeaf-authored surface. |
| 2.4.1 | [Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 2.4.2 | [Page Titled](https://www.w3.org/WAI/WCAG21/Understanding/page-titled) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 2.4.3 | [Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 2.4.4 | [Link Purpose (In Context)](https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 2.5.1 | [Pointer Gestures](https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures) | N/E | The public landing: no multi-point or path-based gestures. |
| 2.5.2 | [Pointer Cancellation](https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation) | N/E | The public landing: uses default `<a>` activation behavior. |
| 2.5.3 | [Label in Name](https://www.w3.org/WAI/WCAG21/Understanding/label-in-name) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 2.5.4 | [Motion Actuation](https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation) | N/A | No motion-based functionality. |
| 3.1.1 | [Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 3.2.1 | [On Focus](https://www.w3.org/WAI/WCAG21/Understanding/on-focus) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 3.2.2 | [On Input](https://www.w3.org/WAI/WCAG21/Understanding/on-input) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 3.3.1 | [Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification) | N/E | The public landing has no forms. The authenticated dashboard forms need live evaluation per [§ 1](#1-surface-description). |
| 3.3.2 | [Labels or Instructions](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions) | N/E | The public landing has no forms. |
| 4.1.1 | [Parsing](https://www.w3.org/WAI/WCAG21/Understanding/parsing) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 4.1.2 | [Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |

---

## 3. WCAG 2.1 Level AA conformance

Level AA is the target set for [ADA Title II](https://www.ada.gov/resources/2024-03-08-web-rule/), [Section 508](https://www.access-board.gov/ict/), [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/), and [UC IMG-2150](https://policy.ucop.edu/doc/7000611/IMT-2150). Level AA subsumes Level A; this table covers the criteria added at AA.

| # | Criterion | api.bayleaf.dev | Remarks |
|---|---|---|---|
| 1.2.4 | [Captions (Live)](https://www.w3.org/WAI/WCAG21/Understanding/captions-live) | N/A | No live media. |
| 1.2.5 | [Audio Description (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-description-prerecorded) | N/A | No prerecorded video. |
| 1.3.4 | [Orientation](https://www.w3.org/WAI/WCAG21/Understanding/orientation) | N/E | The public landing: responsive, no orientation lock. |
| 1.3.5 | [Identify Input Purpose](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose) | N/E | The public landing has no inputs. The authenticated dashboard may have username/email fields that should carry `autocomplete` attributes. |
| 1.4.3 | [Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.4.4 | [Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.4.5 | [Images of Text](https://www.w3.org/WAI/WCAG21/Understanding/images-of-text) | N/A | No images of text on BayLeaf-authored surfaces. See [VPAT-chat.md § AI-generated output](VPAT-chat.md#ai-generated-output-as-an-accessibility-surface) for AI-generated output. |
| 1.4.10 | [Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.4.11 | [Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.4.12 | [Text Spacing](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 1.4.13 | [Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus) | N/E | The public landing: no hover tooltips or popovers. |
| 2.4.5 | [Multiple Ways](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways) | N/A | Single-page surfaces (the public landing); no "set of pages" to offer multiple navigation to. |
| 2.4.6 | [Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 2.4.7 | [Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 3.1.2 | [Language of Parts](https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts) | N/A | No foreign-language passages on BayLeaf-authored surfaces. |
| 3.2.3 | [Consistent Navigation](https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation) | N/A | Single-page surfaces. |
| 3.2.4 | [Consistent Identification](https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification) | N/E | Not yet evaluated for this surface; see [VPAT-chat.md](VPAT-chat.md), [VPAT-landing.md](VPAT-landing.md) for sibling-surface observations. |
| 3.3.3 | [Error Suggestion](https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion) | N/E | No forms on the public landing. |
| 3.3.4 | [Error Prevention (Legal, Financial, Data)](https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data) | N/E | Key provisioning on the authenticated dashboard is reversible (keys can be rotated/revoked); not a "legal, financial, data" transaction in the WCAG sense. |
| 4.1.3 | [Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages) | N/E | No dynamic status on the public landing. Critical for Chat (streamed responses) and the authenticated dashboard (key-provisioning feedback); see [VPAT-chat.md](VPAT-chat.md), [§ 1](#1-surface-description), [VPAT-chat.md § AI-generated output](VPAT-chat.md#ai-generated-output-as-an-accessibility-surface). |

**Level AAA criteria** are not included in this table. VPAT 2.5 treats Level AAA as optional; conformance claims at AA do not include AAA. BayLeaf has not targeted AAA and does not claim it.

---

## 4. Revised Section 508: Chapters 3, 4, 5, 6

[Revised Section 508](https://www.access-board.gov/ict/) incorporates
WCAG 2.0 Level A and AA by reference for web content (Chapter 5:
Software, and Chapter 6: Support Documentation). The chapters below
cover the 508-specific requirements that extend beyond WCAG.

**Chapter 3: Functional Performance Criteria (FPC).** FPC apply when
[§ E205.2](https://www.access-board.gov/ict/#E205.2) (web/software
conformance requirements) cannot be fully met, or as an alternative
path. For a web-only service, WCAG 2.0 AA conformance generally
discharges the FPC obligation. BayLeaf claims conformance via the
WCAG path; see [§ 3](#3-wcag-21-level-aa-conformance).

| § | Criterion | Applies? | Remarks |
|---|---|---|---|
| [302.1](https://www.access-board.gov/ict/#302.1) | Without Vision | Via WCAG | Chat relies on upstream Open WebUI; others per [§ 3](#3-wcag-21-level-aa-conformance). |
| [302.2](https://www.access-board.gov/ict/#302.2) | With Limited Vision | Via WCAG | Covered by 1.4.3, 1.4.4, 1.4.10. |
| [302.3](https://www.access-board.gov/ict/#302.3) | Without Perception of Color | Via WCAG | Covered by 1.4.1. |
| [302.4](https://www.access-board.gov/ict/#302.4) | Without Hearing | N/A | No audio content. |
| [302.5](https://www.access-board.gov/ict/#302.5) | With Limited Hearing | N/A | No audio content. |
| [302.6](https://www.access-board.gov/ict/#302.6) | Without Speech | N/A | No speech-input required. |
| [302.7](https://www.access-board.gov/ict/#302.7) | With Limited Manipulation | Via WCAG | Covered by 2.1.1, 2.5.1. |
| [302.8](https://www.access-board.gov/ict/#302.8) | With Limited Reach and Strength | Via WCAG | Covered by 2.5.1, 2.5.2. |
| [302.9](https://www.access-board.gov/ict/#302.9) | Minimize Photosensitive Seizure Triggers | Via WCAG | Covered by 2.3.1. |
| [302.10](https://www.access-board.gov/ict/#302.10) | With Limited Cognition, Language, and Learning | Via WCAG | Broadly covered by readable-content criteria (3.1.*, 2.4.*). |

**Chapter 4: Hardware.** Not applicable. BayLeaf is not hardware.

**Chapter 5: Software.**

| § | Criterion | Applies? | Remarks |
|---|---|---|---|
| [502](https://www.access-board.gov/ict/#502) | Interoperability with Assistive Technology | Via WCAG 4.1.2 | Applies to platform-software-like behavior; for web content largely discharged by WCAG 4.1.2 (Name, Role, Value). |
| [503](https://www.access-board.gov/ict/#503) | Applications | Via WCAG | Web applications covered by WCAG incorporation. |
| [504](https://www.access-board.gov/ict/#504) | Authoring Tools | N/A | BayLeaf is not an authoring tool in the 508 sense; users generate content via prompts but BayLeaf does not author persistent web content on the user's behalf. |

**Chapter 6: Support Documentation and Services.**

| § | Criterion | Applies? | Remarks |
|---|---|---|---|
| [602.2](https://www.access-board.gov/ict/#602.2) | Accessibility and Compatibility Features | Supports | This document plus [HECVAT.md](HECVAT.md), [FERPA.md](FERPA.md), and [SECURITY.md](SECURITY.md) are provided as accessible web content. |
| [602.3](https://www.access-board.gov/ict/#602.3) | Electronic Support Documentation | N/E | Support page at [`docs/support.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/support.html) is out of scope per [VPAT-overview.md § 4](VPAT-overview.md#4-per-surface-acrs) but will be brought in when capacity allows. |
| [602.4](https://www.access-board.gov/ict/#602.4) | Alternate Formats for Non-Electronic Support Documentation | N/A | No non-electronic documentation. |
| [603](https://www.access-board.gov/ict/#603) | Support Services | Supports | Support is via email to the operator ([amsmith@ucsc.edu](mailto:amsmith@ucsc.edu)); email is an accessible medium. |

---

## 5. EN 301 549: chapters not covered above

[EN 301 549 v3.2.1](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf)
is the European harmonized standard for ICT accessibility. It
incorporates WCAG 2.1 Level A and AA by reference (Chapter 9: Web)
and adds requirements beyond WCAG in Chapters 5, 6, 7, 8, 10, 11, and
12. For a web-only service with no hardware, no two-way voice
communication, no video, and no closed functionality, most of these
chapters are Not Applicable.

| Chapter | Title | Applies? | Remarks |
|---|---|---|---|
| [4](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Functional Performance Statements | Via WCAG | Parallels Section 508 Chapter 3; discharged via WCAG conformance. |
| [5](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Generic Requirements | Partially Applies | 5.1 (closed functionality), 5.2 (biometrics), 5.3 (privacy of AT), 5.4 (preservation of info through conversion), 5.5 (operable parts), 5.6 (locking/toggle), 5.7 (key repeat), 5.8 (double-strike), 5.9 (simultaneous user actions): all N/A for a web-only service without biometrics or hardware controls. |
| [6](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | ICT with Two-Way Voice Communication | N/A | No voice communication. |
| [7](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | ICT with Video Capabilities | N/A | No video playback or capture. |
| [8](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Hardware | N/A | Not hardware. |
| [9](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Web | Via WCAG | Web content covered by [§§ 2](#2-wcag-21-level-a-conformance)–[3](#3-wcag-21-level-aa-conformance). |
| [10](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Non-Web Documents | N/A | BayLeaf does not distribute non-web documents (no PDFs, no Word files) as primary content. |
| [11](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Software | Via WCAG 4.1.2 | The API dashboard is "software" in the EN sense; covered by WCAG. |
| [12](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Documentation and Support Services | Supports | Parallels 508 Chapter 6; BayLeaf documentation is web content. |
| [13](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | ICT Providing Relay or Emergency Service Access | N/A | Not a relay or emergency service. |
