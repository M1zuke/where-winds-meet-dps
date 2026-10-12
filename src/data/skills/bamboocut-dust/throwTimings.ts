import type { ChainedThrowTiming, ThrowTiming } from "./throwChain"

interface ThrowTimings<Timing extends ThrowTiming> {
  normal: Timing
  fragrant: Timing
}

// In-game values as of 2026-10-12. The umbrella's hit frames are not
// measurable: each out hit sits at the far point of the throw and the back hit
// one frame later — provisional frames, bounded by the cast length. The
// summon resonance follows the far point by 18 frames over the play speed.
export const FIRST_THROW: ThrowTimings<ThrowTiming> = {
  normal: {
    castFrames: 68,
    outFrame: 45,
    backFrame: 46,
    windowOpenFrame: 37,
    windowCloseFrame: 65,
    resonanceDelayFrames: 14,
  },
  fragrant: {
    castFrames: 53,
    outFrame: 34,
    backFrame: 35,
    windowOpenFrame: 18,
    windowCloseFrame: 50,
    resonanceDelayFrames: 11,
  },
}

export const SECOND_THROW: ThrowTimings<ChainedThrowTiming> = {
  normal: {
    castFrames: 62,
    outFrame: 35,
    backFrame: 36,
    windowOpenFrame: 25,
    windowCloseFrame: 58,
    replaceStepFrame: 5,
    resonanceDelayFrames: 15,
  },
  fragrant: {
    castFrames: 47,
    outFrame: 27,
    backFrame: 28,
    windowOpenFrame: 15,
    windowCloseFrame: 44,
    replaceStepFrame: 4,
    resonanceDelayFrames: 12,
  },
}

export const THIRD_THROW: ThrowTimings<ChainedThrowTiming> = {
  normal: {
    castFrames: 70,
    outFrame: 44,
    backFrame: 45,
    windowOpenFrame: 33,
    windowCloseFrame: 65,
    replaceStepFrame: 5,
    resonanceDelayFrames: 16,
  },
  fragrant: {
    castFrames: 54,
    outFrame: 34,
    backFrame: 35,
    windowOpenFrame: 21,
    windowCloseFrame: 50,
    replaceStepFrame: 4,
    resonanceDelayFrames: 13,
  },
}

export const FOURTH_THROW: ThrowTimings<ChainedThrowTiming> = {
  normal: {
    castFrames: 64,
    outFrame: 37,
    backFrame: 38,
    windowOpenFrame: 27,
    windowCloseFrame: 60,
    replaceStepFrame: 5,
    resonanceDelayFrames: 16,
  },
  fragrant: {
    castFrames: 50,
    outFrame: 28,
    backFrame: 29,
    windowOpenFrame: 17,
    windowCloseFrame: 46,
    replaceStepFrame: 4,
    resonanceDelayFrames: 13,
  },
}
