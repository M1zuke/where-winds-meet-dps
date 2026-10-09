// No imports of its own. Every value byte-identical to the current JSON —
// this file PINS ids, it does not mint new ones.
export const SKILL = {
  anxisoldierheng: "stonesplitStrength-anxisoldierheng",
  anxisoldierhengStab: "stonesplitStrength-anxisoldierheng-stab",
  anxisoldiermodown: "stonesplitStrength-anxisoldiermodown",
  anxisoldiermojump: "stonesplitStrength-anxisoldiermojump",
  anxisoldiermosweep: "stonesplitStrength-anxisoldiermosweep",
  deflect: "stonesplitStrength-deflect",
  deflectCancel: "stonesplitStrength-deflect-cancel",
  phalanxchargedS3: "stonesplitStrength-phalanxcharged-s3",
  phalanxchargedS3Innerpassion: "stonesplitStrength-phalanxcharged-s3-innerpassion",
  phalanxq: "stonesplitStrength-phalanxq",
  phalanxqSupreme: "stonesplitStrength-phalanxq-supreme",
  anxisoldiermosweepSupreme: "stonesplitStrength-anxisoldiermosweep-supreme",
  phalanxspecial: "stonesplitStrength-phalanxspecial",
  phalanxspecialPrepull: "stonesplitStrength-phalanxspecial-prepull",
  snowpartingcharged: "stonesplitStrength-snowpartingcharged",
  snowpartingchargedForgetfulness: "stonesplitStrength-snowpartingcharged-forgetfulness",
  snowpartingdual: "stonesplitStrength-snowpartingdual",
  snowpartingdualPrepull: "stonesplitStrength-snowpartingdual-prepull",
  snowpartingqStab: "stonesplitStrength-snowpartingq-stab",
  snowpartingslide: "stonesplitStrength-snowpartingslide",
  snowpartingslidePrepull: "stonesplitStrength-snowpartingslide-prepull",
  snowpartingslidePrepullHit: "stonesplitStrength-snowpartingslide-prepull-hit",
  snowpartingspecial: "stonesplitStrength-snowpartingspecial",
  snowpartingvc: "stonesplitStrength-snowpartingvc",
  snowpartingvcPrepull: "stonesplitStrength-snowpartingvc-prepull",
  moBladeDual: "stonesplitStrength-mo-blade-dual",
  snowpartingqSlash: "stonesplitStrength-snowpartingq-slash",
  phalanxchargedS1: "stonesplitStrength-phalanxcharged-s1",
  phalanxchargedS2: "stonesplitStrength-phalanxcharged-s2",
  phalanxchargedS2Innerpassion: "stonesplitStrength-phalanxcharged-s2-innerpassion",
  breakDefense: "stonesplitStrength-break-defense",
  hengLightAttack1: "stonesplitStrength-heng-light-attack-1",
  hengLightAttack2: "stonesplitStrength-heng-light-attack-2",
  hengLightAttack3: "stonesplitStrength-heng-light-attack-3",
  hengLightAttack4: "stonesplitStrength-heng-light-attack-4",
  hengHeavyAttack1: "stonesplitStrength-heng-heavy-attack-1",
  hengHeavyAttack2: "stonesplitStrength-heng-heavy-attack-2",
  hengHeavyAttack3: "stonesplitStrength-heng-heavy-attack-3",
  hengHeavyAttack4: "stonesplitStrength-heng-heavy-attack-4",
  hengDash: "stonesplitStrength-heng-dash",
  moLightAttack1: "stonesplitStrength-mo-light-attack-1",
  moLightAttack2: "stonesplitStrength-mo-light-attack-2",
  moLightAttack3: "stonesplitStrength-mo-light-attack-3",
  moDash: "stonesplitStrength-mo-dash",
} as const

export const DEBUFF = {
  bitterSeasonTick: "debuff-stonesplitStrength-bitter-season-tick",
} as const

// The two gate buffs `classes/stonesplit-strength/gates.ts` registers — a rotation hit
// applies them, and they carry the stat effects the timeline reads.
export const STATUS = {
  dread: "buff-stonesplitStrength-dread",
  fearfulBlade: "buff-stonesplitStrength-fearful-blade",
  breakDefenseCooldown: "buff-stonesplitStrength-break-defense-cooldown",
} as const
