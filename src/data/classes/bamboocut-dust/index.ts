import { defineClass } from "../../../definitions/classes/classDef"
import { CLASS_ID, SKILLS } from "../../skills/bamboocut-dust"
import { DEBUFFS } from "../../skills/bamboocut-dust/debuffs"
import { withUniversalSkills } from "../../../definitions/skills/universalSkills"
import { rotationsFor } from "../../../definitions/rotations/registry"
import defaultRotation from "./rotations/placeholder"
import { INNER_WAY_ID } from "../../innerWays/ids"
import { MARTIAL_ART_ID } from "../../martialArts/ids"
import {
  everspringUmbrellaAdditionalAttack,
  unfetteredRopeDartAdditionalAttack,
} from "../../skills/bamboocut-dust/buffs/additionalAttack"
import { fragrantSong } from "../../skills/bamboocut-dust/buffs/fragrantSong"
import { returningUmbrellaDamage } from "../../skills/bamboocut-dust/buffs/returningUmbrellaDamage"
import { soulbreakCriticalBoost } from "../../skills/bamboocut-dust/buffs/soulbreakCriticalBoost"
import { soulbreakDamageTaken } from "../../skills/bamboocut-dust/buffs/soulbreakDamageTaken"
import { soulbreakPayoutFeed } from "../../skills/bamboocut-dust/buffs/soulbreakPayoutFeed"
import { phantomRallyResonanceBoost } from "../../skills/bamboocut-dust/buffs/phantomRallyResonanceBoost"
import {
  tangMelodyEarlyRanks,
  tangMelodyLaterRanks,
} from "../../skills/bamboocut-dust/buffs/tangMelody"
import {
  towlineSweepBurnAndBury,
  towlineSweepFirstSweepsBonus,
  towlineSweepLastSweepsBonus,
  towlineSweepMiddleSweepsBonus,
} from "../../skills/bamboocut-dust/buffs/towlineSweepBonuses"
import { enduranceMeter } from "../../resources/enduranceMeter"
import { BAMBOOCUT_DUST_GATES } from "./gates"
import { fadingCrimsonMeter, tokensOfGratitudeMeter } from "./meters"

const classSkillIds = new Set(SKILLS.map((skill) => skill.id))
const skillsWithClassOverrides = withUniversalSkills(CLASS_ID, "Bamboocut", SKILLS).filter(
  (skill, index) => index < SKILLS.length || !classSkillIds.has(skill.id),
)

export const bamboocutDust = defineClass({
  id: CLASS_ID,
  displayName: "Bamboocut Dust",
  validated: false,
  spec: "bamboocut_dust",
  primaryAttribute: "Bamboocut",
  attributeMultiplier: 1.5,
  classMindGroup: INNER_WAY_ID.phantomRally,
  allowedMindMethods: [
    INNER_WAY_ID.moraleChant,
    INNER_WAY_ID.bitterSeason,
    INNER_WAY_ID.breakingPoint,
    INNER_WAY_ID.evasiveCharge,
    INNER_WAY_ID.wolfchasersArt,
    INNER_WAY_ID.battleAnthem,
    INNER_WAY_ID.thunderousBloom,
    INNER_WAY_ID.mistwing,
    INNER_WAY_ID.towlineSweep,
    INNER_WAY_ID.lightAnew,
    INNER_WAY_ID.songOfTang,
  ],
  classSpecificAttunements: [
    "everspringMartialArt",
    "everspringSpecial",
    "unfetteredMartialArt",
    "unfetteredCharged",
    "unfetteredSpecial",
  ],
  weapons: [MARTIAL_ART_ID.everspringUmbrella, MARTIAL_ART_ID.unfetteredRopeDart],
  // In-game values as of 2026-10-12: the approach range of the rope dart's
  // light chain, the shortest read reach on either weapon — an assumption for
  // every skill with no reach of its own.
  defaultMeleeReachMeters: 6,
  meters: [enduranceMeter, fadingCrimsonMeter, tokensOfGratitudeMeter],
  critBoostWeaponTypes: [],
  skills: skillsWithClassOverrides,
  debuffs: DEBUFFS,
  rotations: rotationsFor(CLASS_ID),
  defaultRotationId: defaultRotation.id,
  classBuffDefs: [
    returningUmbrellaDamage,
    fragrantSong,
    everspringUmbrellaAdditionalAttack,
    unfetteredRopeDartAdditionalAttack,
    soulbreakDamageTaken,
    soulbreakCriticalBoost,
    soulbreakPayoutFeed,
    towlineSweepFirstSweepsBonus,
    towlineSweepMiddleSweepsBonus,
    towlineSweepLastSweepsBonus,
    towlineSweepBurnAndBury,
    phantomRallyResonanceBoost,
    tangMelodyEarlyRanks,
    tangMelodyLaterRanks,
  ],
  gateBuffs: BAMBOOCUT_DUST_GATES,
  mechanics: [],
  skillBehaviors: [],
  displayGates: [],
  poisonExtensions: [],
})
