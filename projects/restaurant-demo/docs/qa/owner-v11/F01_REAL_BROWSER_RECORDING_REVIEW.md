# ZESTRY F01 — Real Chrome playback recordings (2026-11-18)

This is actual headless Google Chrome footage of the V11 local review build, NOT an AI-generated animation and NOT the public deployed site. No deployment was performed.

- Desktop: F01_full_animation_desktop_recording.mp4 (1440×900)
- Mobile: F01_full_animation_mobile_recording.mp4 (390×844)
- Timeline contact sheets: F01_desktop_frame_contact_sheet.jpg, F01_mobile_frame_contact_sheet.jpg
- Runtime evidence: real_browser_recording_desktop.json, real_browser_recording_mobile.json

## Verification
The original approved F01 1984×1134 SVG composition (261 frames) is rendered with xMidYMid slice inside a true circle. The desktop browser recording captured 229 frames; mobile captured 118, each from the beginning through the completed final bowl at frame 260. At approximately 1, 3, 5, 7, and 9.3 seconds the Lottie playback state was checked. Both recordings completed, and the final animation frame held with no JavaScript errors or HTTP asset failures.

## Creative review finding
The wooden board now fills the entire circle; the earlier yellow bands are gone. The center bowl stays within the circle. HOWEVER, some outer flying ingredients are visibly cropped at the left and right circle edges during the introductory motion. This is caused by covering a 1:1 circle with a 1.75:1 original animation. Playback does not stop prematurely. Whether the outer-edge crop is acceptable remains an owner creative decision.

The source F01 Lottie, F04 checkout behavior, and all other approved animations were not changed. Draft PR evidence only. No Render or Vercel deployment.
