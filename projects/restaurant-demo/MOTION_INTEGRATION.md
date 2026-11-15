# ZESTRY animation integration register

The source Lotties belong to the independent Food & Restaurant pack. The ZESTRY app **does not edit their keyframes**.

| ID | Scene | Site location | Status in this branch |
| --- | --- | --- | --- |
| F01 | Pasta bowl hero | Homepage hero | Genuine original vector `f01.json` bundled |
| F02 | Chef in Action | Kitchen hero card | Genuine original vector `f02.json` bundled |
| F03 | Coffee brewing | Coffee feature | Original `f03-coffee.svg` static fallback; final Lottie export not supplied |
| F04 | Breakfast order journey | Demo checkout confirmation | Genuine original vector `f04.json` bundled |
| F05 | Interactive menu book | Menu overlay | Original self-contained interactive `f05-interactive.html` bundled |
| F06-1 | Chopping board | Kitchen card | Genuine original vector `f06-1.json` bundled |
| F06-2 | Mixing bowl | Kitchen card | Original `f06-2.svg` static fallback; final Lottie export not supplied |
| F06-3 | Cooking pot | Kitchen card | Original `f06-3.svg` static fallback; final Lottie export not supplied |
| F07 | Table reservation | Reservation section / confirmation | **Pending**. Retrieved JSON was incomplete; do not ship or claim Lottie is integrated. Use clearly labeled static preview. |
| F08 | Signature dish | Featured special | Planned only; existing food photo carries the section. |

The HTML app lazy-loads JSONs via the local vendored Lottie renderer and pauses looping animations outside the viewport. On unavailable JSON / invalid export / reduced-motion preference, it renders a **labeled static preview**, not a synthetic substitute.

### Next asset handoff

To complete the pack integration, add only the actual QA-approved JSON or dotLottie exports for F03, F06-2, F06-3, F07 and (when completed) F08. Validate JSON `layers`, `op`, visibility and full final-state choreography in Chromium before changing this table to “bundled.” Prefer the original F05 interaction source, not a recreation.

### Source boundary

Do not regenerate or retime the approved F01/F02/F04/F05/F06-1 animations from inside the website project. If source Lottie refinements are requested, apply them in the asset production lane and copy the resulting accepted exports here. No globals or runtime dependencies from Chapchitra or Threads.
