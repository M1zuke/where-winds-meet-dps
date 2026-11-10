import { defineSkill, hit, levelScaled } from "../../../definitions/skills/skillDef"
import { LEVEL_ROWS } from "./levelRows"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { ATTACK, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL, DEBUFF } from "./ids"
import { launchHigherPriorityBreak } from "./droneLaunchBreak"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

export const umbdronelaunch20Hit = defineSkill({
  id: SKILL.umbdronelaunch20Hit,
  classId: "silkbindJade",
  name: "UmbDroneLaunch[20hit]",
  breakdownName: "Umbrella Launch",
  tags: [PROP.hasQiBreakPhysPen, WEAPON.umbrella, ATTACK.heavy, ROLE.umbDrone, ROLE.umbDroneLaunch],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  receives: [
    BUFF.thunderousBloom,
    BUFF.springThunder,
    BUFF.mistwillowLightBuff,
    BUFF.mistwillowBuff,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  castTag: CAST.umbDroneLaunch20hit,
  // Cast length to the earliest next input (in-game animation, 2026-10-15).
  castFrames: 65.58,
  triggerable: true,
  // In-game values as of 2026-09-28: melee, assumed — a further 1.75 m
  // shrink-only pull toward a locked target.
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      // In-game values as of 2026-10-15: the throw's collider lands at 35.78 f;
      // the umbrella attaches at 36 f, which opens the drone's run.
      frame: 35.78,
      ...levelScaled(LEVEL_ROWS.umbdronelaunchHit0),
      extraCritDamage: 0,
      triggers: [applyDebuff({ target: DEBUFF.umbdrone20Hit })],
    }),
    launchHigherPriorityBreak(1),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-10-05T00:00:00.000Z",
})
