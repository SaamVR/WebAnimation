# CHAPCHITRA — Artist's Edit normal-scrolling navbar (November 12, 2026)

## Version and scope

- Live Render source: 29f484bb866146e8c2a52cfc12d9035413b38a68
- Live Render deploy: dep-dbqctsvf3r2c73evljrg
- Artist's Edit: https://chapchitra-webanimation.onrender.com/artists-edit/
- Pinned review: https://chapchitra-webanimation.onrender.com/artists-edit/review/29f484bb866146e8c2a52cfc12d9035413b38a68/
- Development PR: https://github.com/SaamVR/WebAnimation/pull/83 — DRAFT, UNMERGED

## Browser recordings and screenshots

- [WebKit iPad-viewport screen recording: navbar scrolls away](webkit-ipad-artist-navbar-scroll.webm)
- [WebKit iPad-viewport at page top](webkit-ipad-artist-top.png)
- [WebKit iPad-viewport scrolled: navbar absent](webkit-ipad-artist-scrolled.png)
- [WebKit iPad-viewport after returning to top](webkit-ipad-artist-returned.png)
- [Desktop Chromium scrolled](chromium-desktop-artist-scrolled.png)
- [Mobile Chromium scrolled](chromium-mobile-artist-scrolled.png)

## Acceptance

- Full source/build: 155/155 source tests, build PASS.
- Targeted selector tests: 2/2 PASS.
- Public navbar QA: 90/90 PASS across desktop Chromium, iPad-size WebKit, mobile Chromium, all Artist's Edit scroll states plus Home/Shop/Journal/About sticky control states.
- Public two-sided Artist editor: 54/54 PASS.
- Public routing: Artist's Edit, SHA-pinned route, Home, Shop, Journal, About and approved Regular Tee image returned HTTP 200.
- [Machine-readable public scroll QA](public-navbar-normal-flow-report.json) — zero browser exceptions and zero failed HTTP requests.

## Precision and limitations

The browser evidence is from automated desktop/mobile Chromium and WebKit viewport simulation, **not a physical iPad Safari/Chrome session**. This is a deliberate owner-requested normal-flow behavior change, not a claim that the underlying iPadOS WebKit sticky gap was repaired globally.

The header appears with the original announcement at the top. On Artist's Edit the header scrolls fully away with the document and reappears only when scrolling back to the top. Other pages retain sticky header behavior. C08 logo integration, garments, print guides and worktable were not modified. This branch contains evidence only; the Render source SHA is unchanged.

Owner visual acceptance remains pending. Do not merge PR #83 into main without approval.
