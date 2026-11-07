import { SET_ID } from "./ids"

export interface SetFourPieceText {
  short: string
  full: string
}

type NonGearSetId = typeof SET_ID.brimflow | typeof SET_ID.calmwaters
type GearSetId = Exclude<(typeof SET_ID)[keyof typeof SET_ID], NonGearSetId>

// In-game values as of 2026-10-17.
export const SET_FOUR_PIECE_TEXTS: Readonly<Record<GearSetId, SetFourPieceText>> = {
  [SET_ID.jadeware]: {
    short: "MA Skill: +10% Affinity DMG, +7.5% Direct Aff. vs low Qi",
    full: "Casting Martial Art Skill activates Jadeware effect: Increases Affinity DMG by 10% and increases Direct Affinity Rate by 7.5% against targets in Qi Imbalance or with a Qi percentage lower than yours or below 40%. This effect lasts 10s and can only trigger once every 12s.",
  },
  [SET_ID.hawkwing]: {
    short: "Affinity hit: +1.8% Phys/Bellstrike Atk per stack, 5s, x5",
    full: "When any damage triggers Affinity, gain Hawkwing: increases both Physical Attack and Bellstrike Attack by 1.8% for 5 seconds, stacking up to 5 times.",
  },
  [SET_ID.rainwhisper]: {
    short: "+10% Crit DMG; +15% more with a self-applied shield",
    full: "Increases all Critical DMG and healing by 10%, and further increases them by 15% when you have an HP shield applied by yourself.",
  },
  [SET_ID.swiftGale]: {
    short: "+10% Airborne Heavy Attack DMG, knockdown every 10s",
    full: "Increases Airborne Heavy Attack by 10% and knocks the target. The Knocked-Down effect can only trigger once every 10 seconds.",
  },
  [SET_ID.swayingHeights]: {
    short: "+5% DMG vs targets above 50% HP, up to +10%",
    full: "Increases the damage dealt against targets with more than 50% HP by 5%. Every 5% more HP further increases this bonus by 1%, up to 10%.",
  },
  [SET_ID.swallowcall]: {
    short: "Light Attack +12% DMG; +6% Phys/Bamboocut vs low Qi",
    full: "Light Attacks and effects triggered by Light Attacks (e.g., rodents) deal 12% more HP damage, and deal 6% more Physical and Bamboocut damage to targets with below 40% Qi or suffering from a Qi Anomaly status (including Vacant Peak, Bone Corrosion, and Qi Imbalance).",
  },
  [SET_ID.mistwillow]: {
    short: "Light/Heavy cross-boost +10% Phys & Silkbind DMG, 15s",
    full: "Landing a Heavy Attack/Heavy Attack Charged Skill increases the Physical and Silkbind damage of Light Attacks and Ballistic Skills by 10% for 15 seconds, and vice versa. When both damage bonuses exist at the same time, they will be upgraded to Mistwillow: increases the Physical and Silkbind damage of both Light Attack/Ballistic Skills and Heavy Attack/Heavy Attack Charged Skills. Hitting the enemy with corresponding skills again can refresh the effect's duration.\nThe duration of the effects above can only be refreshed once every 2 seconds.",
  },
  [SET_ID.ivorybloom]: {
    short: "Full HP/after crit heal: +5% Crit Rate, +15% Crit DMG",
    full: "At Max HP or within 3 seconds of a Critical Healing, there is a bonus 5% chance to deal Critical Healing and Critical DMG, and the effects of Critical Healing and Critical DMG are increased by 15%.",
  },
  [SET_ID.starweave]: {
    short: "Boss/multi hit: +3% MA Skill DMG/stack x5, more at range",
    full: "When hitting at least 2 enemies simultaneously, or hitting a boss or player, you gain 1 stack of Starweave: For 5 seconds, Martial Art Skills deal 3% increased damage and further bonus damage to enemies more than 4 meters away; the bonus increases with distance, up to 1% at 8 meters. Starweave stacks up to 5 times, and 1 stack is removed each time you take damage. Up to 2 stacks of Starweave can be gained per second.",
  },
  [SET_ID.cleftpeak]: {
    short: "Boss hit: +1% DMG/stack x5; +8% Varied Combo at 5 stacks",
    full: "Hitting a boss or player grants Shattered Ridge for 5 seconds: Increases HP damage dealt by 1%, stacking up to 5 times. At 5 stacks, increases damage of Light/Heavy Attack: Varied Combo, Assist Trigger Skills, and their assist effects by a further 8%. A successful Deflect immediately grants 5 stacks of Shattered Ridge.\nThe extra DMG Boost applies to the following skills: Light/Heavy Attack: Varied Combo of Snowparting Blade, Thundercry Blade, Vernal Umbrella, Museflow Waist Drum, and Willowbend Fan; Inkwell Fan: Moon Shatter Spring; Anxi Army Assist and its Trigger Skills of Snowparting Blade and Phalanxbane Blade.",
  },
  [SET_ID.etherwrath]: {
    short: "Boss hit: +1.2% all Atk/stack x5; +6 Pen on MA effects",
    full: "Hitting a boss or player grants Etherwrath: Increases all types of Attack by 1.2% (including Physical Attack and all Attribute Attacks) for 8s, stacking up to 5 times. At 5 stacks of Etherwrath, grants 6 additional Penetration of all types when Martial Art effects deal damage. Triggering a Perfect Dodge instantly grants 5 stacks of Etherwrath.\nApplicable Martial Art effects: Heavenwill Gauntlets - Falcon's Pursuit and Vile Condemned series, Skystrike Gauntlets - Falcon's Pursuit, Mortal Rope Dart - Rodent, Everspring Umbrella - Resonance, Phalanxbane Blade - Anxi Army Assist.",
  },
  [SET_ID.tiltrim]: {
    short: "Hit while enhanced: +1% all Atk/stack x5; +5% Inebriate",
    full: "Dealing damage while under a Martial Art Special Enhancement grants Tiltrim for 5s. Each stack of Tiltrim increases all attacks by 1%, including Physical Attack and all Attribute Attacks. At 5 stacks, Inebriate-enhanced skills deal an additional 5% HP damage.\nApplicable Enhancements: Inebriate, Infernal Twinblades - Flamelash, Everspring Umbrella - Flower Burial.",
  },
}
