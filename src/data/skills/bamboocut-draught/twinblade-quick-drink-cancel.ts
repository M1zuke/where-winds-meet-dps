import { defineSkill } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"
import { SKYSPEAK_TIER_4_CONDITION } from "./skyspeak-tier-4"
import { twinbladeQuickDrinkHit } from "./twinblade-quick-drink"

export const twinbladeQuickDrinkCancel = defineSkill({
  id: SKILL.twinbladeQuickDrinkCancel,
  classId: "bamboocutDraught",
  name: "Twinblade - Perfect Quick Drink [cancel]",
  breakdownName: "Whaledraft (Drink)",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.twinbladeQuickDrinkCancel,
  cancelledBy: "deflectCancel",
  receives: [...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  castConditions: [SKYSPEAK_TIER_4_CONDITION],
  triggerable: false,
  castFrames: 24,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [twinbladeQuickDrinkHit],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
