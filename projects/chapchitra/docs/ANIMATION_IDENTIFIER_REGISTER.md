# CHAPCHITRA — Reserved Animation Identifier Register

**Authority:** Owner's revised nine-animation creative plan (November 7, 2026).  
**Scope:** This register assigns numbers to *creative animation modules*, **not** reusable button UI components.

| ID | Reserved animation module | Implementation and approval evidence as of November 11, 2026 |
| --- | --- | --- |
| **C01** | **Connected Service Benefits** — four coordinated animated service icons and connecting line | **Implemented, visually approved and deployed** |
| **C02** | **Ink-Sweep Page Transition** — print-roller/organic ink navigation wipe | Concept and palette approved; **no verified finished module or owner acceptance** |
| **C03** | **Interactive Brass Bell** | Reserved/creative concept approved; **not verified implemented** |
| **C04** | **Ink-Stamp Add-to-Cart Feedback** — subtle stamped cart indicator | Reserved/creative concept approved; **not verified implemented** |
| **C05** | **Four Animated Story Icons** — storybook, Bangladesh, printmaking, finished apparel | Reserved/creative concept approved; **not verified implemented** |
| **C06** | **Workers Upload Loader** | Approved concept/choreography with exploratory integration activity; **not verified completed/owner accepted** |
| **C07** | **Folding T-Shirt Packaging** | Reserved/creative concept approved; **not verified implemented** |
| **C08** | **Animated Roller Logo** — Wordmark Reprint Lottie | **Implemented, visually approved and deployed** |
| **C09** | **Street Illustration Animation** | Reserved; **not verified implemented** |

**Verified completed numbered animation modules: C01 and C08 only.** A design-approved concept, a generic UI transition, a prototype, and a production-ready owner-approved animation are different states. Do not mark an animation module complete from a button's hover/press effect or from its use of ink-related visual language.

## Separately approved, *unnumbered* reusable website components

- **Compact SVG Button System** — 164×64 Illustrator source, three approved palettes, clipped Graphite ink hover, physical press, stationary shadow, pointer/keyboard/BFCache accessibility.
- **Long SVG Button System** — 320×54 Illustrator source, three approved palettes, physical press, clipped editorial hover, Add to Bag → ADDED → visible Press Green return swipe.
- Both button systems are **owner-approved UI components**; neither is assigned C05, C06, or any other animation-catalog number.
- The buttons' press/ink actions do **not** count as completing C02, C04, C05 or C06.

## Repository naming and approval gate

- Compact source branch: `feature/chapchitra-compact-svg-buttons`; draft approval PR **#79**.
- Long source branch: `feature/chapchitra-long-svg-buttons`; draft approval PR **#80**.
- Source directories, tests, QA evidence and documentation should use **compact** / **long**, not C05 / C06.
- Old commit messages, historical GitHub Actions logs and superseded PR discussions are historical records and must not be rewritten to falsify provenance.
- Do not renumber the creative animation modules, alter existing approved artwork, or merge into `main` without the owner's explicit authorization.
