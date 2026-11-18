# V12 F01 Browser Recording

Actual Chrome desktop capture from the V12 local preview, recorded 2026-11-18.
- 1440x900 H.264 MP4: F01_V12_no_ingredient_crop_desktop.mp4
- Browser playback JSON: F01_V12_browser_recording_qa.json
- Video is not AI generated and is not a recording of the public Render deployment.

Captured from the beginning of the original 261-frame F01 source through its final frame 260 and final-frame hold. Runtime sampling showed frames ~32 at 1s, ~93 at 3s, ~154 at 5s, ~215 at 7s and completed frame 260 at 9.3s, without JavaScript or network errors.

The original complete F01 ingredient animation is uniformly scaled to fit within the circle, and the original wood background is cloned as a separate circle-filling vector. Some ingredient shapes still naturally enter from outside the original authored Lottie canvas; that is original motion, not circle-induced cropping.

Owner acceptance still pending. Do not deploy without authorization.