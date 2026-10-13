/**
 * Keep only one gallery iframe live at once. The featured hero remains untouched.
 * Project links remain normal anchors even when scripts or previews are unavailable.
 */
export function selectPreview(candidates, viewportHeight, preferredId = null) {
  const height = Number.isFinite(viewportHeight) && viewportHeight > 0 ? viewportHeight : 0;
  const eligible = candidates.filter(item =>
    item.visible !== false && item.hidden !== true &&
    Number.isFinite(item.top) && Number.isFinite(item.bottom) &&
    item.bottom > 0 && item.top < height
  );
  if (preferredId !== null) {
    const preferred = eligible.find(item => item.id === preferredId);
    if (preferred) return preferred.id;
  }
  eligible.sort((a, b) => {
    const aDistance = Math.abs((a.top + a.bottom) / 2 - height / 2);
    const bDistance = Math.abs((b.top + b.bottom) / 2 - height / 2);
    return aDistance - bDistance;
  });
  return eligible[0]?.id ?? null;
}

export function installGalleryPreviews(doc = document, win = window) {
  const cards = Array.from(doc.querySelectorAll('.works .work')).filter(card =>
    card.querySelector('iframe[data-preview-src]')
  );
  if (cards.length === 0) return () => {};
  let active = null;
  let preferred = null;
  let scheduled = false;
  let disposed = false;

  function refresh() {
    scheduled = false;
    if (disposed) return;
    const candidates = cards.map((card, id) => {
      const rect = card.getBoundingClientRect();
      return {
        id,
        top: rect.top,
        bottom: rect.bottom,
        hidden: card.hidden || card.getAttribute('aria-hidden') === 'true',
        visible: doc.visibilityState !== 'hidden' && rect.width > 0 && rect.height > 0
      };
    });
    const next = selectPreview(candidates, win.innerHeight, preferred);
    if (active === next) return;
    if (active !== null) cards[active].querySelector('iframe').removeAttribute('src');
    active = next;
    if (active !== null) {
      const frame = cards[active].querySelector('iframe');
      frame.setAttribute('src', frame.dataset.previewSrc);
    }
  }

  function schedule() {
    if (scheduled || disposed) return;
    scheduled = true;
    win.requestAnimationFrame(refresh);
  }

  const cleanup = [];
  function listen(node, event, handler, options) {
    node.addEventListener(event, handler, options);
    cleanup.push(() => node.removeEventListener(event, handler, options));
  }
  cards.forEach((card, id) => {
    listen(card, 'pointerenter', () => { preferred = id; schedule(); });
    listen(card, 'pointerleave', () => { if (preferred === id) preferred = null; schedule(); });
    listen(card, 'focusin', () => { preferred = id; schedule(); });
    listen(card, 'focusout', () => { if (preferred === id) preferred = null; schedule(); });
  });
  listen(win, 'scroll', schedule, { passive: true });
  listen(win, 'resize', schedule, { passive: true });
  listen(doc, 'visibilitychange', schedule);
  listen(doc.querySelector('.filters') ?? doc, 'click', schedule);
  schedule();
  return () => {
    disposed = true;
    cleanup.forEach(unlisten => unlisten());
    if (active !== null) cards[active].querySelector('iframe').removeAttribute('src');
    active = null;
  };
}

if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  installGalleryPreviews(document, window);
}
