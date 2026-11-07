// v83 → v84 — Silkbind Jade's Forsaken Fame whirlwind and Spring Sorrow's
// bullet land after their flight (Flying Tornado flies faster, Spring Sorrow
// plays its slow clip below Blossom Barrage rank 3), Lingering Bone lands 0.03 s
// after the hit that applies it and opens Star Reacher's windows, Jadebreak
// lands at 10 f of Emerald Barrier (its cancel included, which also lands the
// hit at 9 f), Spring Sorrow receives Spring Thunder, Peak's Springless
// Silence and Moon Shatter Spring keep their animation's own lengths and
// frames, the throw casts 65.58 f, and the floating umbrella's projectiles no
// longer list Soul-Shaken. A Skill Editor copy seeded before this still
// carries the old shape. Each part is rewritten only while it is still what was
// seeded: once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

const sameValue = (left: unknown, right: unknown): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

const sameIds = (left: unknown, right: readonly string[]): boolean =>
  Array.isArray(left) &&
  left.length === right.length &&
  [...left].sort().join("|") === [...right].sort().join("|")

type Swap<Value> = readonly [from: Value | undefined, to: Value | undefined]

function swapField(
  record: RecordValue,
  key: string,
  swap: Swap<unknown> | undefined,
  matches: (current: unknown, from: unknown) => boolean = sameValue,
): RecordValue {
  if (!swap || !matches(record[key], swap[0])) return record
  const healed = { ...record, [key]: swap[1] }
  if (swap[1] === undefined) delete healed[key]
  return healed
}

interface VariantPatch {
  id: string
  frame?: Swap<number>
  castFrames?: Swap<number>
  projectile?: Swap<unknown>
}

interface HitPatch {
  frame?: Swap<number>
  projectile?: Swap<unknown>
  variants?: readonly VariantPatch[]
  variantsAdded?: readonly unknown[]
}

interface SkillPatch {
  castFrames?: Swap<number>
  reachMeters?: Swap<number>
  receives?: Swap<string[]>
  triggersBuffs?: Swap<string[]>
  triggersBuffsAtFrame?: Swap<Record<string, number>>
  hits?: readonly HitPatch[]
}

const WHIRLWIND_PROJECTILE = {
  speedMetersPerSecond: 20,
  contactAdvanceMeters: 1.75,
  maxTravelFrames: 60,
}
const FLYING_TORNADO_WHIRLWIND_PROJECTILE = { ...WHIRLWIND_PROJECTILE, speedMetersPerSecond: 30 }
const SPRING_SORROW_PROJECTILE = {
  speedMetersPerSecond: 50,
  contactAdvanceMeters: 0.5,
  maxTravelFrames: 300,
}
const SPRING_SORROW_FAST_CLIP_VARIANT = {
  id: "hv-umbq-hit-0-fast-clip",
  label: "Blossom Barrage 3+",
  conditions: [{ param: "blossomBarrage", minTier: 3 }],
  physMultiplier: 2.3397,
  attributeMultiplier: 3.5095,
  physFixed: 648,
  attributeFixed: 353,
  frame: 46.08,
  castFrames: 67.31,
}
const SPRING_SORROW_RECEIVES_BEFORE = [
  "combo",
  "windWall",
  "trajectorySkill",
  "mistwillowHeavyBuff",
  "mistwillowBuff",
  "starweaveMartialBoost",
  "vernalUmbrellaAdditionalAttack",
]
const SPRING_SORROW_RECEIVES_AFTER = [
  "combo",
  "windWall",
  "trajectorySkill",
  "mistwillowHeavyBuff",
  "mistwillowBuff",
  "thunderousBloom",
  "springThunder",
  "starweaveMartialBoost",
  "vernalUmbrellaAdditionalAttack",
]
const MARK_GRANTS = ["lingeringBone", "starReacherSupreme", "starReacher"]
const JADEBREAK_AT_FRAME = { windWall: 10, windWallPursuit: 10 }
const LAUNCH_PATCH: SkillPatch = { castFrames: [66, 65.58] }
const TICK_RECEIVES_BEFORE = [
  "mistwillowHeavyBuff",
  "mistwillowBuff",
  "soulShaken",
  "thunderousBloom",
  "springThunder",
  "combo",
  "comboUmbLightBonus",
  "windWall",
  "trajectorySkill",
  "nonPlayerBaseDamage115",
  "vernalUmbrellaAdditionalAttack",
]
const TICK_RECEIVES_AFTER = TICK_RECEIVES_BEFORE.filter((id) => id !== "soulShaken")
const TICK_PATCH: SkillPatch = { receives: [TICK_RECEIVES_BEFORE, TICK_RECEIVES_AFTER] }

const PATCHES: Readonly<Record<string, SkillPatch>> = {
  "silkbindJade-fanlightcharged": {
    castFrames: [98, 97.8],
    reachMeters: [undefined, 20],
    triggersBuffs: [["lingeringBone"], MARK_GRANTS],
    triggersBuffsAtFrame: [{ lingeringBone: 71 }, undefined],
    hits: [
      {
        frame: [71, 71.4],
        projectile: [undefined, WHIRLWIND_PROJECTILE],
        variants: [
          {
            id: "hv-fanlightcharged-hit-0-flying-tornado",
            castFrames: [86, 86.4],
            projectile: [undefined, FLYING_TORNADO_WHIRLWIND_PROJECTILE],
          },
        ],
      },
    ],
  },
  "silkbindJade-fanspecial": {
    castFrames: [67, 66.8],
    triggersBuffs: [["lingeringBone"], MARK_GRANTS],
    triggersBuffsAtFrame: [{ lingeringBone: 33 }, undefined],
    hits: [{ frame: [33, 33.45] }],
  },
  "silkbindJade-fanq": {
    castFrames: [61, 61.2],
    triggersBuffsAtFrame: [undefined, JADEBREAK_AT_FRAME],
  },
  "silkbindJade-fanqcancel": {
    triggersBuffs: [
      ["jadeware", "windWall", "springThunder"],
      ["jadeware", "windWall", "windWallPursuit", "springThunder"],
    ],
    triggersBuffsAtFrame: [undefined, JADEBREAK_AT_FRAME],
    hits: [{ frame: [0, 9] }],
  },
  "silkbindJade-umbq": {
    castFrames: [67, 87.5],
    receives: [SPRING_SORROW_RECEIVES_BEFORE, SPRING_SORROW_RECEIVES_AFTER],
    hits: [
      {
        frame: [50, 59.8],
        projectile: [undefined, SPRING_SORROW_PROJECTILE],
        variantsAdded: [SPRING_SORROW_FAST_CLIP_VARIANT],
      },
    ],
  },
  "silkbindJade-umbq-prepull": {
    receives: [SPRING_SORROW_RECEIVES_BEFORE, SPRING_SORROW_RECEIVES_AFTER],
  },
  "silkbindJade-umbdronelaunch": LAUNCH_PATCH,
  "silkbindJade-umbdronelaunch-12hit": LAUNCH_PATCH,
  "silkbindJade-umbdronelaunch-16hit": LAUNCH_PATCH,
  "silkbindJade-umbdronelaunch-20hit": LAUNCH_PATCH,
  "silkbindJade-umbdronelaunch-23hit": LAUNCH_PATCH,
  "silkbindJade-umbdronelaunch-26hit": LAUNCH_PATCH,
  "silkbindJade-umbdrone": TICK_PATCH,
  "silkbindJade-umbdrone-12hit": TICK_PATCH,
  "silkbindJade-umbdrone-16hit": TICK_PATCH,
  "silkbindJade-umbdrone-20hit": TICK_PATCH,
  "silkbindJade-umbdrone-23hit": TICK_PATCH,
  "silkbindJade-umbdrone-26hit": TICK_PATCH,
  "silkbindJade-fanheavypursuit-3-hit": {
    castFrames: [93, 93.42],
    hits: [{ frame: [10, 9.66] }, { frame: [34, 33.78] }, { frame: [72, 71.82] }],
  },
  "silkbindJade-fanheavypursuit-5-hit": {
    castFrames: [146, 145.98],
    hits: [
      { frame: [14, 14.05] },
      { frame: [33, 32.51] },
      { frame: [69, 68.97] },
      { frame: [84, 84.2] },
      { frame: [112, 111.9] },
    ],
  },
}

function sameIdList(current: unknown, from: unknown): boolean {
  return Array.isArray(from) ? sameIds(current, from as string[]) : sameValue(current, from)
}

function healVariant(variant: unknown, patches: readonly VariantPatch[]): unknown {
  if (!isRecord(variant)) return variant
  const patch = patches.find((candidate) => candidate.id === variant.id)
  if (!patch) return variant
  return swapField(
    swapField(swapField(variant, "frame", patch.frame), "castFrames", patch.castFrames),
    "projectile",
    patch.projectile,
  )
}

function healHit(hit: unknown, patch: HitPatch | undefined): unknown {
  if (!patch || !isRecord(hit)) return hit
  let healed = swapField(swapField(hit, "frame", patch.frame), "projectile", patch.projectile)
  if (patch.variants && Array.isArray(healed.variants)) {
    const patches = patch.variants
    healed = {
      ...healed,
      variants: healed.variants.map((variant) => healVariant(variant, patches)),
    }
  }
  if (patch.variantsAdded && healed.variants === undefined)
    healed = { ...healed, variants: patch.variantsAdded }
  return healed
}

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES[skill.id]
  if (!patch) return skill
  let healed = skill
  healed = swapField(healed, "castFrames", patch.castFrames)
  healed = swapField(healed, "reachMeters", patch.reachMeters)
  healed = swapField(healed, "receives", patch.receives, sameIdList)
  healed = swapField(healed, "triggersBuffs", patch.triggersBuffs, sameIdList)
  healed = swapField(healed, "triggersBuffsAtFrame", patch.triggersBuffsAtFrame)
  if (patch.hits && Array.isArray(healed.hits)) {
    const hitPatches = patch.hits
    healed = { ...healed, hits: healed.hits.map((hit, index) => healHit(hit, hitPatches[index])) }
  }
  return healed
}

export const V84__jadeHitLandingsGrantsAndClipTimings: CustomSkillMigration = {
  to: 84,
  name: "V84__jadeHitLandingsGrantsAndClipTimings",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 84, skills }
  },
}
