import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import type { LevelRows } from "../../../engine/skill"
import { LEVEL_ROWS } from "./levelRows"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { INKWELL_FAN_RECEIVES } from "./receives"
import {
  MOON_SHATTER_SPRING_CONDITIONS,
  PURSUIT_RECHARGE_CUT,
  STARTLING_SPRING_STACK,
} from "./moonShatterSpring"

const coefficientsFor = (levelRows: LevelRows) => ({
  ...levelScaled(levelRows),
  extraCritDamage: 1,
  triggers: [PURSUIT_RECHARGE_CUT, STARTLING_SPRING_STACK],
})

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
    BUFF.nonPlayerBaseDamage145,
    ...INKWELL_FAN_RECEIVES,
    BUFF.swiftGaleAirborneHeavyBoost,
    BUFF.cleftpeakDeflect,
  ],
  triggersBuffs: [BUFF.pursuitChargedBoost, BUFF.moonShatterSpringLockout],
  castConditions: MOON_SHATTER_SPRING_CONDITIONS,
  // Cast length to the earliest next input and the strike frames (in-game
  // animation, 2026-10-15).
  castFrames: 93.42,
  triggerable: true,
  // In-game values as of 2026-09-28: 9 m approach reach; the cast's own
  // segments then teleport to about 1.5 m from the target, along its facing.
  reachMeters: 9,
  displacement: { kind: "toTarget", meters: 1.5 },
  hits: [
    hit(0, { frame: 9.66, ...coefficientsFor(LEVEL_ROWS.fanheavypursuit3Hit0) }),
    hit(1, { frame: 33.78, ...coefficientsFor(LEVEL_ROWS.fanheavypursuit3Hit0) }),
    hit(2, { frame: 71.82, ...coefficientsFor(LEVEL_ROWS.fanheavypursuit3Hit2) }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
})
