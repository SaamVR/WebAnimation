# F03 V2 — Lottie-web runtime controller compatibility (2026-11-17)

**User defect:** F03 machine never fades behind the completed latte cup, despite correct final V2 master choreography. User supplied iPad screen recording \`ScreenRecording_11-17-2026 23-48-26_1.mp4\` (4.36s excerpt). The machine persists during cup motion. The owner-approved target is beans/grinding, pour, coffee surface transition, machine disappearance, cup zoom-in and visible latte art, rising steam, final-frame hold.

## Root cause, independently reproduced in Chromium
Current approved F03 JSON (SHA-256 \`136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68\`) contains:
- Machine opacity controller: parent null layer \`ind:2\`, 100% through frame 117.6 (3.92s) → 0% at frame 173.4 (5.78s).
- Cup hero scale controller: parent null layer \`ind:1\`, 100% through frame 138 (4.6s) → 169% at frame 178 (5.93s), settling about 168% to frame 228 (7.6s).
- Final latte surface: shape layer 6, fully visible by frame 130.
- Steam: three strands fade up after frame 175.

Chromium Lottie-web does not propagate the parent null controller's opacity to machine child artwork layers 15–27. At frame 227, machine remains visible in live site. Re-rendering an in-memory copy of the same F03 data with the parent's original opacity keyframes applied directly to 13 opaque machine artwork layers makes the machine disappear and reveals the centered steaming latte cup. Bean layers 10–14 already have their own fade and are deliberately untouched.

## Patch
Integrate this verified normalization at F03 JSON load time, after JSON is fetched and before \`lottie.loadAnimation\`. Validate that the controller and expected 13 machine layers exist before applying. Clone keyframe objects; preserve source assets byte-for-byte. Original F03 checksum remains unchanged, as does approved animation timing. No machine redraw, no cup geometry/scale change and no additional animation invented.

## Release criteria
Check source JSON checksum, F03 opacity at frames 0, 117, 155, 173, 178, 220, 227, final machine absent, latte cup + steam visible, one-shot playback with final hold, desktop/mobile/iPad layout, F01 broth runtime normalization retained, F02 chef, F04 confirmation, F05 interactive menu, F06 continuous cooking, F07 reservation, F08 excluded, cart/checkout/booking simulations functional. No changes outside \`projects/restaurant-demo/\`.

This release remains a **visual review**, not owner creative approval.
