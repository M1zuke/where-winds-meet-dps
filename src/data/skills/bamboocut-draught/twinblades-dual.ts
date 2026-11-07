import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

const strike = (index: number, frame: number) =>
  hit(index, {
    frame,
    physMultiplier: 0.36646,
    attributeMultiplier: 0.54969,
    physFixed: 102,
    attributeFixed: 55.5,
  })

// In-game values as of 2026-10-06. The two hit frames are placed at thirds of
// the cast; the animation does not expose them.
export const twinbladesDual = defineSkill({
  id: SKILL.twinbladesDual,
  classId: "bamboocutDraught",
  name: "Twin Blades (Dual-Weapon Skill)",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.twinbladesDual,
  receives: [...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  triggersBuffs: [],
  isWeaponSwap: true,
  reachMeters: 4.5,
  castFrames: 45,
  triggerable: true,
  hits: [strike(0, 15), strike(1, 30)],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
