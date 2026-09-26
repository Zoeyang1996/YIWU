/** Browser suspension and clock resets must never reverse or explode interpolation. */
export function animationStep(now: number, previous: number, reduced = false) {
  const dt = Math.max(0, Math.min((now - previous) / 1000, .05));
  return { dt, ease: 1 - Math.exp(-dt * (reduced ? 22 : 4)) };
}
