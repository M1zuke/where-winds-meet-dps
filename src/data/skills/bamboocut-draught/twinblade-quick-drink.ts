import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"
import { SKYSPEAK_TIER_4_CONDITION } from "./skyspeak-tier-4"
import { DRINK_CONVERSION_FRAME, drinkGrants } from "./whaledraft"

// In-game values as of 2026-10-15: with the twinblades in hand the perfect
// drink launches the 0.4 falcon, and is offered only with Skyspeak tier 4. The
// falcon launches on frame 18 and its flight time is unknown, so it lands with
// the conversion on frame 19.
export const twinbladeQuickDrinkHit = hit(0, {
  frame: DRINK_CONVERSION_FRAME,
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
  triggers: [...drinkGrants, castSkill({ target: SKILL.falconsPursuitTwinblades })],
})

export const twinbladeQuickDrink = defineSkill({
  id: SKILL.twinbladeQuickDrink,
  classId: "bamboocutDraught",
  name: "Twinblade - Perfect Quick Drink",
  breakdownName: "Whaledraft (Drink)",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.twinbladeQuickDrink,
  receives: [...CLASS_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  castConditions: [SKYSPEAK_TIER_4_CONDITION],
  triggerable: false,
  castFrames: 41,
  reachMeters: 4,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [twinbladeQuickDrinkHit],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
