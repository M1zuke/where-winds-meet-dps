import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/silkbind-jade"
import { DEBUFFS } from "../../skills/silkbind-jade/debuffs"
import { jadebreak } from "../../skills/silkbind-jade/buffs/jadebreak"
import { windrider } from "../../skills/silkbind-jade/buffs/windrider"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationPoolFor } from "../../../definitions/rotations/registry"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { MARTIAL_ART_ID } from "../../martialArts/ids"
import { SILKBIND_JADE_GATES } from "./gates"
import { SILKBIND_JADE_GRADUATION_BUILD } from "./graduationBuild"

export const silkbindJade = defineClass({
  id: CLASS_ID,
  displayName: "Silkbind Jade",
  // Graduation flip: gear-set, inner-way ladder (Blossom Barrage, Breaking
  // Point, Star Reacher, Thunderous Bloom all wired through this branch),
  // heal-output lane, and per-level Solo Mode scaling all check out against
  // Mun's Ultimate Umbrella Guide (Patch 2.0) and the engine-baseline /
  // buff-equivalence fixtures (graduation.test.ts exercises this build
  // directly). The UI removes the WIP badge on this flag.
  //
  // Three arrays stay empty by design — same shape as `stonesplit-strength`,
  // which is `validated: true` with those three arrays empty:
  //   * `mechanics` — no mechanic file exists that would wrap a Silkbind
  //     feature in `declareMechanic(...)`. There's no level-attribute bonus
  //     mechanic for Silkbind (Bellstrike Umbra has one; Stonesplit / Bellstrike
  //     Splendor don't).
  //   * `skillBehaviors` — all four sibling classes have empty
  //     `skillBehaviors`. Authoring one without doc evidence isn't possible.
  //   * `displayGates` — same.
  //   * `poisonExtensions` — Bellstrike Umbra has one (Sword Horizon Zenith
  //     extending a Bitter Season poison). No doc evidence for an equivalent
  //     mechanic on Silkbind Jade; left empty to avoid a fabricated
  //     interaction.
  //
  // `classBuffDefs` carries the two fan-side buffs captured in the 2026-08-19
  // in-game tooltip pass:
  //   * Jadebreak — fan-granted, umbrella-side ribbon (+30% umbrellaBoost,
  //     +10% Boss damage on Projectile/Heavy Pursuit hit) for 15s. The Boss
  //     filter is gated by `!ctx.target.isTrainingDummy` as a proxy for
  //     `target.isBoss` (engine has no native `isBoss` field yet).
  //   * Windrider — fan-granted, "enhances the next Pursuit Skill" for 3s.
  //     Magnitude captured as 0 + comment; the in-game tooltip localizes
  //     "enhances" without a number, so the multiplier is pending another
  //     in-game capture.
  //
  // Lingering Bone is a global buff (in `reference/classes/buffs/`) not
  // listed here — it's owned elsewhere. The 2026-08-19 capture surfaced a
  // duration split (0.8s non-boss / 2s boss) that the JSON currently does
  // not model; that's a separate change outside the silkbind-jade sprint.
  //
  // Five skill-def placeholders (umbrella-light, spring-sorrow, spring-away,
  // let-spring-go, everbloom) carry zero multipliers and explicit
  // `Placeholder (validated: false)` headers in their file comments. They
  // remain in-game-tooltip-gated and do not contribute to DPS output today.
  validated: true,
  spec: "silkbind_jade",
  primaryAttribute: "Silkbind",
  attributeMultiplier: 51.5,
  classMindGroup: "",
  allowedMindMethods: [
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.insightfulStrike,
    INNER_WAY_ID.bitterSeason,
    INNER_WAY_ID.thunderousBloom,
    INNER_WAY_ID.blossomBarrage,
    INNER_WAY_ID.breakingPoint,
    INNER_WAY_ID.starReacher,
  ],
  classSpecificAttunements: ["fanQ", "fanCharged", "fanSpecial", "umbQ", "umbCharged"],
  weapons: [MARTIAL_ART_ID.silkbindFan, MARTIAL_ART_ID.silkbindUmbrella],
  critBoostWeaponTypes: [],
  skills: withUniversalSkills(CLASS_ID, "Silkbind", SKILLS),
  debuffs: DEBUFFS,
  ...rotationPoolFor(CLASS_ID),
  graduationBuild: SILKBIND_JADE_GRADUATION_BUILD,
  classBuffDefs: [jadebreak, windrider],
  gateBuffs: SILKBIND_JADE_GATES,
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
