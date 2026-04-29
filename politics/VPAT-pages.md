# VPAT and bayleaf.dev Pages

**Service:** BayLeaf bayleaf.dev static pages: the landing at
[`bayleaf.dev`](https://bayleaf.dev) and the support page at
[`bayleaf.dev/support.html`](https://bayleaf.dev/support.html). Both
are surfaces of the BayLeaf AI Playground.  
**Operator:** Adam Smith, Associate Professor, Dept. of Computational Media, UC Santa Cruz  
**Status:** Working draft, upgraded to empirical verification for contrast, reflow, focus visibility, text zoom, text spacing, HTML parsing, accessibility-tree structure, and color-vision-deficiency simulation, using headless Chromium via [`rodney`](https://github.com/simonw/rodney) and direct [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/). All previously flagged defects have been fixed and re-verified: [1.4.3 Contrast](#4-wcag-21-level-aa-conformance) now passes AA on every rendered text/background pair with comfortable headroom, [2.4.7 Focus Visible](#4-wcag-21-level-aa-conformance) now has an explicit high-contrast indicator, and [2.4.1 Bypass Blocks](#3-wcag-21-level-a-conformance) now provides a `<main>` landmark.  
**Template:** [VPAT® 2.5 INT](https://www.itic.org/policy/accessibility/vpat), covering [WCAG 2.1](https://www.w3.org/TR/WCAG21/) Level A and AA, [Revised Section 508](https://www.access-board.gov/ict/), and [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/).

> This is a per-surface ACR. Framing, inheritance map, evaluation methodology, open questions, and references live in [VPAT-overview.md](VPAT-overview.md). Read that document first for the posture; read this one for surface-specific findings and the conformance table.

---

## 1. Surface description

**UI origin.** Two static HTML files sharing one external stylesheet,
all served via [GitHub Pages](https://pages.github.com/) with custom
domain per [`docs/CNAME`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/CNAME):

- [`docs/index.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/index.html):
  the landing at [bayleaf.dev](https://bayleaf.dev).
- [`docs/support.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/support.html):
  the support page at
  [bayleaf.dev/support.html](https://bayleaf.dev/support.html),
  linked from the landing's "Support" button.
- [`docs/style.css`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/style.css):
  shared stylesheet covering layout, typography, the button-styled
  link system (`.service-link` with `.primary-action` modifier), and
  the `:focus-visible` indicator. No JavaScript, no build step.

**Why this scope.** Both pages are small, hand-written HTML with no
framework, no runtime DOM manipulation, and no user input. They share
all styling, so a single empirical verification pass covers both.
Source inspection can meaningfully cover most WCAG 2.1 AA criteria;
criteria that require a rendered browser (actual color rendering,
zoom/reflow behavior, focus visibility in practice, text-spacing
override tolerance) have been verified empirically against the served
pages using headless Chromium.

### Evaluation methodology

All empirical claims in this ACR are reproducible. The verification
pass ran against the local working tree served from
`python3 -m http.server 8765 --directory docs`, under headless
Chromium (via [`uvx rodney`](https://github.com/simonw/rodney)
v0.4.0, Chromium 147) with viewport emulation controlled through
direct CDP calls to
[`Emulation.setDeviceMetricsOverride`](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setDeviceMetricsOverride).
Date of evaluation: 2026-04-29.

- **Contrast ratios** computed from the DOM's effective foreground
  and background colors (walking up the DOM to find the first
  non-transparent ancestor background), using the WCAG 2.1
  [relative-luminance formula](https://www.w3.org/TR/WCAG21/#dfn-relative-luminance).
- **Reflow** tested at 320, 400, and 1280 CSS px viewport widths via
  `setDeviceMetricsOverride`; overflow detected by comparing
  `document.documentElement.scrollWidth` to `window.innerWidth` and
  by enumerating elements whose bounding-box right edge exceeded the
  viewport width.
- **Text zoom** simulated at 200% via `document.documentElement.style.fontSize = "200%"`;
  overflow and clipping re-measured.
- **Text spacing** tested by injecting a `<style>` element setting
  the WCAG 1.4.12 user-override thresholds (line-height 1.5,
  letter-spacing 0.12em, word-spacing 0.16em, paragraph margin 2em)
  as `!important` rules; overflow re-measured.
- **Focus visibility** captured by programmatically focusing each
  interactive element (`.focus()`) and inspecting computed
  `outline*` and `boxShadow` styles, plus screenshot inspection via
  a vision-capable subagent for perceptual confirmation.
- **Accessibility tree** dumped via rodney's `ax-tree` command
  (which proxies Chromium's
  [`Accessibility.getFullAXTree`](https://chromedevtools.github.io/devtools-protocol/tot/Accessibility/#method-getFullAXTree)).
- **HTML validity** checked via the
  [W3C Nu HTML Checker](https://validator.w3.org/nu/) public API
  (`POST https://validator.w3.org/nu/?out=json`).
- **Color-vision-deficiency simulation** applied by injecting SVG
  `feColorMatrix` filters with
  [Machado, Oliveira, and Fernandes (2009)](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html)
  severity-1.0 matrices for protanopia, deuteranopia, tritanopia,
  and achromatopsia; screenshots evaluated by a vision-capable
  subagent for information-loss judgment.

### Structure observed

Both pages use valid HTML5 with `<html lang="en">`. Each has a
single `<h1>`, `<h2>` section headings in order, `<ul>` lists,
primary content wrapped in `<main id="main">`, and a
`<footer class="contact">` for the post-content link block. The
landing additionally uses a single `<details>/<summary>` collapsible
subprocessor list and three `<h3>` subsections under "API Service".
Support page adds a `.note` callout block (styled `<div>`, not a
landmark). Neither page contains forms, images, media, or
JavaScript.

### Structural observations that inform [the conformance tables below](#3-wcag-21-level-a-conformance)

- [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships):
  headings are in hierarchical order (h1 → h2 → h3, no skipped
  levels); lists use `<ul>` not presentational `<div>`s; the
  subprocessor disclosure uses native `<details>/<summary>` which is
  keyboard-accessible and screen-reader-friendly.
- [1.4.1 Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color):
  color is never the sole means of conveying information. Buttons
  carry visible text labels ("BayLeaf Chat", "Source", etc.); the
  blue/green/dark-gray distinction is redundant with the labels.
  Empirically verified under
  [Machado et al. 2009](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html)
  simulations for protanopia, deuteranopia, tritanopia, and
  achromatopsia: all buttons remain distinguishable by label and by
  luminance in grayscale; no information is lost.
- [2.4.1 Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks):
  primary content is wrapped in `<main id="main">` and the contact
  block is marked as `<footer>`, providing navigable landmarks.
  Chromium's accessibility tree exposes the `[main]` role at the
  root level directly below `[RootWebArea]` on both pages.
- [2.4.4 Link Purpose (In Context)](https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context):
  link text is descriptive (e.g., "UCSC's Newly Established AI
  Council Is at a Crossroads", "OpenRouter's model directory"); no
  "click here".
- [3.1.1 Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page):
  `lang="en"` is set on `<html>` on both pages.
- [1.4.3 Contrast Minimum](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum):
  all rendered text/background pairs have been measured empirically
  against WCAG relative-luminance formulas. Results: `#333` on white
  (12.63:1), `#2a5298` on white (7.61:1), white on `#2a5298`
  (7.61:1), white on `#1e5a3a` (8.14:1), white on `#555` (7.46:1),
  `#666` on white (5.74:1), `#444` on `#f8f9fa` (the support-page
  `.note` callout, 9.24:1), `#2a5298` on `#f8f9fa` (link inside
  `.note`, 7.22:1). All pass AA with comfortable headroom (lowest
  ratio 5.74:1, above the 4.5:1 AA threshold).
- [1.4.4 Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text):
  simulated at 200% root font size; document scroll width remained
  within the viewport and no element clipped its content.
- [1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing):
  injected the WCAG user-override thresholds as `!important` rules;
  layout adapted without horizontal overflow or element clipping.
- [2.4.7 Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible):
  the `.service-link` buttons have an explicit
  `:focus-visible { outline: 3px solid #fff; outline-offset: 2px;
  box-shadow: 0 0 0 5px #2a5298; }` rule that renders a white inner
  ring with a blue outer ring, visible against every button
  background (blue, green, dark gray). Inline prose links use
  Chromium's default focus ring (blue, `rgb(0, 95, 204)`), which is
  clearly visible against white. Note: the platform-default ring on
  colored buttons is barely perceptible; the explicit rule is
  necessary for 2.4.7 conformance, not optional.
- [4.1.1 Parsing](https://www.w3.org/WAI/WCAG21/Understanding/parsing):
  both pages validate with zero messages from the
  [W3C Nu HTML Checker](https://validator.w3.org/nu/). DOM-level
  ID-uniqueness check finds no duplicate IDs (each page has exactly
  one: `#main`).
- [4.1.2 Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value):
  uses native elements (`<a>`, `<details>`, `<summary>`, `<main>`,
  `<footer>`) with correct default roles; no custom ARIA.

### Things source inspection cannot cover (deferred)

- Screen reader traversal of `<details>/<summary>` and the
  `<main>`/`<footer>` landmarks in NVDA, JAWS, and VoiceOver.
  Chromium's accessibility tree is a reasonable proxy for structural
  exposure but not definitive for AT-specific traversal behavior,
  verbosity, or reading-order nuances.
- Keyboard-only operator pass: confirming every interactive element
  receives focus in DOM order under real keyboard input (not
  programmatic `.focus()`), and that the focus path has no
  dead-ends. Partially testable via CDP-dispatched `Tab` events, but
  a human pass is canonical.
- Browser-level font smoothing variation in perceived contrast
  across operating systems (macOS subpixel AA vs. Windows ClearType
  vs. Linux).

### Links for the future evaluation pass

- Live pages:
  [bayleaf.dev](https://bayleaf.dev),
  [bayleaf.dev/support.html](https://bayleaf.dev/support.html).
- Source:
  [docs/index.html](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/index.html),
  [docs/support.html](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/support.html),
  [docs/style.css](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/style.css).
- Remaining open items: screen reader traversal of
  `<details>/<summary>` and landmarks in NVDA, JAWS, VoiceOver;
  human keyboard-only pass.

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
hosted on GitHub Pages. BayLeaf's
[`docs/index.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/index.html)
and
[`docs/support.html`](https://github.com/bayleaf-ucsc/bayleaf/blob/main/docs/support.html)
are BayLeaf's responsibility regardless of the hosting platform
(see [§ 1](#1-surface-description)). Both are now in scope for this
ACR. Any future pages added to `docs/` will be brought into scope at
the time they ship.

**Practical implication for the ACR table in [the conformance tables below](#3-wcag-21-level-a-conformance):**
outbound GitHub links need no special annotation; they are out of
scope by virtue of not being BayLeaf surfaces. A reviewer concerned
about the accessibility of the destination should consult
[GitHub's ACRs](https://accessibility.github.com/) directly.

---

---

## 3. WCAG 2.1 Level A conformance

The full Level A criterion set is defined by the [W3C WCAG 2.1 Recommendation](https://www.w3.org/TR/WCAG21/#conformance-reqs). Each row below links to the *Understanding* document for the criterion.

Remarks have been trimmed to the bayleaf.dev static-pages surface. Sentences in the pre-split draft that addressed sibling surfaces (Chat or the API) have been removed; where no sentence in the original applied to the pages, the remark reads "Not yet evaluated for this surface" with pointers to the sibling ACRs. Remarks use `Pages:` as the surface prefix, covering both the landing and the support page unless otherwise noted.

| # | Criterion | Landing | Remarks |
|---|---|---|---|
| 1.1.1 | [Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content) | Supports | Pages: no non-text content that conveys meaning on either page; all images are absent (text-only pages). |
| 1.2.1 | [Audio-only and Video-only (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-only-and-video-only-prerecorded) | N/A | No prerecorded media on any BayLeaf surface. |
| 1.2.2 | [Captions (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded) | N/A | No prerecorded media. |
| 1.2.3 | [Audio Description or Media Alternative (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-description-or-media-alternative-prerecorded) | N/A | No prerecorded media. |
| 1.3.1 | [Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships) | Supports | Pages: headings in hierarchical order (h1 → h2 → h3, no skipped levels), lists marked up as `<ul>`; the landing's subprocessor disclosure uses native `<details>/<summary>`; both pages wrap primary content in `<main>` and the post-content link block in `<footer>`. |
| 1.3.2 | [Meaningful Sequence](https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence) | Supports | Pages: DOM order matches visual order; no CSS-driven reordering. |
| 1.3.3 | [Sensory Characteristics](https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics) | Supports | Pages: no instructions rely on shape, size, or location. |
| 1.4.1 | [Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color) | Supports | Pages: color is not the sole means of conveying information; link text is descriptive independent of color. Empirically verified under [Machado et al. 2009](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html) simulations for protanopia, deuteranopia, tritanopia, and achromatopsia (see [§ 1](#1-surface-description)): no information is lost under any CVD. |
| 1.4.2 | [Audio Control](https://www.w3.org/WAI/WCAG21/Understanding/audio-control) | N/A | No auto-playing audio. |
| 2.1.1 | [Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard) | Supports | Pages: all interactive elements are native `<a>` and (on the landing) `<details>`, keyboard-operable by default. |
| 2.1.2 | [No Keyboard Trap](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap) | Supports | Pages: no modal, no custom focus traps. |
| 2.1.4 | [Character Key Shortcuts](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts) | N/A | Not applicable to this surface. |
| 2.2.1 | [Timing Adjustable](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable) | N/A | Not applicable to this surface. |
| 2.2.2 | [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide) | N/A | Not applicable to this surface. |
| 2.3.1 | [Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold) | Supports | No flashing content on any BayLeaf-authored surface. |
| 2.4.1 | [Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks) | Supports | Pages: both pages wrap primary content in `<main id="main">` and the contact block in `<footer>`, providing navigable landmarks. Verified in Chromium's accessibility tree (`[main]` role exposed at root level on each page). |
| 2.4.2 | [Page Titled](https://www.w3.org/WAI/WCAG21/Understanding/page-titled) | Supports | Pages: landing is titled `<title>BayLeaf AI Playground</title>`; support page is titled `<title>Support: BayLeaf AI Playground</title>`. Both titles are descriptive and distinct. |
| 2.4.3 | [Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order) | Supports | Pages: DOM order is reading order; no `tabindex` manipulation. |
| 2.4.4 | [Link Purpose (In Context)](https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context) | Supports | Pages: link text is descriptive on both pages (e.g., "UCSC's Newly Established AI Council Is at a Crossroads", "OpenRouter's model directory", "API Issue", "amsmith@ucsc.edu"); no "click here". |
| 2.5.1 | [Pointer Gestures](https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures) | Supports | Pages: no multi-point or path-based gestures. |
| 2.5.2 | [Pointer Cancellation](https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation) | Supports | Pages: uses default `<a>` activation behavior. |
| 2.5.3 | [Label in Name](https://www.w3.org/WAI/WCAG21/Understanding/label-in-name) | Supports | Pages: no aria-label overrides; visible text matches accessible name. |
| 2.5.4 | [Motion Actuation](https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation) | N/A | No motion-based functionality. |
| 3.1.1 | [Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page) | Supports | Pages: `<html lang="en">` present. |
| 3.2.1 | [On Focus](https://www.w3.org/WAI/WCAG21/Understanding/on-focus) | Supports | Pages: no focus-triggered context changes. |
| 3.2.2 | [On Input](https://www.w3.org/WAI/WCAG21/Understanding/on-input) | Supports | Pages: no form inputs. |
| 3.3.1 | [Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification) | N/A | Not applicable to this surface. |
| 3.3.2 | [Labels or Instructions](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions) | N/A | Not applicable to this surface. |
| 4.1.1 | [Parsing](https://www.w3.org/WAI/WCAG21/Understanding/parsing) | Supports | Pages: both pages validate with zero messages from the [W3C Nu HTML Checker](https://validator.w3.org/nu/). ID-uniqueness verified via DOM enumeration (each page has exactly one element with an `id` attribute: the `<main id="main">` landmark). Note: [WCAG 2.2 removed this criterion](https://www.w3.org/TR/WCAG22/#parsing) as obsolete, but VPAT 2.5 retains it under WCAG 2.1. |
| 4.1.2 | [Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value) | Supports | Pages: uses native elements (`<a>`, `<main>`, `<footer>`, plus `<details>/<summary>` on the landing) with correct default roles; no custom ARIA. Verified via Chromium's accessibility tree. |

---

## 4. WCAG 2.1 Level AA conformance

Level AA is the target set for [ADA Title II](https://www.ada.gov/resources/2024-03-08-web-rule/), [Section 508](https://www.access-board.gov/ict/), [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/), and [UC IMG-2150](https://policy.ucop.edu/doc/7000611/IMT-2150). Level AA subsumes Level A; this table covers the criteria added at AA.

| # | Criterion | Landing | Remarks |
|---|---|---|---|
| 1.2.4 | [Captions (Live)](https://www.w3.org/WAI/WCAG21/Understanding/captions-live) | N/A | No live media. |
| 1.2.5 | [Audio Description (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-description-prerecorded) | N/A | No prerecorded video. |
| 1.3.4 | [Orientation](https://www.w3.org/WAI/WCAG21/Understanding/orientation) | Supports | Pages: responsive, no orientation lock. |
| 1.3.5 | [Identify Input Purpose](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose) | N/A | Not applicable to this surface. |
| 1.4.3 | [Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) | Supports | Pages: every rendered text/background pair passes AA with comfortable headroom on both pages, verified empirically against WCAG relative-luminance formulas (see [§ 1](#1-surface-description) for per-pair ratios). The lowest ratio on either page is the `.tagline` text (`#666` on white) at 5.74:1, well above the 4.5:1 AA threshold. |
| 1.4.4 | [Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text) | Supports | Pages: verified empirically by setting `document.documentElement.style.fontSize = "200%"` in headless Chromium; no horizontal overflow, no element clipping, layout reflows cleanly. The shared stylesheet uses `rem` and unitless relative sizes throughout. |
| 1.4.5 | [Images of Text](https://www.w3.org/WAI/WCAG21/Understanding/images-of-text) | N/A | No images of text on BayLeaf-authored surfaces. See [VPAT-chat.md § AI-generated output](VPAT-chat.md#ai-generated-output-as-an-accessibility-surface) for AI-generated output. |
| 1.4.10 | [Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow) | Supports | Pages: verified empirically in headless Chromium via CDP `Emulation.setDeviceMetricsOverride`. At 320 CSS px viewport width (the WCAG threshold, equivalent to 400% zoom of a 1280 px window), both pages have document scroll width ≤ 305 px with zero horizontally overflowing elements. The landing's five-button nav row wraps to four rows. Also verified at 400 px and 1280 px. |
| 1.4.11 | [Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast) | Supports | Pages: the button-styled links pass the 3:1 UI-component threshold on both pages (lowest button background ratio is `#555` at 7.46:1 on the landing). The support page's `.note` callout has a 3 px `#2a5298` left border against the `#f8f9fa` callout background (7.22:1). No other non-text UI components convey information. |
| 1.4.12 | [Text Spacing](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing) | Supports | Pages: verified empirically by injecting a `<style>` element with the WCAG 1.4.12 user-override thresholds (`line-height: 1.5`, `letter-spacing: 0.12em`, `word-spacing: 0.16em`, paragraph margin 2em) as `!important` rules; no horizontal overflow and no element clipping resulted. The shared stylesheet has no fixed `height` on text containers. |
| 1.4.13 | [Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus) | N/A | Pages: no hover tooltips or popovers. |
| 2.4.5 | [Multiple Ways](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways) | N/A | Single-page surfaces (landing); no "set of pages" to offer multiple navigation to. |
| 2.4.6 | [Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels) | Supports | Pages: headings describe their sections clearly. |
| 2.4.7 | [Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible) | Supports | Pages: `.service-link:focus-visible` in the shared stylesheet renders a 3 px white outline at 2 px offset plus a 5 px blue box-shadow, producing a double-ring indicator visible against every button background (blue, green, dark gray). Verified by screenshot on both pages. Inline prose links use Chromium's default focus ring against white. The platform-default ring alone is barely perceptible on colored buttons, so the explicit rule is necessary, not cosmetic. |
| 3.1.2 | [Language of Parts](https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts) | N/A | No foreign-language passages on BayLeaf-authored surfaces. |
| 3.2.3 | [Consistent Navigation](https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation) | N/A | Single-page surfaces. |
| 3.2.4 | [Consistent Identification](https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification) | Supports | Pages: recurring elements (the service-link button system, the `.contact` footer link block) are identified consistently across both pages via the shared stylesheet. |
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
