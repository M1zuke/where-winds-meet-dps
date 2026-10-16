export const AFTER_HIT_SEC = 1e-6

// The step between two damaging hits on one frame must clear a grant's lead
// behind its own hit, or the next hit would not read it.
export const SAME_FRAME_STEP_SEC = 2 * AFTER_HIT_SEC
