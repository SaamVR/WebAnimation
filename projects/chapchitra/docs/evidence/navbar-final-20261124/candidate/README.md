# CHAPCHITRA — final owner screenshot navbar corrections (CANDIDATE ONLY)

- Code pull request: https://github.com/SaamVR/WebAnimation/pull/164
- Candidate exact SHA: \`b4d649cdc8a63e82a0ae4f77cc507d262e9aebdc\`
- Staging baseline at recording: \`c41b8c747167ef2cc2e1d1c486f9a6b554856837\`.
- Render service was **NOT** redeployed for these captures. Playwright locally substituted candidate app.mjs, styles.css, theme.css and theme-toggle.css into the browser load at the existing staging origin. This is **not live-site acceptance**.

## Independent browser evidence

- [Hero01 owner-corrected navbar and C08 browser regression](hero01-final-contract/): **5/5 profiles PASS** (1440px Chromium, iPad WebKit, 390px Chromium, 320px Chromium, reduced-motion WebKit). Complete actual-browser screenshots, 390px transition recording, and machine-readable report. The revised test asserts the original CHAPCHITRA wordmark is hidden in the closed phone header and remains available in the expanded menu, without changing original SVG art, C08 timing, or Hero01 visuals.


- [Mobile/tablet/desktop browser matrix](candidate-qa.json): **260/260 checks PASS**, 24 Chromium/WebKit profiles × 320/375/390/430/834/1440 widths × dark/light.
- [Intermediate tablet breakpoint matrix](tablet-between-breakpoints.json): **84/84 PASS**, 16 Chromium/WebKit profiles × 431/600/740/834 widths × dark/light.
- [32.30s combined actual-browser MP4](CHAPCHITRA_Navbar_Final_Candidate_Light_Dark_390x844.mp4) with separate dark/light 390×844 browser sessions concatenated, showing original illustrated toggle, full-height menu, X close, theme changes and Home→Shop C02. File SHA-256: \`90e63e9764546768cb5400524a8b9c1c92120833e2379de6454d8339deae8eeb\`.
- **44 real-browser PNG screenshots** of full-width desktop dark Cream 36px backing and expanded/closed phone menus, rather than a simulation/mockup.
- The original owner SVG files, C02/C03/C04/C08 runtime files, palette tokens, other repo demos and production/main were not edited.
- [C02 unchanged vertical portrait compositor regression](c02-candidate-matrix.json): **80/80 PASS** across all 16 Chromium/WebKit × 320/375/390/430px × light/dark journeys from the new menu to Shop; full viewport ink cover, existing source Walnut/Gallery White backing, first-paint continuity and destination completion. Four real 390px destination captures included.
- 315/315 native tests passed. Required exact-head CI and merged live Render verification are separate release gates.
