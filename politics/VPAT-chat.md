# VPAT and BayLeaf Chat

**Service:** BayLeaf Chat ([`chat.bayleaf.dev`](https://chat.bayleaf.dev)), a surface of the BayLeaf AI Playground  
**Operator:** Adam Smith, Associate Professor, Dept. of Computational Media, UC Santa Cruz  
**Status:** Working draft. Not a signed ACR. Most WCAG criteria are Not Evaluated, pending (in part) a published ACR from upstream Open WebUI (see [§ 1](#1-surface-description)).  
**Template:** [VPAT® 2.5 INT](https://www.itic.org/policy/accessibility/vpat), covering [WCAG 2.1](https://www.w3.org/TR/WCAG21/) Level A and AA, [Revised Section 508](https://www.access-board.gov/ict/), and [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/).

> This is a per-surface ACR. Framing, inheritance map, evaluation methodology, open questions, and references live in [VPAT-overview.md](VPAT-overview.md). Read that document first for the posture; read this one for surface-specific findings and the conformance table.

---

## 1. Surface description

**UI origin.** [Open WebUI](https://openwebui.com/) is an
open-source chat frontend developed at
[github.com/open-webui/open-webui](https://github.com/open-webui/open-webui).
BayLeaf Chat is an Open WebUI deployment on DigitalOcean App Platform,
configured as documented in [../chat/DESIGN.md](../chat/DESIGN.md).

**What BayLeaf controls.** Everything that is not the upstream UI
itself:

- Model selection and system prompts for curated workspace models
  (see [../chat/models/](https://github.com/bayleaf-ucsc/bayleaf/tree/main/chat/models)).
  System prompts can nudge model output toward more accessible
  formatting (e.g., asking for alt text on generated images, preferring
  lists and headings over dense paragraphs); see [§ 2](#2-ai-generated-output-as-an-accessibility-surface).
- Tool/function definitions
  ([chat/tools/](https://github.com/bayleaf-ucsc/bayleaf/tree/main/chat/tools)).
- Theme, logo, and copy customizations applied via Open WebUI's
  [admin settings](https://docs.openwebui.com/features/).
- Choice of Open WebUI version (pinned in deployment config).

**What BayLeaf does not control.** The HTML, CSS, ARIA attributes,
focus management, keyboard handlers, and screen-reader semantics of
the Open WebUI UI itself. Changes to any of those require upstream
contribution or a fork.

**The open question: does Open WebUI publish an ACR?**
*As of this writing, the operator has not located a published ACR or
accessibility statement from the Open WebUI project.* Relevant places
to check and cite when the question is re-opened:

- Open WebUI [documentation site](https://docs.openwebui.com/):
  search for "accessibility", "a11y", "VPAT", "WCAG".
- Open WebUI [repository README](https://github.com/open-webui/open-webui/blob/main/README.md)
  and [SECURITY.md](https://github.com/open-webui/open-webui/blob/main/SECURITY.md).
- Issues labeled accessibility:
  [`is:issue label:accessibility`](https://github.com/open-webui/open-webui/issues?q=is%3Aissue+label%3Aaccessibility)
  or full-text search for
  [`a11y`](https://github.com/open-webui/open-webui/issues?q=a11y)
  and [`accessibility`](https://github.com/open-webui/open-webui/issues?q=accessibility).
- Pull requests touching ARIA:
  [`aria-`](https://github.com/open-webui/open-webui/pulls?q=aria-).
- The project's [Discord](https://discord.gg/5rJgQTnV4s) and
  [discussions](https://github.com/open-webui/open-webui/discussions)
  for community accessibility conversations.

If no upstream ACR exists, BayLeaf's honest posture is that Chat's
conformance is **Not Evaluated, with inherited dependency on an
upstream project that has not published its own conformance report.**
This is a weaker posture than the comparable inheritance argument in
[FERPA.md § 5](FERPA.md#5-the-contract-stack-beneath-bayleaf), where
the subprocessor DPAs are published artifacts. A reasonable next step
is to open an upstream issue asking whether an ACR is planned.

**Operator-known gaps (informal, not an evaluation).** These are
things the operator has noticed in day-to-day use, not an audit:

- *To be filled in.* Candidate items to document when the operator
  does a walk-through: focus visibility on theme-customized buttons,
  color contrast of the custom accent colors in the selected theme,
  keyboard reachability of the model selector, ARIA live-region
  behavior during streamed responses.

**Links for the future evaluation pass.**

- [Open WebUI repo](https://github.com/open-webui/open-webui)
- [Open WebUI docs](https://docs.openwebui.com/)
- Open WebUI uses [Svelte](https://svelte.dev/) and
  [SvelteKit](https://kit.svelte.dev/); frontend source under
  [`src/lib/`](https://github.com/open-webui/open-webui/tree/main/src/lib).
- BayLeaf Chat deployment notes: [../chat/DESIGN.md](../chat/DESIGN.md).

---

## 2. AI-generated output as an accessibility surface


The standard VPAT applies to the product's UI. For a chat service, most
of what a user perceives is *model output* rendered inside that UI.
Model output is neither purely UI (the chat frontend doesn't author it)
nor purely user content (the user didn't type it); it is a third
category that existing accessibility templates do not cleanly address.
This section names the category and enumerates the relevant success
criteria, so that future evaluations can reason about it without
re-inventing the frame.

**Why the standard VPAT misses this.** Vendor VPATs are written from
the perspective of a product team that ships a UI. The UI's
accessibility is their responsibility; the content users paste in is
not. LLM output sits between those categories: the product generated
it in response to user prompts, but it is not curated or QA'd the way
first-party content would be. Consumer AI vendors (OpenAI, Anthropic,
Google) handle this by declining to cover model output in their ACRs,
which is honest but leaves the accessibility question unanswered for
anyone relying on those tools in an institutional context.

**Relevant WCAG 2.1 success criteria applied to model output:**

- [1.1.1 Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content):
  generated images (DALL·E, Imagen, etc.) rendered in the chat UI need
  alt text. The model can be prompted to provide a description
  alongside any generated image; the UI must render it as an `alt`
  attribute or equivalent. This is a joint UI/prompt responsibility.
- [1.3.1 Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships):
  when a model emits markdown tables, lists, or headings, the UI's
  markdown renderer must preserve those semantics in the DOM.
  Malformed markdown (which LLMs sometimes produce) can produce
  inaccessible output even when the renderer is correct.
- [1.4.5 Images of Text](https://www.w3.org/WAI/WCAG21/Understanding/images-of-text):
  models occasionally return ASCII art, rendered diagrams, or
  screenshots when text would serve. The system prompt is a lever for
  steering away from this.
- [2.4.6 Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels):
  long model responses benefit from heading structure; the system
  prompt can encourage this for long answers.
- [4.1.3 Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages):
  this is the biggest one for streamed chat. As tokens stream in,
  screen readers need to know content is arriving without being
  flooded by every token. The standard pattern is an ARIA live
  region with appropriate politeness; the UI owns this, but BayLeaf
  can verify upstream behavior and file issues when it is wrong.

**The system-prompt-as-lever observation.** A faculty-operated service
can embed accessibility-aware conventions in system prompts in ways a
fixed-product vendor cannot. Examples of what BayLeaf *could* add to
system prompts if accessibility review recommended it:

- "When describing an image you generate, write an alt-text-quality
  description in a sentence above the image."
- "For responses longer than ~300 words, use level-2 markdown
  headings to structure the answer."
- "Do not render information as ASCII art when prose would serve.
  Prefer structured lists over formatted diagrams."
- "When emitting tables, include a brief sentence describing what the
  table shows before the table itself."

None of these is committed BayLeaf policy today. They are on the table
as design choices the service can make, and the fact that they are on
the table at all is one of the structural advantages of
faculty-operated tools enumerated in [POSITION.md](POSITION.md) and
[HECVAT.md](HECVAT.md). A vendor ACR cannot make this move; BayLeaf's
can, and the AI Council may want to weigh in on whether it should.

**Research and guidance to consult.** This is an active area without
settled best practices. Relevant entry points:

- W3C [Accessibility of Remote Meetings](https://www.w3.org/TR/remote-meetings/)
  (has some applicable live-region pattern discussion).
- [W3C APG: Live Region patterns](https://www.w3.org/WAI/ARIA/apg/patterns/alert/)
  and [status](https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/) documentation.
- Deque [screen reader announcements in streaming UIs](https://www.deque.com/blog/)
  (search for streaming / live region content).
- The [WebAIM Screen Reader User Survey](https://webaim.org/projects/screenreadersurvey10/)
  for context on how real users consume streamed content.
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
  for the general live-region patterns the UI should implement.

**Where this lives in the conformance table.** [the conformance tables below](#3-wcag-21-level-a-conformance)
marks AI-output criteria as Not Evaluated with remarks pointing here.
A future evaluation pass would need to decide whether to fold AI output
into Chat's conformance entries (arguing it is part of the Chat
surface) or to report it in a separate addendum. The operator's
current view: keep it as a separate section until the AI Council has
a position on whether system-prompt interventions are in scope for
this VPAT.

---

## 3. WCAG 2.1 Level A conformance

The full Level A criterion set is defined by the [W3C WCAG 2.1 Recommendation](https://www.w3.org/TR/WCAG21/#conformance-reqs). Each row below links to the *Understanding* document for the criterion.

Remarks have been trimmed to the Chat surface. Sentences in the pre-split draft that addressed sibling surfaces (the API or the bayleaf.dev landing) have been removed; where no sentence in the original applied to Chat, the remark reads "Not yet evaluated for this surface" with pointers to the sibling ACRs.

| # | Criterion | Chat | Remarks |
|---|---|---|---|
| 1.1.1 | [Non-text Content](https://www.w3.org/WAI/WCAG21/Understanding/non-text-content) | N/E | Chat: see [§ 2](#2-ai-generated-output-as-an-accessibility-surface) for AI-generated images. |
| 1.2.1 | [Audio-only and Video-only (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-only-and-video-only-prerecorded) | N/A | No prerecorded media on any BayLeaf surface. |
| 1.2.2 | [Captions (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded) | N/A | No prerecorded media. |
| 1.2.3 | [Audio Description or Media Alternative (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-description-or-media-alternative-prerecorded) | N/A | No prerecorded media. |
| 1.3.1 | [Info and Relationships](https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.3.2 | [Meaningful Sequence](https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.3.3 | [Sensory Characteristics](https://www.w3.org/WAI/WCAG21/Understanding/sensory-characteristics) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.4.1 | [Use of Color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.4.2 | [Audio Control](https://www.w3.org/WAI/WCAG21/Understanding/audio-control) | N/A | No auto-playing audio. |
| 2.1.1 | [Keyboard](https://www.w3.org/WAI/WCAG21/Understanding/keyboard) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.1.2 | [No Keyboard Trap](https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.1.4 | [Character Key Shortcuts](https://www.w3.org/WAI/WCAG21/Understanding/character-key-shortcuts) | N/E | Open WebUI may bind character shortcuts; verify in Chat evaluation. |
| 2.2.1 | [Timing Adjustable](https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.2.2 | [Pause, Stop, Hide](https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide) | N/E | Streamed chat responses are arguably "moving" content; examine in Chat evaluation with [§ 2](#2-ai-generated-output-as-an-accessibility-surface) in mind. |
| 2.3.1 | [Three Flashes or Below Threshold](https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold) | N/E | No flashing content on any BayLeaf-authored surface. |
| 2.4.1 | [Bypass Blocks](https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.4.2 | [Page Titled](https://www.w3.org/WAI/WCAG21/Understanding/page-titled) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.4.3 | [Focus Order](https://www.w3.org/WAI/WCAG21/Understanding/focus-order) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.4.4 | [Link Purpose (In Context)](https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.5.1 | [Pointer Gestures](https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.5.2 | [Pointer Cancellation](https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.5.3 | [Label in Name](https://www.w3.org/WAI/WCAG21/Understanding/label-in-name) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.5.4 | [Motion Actuation](https://www.w3.org/WAI/WCAG21/Understanding/motion-actuation) | N/A | No motion-based functionality. |
| 3.1.1 | [Language of Page](https://www.w3.org/WAI/WCAG21/Understanding/language-of-page) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 3.2.1 | [On Focus](https://www.w3.org/WAI/WCAG21/Understanding/on-focus) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 3.2.2 | [On Input](https://www.w3.org/WAI/WCAG21/Understanding/on-input) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 3.3.1 | [Error Identification](https://www.w3.org/WAI/WCAG21/Understanding/error-identification) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 3.3.2 | [Labels or Instructions](https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 4.1.1 | [Parsing](https://www.w3.org/WAI/WCAG21/Understanding/parsing) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 4.1.2 | [Name, Role, Value](https://www.w3.org/WAI/WCAG21/Understanding/name-role-value) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |

---

## 4. WCAG 2.1 Level AA conformance

Level AA is the target set for [ADA Title II](https://www.ada.gov/resources/2024-03-08-web-rule/), [Section 508](https://www.access-board.gov/ict/), [EN 301 549](https://www.etsi.org/deliver/etsi_en/301500_301599/301549/), and [UC IMG-2150](https://policy.ucop.edu/doc/7000611/IMT-2150). Level AA subsumes Level A; this table covers the criteria added at AA.

| # | Criterion | Chat | Remarks |
|---|---|---|---|
| 1.2.4 | [Captions (Live)](https://www.w3.org/WAI/WCAG21/Understanding/captions-live) | N/A | No live media. |
| 1.2.5 | [Audio Description (Prerecorded)](https://www.w3.org/WAI/WCAG21/Understanding/audio-description-prerecorded) | N/A | No prerecorded video. |
| 1.3.4 | [Orientation](https://www.w3.org/WAI/WCAG21/Understanding/orientation) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.3.5 | [Identify Input Purpose](https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.4.3 | [Contrast (Minimum)](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.4.4 | [Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.4.5 | [Images of Text](https://www.w3.org/WAI/WCAG21/Understanding/images-of-text) | N/E | No images of text on BayLeaf-authored surfaces. See [§ 2](#2-ai-generated-output-as-an-accessibility-surface) for AI-generated output. |
| 1.4.10 | [Reflow](https://www.w3.org/WAI/WCAG21/Understanding/reflow) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.4.11 | [Non-text Contrast](https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.4.12 | [Text Spacing](https://www.w3.org/WAI/WCAG21/Understanding/text-spacing) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 1.4.13 | [Content on Hover or Focus](https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.4.5 | [Multiple Ways](https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways) | N/A | Not applicable to this surface. |
| 2.4.6 | [Headings and Labels](https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 2.4.7 | [Focus Visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 3.1.2 | [Language of Parts](https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts) | N/A | No foreign-language passages on BayLeaf-authored surfaces. |
| 3.2.3 | [Consistent Navigation](https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation) | N/A | Single-page surfaces. |
| 3.2.4 | [Consistent Identification](https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 3.3.3 | [Error Suggestion](https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 3.3.4 | [Error Prevention (Legal, Financial, Data)](https://www.w3.org/WAI/WCAG21/Understanding/error-prevention-legal-financial-data) | N/E | Not yet evaluated for this surface; see [VPAT-api.md](VPAT-api.md), [VPAT-pages.md](VPAT-pages.md) for sibling-surface observations. |
| 4.1.3 | [Status Messages](https://www.w3.org/WAI/WCAG21/Understanding/status-messages) | N/E | Critical for Chat (streamed responses) and the API dashboard (key-provisioning feedback); see [§ 1](#1-surface-description), [VPAT-api.md](VPAT-api.md), [§ 2](#2-ai-generated-output-as-an-accessibility-surface). |

**Level AAA criteria** are not included in this table. VPAT 2.5 treats Level AAA as optional; conformance claims at AA do not include AAA. BayLeaf has not targeted AAA and does not claim it. The [full AAA criterion list](https://www.w3.org/TR/WCAG21/#conformance-reqs) is available from W3C for readers interested in the next tier.

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
