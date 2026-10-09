import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"

// In-game values as of 2026-10-05.
const CAST_TOTAL = {
  physMultiplier: 3.0185,
  attributeMultiplier: 4.5278,
  physFixed: 835,
  attributeFixed: 455,
}
const HIT_SHARES = [0.175, 0.175, 0.175, 0.175, 0.3]

const coefficientsFor = (share: number) => ({
  physMultiplier: CAST_TOTAL.physMultiplier * share,
  attributeMultiplier: CAST_TOTAL.attributeMultiplier * share,
  physFixed: CAST_TOTAL.physFixed * share,
  attributeFixed: CAST_TOTAL.attributeFixed * share,
  extraCritDamage: 1,
})

export const fanheavypursuit5Hit = defineSkill({
  id: SKILL.fanheavypursuit5Hit,
  classId: "silkbindJade",
  name: "FanHeavyPursuit 5-Hit",
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
  castTag: CAST.fanHeavyPursuit5Hit,
  receives: [
    BUFF.windWallPursuit,
    BUFF.lowQiFollowUp,
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
    BUFF.nonPlayerBaseDamage145,
    ...INKWELL_FAN_RECEIVES,
  ],
  triggersBuffs: [BUFF.pursuitChargedBoost],
  // Cast length to the earliest next input (in-game animation, 2026-09-24).
  castFrames: 146,
  triggerable: true,
  // In-game values as of 2026-09-28: 9 m approach reach; the cast's own
  // segments then teleport to about 1.5 m from the target, along its facing.
  reachMeters: 9,
  displacement: { kind: "toTarget", meters: 1.5 },
  hits: [
    hit(0, { frame: 14, ...coefficientsFor(HIT_SHARES[0]) }),
    hit(1, { frame: 33, ...coefficientsFor(HIT_SHARES[1]) }),
    hit(2, { frame: 69, ...coefficientsFor(HIT_SHARES[2]) }),
    hit(3, { frame: 84, ...coefficientsFor(HIT_SHARES[3]) }),
    hit(4, { frame: 112, ...coefficientsFor(HIT_SHARES[4]) }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
})
