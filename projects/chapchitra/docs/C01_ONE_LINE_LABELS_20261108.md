# CHAPCHITRA — C01 Single-Line Feature Labels and Hero Proximity

**Status:** Owner visual review only. No merge to production.

## Approved feature labels

The previous four title-and-subtitle pairs are superseded by exactly one line per icon:

1. **Original Art & Customization**
2. **Secure & Flexible Payment**
3. **Fast Delivery**
4. **24/7 Support**

The fourth avoids the phrase "Customer Support". The website's 24/7 availability must be confirmed operationally before public launch.

## Layout change

- Desktop/tablet C01 top padding **29px → 15px**, approximately half.
- Mobile (≤680px) top padding **23px → 12px**, approximately half.
- All subtitles removed, leaving a semantic `h3` for each feature.
- Single-line treatment preserved from 1408px desktop through 320px mobile.
- Responsive text sizing in the narrow 681–800px range prevents collisions without changing the previously approved icon/connector spacing.
- C01 bottom padding, site gutters, icon sizing and original V3 connector geometry unchanged.
- Lottie assets and their exact 10.27-second coordinated animation timeline unchanged.

## Verification

- C01 original JSON SHA checks and single-line copy regression tests.
- Real Chromium measured at **1408, 1194, 1024, 834, 768, 740, 681, 680, 430 and 320px**. No title wrapping, clipping, collisions or page-level horizontal overflow.
- Original four Lottie compositions and three connector paths still render.
- Evidence saved as `docs/c01-evidence/c01-one-line-{1408,834,681,430,320}.png` and `c01-one-line-qa.json`.
- New original Lottie replay video `docs/c01-evidence/c01-one-line-synchronized-lottie.webm`.

**Release boundary:** Keep C01 in draft PR #67 and deploy to the existing isolated Render review branch only. Preserve concurrently approved Artist's Edit work. No merge, production publishing, or unrelated changes.
