# CHAPCHITRA C03 — Product Fly-to-Bag (approved choreography, site-wide activation)

C03 **replaces the proposed Brass Bell concept**. It is not a notification
feature and changes no notification controls. Activation now covers every
successful catalog Add-to-Bag click on Home, Shop, filtered Shop, Product Detail,
Related Products, Favorites, and dynamically rendered product cards.

Visual reference: the owner's approved THREADS T02 V3 trajectory, single
monotonic shrink, original cutout retained on the page, basket catch and
counter pulse, from read-only
`release/threads-demo-complete-20261026:site/threads/t02-fly-cart.mjs`.

- The existing CHAPCHITRA session-bag event handler commits the quantity
  synchronously. Only successful increments invoke C03; failures/99 limit
  retain their existing error/status behavior and skip motion.
- A duplicate of the clicked card's `.product-visual .shirt-svg`, or Product
  Detail's `.detail-art .shirt-svg` (or displayed image), is drawn above the
  page with a transparent, pointer-inert overlay. No beige
  product card or background rectangle is included, and the original stays
  still. The clone starts from the lower-right artwork quadrant.
- Self-hosted GSAP tween uses a native SVG quadratic Bézier path whose
  source, destination and control are derived from live DOM rectangles and
  the existing header. When a narrow phone scrolls the Add button into view
  but moves the product above the viewport, an approved T02-style short
  camera reveal brings the source into view and restores the preflight scroll
  position after the catch. Flight is **.91s**, beginning at **.12s**, with one
  continuously shrinking scale. Bag impact starts at **1.03s**. The current
  CHAPCHITRA bag SVG has no wheels; it receives a restrained rebound, and
  its existing count receives a pulse. No wheel artwork was invented.
- A second add cancels the prior visualization but does not reverse either
  committed quantity; scroll/resize/pagehide/tab-hide/reduced-motion changes
  cancel cleanly. Reduced motion performs only the existing immediate counter
  update and accessible status announcement.
- The existing THREADS GSAP 3 vendor bundle is copied unchanged as a
  self-hosted runtime (do not link THREADS at runtime or edit its source).
  Build copies this module, its CSS and vendor to the existing app's output.

Scope: `src/app.mjs` (one visual hook),
`src/motion/c03/` (new feature), and focused tests/evidence only.
No CHAPCHITRA staging integration, C02, C05, Artist's Edit, checkout,
THREADS or notification changes are authorized.

**Creative status:** Original C03 choreography APPROVED. Site-wide activation
passes local regression QA and has owner creative approval for staging integration.

**Deployment: NONE — per no-automatic-preview policy.**
