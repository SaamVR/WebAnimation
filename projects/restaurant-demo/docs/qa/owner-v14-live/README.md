# ZESTRY V14 — Actual deployed Render browser QA

Captured November 18, 2026 directly in Chromium from https://zestry-v3-restaurant-review-20261117.onrender.com/. NOT offline compositions.

Render live deploy ID `dep-dbuhro0ae00c73ejg7bg`, merged SHA `df31c06c51130adcffecfde1ee97a0b7e889cf7d`, PR #125 merged.

Desktop and mobile full F01 website-screen recordings: `desktop-F01-real-browser.webm` and `mobile-F01-real-browser.webm`. Representative screenshots include early/mid/final animation states and F05 menu/F04 checkout/F07 reservation.

Live browser QA confirms V14 CSS 756.6px circle at desktop, 84% ingredient stage, original wood backdrop and yellow accent, no unintended circle clipping in sampled frames, no horizontal overflow, no runtime or site-asset errors. Original F01 choreography is unchanged.

F05 Closed→Overview→Starters→add dish→bag count 1 passed. F04 8s single-play simulated checkout confirmation passed. F07 simulated booking confirmation passed.

See `ZESTRY_V14_LIVE_BROWSER_ACCEPTANCE.json` for measured browser evidence. This QA-only branch does not modify the live Render deploy branch or trigger another deployment. Owner creative signoff remains separate.
