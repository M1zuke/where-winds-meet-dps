import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"

const strike = (index: number) =>
  hit(index, {
    frame: 0,
    physMultiplier: 0.487872,
    attributeMultiplier: 0.731808,
    physFixed: 0,
    attributeFixed: 0,
    // In-game values as of 2026-09-25, before the class's own Qi bonuses.
    qiRate: 0.4,
  })

// The falcon the sixth light attack or a perfect drink unleashes: three
// strikes at a third of its 1.4784 total, no flat adds (in-game damage
// tooltip "Falcon's Pursuit Cumulative Damage", 2026-09-05); the in-game log
// books it under Whaledraft. The hit count per bullet is unsettled — observed
// runs land anywhere from 1 to 6 depending on how long the bullet tracks its
// target; 3 is kept as the design ratio pending a tighter bound.
export const falconsPursuit = defineSkill({
  id: SKILL.falconsPursuit,
  classId: "bamboocutDraught",
  name: "Falcon's Pursuit",
  breakdownName: "Whaledraft",
  tags: [WEAPON.gauntlets, ROLE.falconsPursuit],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.falconsPursuit,
  receives: [
    ...CLASS_RECEIVES,
    ...SKYSTRIKE_GAUNTLETS_RECEIVES,
    BUFF.skystrikeGauntletsAdditionalAttackCoefficient,
    BUFF.etherwrathPenetrationBoost,
  ],
  triggerable: true,
  castFrames: 0,
  hits: [strike(0), strike(1), strike(2)],
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
