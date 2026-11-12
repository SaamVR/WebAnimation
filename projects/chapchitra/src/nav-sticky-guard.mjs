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
  // Opt-in A/B probe for Safari/Chrome's browser-owned top surface.
  // Changes only background COLOR (not geometry), only in ?navdebug=1.
  // Restored automatically when toggled off or diagnostic is disposed.
  const tintButton=root.createElement('button');
  tintButton.type='button';
  tintButton.textContent='Test browser-edge color';
  tintButton.style.cssText=button.style.cssText+'margin:7px 0 0;';
  let tintProbeActive=false;
  const initialHtmlBackground=root.documentElement.style.backgroundColor;
  const initialBodyBackground=root.body.style.backgroundColor;
  const restoreBackground=()=>{
    root.documentElement.style.backgroundColor=initialHtmlBackground;
    root.body.style.backgroundColor=initialBodyBackground;
  };
  panel.append(text, button, tintButton, message);
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
    // A physical iPad screenshot alone cannot identify whether a strip
    // belongs to the browser toolbar, the DOM layout, or the compositor.
    // Capture all requested boxes and the DOM point immediately below chrome.
    const app = root.getElementById('app');
    const main = root.getElementById('main');
    const nodes = { html:root.documentElement, body:root.body,
      app, announcement, siteHeader:header, main };
    const boxOf = element => {
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      const css = view.getComputedStyle(element);
      return {
        x:round(rect.x),y:round(rect.y),top:round(rect.top),
        bottom:round(rect.bottom),height:round(rect.height),
        left:round(rect.left),right:round(rect.right),
        width:round(rect.width),
        marginTop:css.marginTop,marginBottom:css.marginBottom,
        paddingTop:css.paddingTop,paddingBottom:css.paddingBottom,
        position:css.position,topCSS:css.top,
        transform:css.transform,translate:css.translate,
        background:css.backgroundColor
      };
    };
    const rectangles = Object.fromEntries(
      Object.entries(nodes).map(([name,element])=>[name,boxOf(element)])
    );
    const atVisualTop = Math.min(Math.max(2,(view.innerHeight ?? 3)-1),
      Math.max(2,Math.floor((view.visualViewport?.offsetTop ?? 0)+2)));
    const announceTop = rectangles.announcement?.top ?? NaN;
    const pointAtTop = root.elementFromPoint(cx,cy);
    const pointAtVisual = root.elementFromPoint(cx,atVisualTop);
    const topDiagnosis = Math.abs(state.scrollY)<2 && Math.abs(announceTop)<2 &&
      announcement.contains(pointAtTop)
      ? 'document-starts-at-viewport-top; screenshot-only strip is outside DOM or compositor'
      : announceTop>2 && state.scrollY<2
        ? 'document-announcement-displaced; inspect html/body/#app boxes and computed spacing'
        : 'scroll/overlay/viewport-dependent; inspect full geometry';
    return {
      ...state,
      rectangles,
      topDiagnosis,
      samplePoints:{
        viewportTop:{x:cx,y:cy,element:describeElement(pointAtTop)},
        visualTop:{x:cx,y:atVisualTop,element:describeElement(pointAtVisual)}
      },
      scrollRestoration:view.history?.scrollRestoration ?? 'unknown',
      docClientHeight:root.documentElement?.clientHeight ?? 0,
      docScrollHeight:root.documentElement?.scrollHeight ?? 0,
      bodyScrollHeight:root.body?.scrollHeight ?? 0,
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
    // Use event-time measurements so iPad Safari / background WebKit does
    // not lose the trace when requestAnimationFrame is throttled.
    // The stylesheet may settle after the first measure; never show stale
    // early body-margin pixels in the read-only diagnostic panel.
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
      'document/paint diagnosis: ' + state.topDiagnosis + '\n' +
      'root/announcement/header tops: ' +
      [state.rectangles.html?.top,state.rectangles.body?.top,
       state.rectangles.app?.top,state.rectangles.announcement?.top,
       state.rectangles.siteHeader?.top].join(' / ') + 'px\n' +
      'safe-area top: ' + state.safeAreaTop + 'px\n' +
      'browser-edge color probe: ' + (tintProbeActive?'ON (Terracotta)':'OFF') + '\n' +
      'scrollY: ' + state.scrollY + 'px\n' +
      'viewport height: ' + state.visualHeight + ' / ' + state.layoutHeight + 'px\n' +
      'samples: ' + samples.length + ' (max 120)\n' +
      'While the strip is visible, tap Copy and paste the result into chat.';
  };
  const schedule = () => {
    capture();
    if (!frame) frame = view.requestAnimationFrame(draw);
  };
  const listeners = [
    ['scroll', view], ['resize', view], ['pageshow', view],
    ['load', view], ['focus', view],
    ['orientationchange', view], ['scroll', view.visualViewport],
    ['resize', view.visualViewport],
  ];
  for (const [event, target] of listeners) target?.addEventListener(event, schedule, { passive: true });

  tintButton.addEventListener('click',()=>{
    tintProbeActive=!tintProbeActive;
    if(tintProbeActive){
      // Contrasting brand Terracotta makes page-tinted native browser pixels
      // distinguishable from a page-layout gap; no offsets/margins/scrolling.
      root.documentElement.style.backgroundColor='#8A503B';
      root.body.style.backgroundColor='#8A503B';
      message.textContent='Color probe ON. Compare the top strip visually, then tap again to restore.';
    }else{
      restoreBackground();
      message.textContent='Color probe OFF; original page colors restored.';
    }
    schedule();
  });
  const report = () => JSON.stringify({
    browserEdgeColorProbeActive:tintProbeActive,
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
    restoreBackground();
    panel.remove();
    probe.remove();
    delete view.__ccNavViewport;
  };
}
