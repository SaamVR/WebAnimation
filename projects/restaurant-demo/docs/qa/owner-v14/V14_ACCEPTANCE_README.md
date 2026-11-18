# ZESTRY V14 native-browser acceptance evidence

Source: c574a2bea361042f965a77529005dae528067274. Test date: 2026-11-18.

Seven real Chromium viewports (1600x900, 1440x900, 1100x800, 1024x768, 768x1024, 390x844, 320x690) passed no-horizontal-overflow, animation geometry, JS error, and local asset checks.

Original wood tabletop is verified as `svg.f01-wood-fill` (not a nested SVG), with xMidYMid slice; F01 uses xMidYMid meet. Desktop circle 756.59px and stage 635.53px, source canvas corner clearance 12.287px. Ingredient content does not visibly clip against the circle in the captured samples.

F05 book: Closed -> Overview -> Starters -> Garden Crunch Salad -> bag count 1. F04 simulated pickup: Sample order received, original one-shot 8-second F04 SVG. F07 reservation: Sample table request received. Mobile navigation and reduced-motion passed.

Two **actual Playwright Chromium website recordings** are included: desktop-F01-real-browser.webm and mobile-F01-real-browser.webm. They are not offline composites. The PNGs are actual browser screenshots including early/mid/end frames and interactive checkpoints.

V14_ACCEPTANCE_QA.json is the machine-readable final result. The initial browser script used an over-strict wood DOM query and an intermediate script raced the F05 state machine. Both harness errors were corrected; final QA reports zero issues.

No original F01/F04/F05 animation assets were edited. Deployment is separately authorized for the existing Render ZESTRY staging service, not production commerce.
