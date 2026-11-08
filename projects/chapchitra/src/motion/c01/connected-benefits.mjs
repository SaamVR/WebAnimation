/* C01 approved connected benefits. Exactly one clock drives all four original 60fps Lottie playheads and authored V3 connector strokes. */
const DURATION = 10.27;
const FPS = 60;
const STARTS = [0, 2.64, 5.28, 7.67];
const DURATIONS = [2.25, 2.25, 2, 2.1];
const CONNECTIONS = [[2.25, 2.64], [4.89, 5.28], [7.28, 7.67]];
const SOURCES = [
  '/assets/c01/icon-01-print-care-v4.json',
  '/assets/c01/icon-02-easy-payment-v2.json',
  '/assets/c01/icon-03-delivery-v2.json',
  '/assets/c01/icon-04-order-support-v2.json'
];
const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
const NS = 'http://www.w3.org/2000/svg';
let rendererPromise;
function loadRenderer() {
  if (window.lottie?.loadAnimation) return Promise.resolve(window.lottie);
  if (rendererPromise) return rendererPromise;
  rendererPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = '/motion/c01/vendor/lottie.min.js';
    script.async = true;
    script.onload = () => window.lottie?.loadAnimation ? resolve(window.lottie) : reject(new Error('Lottie renderer unavailable'));
    script.onerror = () => reject(new Error('Self-hosted Lottie renderer failed to load'));
    document.head.append(script);
  });
  return rendererPromise;
}
function node(tag, attrs) {
  const element = document.createElementNS(NS, tag);
  for (const [name, value] of Object.entries(attrs)) element.setAttribute(name, value);
  return element;
}
export function mountConnectedBenefits(stage) {
  if (!stage || stage.dataset.c01Mounted) return;
  stage.dataset.c01Mounted = 'true';
  const layer = stage.querySelector('.c01-connectors');
  const slots = [...stage.querySelectorAll('.c01-icon')];
  const canvases = [...stage.querySelectorAll('.c01-lottie')];
  const posters = [...stage.querySelectorAll('.c01-poster')];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 680px)');
  let seconds = 0, visible = false, started = false, failed = false;
  let active = false, raf = 0, previous = null, layoutRAF = 0;
  let actors = [], segments = [], lastFrame = [-1, -1, -1, -1];
  const lastReveal = [NaN, NaN, NaN, NaN];
  function applyIcons() {
    // One authored V3 clock: future slots retain a beige outline matching the
    // inactive connecting line. At their existing 140ms reveal, the outline
    // yields to the original icon + offset frame without changing keyframes.
    slots.forEach((slot, i) => {
      const opacity = reduced.matches || !started || i === 0 ? 1 :
        clamp((seconds - STARTS[i] + .02) / .14, 0, 1);
      if (opacity !== lastReveal[i]) {
        const shell = slot.parentElement;
        shell.style.setProperty('--c01-art-opacity', String(opacity));
        shell.style.setProperty('--c01-guide-opacity', String(.57 * (1 - opacity)));
        lastReveal[i] = opacity;
      }
    });
    if (!actors.length) return;
    actors.forEach((animation, i) => {
      const frame = clamp((seconds - STARTS[i]) * FPS, 0, DURATIONS[i] * FPS - 1);
      if (Math.abs(frame - lastFrame[i]) >= .12) {
        animation.goToAndStop(frame, true);
        lastFrame[i] = frame;
      }
    });
  }
  function applyLines() {
    segments.forEach((segment, i) => {
      const [start, end] = CONNECTIONS[i];
      const ratio = clamp((seconds - start) / (end - start), 0, 1);
      const length = segment.length;
      segment.active.style.strokeDasharray = length + ' ' + length;
      segment.active.style.strokeDashoffset = String(length * (1 - ratio));
      if (ratio > .005 && ratio < .999) {
        const from = Math.max(0, length * ratio - 14);
        const a = segment.active.getPointAtLength(from);
        const b = segment.active.getPointAtLength(length * ratio);
        segment.pulse.setAttribute('d', 'M ' + a.x + ' ' + a.y + ' L ' + b.x + ' ' + b.y);
      } else segment.pulse.setAttribute('d', '');
    });
  }
  function apply() {
    applyIcons();
    applyLines();
  }
  function setProgress(next) {
    seconds = clamp(next, 0, DURATION);
    apply();
  }
  function layout() {
    const rect = stage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const centers = slots.map(slot => {
      const r = slot.getBoundingClientRect();
      return { x: r.left - rect.left + r.width / 2, y: r.top - rect.top + r.height / 2, radius: r.width / 2 };
    });
    layer.setAttribute('viewBox', '0 0 ' + rect.width + ' ' + rect.height);
    layer.replaceChildren();
    segments = [];
    for (let i = 0; i < 3; i++) {
      const a = centers[i], b = centers[i + 1];
      let path;
      if (mobile.matches) {
        const x = (a.x + b.x) / 2, start = a.y + a.radius + 3, end = b.y - b.radius - 3;
        path = 'M ' + x.toFixed(2) + ' ' + start.toFixed(2) +
          ' C ' + (x + 5).toFixed(2) + ' ' + (start + (end - start) * .3).toFixed(2) +
          ' ' + (x - 5).toFixed(2) + ' ' + (start + (end - start) * .68).toFixed(2) +
          ' ' + x.toFixed(2) + ' ' + end.toFixed(2);
      } else {
        const y = (a.y + b.y) / 2, start = a.x + a.radius + 4, end = b.x - b.radius - 4;
        path = 'M ' + start.toFixed(2) + ' ' + y.toFixed(2) +
          ' C ' + (start + (end - start) * .3).toFixed(2) + ' ' + (y - 2.8).toFixed(2) +
          ' ' + (start + (end - start) * .72).toFixed(2) + ' ' + (y + 2.8).toFixed(2) +
          ' ' + end.toFixed(2) + ' ' + y.toFixed(2);
      }
      const guide = node('path', {d: path, class: 'c01-connection-guide'});
      const activePath = node('path', {d: path, class: 'c01-connection-active'});
      const pulse = node('path', {class: 'c01-connection-pulse'});
      layer.append(guide, activePath, pulse);
      segments.push({active: activePath, pulse, length: activePath.getTotalLength()});
    }
    applyLines();
  }
  function requestLayout() {
    if (layoutRAF) return;
    layoutRAF = requestAnimationFrame(() => { layoutRAF = 0; layout(); });
  }
  function pause() {
    active = false;
    previous = null;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }
  function tick(timestamp) {
    if (!active) return;
    if (previous !== null) {
      const delta = Math.max(0, timestamp - previous) / 1000;
      seconds = (seconds + delta) % DURATION;
      apply();
    }
    previous = timestamp;
    raf = requestAnimationFrame(tick);
  }
  function resume() {
    if (active || !started || failed || reduced.matches || !visible || document.hidden) return;
    active = true;
    previous = null;
    raf = requestAnimationFrame(tick);
  }
  function reflectMode() {
    if (reduced.matches) {
      pause();
      setProgress(DURATION);
      // The exact final-pose posters are visible even before the renderer loads.
      stage.dataset.c01Mode = 'static';
    } else {
      stage.dataset.c01Mode = started ? 'animated' : 'poster';
      if (!started && !failed && visible && !document.hidden) void prepare();
      resume();
    }
  }
  async function prepare() {
    if (started || failed || stage.dataset.c01Loading) return;
    stage.dataset.c01Loading = 'true';
    try {
      const [lottie, ...animations] = await Promise.all([
        loadRenderer(),
        ...SOURCES.map(async url => {
          const response = await fetch(url, {cache: 'force-cache'});
          if (!response.ok) throw new Error('C01 original asset HTTP ' + response.status);
          return response.json();
        })
      ]);
      if (animations.some((asset, i) =>
        asset.w !== 512 || asset.h !== 512 || asset.fr !== FPS ||
        asset.op - asset.ip !== DURATIONS[i] * FPS)) {
        throw new Error('C01 original Lottie dimensions or duration mismatch');
      }
      actors = animations.map((asset, i) => lottie.loadAnimation({
        container: canvases[i], renderer: 'svg', loop: false, autoplay: false,
        animationData: asset, rendererSettings: {preserveAspectRatio: 'xMidYMid meet'}
      }));
      await Promise.all(actors.map(animation => new Promise((resolve, reject) => {
        if (animation.isLoaded) { resolve(); return; }
        animation.addEventListener('DOMLoaded', resolve);
        animation.addEventListener('data_failed', () => reject(new Error('Lottie asset rejected')));
      })));
      actors.forEach(animation => animation.pause());
      started = true;
      stage.dataset.c01Ready = 'true';
      canvases.forEach(canvas => { canvas.style.visibility = 'visible'; });
      posters.forEach(poster => { poster.style.visibility = 'hidden'; });
      lastFrame = [-1, -1, -1, -1];
      if (reduced.matches) setProgress(DURATION);
      else setProgress(seconds);
      reflectMode();
    } catch (error) {
      failed = true;
      stage.dataset.c01Mode = 'static';
      pause();
      setProgress(DURATION);
      console.warn('C01 original animation unavailable; final-pose artwork retained.', error);
    } finally {
      delete stage.dataset.c01Loading;
    }
  }
  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(entries => {
        visible = entries.some(entry => entry.isIntersecting);
        if (!visible) pause();
        else reflectMode();
      }, {threshold: 0.01})
    : null;
  if (observer) observer.observe(stage);
  else { visible = true; reflectMode(); }
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause(); else reflectMode();
  });
  reduced.addEventListener('change', reflectMode);
  mobile.addEventListener('change', requestLayout);
  if (typeof ResizeObserver === 'function') new ResizeObserver(requestLayout).observe(stage);
  // At wide viewports, .wrap stays at 1160px while the responsive C01 offsets
  // still change with viewport width; observe resize regardless of stage size.
  window.addEventListener('resize', requestLayout, {passive: true});
  document.fonts?.ready.then(requestLayout);
  layout();
  if (reduced.matches) reflectMode();
  // Read-only review diagnostics; no separate playback clock or event announcements.
  window.__chapchitraC01 = {
    get seconds() { return seconds; },
    get playing() { return active; },
    get ready() { return started; },
    get failed() { return failed; },
    get visible() { return visible; },
    get reduced() { return reduced.matches; },
    get connectors() { return segments.length; },
    get duration() { return DURATION; },
    pause, resume,
    seekForQA: (t) => { pause(); setProgress(t); },
    layoutForQA: layout
  };
}
