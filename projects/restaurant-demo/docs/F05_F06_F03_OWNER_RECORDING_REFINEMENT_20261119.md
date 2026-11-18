# ZESTRY — Owner Recording Refinement: F05 F06 F03

**Source:** Owner-supplied iPad recording `ScreenRecording_11-19-2026 03-40-13_1.mp4`.  
**Starting approved staging SHA:** `a81332d7faf5c277e03207e5e2513d174d124919` (PR #141).  
**Feature branch:** `feat/zestry-f05-flips-food-alignment-compact-story-coffee-20261119`  
**Review:** Unmerged, undeployed. Existing Render demo must remain unchanged until separate owner release approval.

## Owner instructions

1. F05: Replace the artificial rapid reveal when entering Starters and the 0.24s card-only dish transition with natural, clearly recognizable page flips, like the actual book's category flip. Correct photograph/card centering on the illustrated right-hand page. Each category has exactly four items. Crossing the fourth item into a new category must not flash an unrelated older salad/burger/vector food.
2. F06 "A little magic in the making": Too much vertical whitespace top/bottom; reduce section size so it is a tighter, mostly screen-fitting composition.
3. F03 "Your favorite pause of the day": Darken coffee section background enough to make light steam visible without camouflaging the cup or coffee illustration.
4. **F07 booking/reservation:** Owner explicitly approves and freezes. Preserve original reservation animation, wide rectangular modal illustration, controls, form, and motion.

## Production changes (only approved ZESTRY review ZIP)

- Deterministic patcher: `zestry-v3-editorial/refine_f05_section_coffee_20261119.py`.
- **F05:** Original source F05 dotLottie preserved byte for byte. Original authored 2.7-second category-vector page flips retained. Individual dish changes now animate paper-colored front/back leaf with 740 ms 3D rotation, rather than applying 240 ms CSS wobble to just the card. During native category flip states, suppress stale embedded food illustrations that conflict with the photographic leaf and defer the next category photo until the authored hold state. Fix the photo right-hand inset from `54.05%` to `52.75%` in the original book coordinate frame, avoiding arbitrary image offsets. Keep category/previous/next/home/checkout/cart and sixteen demo images intact. Category transition from Starter #4 goes to first Main Course; previous from first Main Course returns to fourth Starter.
- **F06:** Target only `#process`, trim vertical section padding, reduce oversized vector-height box to <=445 px desktop with responsive limits and adequate spacing. Do not change the original animation.
- **F03:** Target only `#coffee`: warm darker gradient `#f6e7d6 -> #e7c8a6 -> #cea184`, with the author-supplied steam and coffee artwork entirely unmodified.
- **F07:** No modification to approved animation or reservation UI.

### Master immutability

SHA-256 checked original archived F01, F02, F03, F07 and F05 `.lottie` master. The patcher rewrites only `index.html`, `assets/f05_book.html` and `assets/f05-fit-v8.css` inside the existing review archive. All other archive entries remain SHA-identical.

## Browser QA and evidence

Passing no-deploy GitHub Actions run: https://github.com/SaamVR/WebAnimation/actions/runs/44407943319

- **50/50** new owner-specific Chromium checks on desktop 1600x900, iPad 1024x768, mobile 390x844. Test suite covers original 2.7s category turn state, each starter dish, #4 boundary, backward wrap, dessert/drinks, 740ms page leaf, photo placement, no broken requests or JS exceptions, compact F06, coffee gradient; native video recordings and frame checkpoints.
- **63/63** existing F01–F07 motion/playback and F05-to-F04 checkout regression checks.
- **71/71** existing approved F07 booking modal and iPad/mobile/reduced-motion QA checks.
- **184/184** combined passes; screenshots and Chrome videos preserved in GitHub Actions artifact `zestry-f05-natural-leaf-process-coffee-qa` on the passing run, including final coffee steam frames and F06 actual rendered animation.

## Release gate

This is an owner-requested refinement, NOT authorization to deploy. Do not merge to Render-tracked staging until owner has the chance to review the actual screenshot/video and approves. No new Render preview/service, no unrelated project changes, and no modifications to live reviewed reservation.
