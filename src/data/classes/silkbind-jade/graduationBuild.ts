import type { GraduationBuild } from "../../../definitions/classes/classDef"
import { SET_ID } from "../../sets/ids"
import { createGraduationGearPiece } from "../graduationGear"

const idPrefix = "graduation-silkbind-jade"

// Word choices follow Mun's Ultimate Umbrella Guide (Patch 2.0) verbatim:
//
//   Left-Side Weapon  (Fan):   Max Phys / Max Phys / Power / Agility / Crit
//   Right-Side Weapon (Umbrella): Max Phys / Max Phys / UmbrellaBoost / Power / Crit
//   Disc:    Max Phys / Max Phys / AllMartialBoost / Power / Crit
//   Pendant: Max Phys / Max Phys / AllMartialBoost / Power / Crit
//   Helm:    Crit / Crit / Max Phys / Power / Agility
//   Armor:   Crit / Crit / Max Phys / Power / Agility
//   Greaves: Power / Power / DamageVsBoss / Max Phys / Crit
//   Bracer:  Power / Power / DamageVsBoss / Max Phys / Crit
//
// Mun flags Momentum as a dead stat post-Patch 2.0 (Blossom Barrage's
// extra Direct Crit already keeps affinity low), and the gear priorities
// use Crit rather than Precision except where Precision is needed to
// reach the 100% cap. Affinity is intentionally absent — overcapping
// the rates is a known failure mode Mun calls out specifically.
// "Crit or Precision" alternatives in the doc resolve to Crit here
// because Crit is what Mun's helm/chest priority list calls out twice.
//
// Attunements stay on the class-specific `fanQ` / `umbQ` pair so the
// umbrella-q and fan-q boosts reach the right weapon-path. Left-side
// weapon takes `fanQ` (fan), right-side takes `umbQ` (umbrella).
// Helm and Armor get `fanQ` / `umbQ` respectively to keep the weapon
// attunement pair in lockstep.
export const SILKBIND_JADE_GRADUATION_BUILD: GraduationBuild = {
  gear: [
    createGraduationGearPiece({
      idPrefix,
      slot: "leftWeapon",
      words: ["maxPhys", "maxPhys", "power", "agility", "crit"],
      attunement: "fanQ",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "rightWeapon",
      words: ["maxPhys", "maxPhys", "umbrellaBoost", "power", "crit"],
      attunement: "umbQ",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "disc",
      words: ["maxPhys", "maxPhys", "allMartialBoost", "power", "crit"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "pendant",
      words: ["maxPhys", "maxPhys", "allMartialBoost", "power", "crit"],
      attunement: "physPen",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "helm",
      words: ["crit", "crit", "maxPhys", "power", "agility"],
      attunement: "fanQ",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "armor",
      words: ["crit", "crit", "maxPhys", "power", "agility"],
      attunement: "umbQ",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "greaves",
      words: ["power", "power", "damageVsBoss", "maxPhys", "crit"],
      attunement: "fanQ",
    }),
    createGraduationGearPiece({
      idPrefix,
      slot: "bracer",
      words: ["power", "power", "damageVsBoss", "maxPhys", "crit"],
      attunement: "umbQ",
    }),
  ],
  set: SET_ID.jadeware,
  bowSet: "crit",
  arsenal: "silkbind",
}
