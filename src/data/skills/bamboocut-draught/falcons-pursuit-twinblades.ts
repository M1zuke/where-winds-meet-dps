import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

const strike = (index: number) =>
  hit(index, {
    frame: 0,
    physMultiplier: 0.59136,
    attributeMultiplier: 0.88704,
    physFixed: 0,
    attributeFixed: 0,
    qiRate: 0.4,
  })

// In-game values as of 2026-10-06. The strike count per bullet is the
// gauntlet falcon's.
export const falconsPursuitTwinblades = defineSkill({
  id: SKILL.falconsPursuitTwinblades,
  classId: "bamboocutDraught",
  name: "Falcon's Pursuit (Twinblades)",
  breakdownName: "Whaledraft",
  tags: [WEAPON.twinBlades, ROLE.falconsPursuit],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.falconsPursuitTwinblades,
  receives: [
    ...CLASS_RECEIVES,
    ...RIVEN_TWINBLADES_RECEIVES,
    BUFF.skystrikeGauntletsAdditionalAttackCoefficient,
    BUFF.etherwrathPenetrationBoost,
  ],
  triggerable: true,
  castFrames: 0,
  hits: [strike(0), strike(1), strike(2)],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
