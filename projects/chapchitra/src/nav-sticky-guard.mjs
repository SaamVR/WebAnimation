// CHAPCHITRA only — Safari visual/layout viewport sticky-header reconciliation.
// The announcement remains in normal document flow. No spacer or margin shifts.
// Only a measured positive gap after the announcement disappears is corrected.
const round = value => Math.round(value * 100) / 100;

export function navGeometry(header, announcement, view = window, applied = 0) {
  const visualTop = view.visualViewport?.offsetTop ?? 0;
  const headerTop = header.getBoundingClientRect().top;
  const announcementBottom = announcement.getBoundingClientRect().bottom;
  const scrollY = view.scrollY ?? 0;
  const announcementGone = announcementBottom <= visualTop + 1;
  const rawHeaderTop = headerTop - applied;
  const gap = announcementGone ? Math.max(0, rawHeaderTop - visualTop) : 0;
  return {
    scrollY: round(scrollY),
    headerTop: round(headerTop),
    rawHeaderTop: round(rawHeaderTop),
    visualOffsetTop: round(visualTop),
    announcementBottom: round(announcementBottom),
    announcementGone,
    gap: round(gap),
    adjustment: round(applied),
  };
}

export function installStickyViewportGuard(root = document, view = window) {
  const header = root.getElementById('siteHeader');
  const announcement = root.querySelector('#app > .announcement');
  if (!header || !announcement) return () => {};

  let applied = 0;
  let frame = 0;
  let previousGap = 0;
  const samples = [];
  const debug = new URLSearchParams(view.location.search).has('navdebug');
  let output = null;

  if (debug) {
    output = root.createElement('pre');
    output.setAttribute('aria-hidden', 'true');
    output.setAttribute('data-cc-nav-debug', '');
    output.style.cssText = 'position:fixed;bottom:8px;left:8px;max-width:min(95vw,380px);z-index:9999;background:#17231fee;color:#fff;font:11px/1.5 monospace;padding:9px 12px;border-radius:6px;pointer-events:none;white-space:pre-wrap;';
    root.body.append(output);
  }

  const measure = () => navGeometry(header, announcement, view, applied);

  function reconcile() {
    frame = 0;
    const state = measure();
    // A positive measured gap is the only reason to translate the header.
    // Read its *untranslated* position by subtracting the prior adjustment,
    // avoiding update oscillation after the first correction.
    const desired = state.announcementGone && state.gap > 1
      ? -state.gap
      : 0;
    if (Math.abs(desired - applied) >= 0.5) {
      applied = desired;
      header.style.translate = applied ? `0 ${round(applied)}px` : '';
    }
    const sample = { ...measure(), visualHeight: round(view.visualViewport?.height ?? view.innerHeight), layoutHeight: view.innerHeight };
    if (sample.gap !== previousGap || debug) {
      samples.push(sample);
      if (samples.length > 120) samples.shift();
      previousGap = sample.gap;
    }
    if (output) output.textContent =
      `Navbar viewport diagnostics (Safari scroll)` +
      `\nheader.top: ${sample.headerTop}px` +
      `\nscrollY: ${sample.scrollY}px` +
      `\nvisualViewport.offsetTop: ${sample.visualOffsetTop}px` +
      `\nannouncement.bottom: ${sample.announcementBottom}px` +
      `\nmeasured gap: ${sample.gap}px / correction: ${sample.adjustment}px` +
      `\nvisual height: ${sample.visualHeight}px / layout height: ${sample.layoutHeight}px`;
  }

  const schedule = () => {
    if (!frame) frame = view.requestAnimationFrame(reconcile);
  };
  const listeners = [['scroll', view], ['resize', view], ['pageshow', view],
    ['scroll', view.visualViewport], ['resize', view.visualViewport]];
  for (const [type, target] of listeners) target?.addEventListener(type, schedule, { passive: true });

  // Geometry snapshots are local-only and opt-in inspectable. No analytics.
  view.__ccNavViewport = { measure, samples };
  schedule();

  return () => {
    if (frame) view.cancelAnimationFrame(frame);
    for (const [type, target] of listeners) target?.removeEventListener(type, schedule);
    header.style.translate = '';
    output?.remove();
    delete view.__ccNavViewport;
  };
}
