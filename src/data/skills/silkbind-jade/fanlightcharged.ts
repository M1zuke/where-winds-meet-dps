import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// The authored row carries the breakthrough-14 multiplier that the engine
// does not apply — `FormulaContext.targetMultiplier` is set in panel.ts and
// read nowhere. Measured against the reference def it is a uniform 1.4504 on
// all four coefficient tracks, which is that multiplier to four figures.
const BREAKTHROUGH_SCALE = 1.45

export const fanlightcharged = defineSkill({
  id: SKILL.fanlightcharged,
  classId: "silkbindJade",
  name: "FanLightCharged",
  tags: [PROP.isCharged, WEAPON.fan, ATTACK.light, ATTUNE.fanCharged, ROLE.fanLightCharged],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanLightCharged,
  receives: [
    BUFF.windWall,
    BUFF.pursuitChargedBoost,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
  ],
  triggersBuffs: [BUFF.lingeringBone],
  castFrames: 75,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 2.76138 / BREAKTHROUGH_SCALE,
      attributeMultiplier: 4.14207 / BREAKTHROUGH_SCALE,
      physFixed: 764.15 / BREAKTHROUGH_SCALE,
      attributeFixed: 416.15 / BREAKTHROUGH_SCALE,
      extraCritDamage: 1,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
