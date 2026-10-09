import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL, STATUS } from "./ids"
import { INEBRIATE_ENHANCED_RECEIVES, RIVEN_TWINBLADES_RECEIVES } from "./receives"

// In-game values as of 2026-10-06. Castable within 1.1 s of Realmplay with
// Binge Points above 49.99; the second slash is two colliders of 0.736078
// each. Cast length to the earliest next input and hit frames: in-game
// animation, 2026-10-06.
export const bladeAgainstWaves = defineSkill({
  id: SKILL.bladeAgainstWaves,
  classId: "bamboocutDraught",
  name: "Twinblade Light Attack - Blade Against Waves",
  breakdownName: "Blade Against Waves",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.bladeAgainstWaves,
  receives: [...INEBRIATE_ENHANCED_RECEIVES, ...RIVEN_TWINBLADES_RECEIVES],
  castConditions: [{ buffId: STATUS.bingePoints, op: "gt", stacks: 49 }],
  triggerable: false,
  castFrames: 54,
  reachMeters: 4,
  displacement: {
    kind: "byDistance",
    bands: [
      {
        minMeters: 0,
        maxMeters: 1.499,
        then: { kind: "towardTarget", referenceMeters: 0 },
      },
      { minMeters: 1.5, maxMeters: 6, then: { kind: "toTarget", meters: 1.5 } },
    ],
    otherwise: { kind: "selfForward", meters: 4 },
  },
  hits: [
    hit(0, {
      frame: 11,
      physMultiplier: 0.315462,
      attributeMultiplier: 0.473193,
      physFixed: 87.6,
      attributeFixed: 47.7,
    }),
    hit(1, {
      frame: 38,
      physMultiplier: 0.736078,
      attributeMultiplier: 1.104117,
      physFixed: 204.4,
      attributeFixed: 111.3,
    }),
    hit(2, {
      frame: 38,
      physMultiplier: 0.736078,
      attributeMultiplier: 1.104117,
      physFixed: 204.4,
      attributeFixed: 111.3,
    }),
  ],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
