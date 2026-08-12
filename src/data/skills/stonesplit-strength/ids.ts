// No imports of its own. Every value byte-identical to the current JSON —
// this file PINS ids, it does not mint new ones.
export const SKILL = {
  anxisoldierheng: "stonesplitStrength-anxisoldierheng",
  anxisoldiermodown: "stonesplitStrength-anxisoldiermodown",
  anxisoldiermojump: "stonesplitStrength-anxisoldiermojump",
  anxisoldiermosweep: "stonesplitStrength-anxisoldiermosweep",
  blockperception: "stonesplitStrength-blockperception",
  deflect: "stonesplitStrength-deflect",
  phalanxchargedS3: "stonesplitStrength-phalanxcharged-s3",
  phalanxchargedS3Innerpassion: "stonesplitStrength-phalanxcharged-s3-innerpassion",
  phalanxq: "stonesplitStrength-phalanxq",
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
} as const

export const DEBUFF = {
  toadPoison: "debuff-stonesplitStrength-toad-poison",
  combustion: "debuff-stonesplitStrength-combustion",
  fluteRipple: "debuff-stonesplitStrength-flute-ripple",
  bitterSeasonTick: "debuff-stonesplitStrength-bitter-season-tick",
} as const

// The two gate buffs `classes/stonesplit-strength/gates.ts` registers — a rotation hit
// applies them, and they carry the stat effects the timeline reads.
export const STATUS = {
  dread: "buff-stonesplitStrength-dread",
  fearfulBlade: "buff-stonesplitStrength-fearful-blade",
} as const
