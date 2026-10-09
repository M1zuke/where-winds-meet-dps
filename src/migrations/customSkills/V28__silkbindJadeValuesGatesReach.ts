// v27 → v28 — Silkbind Jade's in-game accuracy pass: the non-player damage
// factors on Forsaken Fame, Moon Shatter Spring, the floating umbrella's
// projectiles and Spring Away, the ballistic penetration and crit-damage
// talent reach, the Blossom Barrage / Mistwillow reach on Spring Sorrow and
// Spring Away, Spring Away's level-100 flats and lift hit, Umb HeavyLight's
// heavy-share split, Unfading Flower's throw and FanQCancel's Windrider
// grant. A Skill Editor copy seeded before any of it still carries the old
// shape for that skill. Only a copy still identical to what was seeded is
// rewritten — once it differs, a stale copy and a deliberate edit are
// indistinguishable.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

interface FieldSnapshot {
  tags?: unknown
  receives?: unknown
  triggersBuffs?: unknown
  hits?: unknown
}

function droneTickHit(
  physMultiplier: number,
  physFixed: number,
  attributeMultiplier: number,
  attributeFixed: number,
) {
  return [
    {
      id: "hit-0",
      frame: 0,
      physMultiplier,
      attributeMultiplier,
      physFixed,
      attributeFixed,
      extraCritDamage: 1,
      triggers: [],
    },
  ]
}

function droneLaunchHit(debuffId: string, physFixed: number, extraCritDamage: number) {
  return [
    {
      id: "hit-0",
      frame: 0,
      physMultiplier: 0.54,
      attributeMultiplier: 0.81,
      physFixed,
      attributeFixed: 81.5,
      extraCritDamage,
      triggers: [{ kind: "applyDebuff", targetId: debuffId, stacks: 1, condition: null }],
    },
  ]
}

const DRONE_TICK_IDS = [
  "silkbindJade-umbdrone",
  "silkbindJade-umbdrone-12hit",
  "silkbindJade-umbdrone-16hit",
  "silkbindJade-umbdrone-20hit",
  "silkbindJade-umbdrone-23hit",
  "silkbindJade-umbdrone-26hit",
]

const DRONE_LAUNCH_DEBUFF_BY_ID: Record<string, string> = {
  "silkbindJade-umbdronelaunch": "debuff-silkbindJade-umbdrone",
  "silkbindJade-umbdronelaunch-12hit": "debuff-silkbindJade-umbdrone-12hit",
  "silkbindJade-umbdronelaunch-16hit": "debuff-silkbindJade-umbdrone-16hit",
  "silkbindJade-umbdronelaunch-20hit": "debuff-silkbindJade-umbdrone-20hit",
  "silkbindJade-umbdronelaunch-23hit": "debuff-silkbindJade-umbdrone-23hit",
  "silkbindJade-umbdronelaunch-26hit": "debuff-silkbindJade-umbdrone-26hit",
}

const OLD: Record<string, FieldSnapshot> = {
  "silkbindJade-fanlightcharged": {
    receives: [
      "windWall",
      "pursuitChargedBoost",
      "thunderousBloom",
      "springThunder",
      "mistwillowHeavyBuff",
      "mistwillowBuff",
      "inkwellFanAdditionalAttack",
    ],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.9044,
        attributeMultiplier: 2.8566000000000003,
        physFixed: 527,
        attributeFixed: 287,
        extraCritDamage: 1,
        triggers: [],
      },
    ],
  },
  "silkbindJade-fanheavypursuit-3-hit": {
    receives: [
      "windWallPursuit",
      "lowQiFollowUp",
      "thunderousBloom",
      "springThunder",
      "mistwillowLightBuff",
      "mistwillowBuff",
      "inkwellFanAdditionalAttack",
    ],
    hits: [0, 30, 60].map((frame, index) => ({
      id: `hit-${index}`,
      frame,
      physMultiplier: 0.4159333333333333,
      attributeMultiplier: 0.6238666666666667,
      physFixed: 115.33333333333333,
      attributeFixed: 62.66666666666667,
      extraCritDamage: 1,
      triggers: [],
    })),
  },
  "silkbindJade-fanheavypursuit-5-hit": {
    receives: [
      "windWallPursuit",
      "lowQiFollowUp",
      "thunderousBloom",
      "springThunder",
      "mistwillowLightBuff",
      "mistwillowBuff",
      "inkwellFanAdditionalAttack",
    ],
    hits: [0, 30, 60, 90, 120].map((frame, index) => ({
      id: `hit-${index}`,
      frame,
      physMultiplier: 0.6037,
      attributeMultiplier: 0.90556,
      physFixed: 167,
      attributeFixed: 91,
      extraCritDamage: 1,
      triggers: [],
    })),
  },
  "silkbindJade-umbq": {
    tags: [
      "prop:isMartialSkillQ",
      "prop:hasQiBreakPhysPen",
      "weapon:Umbrella",
      "attune:umbQ",
      "role:umbQ",
    ],
    receives: ["combo", "windWall", "trajectorySkill", "vernalUmbrellaAdditionalAttack"],
    triggersBuffs: ["jadeware", "combo", "comboUmbLightBonus", "springThunder"],
  },
  "silkbindJade-umbq-prepull": {
    tags: [
      "prop:isMartialSkillQ",
      "prop:hasQiBreakPhysPen",
      "weapon:Umbrella",
      "attune:umbQ",
      "role:umbQ",
    ],
    receives: ["combo", "windWall", "trajectorySkill", "vernalUmbrellaAdditionalAttack"],
    triggersBuffs: ["jadeware", "combo", "comboUmbLightBonus", "springThunder"],
  },
  "silkbindJade-umblightcharge": {
    receives: [
      "mistwillowHeavyBuff",
      "mistwillowBuff",
      "combo",
      "comboUmbLightBonus",
      "windWall",
      "pursuitChargedBoost",
      "trajectorySkill",
      "thunderousBloom",
      "springThunder",
      "vernalUmbrellaAdditionalAttack",
    ],
    hits: [0, 10, 20, 30, 40, 50].map((frame, index) => ({
      id: `hit-${index}`,
      frame,
      physMultiplier: 0.2862166666666667,
      attributeMultiplier: 0.42933333333333334,
      physFixed: 66,
      attributeFixed: 36.833333333333336,
      extraCritDamage: 1,
      triggers: [],
    })),
  },
  "silkbindJade-umb-heavylight": {
    receives: [
      "thunderousBloom",
      "springThunder",
      "mistwillowHeavyBuff",
      "mistwillowLightBuff",
      "mistwillowBuff",
      "vernalUmbrellaAdditionalAttack",
    ],
    hits: [0, 25, 50].map((frame, index) => ({
      id: `hit-${index}`,
      frame,
      physMultiplier: 0.5667,
      attributeMultiplier: 0.8500666666666666,
      physFixed: 157,
      attributeFixed: 85.33333333333333,
      extraCritDamage: 0,
      triggers: [],
    })),
  },
  "silkbindJade-fanqcancel": {
    triggersBuffs: ["jadeware", "windWall", "windWallPursuit", "springThunder"],
  },
}

const NEW: Record<string, FieldSnapshot> = {
  "silkbindJade-fanlightcharged": {
    receives: [
      "windWall",
      "pursuitChargedBoost",
      "thunderousBloom",
      "springThunder",
      "mistwillowHeavyBuff",
      "mistwillowBuff",
      "nonPlayerBaseDamage145",
      "inkwellFanAdditionalAttack",
    ],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 1.9044,
        attributeMultiplier: 2.8566,
        physFixed: 527,
        attributeFixed: 287,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "silkbindJade-fanheavypursuit-3-hit": {
    receives: [
      "windWallPursuit",
      "lowQiFollowUp",
      "thunderousBloom",
      "springThunder",
      "mistwillowLightBuff",
      "mistwillowBuff",
      "nonPlayerBaseDamage145",
      "inkwellFanAdditionalAttack",
    ],
    hits: [0, 30, 60].map((frame, index) => ({
      id: `hit-${index}`,
      frame,
      physMultiplier: 0.4159333333333333,
      attributeMultiplier: 0.6238666666666667,
      physFixed: 115.33333333333333,
      attributeFixed: 62.666666666666664,
      extraCritDamage: 1,
      triggers: [],
    })),
  },
  "silkbindJade-fanheavypursuit-5-hit": {
    receives: [
      "windWallPursuit",
      "lowQiFollowUp",
      "thunderousBloom",
      "springThunder",
      "mistwillowLightBuff",
      "mistwillowBuff",
      "nonPlayerBaseDamage145",
      "inkwellFanAdditionalAttack",
    ],
    hits: [0, 30, 60, 90, 120].map((frame, index) => ({
      id: `hit-${index}`,
      frame,
      physMultiplier: 0.6037,
      attributeMultiplier: 0.90556,
      physFixed: 167,
      attributeFixed: 91,
      extraCritDamage: 1,
      triggers: [],
    })),
  },
  "silkbindJade-umbq": {
    tags: [
      "prop:isMartialSkillQ",
      "prop:hasQiBreakPhysPen",
      "weapon:Umbrella",
      "attack:light",
      "attune:umbQ",
      "role:umbQ",
    ],
    receives: [
      "combo",
      "windWall",
      "trajectorySkill",
      "mistwillowHeavyBuff",
      "mistwillowBuff",
      "vernalUmbrellaAdditionalAttack",
    ],
    triggersBuffs: [
      "jadeware",
      "combo",
      "comboUmbLightBonus",
      "comboSpringAwayBonus",
      "springThunder",
    ],
  },
  "silkbindJade-umbq-prepull": {
    tags: [
      "prop:isMartialSkillQ",
      "prop:hasQiBreakPhysPen",
      "weapon:Umbrella",
      "attack:light",
      "attune:umbQ",
      "role:umbQ",
    ],
    receives: [
      "combo",
      "windWall",
      "trajectorySkill",
      "mistwillowHeavyBuff",
      "mistwillowBuff",
      "vernalUmbrellaAdditionalAttack",
    ],
    triggersBuffs: [
      "jadeware",
      "combo",
      "comboUmbLightBonus",
      "comboSpringAwayBonus",
      "springThunder",
    ],
  },
  "silkbindJade-umblightcharge": {
    receives: [
      "mistwillowHeavyBuff",
      "mistwillowBuff",
      "combo",
      "comboSpringAwayBonus",
      "windWall",
      "pursuitChargedBoost",
      "trajectorySkill",
      "thunderousBloom",
      "springThunder",
      "nonPlayerBaseDamage125",
      "vernalUmbrellaAdditionalAttack",
    ],
    hits: [0, 10, 20, 30, 40, 50].map((frame, index) => ({
      id: `hit-${index}`,
      frame,
      physMultiplier: 0.2862166666666667,
      attributeMultiplier: 0.42933333333333334,
      physFixed: 79.16,
      attributeFixed: 43.16,
      extraCritDamage: 1,
      triggers:
        frame === 20
          ? [
              {
                kind: "castSkill",
                targetId: "silkbindJade-umblightcharge-lift",
                stacks: 1,
                condition: null,
              },
            ]
          : [],
    })),
  },
  "silkbindJade-umb-heavylight": {
    receives: [
      "thunderousBloom",
      "springThunder",
      "mistwillowHeavyBuff",
      "mistwillowBuff",
      "vernalUmbrellaAdditionalAttack",
    ],
    hits: [
      {
        id: "hit-0",
        frame: 0,
        physMultiplier: 0.38680000000000003,
        attributeMultiplier: 0.5802,
        physFixed: 107.33333333333333,
        attributeFixed: 58.333333333333336,
        extraCritDamage: 0,
        triggers: [
          {
            kind: "castSkill",
            targetId: "silkbindJade-umb-heavylight-heavyshare",
            stacks: 1,
            condition: null,
          },
        ],
      },
      {
        id: "hit-1",
        frame: 25,
        physMultiplier: 0.38680000000000003,
        attributeMultiplier: 0.5802,
        physFixed: 107.33333333333333,
        attributeFixed: 58.333333333333336,
        extraCritDamage: 0,
        triggers: [],
      },
      {
        id: "hit-2",
        frame: 50,
        physMultiplier: 0.38680000000000003,
        attributeMultiplier: 0.5802,
        physFixed: 107.33333333333333,
        attributeFixed: 58.333333333333336,
        extraCritDamage: 0,
        triggers: [],
      },
    ],
  },
  "silkbindJade-fanqcancel": {
    triggersBuffs: ["jadeware", "windWall", "springThunder"],
  },
}

for (const id of DRONE_TICK_IDS) {
  OLD[id] = {
    receives: [
      "mistwillowHeavyBuff",
      "mistwillowBuff",
      "soulShaken",
      "thunderousBloom",
      "springThunder",
      "combo",
      "windWall",
      "trajectorySkill",
      "vernalUmbrellaAdditionalAttack",
      "comboUmbLightBonus",
    ],
    hits: droneTickHit(0.51085, 141.00000000000003, 0.7662500000000001, 77),
  }
  NEW[id] = {
    receives: [
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
    ],
    hits: droneTickHit(0.510829, 141.375, 0.766243, 77),
  }
}

for (const [id, debuffId] of Object.entries(DRONE_LAUNCH_DEBUFF_BY_ID)) {
  OLD[id] = {
    tags: [
      "prop:hasQiBreakPhysPen",
      "weapon:Umbrella",
      "attack:heavy",
      "attune:umbFrequentProjectile",
      "role:umbDrone",
      "role:umbDroneLaunch",
    ],
    hits: droneLaunchHit(debuffId, 148, 1),
  }
  NEW[id] = {
    tags: [
      "prop:hasQiBreakPhysPen",
      "weapon:Umbrella",
      "attack:heavy",
      "role:umbDrone",
      "role:umbDroneLaunch",
    ],
    hits: droneLaunchHit(debuffId, 149.4, 0),
  }
}

function deepEqual(left: unknown, right: unknown): boolean {
  if (left === right) return true
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false
    return left.every((item, index) => deepEqual(item, right[index]))
  }
  if (left && right && typeof left === "object" && typeof right === "object") {
    const leftRecord = left as Record<string, unknown>
    const rightRecord = right as Record<string, unknown>
    const leftKeys = Object.keys(leftRecord)
    const rightKeys = Object.keys(rightRecord)
    if (leftKeys.length !== rightKeys.length) return false
    return leftKeys.every(
      (key) => key in rightRecord && deepEqual(leftRecord[key], rightRecord[key]),
    )
  }
  return false
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

const SNAPSHOT_KEYS: (keyof FieldSnapshot)[] = ["tags", "receives", "triggersBuffs", "hits"]

export function healSilkbindJadeValuesGatesReach(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const oldSnapshot = OLD[skill.id]
  const newSnapshot = NEW[skill.id]
  if (!oldSnapshot || !newSnapshot) return skill
  const oldKeys = SNAPSHOT_KEYS.filter((key) => key in oldSnapshot)
  if (!oldKeys.every((key) => deepEqual(skill[key], oldSnapshot[key]))) return skill
  const healed = { ...skill }
  for (const key of oldKeys) {
    if (key in newSnapshot) healed[key] = newSnapshot[key]
    else delete healed[key]
  }
  return healed
}

export const V28__silkbindJadeValuesGatesReach: CustomSkillMigration = {
  to: 28,
  name: "V28__silkbindJadeValuesGatesReach",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills)
      ? blob.skills.map(healSilkbindJadeValuesGatesReach)
      : blob.skills
    return { ...blob, v: 28, skills }
  },
}
