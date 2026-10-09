import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import type { Displacement } from "../../../engine/skill"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { CLASS_RECEIVES, SKYSTRIKE_GAUNTLETS_RECEIVES } from "./receives"

export const GAUNTLETS_DASH_DISPLACEMENT: Displacement = {
  kind: "byDistance",
  bands: [
    { minMeters: 0, maxMeters: 1.499, then: { kind: "towardTarget", referenceMeters: 0 } },
    { minMeters: 1.5, maxMeters: 7.5, then: { kind: "toTarget", meters: 1.2 } },
  ],
  otherwise: { kind: "towardTarget", referenceMeters: 0 },
}

export const gauntletsDashHit = (frame: number) =>
  hit(0, {
    frame,
    physMultiplier: 0.34392,
    attributeMultiplier: 0.51588,
    physFixed: 96,
    attributeFixed: 52,
  })

// In-game values as of 2026-10-06. The sprint attack outside Tipsy; the
// approach reach is the farthest distance the dash still closes. Cast length to
// the earliest next input and hit frame: in-game animation, 2026-10-06.
export const gauntletsDash = defineSkill({
  id: SKILL.gauntletsDash,
  classId: "bamboocutDraught",
  name: "Gauntlets - Dash",
  tags: [WEAPON.gauntlets],
  skillType: "weapon",
  weaponOrAttribute: "Gauntlets",
  attributeAttack: "Bamboocut",
  castTag: CAST.gauntletsDash,
  receives: [...CLASS_RECEIVES, ...SKYSTRIKE_GAUNTLETS_RECEIVES],
  triggerable: false,
  castFrames: 36,
  reachMeters: 7.5,
  displacement: GAUNTLETS_DASH_DISPLACEMENT,
  hits: [gauntletsDashHit(20)],
  createdAt: "2026-10-06T00:00:00.000Z",
  updatedAt: "2026-10-06T00:00:00.000Z",
})
