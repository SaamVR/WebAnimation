# CHAPCHITRA — Permanent shared staging: Hind Siliguri price amount

**Captured:** November 12, 2026; exact deployed implementation **`d028f75235801220b329ac0bda2fbbed55baf94d`**.

**Canonical staging URL:** https://chapchitra-webanimation.onrender.com/artists-edit/

**Exact Render deployment:** `dep-dbqj5rg473hc7382aoq0` on existing service `srv-dbmu3ubbc2fs73auj78g`.

**GitHub Actions source and integration:** [Candidate #43147400272](https://github.com/SaamVR/WebAnimation/actions/runs/43147400272) and [post-promotion #43148715250](https://github.com/SaamVR/WebAnimation/actions/runs/43148715250), both with successful source/build, browser and conditional animation jobs.

## Public browser verification

- [Desktop Hind Siliguri tag — BDT 450](desktop-tag-450.png)
- [iPad-sized WebKit Hind Siliguri tag — BDT 450](ipad-webkit-tag-450.png)
- [Mobile Hind Siliguri tag — BDT 450](mobile-tag-450.png)
- [Machine-readable QA report](report.json) — **66/66 pass; 0 failed; 0 JavaScript errors; 0 failed HTTP requests**.

Coverage: Home, Shop, Journal, About, Artist's Edit route loads, responsive horizontal overflow, navbar sticky on general pages and normal-flow on Artist's Edit; printed “Total” artwork intact with no duplicate HTML; computed **Hind Siliguri 700** and font loaded; price tag noninteractive; BDT 450 and hoodie BDT 850 totals synchronized; front → back retains total. Source font change is limited to configuration and its focused test.

This is **automated WebKit at iPad viewport**, not a physical iPad test. C02 remains on the separate Animation Integration branch pending exact-head CI/ready-for-integration handoff; don't claim it is on staging. C01/C08 remain as inherited from the staging baseline. Production `main` is untouched.

**Evidence-only branch**: no Render deployment or source change; staging remains at `d028f75235801220b329ac0bda2fbbed55baf94d`.
