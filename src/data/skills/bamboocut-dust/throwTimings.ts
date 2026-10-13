import type { ChainedThrowTiming, ThrowTiming } from "./throwChain"

interface ThrowTimings<Timing extends ThrowTiming> {
  normal: Timing
  fragrant: Timing
}

// In-game values as of 2026-10-13. The far point is where the phantom is
// summoned; the summon resonance follows it by 18 frames over the play speed.
export const FIRST_THROW: ThrowTimings<ThrowTiming> = {
  normal: {
    castFrames: 68,
    outFrame: 35,
    farPointFrame: 45,
    backFrame: 48,
    windowCloseFrame: 65,
    resonanceDelayFrames: 14,
  },
  fragrant: {
    castFrames: 53,
    outFrame: 27,
    farPointFrame: 34,
    backFrame: 37,
    windowCloseFrame: 50,
    resonanceDelayFrames: 11,
  },
}

export const SECOND_THROW: ThrowTimings<ChainedThrowTiming> = {
  normal: {
    castFrames: 62,
    outFrame: 24,
    farPointFrame: 35,
    backFrame: 38,
    windowCloseFrame: 58,
    replaceStepFrame: 5,
    resonanceDelayFrames: 15,
  },
  fragrant: {
    castFrames: 47,
    outFrame: 19,
    farPointFrame: 27,
    backFrame: 29,
    windowCloseFrame: 44,
    replaceStepFrame: 4,
    resonanceDelayFrames: 11,
  },
}

export const THIRD_THROW: ThrowTimings<ChainedThrowTiming> = {
  normal: {
    castFrames: 70,
    outFrame: 30,
    farPointFrame: 44,
    backFrame: 47,
    windowCloseFrame: 65,
    replaceStepFrame: 5,
    resonanceDelayFrames: 16,
  },
  fragrant: {
    castFrames: 54,
    outFrame: 23,
    farPointFrame: 34,
    backFrame: 36,
    windowCloseFrame: 50,
    replaceStepFrame: 4,
    resonanceDelayFrames: 12,
  },
}

export const FOURTH_THROW: ThrowTimings<ChainedThrowTiming> = {
  normal: {
    castFrames: 64,
    outFrame: 26,
    farPointFrame: 37,
    backFrame: 41,
    windowCloseFrame: 60,
    replaceStepFrame: 5,
    resonanceDelayFrames: 16,
  },
  fragrant: {
    castFrames: 50,
    outFrame: 20,
    farPointFrame: 28,
    backFrame: 31,
    windowCloseFrame: 46,
    replaceStepFrame: 4,
    resonanceDelayFrames: 13,
  },
}
