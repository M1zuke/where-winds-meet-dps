import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff, releaseEcho } from "../../../definitions/skills/triggers"
import type { TriggerCondition } from "../../../engine/skill"
import { CAST, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF, STATUS } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"
import { deepdazeEntryTriggers } from "./buffs/deepdazeEntry"

const strike = {
  physMultiplier: 0.329365,
  attributeMultiplier: 0.4940475,
  physFixed: 91.5,
  attributeFixed: 50,
}

const MARKS_DRUNKSLAY: TriggerCondition[] = [
  { buffId: BUFF.skyspeakDrunkslay, op: "gte", stacks: 1 },
]

// In-game values as of 2026-09-16.
const REQUIRES_COOLDOWN_CLEAR: TriggerCondition[] = [
  { buffId: STATUS.herosBloodCooldown, op: "eq", stacks: 0 },
]

// Two strikes on one damage share (in-game animation, 2026-09-05). The Binge
// Points grant must run before the Deepdaze threshold check on the same hit.
// Carouse is granted at the cast, not on a hit — in-game skill text, 2026-09-16.
export const herosBloodHits = [
  hit(2, {
    frame: 0,
    physMultiplier: 0,
    attributeMultiplier: 0,
    physFixed: 0,
    attributeFixed: 0,
    conditions: REQUIRES_COOLDOWN_CLEAR,
    triggers: [applyBuff({ target: STATUS.carouse, stacks: 1 })],
  }),
  hit(0, {
    ...strike,
    frame: 22,
    conditions: REQUIRES_COOLDOWN_CLEAR,
    triggers: [
      applyBuff({ target: STATUS.bingePoints, stacks: 40 }),
      releaseEcho({ target: DEBUFF.drunkslay }),
      applyDebuff({ target: DEBUFF.drunkslay, stacks: 1, conditions: MARKS_DRUNKSLAY }),
      ...deepdazeEntryTriggers(),
      applyBuff({ target: STATUS.herosBloodCooldown, stacks: 1 }),
    ],
  }),
  hit(1, { ...strike, frame: 33, conditions: REQUIRES_COOLDOWN_CLEAR }),
]

// Cast length to the earliest next input: in-game animation, 2026-09-05.
export const herosBlood = defineSkill({
  id: SKILL.herosBlood,
  classId: "bamboocutDraught",
  name: "Twinblade Special",
  breakdownName: "Hero's Blood",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.herosBlood,
  receives: [...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  triggerable: false,
  castFrames: 46,
  // In-game values as of 2026-09-28: 4 m approach reach, plus a further
  // 1.75 m shrink-only pull once in range.
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: herosBloodHits,
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
