import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"

// The authored value is the whole cast spread over its hits, not a per-hit
// value — the reference def states it per hit. Kept as total ÷ hits so the
// number the source actually carries stays legible.
const CAST_HITS = 3
const CAST_TOTAL = {
  physMultiplier: 1.80931,
  attributeMultiplier: 2.71382,
  physFixed: 501.7,
  attributeFixed: 272.6,
}

// The cast total also carries the breakthrough-14 multiplier the engine never
// applies (`targetMultiplier` is set in panel.ts and read nowhere) — a uniform
// 1.450 against the reference def on all four tracks, same as FanLightCharged.
const BREAKTHROUGH_SCALE = 1.45

const COEFFICIENTS = {
  physMultiplier: CAST_TOTAL.physMultiplier / CAST_HITS / BREAKTHROUGH_SCALE,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier / CAST_HITS / BREAKTHROUGH_SCALE,
  physFixed: CAST_TOTAL.physFixed / CAST_HITS / BREAKTHROUGH_SCALE,
  attributeFixed: CAST_TOTAL.attributeFixed / CAST_HITS / BREAKTHROUGH_SCALE,
  extraCritDamage: 1,
}

export const fanheavypursuit3Hit = defineSkill({
  id: SKILL.fanheavypursuit3Hit,
  classId: "silkbindJade",
  name: "FanHeavyPursuit 3-Hit",
  breakdownName: "Moon Shatter Spring",
  tags: [
    PROP.isExecution,
    PROP.hasLowQiCritBoost,
    PROP.hasLowQiDmgBoost,
    WEAPON.fan,
    ATTACK.heavy,
    ATTUNE.fanSpecial,
    ROLE.fanHeavyPursuit,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Fan",
  attributeAttack: "Silkbind",
  castTag: CAST.fanHeavyPursuit3Hit,
  receives: [
    BUFF.windWallPursuit,
    BUFF.lowQiFollowUp,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
  ],
  triggersBuffs: [BUFF.pursuitChargedBoost],
  castFrames: 90,
  triggerable: true,
  hits: [
    hit(0, { frame: 0, ...COEFFICIENTS }),
    hit(1, { frame: 30, ...COEFFICIENTS }),
    hit(2, { frame: 60, ...COEFFICIENTS }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
