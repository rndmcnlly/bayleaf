# VPAT and bayleaf.dev Landing

**Service:** BayLeaf bayleaf.dev landing ([`bayleaf.dev`](https://bayleaf.dev)), a surface of the BayLeaf AI Playground  
**Operator:** Adam Smith, Associate Professor, Dept. of Computational Media, UC Santa Cruz  
**Status:** Working draft. Partially evaluated via source inspection; a handful of criteria want a live browser pass. One known defect (insufficient text contrast on the `#888` Source/Status buttons) is recorded in [§ 4](#4-wcag-21-level-aa-conformance).  
**Template:** [VPAT® 2.5 INT](https://www.itic.org/policy/accessibility/vpat), covering [WCAG 2.1](https://www.w3.org/TR/WCAG21/) Level A and AA, [Revised Section 508](https://www.access-board.gov/ict/), and [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/).

> This is a per-surface ACR. Framing, inheritance map, evaluation methodology, open questions, and references live in [VPAT-overview.md](VPAT-overview.md). Read that document first for the posture; read this one for surface-specific findings and the conformance table.

---

## 1. Surface description

**UI origin.** Single static HTML file at
[`docs/index.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/index.html)
(304 lines, ~15KB), served via [GitHub Pages](https://pages.github.com/)
with custom domain per [`docs/CNAME`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/CNAME).
Inline CSS, no JavaScript, no build step.

**Why this is the pilot surface.** The smallest surface, entirely
self-contained in one file, no framework or library involved. Source
inspection can meaningfully cover most WCAG 2.1 AA criteria; the
handful that require a rendered browser (actual color rendering,
zoom/reflow behavior, focus visibility in practice) are cheap live
follow-ups.

**Structure observed in source.** Valid HTML5; `<html lang="en">`;
single `<h1>`; eight `<h2>` section headings; three `<h3>`
subsections under the API Service h2; a flat row of links styled as
buttons (the top navigation); multiple prose sections with `<ul>`
lists; a `<details>/<summary>` collapsible subprocessor list; a final
contact block in a `<div class="contact">`. Inline styles for
typography, colors, and layout; no external stylesheets, no
JavaScript.

**Structural observations that inform [the conformance tables below](#3-wcag-21-level-a-conformance).**

- [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships):
  headings are in order (h1 → h2; one h3 under h2); lists use `<ul>`
  not presentational `<div>`s; the subprocessor disclosure uses native
  `<details>/<summary>` which is keyboard-accessible and
  screen-reader-friendly.
- [2.4.4 Link Purpose (In Context)](https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context):
  link text is descriptive (e.g., "UCSC's Newly Established AI
  Council Is at a Crossroads" rather than "click here").
- [3.1.1 Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page):
  `lang="en"` is set on `<html>`.
- [1.4.3 Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum):
  the inline CSS uses `#333` on white (ratio ≈ 12.6:1, passes AA),
  `#2a5298` on white (≈ 6.4:1, passes AA normal), white on `#2a5298`
  (same 6.4:1, passes AA), white on `#2d8659` (~4.5:1, borderline;
  wants verification with the
  [WebAIM contrast checker](https://webaim.org/resources/contrastchecker/)),
  white on `#888` (~3.5:1, **fails 1.4.3 AA for normal text**, passes
  only for large text), white on `#555` (~7.5:1, passes AA),
  `#666` on white (the `.tagline`, ~5.7:1, passes AA normal). The
  `#888` buttons ("Source", "Status") are candidates to darken in a
  future edit.
- [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value):
  navigation links are `<a>` elements styled as buttons via
  `.service-link`; role remains "link" which is accurate for
  navigation.

**Things source inspection cannot verify and that want a browser
pass.**

- Actual rendered contrast (browsers may apply font-smoothing that
  shifts perceived contrast).
- Focus visibility on the link-styled buttons (the current CSS does
  not include a `:focus` style; browsers provide a default outline,
  which typically satisfies
  [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible)
  but should be confirmed).
- Zoom/reflow behavior at 400%
  ([1.4.10 Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow)).
- Screen reader traversal of the `<details>/<summary>` element in
  NVDA, JAWS, and VoiceOver.

**Links for the future evaluation pass.**

- Live page: [bayleaf.dev](https://bayleaf.dev).
- Source: [docs/index.html](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/index.html).
- Contrast check tool:
  [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

---

## 2. Out-of-scope neighbors and platform ACRs

BayLeaf's UIs link outbound to a number of GitHub-hosted
destinations: source browsing at
[github.com/bayleaf-ucsc/bayleaf](https://github.com/bayleaf-ucsc/bayleaf),
the vulnerability-reporting policy at
[SECURITY.md](https://github.com/bayleaf-ucsc/bayleaf/blob/main/SECURITY.md),
issue reporting, and the politics/ directory containing HECVAT, FERPA,
and this document.

Those destinations are GitHub product surfaces (repository views, file
rendering, issue forms) whose accessibility is GitHub's responsibility.
GitHub publishes current ACRs at
[accessibility.github.com](https://accessibility.github.com/) covering
github.com and related products. This VPAT notes those ACRs as a
**courtesy disclosure**: a reader following a BayLeaf outbound link
into a GitHub-rendered page is landing on a surface covered by
GitHub's own conformance report, not by BayLeaf's.

This is not a claim that GitHub's ACRs cover BayLeaf-authored content
hosted on GitHub Pages. BayLeaf's [`docs/index.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/index.html)
is BayLeaf's responsibility regardless of the hosting platform
(see [§ 1](#1-surface-description)). Likewise, the
rendered view of [`docs/support.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/support.html)
and future pages in `docs/` is BayLeaf-authored content that will be
brought into scope for direct evaluation when capacity allows.

**Practical implication for the ACR table in [the conformance tables below](#3-wcag-21-level-a-conformance):**
outbound GitHub links need no special annotation; they are out of
scope by virtue of not being BayLeaf surfaces. A reviewer concerned
about the accessibility of the destination should consult
[GitHub's ACRs](https://accessibility.github.com/) directly.

---

---

## 3. WCAG 2.1 Level A conformance

The full Level A criterion set is defined by the [W3C WCAG 2.1 Recommendation](https://www.w3.org/TR/WCAG21/#conformance-reqs). Each row below links to the *Understanding* document for the criterion.

Remarks have been trimmed to the bayleaf.dev landing surface. Sentences in the pre-split draft that addressed sibling surfaces (Chat or the API) have been removed; where no sentence in the original applied to the landing, the remark reads "Not yet evaluated for this surface" with pointers to the sibling ACRs.

| # | Criterion | Landing | Remarks |
|---|---|---|---|
| 1.1.1 | [Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content) | Supports | Landing: no non-text content that conveys meaning; all images are absent (text-only page). |
| 1.2.1 | [Audio-only and Video-only (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-only-and-video-only-prerecorded) | N/A | No prerecorded media on any BayLeaf surface. |
| 1.2.2 | [Captions (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded) | N/A | No prerecorded media. |
| 1.2.3 | [Audio Description or Media Alternative (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-description-or-media-alternative-prerecorded) | N/A | No prerecorded media. |
| 1.3.1 | [Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships) | Supports | Landing: headings in hierarchical order (h1 → h2 → h3), lists marked up as `<ul>`, subprocessor disclosure uses native `<details>/<summary>`. |
| 1.3.2 | [Meaningful Sequence](https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence) | Supports | Landing: DOM order matches visual order; no CSS-driven reordering. |
| 1.3.3 | [Sensory Characteristics](https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics) | Supports | Landing: no instructions rely on shape, size, or location. |
| 1.4.1 | [Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color) | Supports | Landing: color is not the sole means of conveying information; link text is descriptive independent of color. |
| 1.4.2 | [Audio Control](https://www.w3.org/WAI/WCAG21/Understanding/audio-control) | N/A | No auto-playing audio. |
| 2.1.1 | [Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard) | Supports | Landing: all interactive elements are native `<a>` and `<details>`, keyboard-operable by default. |
| 2.1.2 | [No Keyboard Trap](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap) | Supports | Landing: no modal, no custom focus traps. |
| 2.1.4 | [Character Key Shortcuts](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts) | N/A | Not applicable to this surface. |
| 2.2.1 | [Timing Adjustable](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable) | N/A | Not applicable to this surface. |
| 2.2.2 | [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide) | N/A | Not applicable to this surface. |
| 2.3.1 | [Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold) | Supports | No flashing content on any BayLeaf-authored surface. |
| 2.4.1 | [Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks) | Partially Supports | Landing: no skip-link, but the page is short and has only one navigation block; adding a skip-link is a minor future improvement. A single `<main>` landmark would also help. |
| 2.4.2 | [Page Titled](https://www.w3.org/WAI/WCAG21/Understanding/page-titled) | Supports | Landing: `<title>BayLeaf AI Playground</title>`. API templates need source check for `<title>`. |
| 2.4.3 | [Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order) | Supports | Landing: DOM order is reading order; no `tabindex` manipulation. |
| 2.4.4 | [Link Purpose (In Context)](https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context) | Supports | Landing: link text is descriptive (e.g., "UCSC's Newly Established AI Council Is at a Crossroads", "OpenRouter's model directory"); no "click here". |
| 2.5.1 | [Pointer Gestures](https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures) | Supports | Landing: no multi-point or path-based gestures. |
| 2.5.2 | [Pointer Cancellation](https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation) | Supports | Landing: uses default `<a>` activation behavior. |
| 2.5.3 | [Label in Name](https://www.w3.org/WAI/WCAG21/Understanding/label-in-name) | Supports | Landing: no aria-label overrides; visible text matches accessible name. |
| 2.5.4 | [Motion Actuation](https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation) | N/A | No motion-based functionality. |
| 3.1.1 | [Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page) | Supports | Landing: `<html lang="en">` present. |
| 3.2.1 | [On Focus](https://www.w3.org/WAI/WCAG21/Understanding/on-focus) | Supports | Landing: no focus-triggered context changes. |
| 3.2.2 | [On Input](https://www.w3.org/WAI/WCAG21/Understanding/on-input) | Supports | Landing: no form inputs. |
| 3.3.1 | [Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification) | N/A | Not applicable to this surface. |
| 3.3.2 | [Labels or Instructions](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions) | N/A | Not applicable to this surface. |
| 4.1.1 | [Parsing](https://www.w3.org/WAI/WCAG21/Understanding/parsing) | Supports | Landing: validates as HTML5 (per source inspection); no duplicate `id` attributes. Note: [WCAG 2.2 removed this criterion](https://www.w3.org/TR/WCAG22/#parsing) as obsolete, but VPAT 2.5 retains it under WCAG 2.1. |
| 4.1.2 | [Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value) | Supports | Landing: uses native elements (`<a>`, `<details>`, `<summary>`) with correct roles; no custom ARIA. |

---

## 4. WCAG 2.1 Level AA conformance

Level AA is the target set for [ADA Title II](https://www.ada.gov/resources/2024-03-08-web-rule/), [Section 508](https://www.access-board.gov/ict/), [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/), and [UC IMG-2150](https://policy.ucop.edu/doc/7000611/IMT-2150). Level AA subsumes Level A; this table covers the criteria added at AA.

| # | Criterion | Landing | Remarks |
|---|---|---|---|
| 1.2.4 | [Captions (Live)](https://www.w3.org/WAI/WCAG21/Understanding/captions-live) | N/A | No live media. |
| 1.2.5 | [Audio Description (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-description-prerecorded) | N/A | No prerecorded video. |
| 1.3.4 | [Orientation](https://www.w3.org/WAI/WCAG21/Understanding/orientation) | Supports | Landing: responsive, no orientation lock. |
| 1.3.5 | [Identify Input Purpose](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose) | N/A | Not applicable to this surface. |
| 1.4.3 | [Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) | **Partially Supports** | Landing: most color pairs pass AA (see [§ 1](#1-surface-description) for detail); the `#888` "Source" and "Status" buttons (white-on-`#888` ≈ 3.5:1) fail AA for normal text. **Known defect.** Candidate fix: darken to `#666` or below. |
| 1.4.4 | [Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text) | Supports | Landing: uses `rem` and relative units; zooms cleanly to 200% in browsers. |
| 1.4.5 | [Images of Text](https://www.w3.org/WAI/WCAG21/Understanding/images-of-text) | N/A | No images of text on BayLeaf-authored surfaces. See [VPAT-chat.md § AI-generated output](VPAT-chat.md#ai-generated-output-as-an-accessibility-surface) for AI-generated output. |
| 1.4.10 | [Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow) | N/E | Landing: `max-width: 800px` with relative padding should reflow cleanly at 400% zoom / 320 CSS px; wants browser verification. |
| 1.4.11 | [Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast) | Partially Supports | Landing: the `#888` button background on white (~3.5:1) meets the 3:1 UI component threshold here (non-text contrast is a lower bar than text contrast), but the white text on those buttons is the [1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) failure above. |
| 1.4.12 | [Text Spacing](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing) | Supports | Landing: no fixed `height` on text containers; content would adapt to user-overridden spacing. |
| 1.4.13 | [Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus) | N/A | Landing: no hover tooltips or popovers. |
| 2.4.5 | [Multiple Ways](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways) | N/A | Single-page surfaces (landing); no "set of pages" to offer multiple navigation to. |
| 2.4.6 | [Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels) | Supports | Landing: headings describe their sections clearly. |
| 2.4.7 | [Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible) | N/E | Landing: no explicit `:focus` styles in CSS; relies on browser default focus ring. Defaults typically satisfy 2.4.7, but adding an explicit style on `.service-link:focus` is a cheap improvement. Needs live browser check. |
| 3.1.2 | [Language of Parts](https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts) | N/A | No foreign-language passages on BayLeaf-authored surfaces. |
| 3.2.3 | [Consistent Navigation](https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation) | N/A | Single-page surfaces. |
| 3.2.4 | [Consistent Identification](https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification) | Supports | Landing: recurring elements (the subprocessor list, the contact block) are identified consistently. |
| 3.3.3 | [Error Suggestion](https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion) | N/A | No forms on Landing. |
| 3.3.4 | [Error Prevention (Legal, Financial, Data)](https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data) | N/A | Not applicable to this surface. |
| 4.1.3 | [Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages) | N/A | No dynamic status on Landing. |

**Level AAA criteria** are not included in this table. VPAT 2.5 treats Level AAA as optional; conformance claims at AA do not include AAA. BayLeaf has not targeted AAA and does not claim it.

---

## 5. Revised Section 508: Chapters 3, 4, 5, 6

[Revised Section 508](https://www.access-board.gov/ict/) incorporates
WCAG 2.0 Level A and AA by reference for web content (Chapter 5:
Software, and Chapter 6: Support Documentation). The chapters below
cover the 508-specific requirements that extend beyond WCAG.

**Chapter 3: Functional Performance Criteria (FPC).** FPC apply when
[§ E205.2](https://www.access-board.gov/ict/#E205.2) (web/software
conformance requirements) cannot be fully met, or as an alternative
path. For a web-only service, WCAG 2.0 AA conformance generally
discharges the FPC obligation. BayLeaf claims conformance via the
WCAG path; see [§ 4](#4-wcag-21-level-aa-conformance).

| § | Criterion | Applies? | Remarks |
|---|---|---|---|
| [302.1](https://www.access-board.gov/ict/#302.1) | Without Vision | Via WCAG | Chat relies on upstream Open WebUI; others per [§ 4](#4-wcag-21-level-aa-conformance). |
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

## 6. EN 301 549: chapters not covered above

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
| [9](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Web | Via WCAG | Web content covered by [§§ 3](#3-wcag-21-level-a-conformance)–[4](#4-wcag-21-level-aa-conformance). |
| [10](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Non-Web Documents | N/A | BayLeaf does not distribute non-web documents (no PDFs, no Word files) as primary content. |
| [11](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Software | Via WCAG 4.1.2 | The API dashboard is "software" in the EN sense; covered by WCAG. |
| [12](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | Documentation and Support Services | Supports | Parallels 508 Chapter 6; BayLeaf documentation is web content. |
| [13](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/03.02.01_60/en_301549v030201p.pdf) | ICT Providing Relay or Emergency Service Access | N/A | Not a relay or emergency service. |
