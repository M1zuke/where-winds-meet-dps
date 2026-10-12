import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, castSkill, clearStatus, meterDelta } from "../../../definitions/skills/triggers"
import type { HitTrigger, HitVariant, Skill, TriggerCondition } from "../../../engine/skill"
import {
  fadingCrimsonCost,
  fadingCrimsonMeter,
  fadingCrimsonRequires,
} from "../../classes/bamboocut-dust/meters"
import { BUFF, PARAM } from "../buffs/ids"
import { ATTUNE, PROP, ROLE, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { THROW_RECEIVES } from "./receives"

const OUT_HIT = {
  physMultiplier: 1.08504,
  attributeMultiplier: 1.62756,
  physFixed: 300.6,
  attributeFixed: 163.8,
}

const BACK_HIT = {
  physMultiplier: 0.72336,
  attributeMultiplier: 1.08504,
  physFixed: 200.4,
  attributeFixed: 109.2,
}

const NO_DAMAGE = {
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
}

const FRAGRANT_SONG_UP: TriggerCondition = { buffId: STATUS.fragrantSong, op: "gte", stacks: 1 }
const FRAGRANT_SONG_DOWN: TriggerCondition = { buffId: STATUS.fragrantSong, op: "lt", stacks: 1 }
const PHANTOM_UMBRELLA_UP: TriggerCondition = {
  buffId: STATUS.phantomUmbrella,
  op: "gte",
  stacks: 1,
}

const FADING_CRIMSON_PER_THROW = 25
const FADING_CRIMSON_PER_CATCH = 10
const CATCH_FLOWER_BURIAL_END_THRESHOLD = 2
const CATCH_PRESS_DELAY_FRAMES = 1

export interface ThrowTiming {
  castFrames: number
  outFrame: number
  backFrame: number
  windowCloseFrame: number
  resonanceDelayFrames: number
}

export interface ChainedThrowTiming extends ThrowTiming {
  replaceStepFrame: number
}

interface ThrowIdentity {
  id: string
  name: string
  castTag: Skill["castTag"]
  offeredCatchId: string
  phantomMinTier: number
}

interface FirstThrowSpec extends ThrowIdentity {
  kind: "first"
  normal: ThrowTiming
  fragrant: ThrowTiming
}

interface ChainedThrowSpec extends ThrowIdentity {
  kind: "rethrow" | "catch"
  normal: ChainedThrowTiming
  fragrant: ChainedThrowTiming
}

export type ThrowSpec = FirstThrowSpec | ChainedThrowSpec

function fragrantVariant(
  coefficients: typeof NO_DAMAGE,
  override: Pick<HitVariant, "frame" | "castFrames">,
): HitVariant {
  return {
    id: "fragrant-song",
    label: "Fragrant Song",
    conditions: [FRAGRANT_SONG_UP],
    ...coefficients,
    ...override,
  }
}

function phantomTriggers(spec: ThrowSpec): HitTrigger[] {
  return [
    applyBuff({
      target: STATUS.phantomUmbrella,
      requiresParam: PARAM.phantomRally,
      ...(spec.phantomMinTier > 1 ? { requiresMinTier: spec.phantomMinTier } : {}),
    }),
  ]
}

function resonanceTriggers(spec: ThrowSpec): HitTrigger[] {
  return [
    castSkill({
      target: SKILL.resonance,
      conditions: [PHANTOM_UMBRELLA_UP],
      requiresParam: PARAM.phantomRally,
      ...(spec.phantomMinTier > 1 ? { requiresMinTier: spec.phantomMinTier } : {}),
    }),
  ]
}

function catchRewardTriggers(): HitTrigger[] {
  return [
    applyBuff({ target: STATUS.fallingBlossoms }),
    meterDelta({
      target: fadingCrimsonMeter.id,
      stacks: FADING_CRIMSON_PER_CATCH,
      requiresParam: PARAM.phantomRally,
    }),
    castSkill({
      target: SKILL.resonance,
      conditions: [PHANTOM_UMBRELLA_UP],
      requiresParam: PARAM.phantomRally,
    }),
  ]
}

export function throwSkill(spec: ThrowSpec): Skill {
  const { normal, fragrant } = spec
  const damagingHit = (
    coefficients: typeof OUT_HIT,
    frames: { normal: number; fragrant: number },
    extra: { triggers?: HitTrigger[]; fragrantCastFrames?: number } = {},
  ) => ({
    frame: frames.normal,
    ...coefficients,
    triggers: extra.triggers,
    variants: [
      fragrantVariant(coefficients, {
        frame: frames.fragrant,
        castFrames: extra.fragrantCastFrames,
      }),
    ],
  })
  const flowerBurialEnd = (threshold: number) =>
    clearStatus({
      target: STATUS.flowerBurial,
      condition: fadingCrimsonRequires("lte", threshold),
    })
  const pacingHit =
    spec.kind === "first"
      ? {
          frame: 0,
          ...NO_DAMAGE,
          triggers: [applyBuff({ target: STATUS.flowerBurial })],
        }
      : spec.kind === "rethrow"
        ? {
            frame: 1,
            ...NO_DAMAGE,
            triggers: [flowerBurialEnd(0)],
          }
        : {
            frame: spec.normal.replaceStepFrame,
            ...NO_DAMAGE,
            variants: [fragrantVariant(NO_DAMAGE, { frame: spec.fragrant.replaceStepFrame })],
            triggers: [flowerBurialEnd(CATCH_FLOWER_BURIAL_END_THRESHOLD)],
          }
  // A variant's cast length outranks `castFramesWhenGated`, so the Fragrant
  // Song window close rides a variant on this marker, which must precede the
  // out hit's own variant.
  const hitSpecs = [
    {
      frame: fragrant.outFrame + CATCH_PRESS_DELAY_FRAMES,
      ...NO_DAMAGE,
      conditions: [FRAGRANT_SONG_UP],
      requiresNextStepSkillIds: [spec.offeredCatchId],
      variants: [
        {
          id: "fragrant-song-window-close",
          label: "Fragrant Song",
          conditions: [],
          ...NO_DAMAGE,
          castFrames: fragrant.windowCloseFrame,
        },
      ],
      triggers: catchRewardTriggers(),
    },
    {
      frame: normal.outFrame + CATCH_PRESS_DELAY_FRAMES,
      ...NO_DAMAGE,
      conditions: [FRAGRANT_SONG_DOWN],
      requiresNextStepSkillIds: [spec.offeredCatchId],
      castFramesWhenGated: normal.windowCloseFrame,
      triggers: catchRewardTriggers(),
    },
    {
      // One frame after the start: the ledger a variant reads at the cast's
      // start frame already holds this frame's writes, so consuming the
      // Fragrant Song on the start frame would hide it from its own cast.
      frame: 1,
      ...NO_DAMAGE,
      conditions: [FRAGRANT_SONG_UP],
      triggers: [
        applyBuff({ target: STATUS.fragrantSongLogic, durationFrames: fragrant.castFrames }),
        applyBuff({ target: STATUS.fragrantSong, stacks: -1 }),
      ],
    },
    pacingHit,
    damagingHit(
      OUT_HIT,
      { normal: normal.outFrame, fragrant: fragrant.outFrame },
      { triggers: phantomTriggers(spec), fragrantCastFrames: fragrant.castFrames },
    ),
    damagingHit(BACK_HIT, { normal: normal.backFrame, fragrant: fragrant.backFrame }),
    {
      frame: normal.outFrame + normal.resonanceDelayFrames,
      ...NO_DAMAGE,
      variants: [
        fragrantVariant(NO_DAMAGE, {
          frame: fragrant.outFrame + fragrant.resonanceDelayFrames,
        }),
      ],
      triggers: resonanceTriggers(spec),
    },
  ]
  return defineSkill({
    id: spec.id,
    classId: "bamboocutDust",
    name: spec.name,
    breakdownName: "Scarlet Spin",
    tags: [
      WEAPON.umbrella,
      ROLE.dustMartialArtSkill,
      PROP.isMartialSkillQ,
      ATTUNE.everspringMartialArt,
    ],
    skillType: "weapon",
    weaponOrAttribute: "Umbrella",
    attributeAttack: "Bamboocut",
    castTag: spec.castTag,
    receives: THROW_RECEIVES,
    triggersBuffs: [BUFF.jadeware, BUFF.springThunder],
    castConditions:
      spec.kind === "first"
        ? [
            fadingCrimsonRequires("gte", FADING_CRIMSON_PER_THROW),
            { buffId: STATUS.flowerBurial, op: "lt", stacks: 1 },
          ]
        : [{ buffId: STATUS.flowerBurial, op: "gte", stacks: 1 }],
    meterCosts: [fadingCrimsonCost(FADING_CRIMSON_PER_THROW)],
    castFrames: normal.castFrames,
    triggerable: false,
    hits: hitSpecs.map((hitSpec, index) => hit(index, hitSpec)),
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z",
  })
}
