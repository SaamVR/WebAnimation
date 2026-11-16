/**
 * Visible dwell clock for CHAPCHITRA's approved five-slide hero.
 * C08 can lock a completed deadline, but its playing time is INCLUDED
 * in the eight-second first slide instead of being an extra delay.
 */
export const HERO_DWELL_MS = Object.freeze([8000, 4000, 4000, 4000, 4000]);

export function createHeroCarouselClock({
  onAdvance,
  canRun = () => true,
  isLocked = () => false,
  now = () => performance.now(),
  setTimer = (callback, delay) => setTimeout(callback, delay),
  clearTimer = handle => clearTimeout(handle)
}) {
  let active = 0;
  let remaining = HERO_DWELL_MS[0];
  let startedAt = null;
  let timer = null;

  function pause() {
    if (startedAt !== null) {
      remaining = Math.max(0, remaining - Math.max(0, now() - startedAt));
      startedAt = null;
    }
    if (timer !== null) {
      clearTimer(timer);
      timer = null;
    }
  }
  function tryAdvance() {
    if (remaining <= 0 && canRun() && !isLocked()) {
      onAdvance((active + 1) % HERO_DWELL_MS.length);
    }
  }
  function resume() {
    if (startedAt !== null || !canRun()) return;
    if (remaining <= 0) { tryAdvance(); return; }
    startedAt = now();
    timer = setTimer(() => {
      pause();
      if (remaining > 0) resume();
      else tryAdvance();
    }, remaining);
  }
  function startSlide(index) {
    if (!Number.isInteger(index) || index < 0 || index >= HERO_DWELL_MS.length) {
      throw new RangeError('Invalid hero slide');
    }
    pause();
    active = index;
    remaining = HERO_DWELL_MS[index];
    resume();
  }
  function snapshot() {
    const elapsed = startedAt === null ? 0 : Math.max(0, now() - startedAt);
    return {slide:active, remainingMs:Math.max(0, remaining - elapsed),
      running:startedAt !== null, waitingForC08:remaining <= 0 && isLocked()};
  }
  return {startSlide, pause, resume, snapshot};
}
