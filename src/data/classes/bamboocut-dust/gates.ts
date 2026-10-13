import type { Buff } from "../../../engine/buff"
import { defineGateBuff } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { PARAM } from "../../skills/buffs/ids"
import { ROLE } from "../../skills/ids"
import { STATUS } from "../../skills/bamboocut-dust/ids"
import { fadingCrimsonMeter } from "./meters"

const CLASS_ID = "bamboocutDust"
const CREATED_AT = "2026-10-12T00:00:00.000Z"

// In-game values as of 2026-10-12.
export const FLOWER_BURIAL_DURATION_FRAMES = 720
export const FALLING_BLOSSOMS_DURATION_FRAMES = 300
export const FALLING_BLOSSOMS_STACKS_FOR_FRAGRANT_SONG = 3
export const FRAGRANT_SONG_DURATION_FRAMES = 600
export const FRAGRANT_SONG_DELICATE_DURATION_FRAMES = 600
export const PHANTOM_UMBRELLA_DURATION_FRAMES = 300
export const CYCLONE_AWARENESS_DURATION_FRAMES = 156
export const SOULBOUND_DURATION_FRAMES = 3600 * 60
export const PIERCING_DART_READY_DURATION_FRAMES = 1800
export const SOUL_RETURN_DURATION_FRAMES = 720
export const SOUL_RETURN_TOWLINE_SWEEP_DURATION_FRAMES = 1260

export const BAMBOOCUT_DUST_GATES: readonly Buff[] = [
  defineGateBuff({
    id: STATUS.flowerBurial,
    classId: CLASS_ID,
    name: "Flower Burial",
    description: "Scarlet Spin re-throws; Fading Crimson does not regenerate.",
    scope: "player",
    activation: "triggered",
    durationFrames: FLOWER_BURIAL_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    meterModifiers: [{ meterId: fadingCrimsonMeter.id, kind: "regen", amount: -1 }],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.fallingBlossoms,
    classId: CLASS_ID,
    name: "Falling Blossoms",
    description: "Three stacks within 5 s become Fragrant Song.",
    scope: "player",
    activation: "triggered",
    durationFrames: FALLING_BLOSSOMS_DURATION_FRAMES,
    effects: [],
    maxStacks: FALLING_BLOSSOMS_STACKS_FOR_FRAGRANT_SONG,
    stackScaling: "flat",
    onExpire: { targetId: STATUS.fallingBlossoms, stacks: 0 },
    onMaxStacks: [
      applyBuff({ target: STATUS.fragrantSong }),
      applyBuff({ target: STATUS.fragrantSongDelicate }),
      applyBuff({
        target: STATUS.fallingBlossoms,
        stacks: -FALLING_BLOSSOMS_STACKS_FOR_FRAGRANT_SONG,
      }),
    ],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.fragrantSong,
    classId: CLASS_ID,
    name: "Fragrant Song",
    description: "The next throw flies 30% faster, always crits and opens its catch window early.",
    scope: "player",
    activation: "triggered",
    durationFrames: FRAGRANT_SONG_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.fragrantSongLogic,
    classId: CLASS_ID,
    name: "Fragrant Song Logic",
    description: "Marks the throw cast under Fragrant Song.",
    scope: "player",
    activation: "triggered",
    durationFrames: FRAGRANT_SONG_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.fragrantSongDelicate,
    classId: CLASS_ID,
    name: "Fragrant Song - Delicate",
    description: "Dreamwrought Bubbles needs no charging.",
    scope: "player",
    activation: "triggered",
    durationFrames: FRAGRANT_SONG_DELICATE_DURATION_FRAMES,
    effects: [],
    maxStacks: 4,
    stackScaling: "flat",
    requiresParam: PARAM.phantomRally,
    onExpire: { targetId: STATUS.fragrantSongDelicate, stacks: 0 },
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.phantomUmbrella,
    classId: CLASS_ID,
    name: "Phantom Umbrella",
    description: "Anchors the resonance hits.",
    scope: "player",
    activation: "triggered",
    durationFrames: PHANTOM_UMBRELLA_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.cycloneAwareness,
    classId: CLASS_ID,
    name: "Cyclone Awareness",
    description: "Cyclone Waltz can be recast.",
    scope: "player",
    activation: "triggered",
    durationFrames: CYCLONE_AWARENESS_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.soulbound,
    classId: CLASS_ID,
    name: "Soulbound",
    description: "The next Piercing Dart applies Soul Loss with every sweep.",
    scope: "player",
    activation: "triggered",
    durationFrames: SOULBOUND_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.soulboundRelease,
    classId: CLASS_ID,
    name: "Soulbound Release",
    description: "Marks the Piercing Dart cast that consumed Soulbound.",
    scope: "player",
    activation: "triggered",
    durationFrames: 1,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.piercingDartReady,
    classId: CLASS_ID,
    name: "Piercing Dart Ready",
    description: "The charging stance is held; Piercing Dart can be released.",
    scope: "player",
    activation: "triggered",
    durationFrames: PIERCING_DART_READY_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
  defineGateBuff({
    id: STATUS.soulReturn,
    classId: CLASS_ID,
    name: "Soul Return",
    description: "Martial Art Skills cost half the Fading Crimson.",
    scope: "player",
    activation: "triggered",
    durationFrames: SOUL_RETURN_DURATION_FRAMES,
    effects: [],
    maxStacks: 1,
    stackScaling: "flat",
    meterModifiers: [
      { meterId: fadingCrimsonMeter.id, kind: "cost", amount: -0.5, tag: ROLE.dustMartialArtSkill },
    ],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }),
]
