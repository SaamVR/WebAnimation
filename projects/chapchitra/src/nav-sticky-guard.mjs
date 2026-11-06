// CHAPCHITRA sticky navbar diagnostics — observational only.
// CSS position:sticky; top:0 is the sole positioning authority.
// The announcement is the preceding normal-flow sibling. No compensating
// transforms, negative margins, fixed positioning or scroll nudges are applied.
const round = value => Math.round(value * 100) / 100;

export function navGeometry(header, announcement, view = window) {
  const headerTop = header.getBoundingClientRect().top;
  const announcementBottom = announcement.getBoundingClientRect().bottom;
  const visualOffsetTop = view.visualViewport?.offsetTop ?? 0;
  const announcementGone = announcementBottom <= 0;
  return {
    scrollY: round(view.scrollY ?? 0),
    headerTop: round(headerTop),
    announcementBottom: round(announcementBottom),
    announcementGone,
    layoutGap: round(announcementGone ? Math.max(0, headerTop) : 0),
    visualOffsetTop: round(visualOffsetTop),
    // Browser chrome or pinch zoom may shift the visual viewport. Display
    // that separately; do not use it to translate the sticky element.
    visualRelativeTop: round(headerTop - visualOffsetTop),
  };
}

export function installStickyViewportDiagnostics(root = document, view = window) {
  // Zero work/listeners on the normal storefront. Enable on Safari only
  // when explicitly inspecting ?navdebug=1.
  if (!new URLSearchParams(view.location?.search ?? '').has('navdebug')) return () => {};
  const header = root.getElementById('siteHeader');
  const announcement = root.querySelector('#app > .announcement');
  if (!header || !announcement) return () => {};

  const output = root.createElement('pre');
  output.setAttribute('aria-hidden', 'true');
  output.setAttribute('data-cc-nav-debug', '');
  output.style.cssText = 'position:fixed;bottom:8px;left:8px;max-width:min(95vw,380px);z-index:9999;background:var(--deep);color:var(--bg);font:11px/1.5 monospace;padding:9px 12px;border-radius:6px;pointer-events:none;white-space:pre-wrap;';
  root.body.append(output);
  const samples = [];
  const measure = () => navGeometry(header, announcement, view);
  let frame = 0;

  const draw = () => {
    frame = 0;
    const sample = {
      ...measure(),
      visualHeight: round(view.visualViewport?.height ?? view.innerHeight),
      layoutHeight: view.innerHeight,
    };
    samples.push(sample);
    if (samples.length > 120) samples.shift();
    output.textContent = 'Native sticky diagnostics (read-only)' +
      '\nheader.top: ' + sample.headerTop + 'px' +
      '\nannouncement.bottom: ' + sample.announcementBottom + 'px' +
      '\nlayout gap: ' + sample.layoutGap + 'px' +
      '\nvisualViewport.offsetTop: ' + sample.visualOffsetTop + 'px' +
      '\nheader relative to visual viewport: ' + sample.visualRelativeTop + 'px' +
      '\nscrollY: ' + sample.scrollY + 'px' +
      '\nvisual height: ' + sample.visualHeight + 'px / layout: ' + sample.layoutHeight + 'px';
  };
  const schedule = () => { if (!frame) frame = view.requestAnimationFrame(draw); };
  const listeners = [['scroll', view], ['resize', view], ['pageshow', view],
    ['orientationchange', view], ['scroll', view.visualViewport],
    ['resize', view.visualViewport]];
  for (const [event, target] of listeners) target?.addEventListener(event, schedule, { passive: true });
  view.__ccNavViewport = { measure, samples };
  schedule();
  return () => {
    if (frame) view.cancelAnimationFrame(frame);
    for (const [event, target] of listeners) target?.removeEventListener(event, schedule);
    output.remove();
    delete view.__ccNavViewport;
  };
}
