// computeGroundDepth
export function computeGroundDepth(
  bottomVh: number,
  jitter = 0,
  categoryOffset = 0
) {
  const Z_TOP = 6000;   // big base so background layers never collide
  const SCALE = 50;     // how many z units per vh
  const j = Math.round(jitter);

  // smaller bottomVh = closer to top of screen = lower z
  // larger bottomVh = lower on screen = higher z
  return Z_TOP - Math.round(bottomVh * SCALE) + j + categoryOffset;
}
