// CHAPCHITRA — opt-in physical iPad viewport diagnostics (?navdebug=1).
// No positioning corrections: CSS position:sticky; top:0 remains authoritative.
// Nothing is rendered, measured repeatedly or listened to on normal pages.
const round = value => Math.round(value * 100) / 100;

export function navGeometry(header, announcement, view = window) {
  const headerRect = header.getBoundingClientRect();
  const announcementRect = announcement.getBoundingClientRect();
  const viewport = view.visualViewport;
  const visualOffsetTop = viewport?.offsetTop ?? 0;
  const announcementGone = announcementRect.bottom <= 0;
  return {
    scrollY: round(view.scrollY ?? 0),
    headerTop: round(headerRect.top),
    headerBottom: round(headerRect.bottom),
    announcementBottom: round(announcementRect.bottom),
    announcementGone,
    layoutGap: round(announcementGone ? Math.max(0, headerRect.top) : 0),
    visualOffsetTop: round(visualOffsetTop),
    visualPageTop: round(viewport?.pageTop ?? (view.scrollY ?? 0) + visualOffsetTop),
    visualHeight: round(viewport?.height ?? view.innerHeight ?? 0),
    layoutHeight: round(view.innerHeight ?? 0),
    visualScale: round(viewport?.scale ?? 1),
    // Browser toolbar pixels may be outside the document entirely.
    visualRelativeTop: round(headerRect.top - visualOffsetTop),
  };
}

export function installStickyViewportDiagnostics(root = document, view = window) {
  if (!new URLSearchParams(view.location?.search ?? '').has('navdebug')) return () => {};
  const header = root.getElementById('siteHeader');
  const announcement = root.querySelector('#app > .announcement');
  if (!header || !announcement) return () => {};

  const panel = root.createElement('aside');
  panel.setAttribute('data-cc-nav-debug', '');
  panel.setAttribute('aria-label', 'Read-only iPad sticky navbar measurements');
  panel.style.cssText = 'position:fixed;bottom:8px;left:8px;width:min(95vw,400px);max-height:48vh;overflow:auto;z-index:9999;background:var(--deep);color:var(--bg);font:11px/1.45 monospace;padding:9px 12px;border:1px solid var(--grey);border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,.2);';
  const text = root.createElement('pre');
  text.style.cssText = 'white-space:pre-wrap;margin:0 0 7px;overflow-wrap:anywhere;';
  const button = root.createElement('button');
  button.type = 'button';
  button.textContent = 'Capture and copy iPad measurements';
  button.style.cssText = 'font:600 12px/1.3 system-ui;padding:9px 12px;border-radius:5px;border:1px solid currentColor;background:var(--bg);color:var(--ink);min-height:40px;';
  const message = root.createElement('div');
  message.setAttribute('role', 'status');
  message.style.cssText = 'font:11px/1.3 system-ui;margin-top:5px;';
  panel.append(text, button, message);
  root.body.append(panel);

  // A hidden probe reads actual WebKit safe-area environment values rather
  // than guessing from screen/device model or supplying a hardcoded offset.
  const probe = root.createElement('div');
  probe.setAttribute('aria-hidden', 'true');
  probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;width:0;height:0;padding-top:env(safe-area-inset-top,0px);padding-left:env(safe-area-inset-left,0px);';
  root.body.append(probe);
  const samples = [];
  let frame = 0;

  function describeElement(element) {
    if (!element) return 'outside document / none';
    if (header.contains(element)) return 'navbar';
    if (announcement.contains(element)) return 'announcement';
    const parent = element.closest('[id], main, section, article');
    return (parent?.id ? '#' + parent.id : parent?.tagName?.toLowerCase() ?? element.tagName.toLowerCase());
  }
  const measure = () => {
    const state = navGeometry(header, announcement, view);
    const headerStyle = view.getComputedStyle(header);
    const safeStyle = view.getComputedStyle(probe);
    // elementFromPoint can test only DOM-visible pixels. If it reports the
    // navbar but a screenshot shows products above it, the strip belongs to
    // browser chrome/compositing outside the measured DOM viewport.
    const cx = Math.max(1, Math.floor((view.innerWidth ?? 0) / 2));
    const cy = 2;
    return {
      ...state,
      cssPosition: headerStyle.position,
      cssTop: headerStyle.top,
      computedTranslate: headerStyle.translate,
      inlineTranslate: header.style.translate,
      safeAreaTop: round(parseFloat(safeStyle.paddingTop) || 0),
      safeAreaLeft: round(parseFloat(safeStyle.paddingLeft) || 0),
      domAtTop: describeElement(root.elementFromPoint(cx, cy)),
      domAtLeftTop: describeElement(root.elementFromPoint(2, cy)),
      documentScrollTop: round(root.scrollingElement?.scrollTop ?? 0),
      screenOrientation: view.screen?.orientation?.type ?? 'unknown',
    };
  };
  const ancestorStyles = () => {
    const result = [];
    for (let node = header.parentElement; node && result.length < 5; node = node.parentElement) {
      const style = view.getComputedStyle(node);
      result.push({
        node: node.id ? '#' + node.id : node.tagName.toLowerCase(),
        overflowX: style.overflowX, overflowY: style.overflowY,
        transform: style.transform, contain: style.contain,
      });
    }
    return result;
  };
  const capture = () => {
    const state = measure();
    samples.push({ time: Date.now(), ...state });
    if (samples.length > 120) samples.shift();
    return state;
  };

  const draw = () => {
    frame = 0;
    const state = capture();
    text.textContent =
      'iPad navbar diagnosis (read-only)\n' +
      'header.top: ' + state.headerTop + 'px; CSS top: ' + state.cssTop + '\n' +
      'announcement.bottom: ' + state.announcementBottom + 'px\n' +
      'layout gap: ' + state.layoutGap + 'px\n' +
      'visualViewport.offsetTop: ' + state.visualOffsetTop + 'px\n' +
      'visualViewport.pageTop: ' + state.visualPageTop + 'px\n' +
      'header relative to visual viewport: ' + state.visualRelativeTop + 'px\n' +
      'DOM at screen top: ' + state.domAtTop + '\n' +
      'safe-area top: ' + state.safeAreaTop + 'px\n' +
      'scrollY: ' + state.scrollY + 'px\n' +
      'viewport height: ' + state.visualHeight + ' / ' + state.layoutHeight + 'px\n' +
      'samples: ' + samples.length + ' (max 120)\n' +
      'While the strip is visible, tap Copy and paste the result into chat.';
  };
  const schedule = () => { if (!frame) frame = view.requestAnimationFrame(draw); };
  const listeners = [
    ['scroll', view], ['resize', view], ['pageshow', view],
    ['orientationchange', view], ['scroll', view.visualViewport],
    ['resize', view.visualViewport],
  ];
  for (const [event, target] of listeners) target?.addEventListener(event, schedule, { passive: true });

  const report = () => JSON.stringify({
    purpose: 'CHAPCHITRA opt-in iPad viewport diagnosis; no analytics or cookies',
    browser: view.navigator?.userAgent ?? 'unknown',
    viewportMeta: root.querySelector('meta[name="viewport"]')?.content ?? '',
    route: view.location?.pathname ?? '',
    screen: { width: view.screen?.width, height: view.screen?.height,
      pixelRatio: view.devicePixelRatio },
    ancestors: ancestorStyles(),
    samples,
  }, null, 2);
  button.addEventListener('click', async () => {
    capture();
    const payload = report();
    try {
      await view.navigator.clipboard.writeText(payload);
      message.textContent = 'Copied ' + samples.length + ' measurements. Paste into chat.';
    } catch {
      // iPad permissions may deny Clipboard API. Expose selectable text;
      // do not transmit reports to any external service.
      text.textContent = payload;
      message.textContent = 'Clipboard blocked. Select and copy the report above.';
    }
  });
  view.__ccNavViewport = { measure, samples, report };
  schedule();

  return () => {
    if (frame) view.cancelAnimationFrame(frame);
    for (const [event, target] of listeners) target?.removeEventListener(event, schedule);
    panel.remove();
    probe.remove();
    delete view.__ccNavViewport;
  };
}
