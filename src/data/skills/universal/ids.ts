// No imports of its own. Ids here are in their PRE-RETARGET form — `SKILL.*`
// carries the bare `universal-*` id and `DEBUFF.*` the bare `debuff-universal-*`
// id, exactly as authored; `src/data/skills/index.ts`'s `instantiateUniversal`
// / `retargetId` rewrite them onto each class at load time, unchanged by this
// conversion.
export const SKILL = {
  bitterSeasonTick: "universal-bitter-season-tick",
  deflectCancelPrepull: "universal-deflect-cancel-prepull",
  deflectCancel: "universal-deflect-cancel",
  delay: "universal-delay",
  dragonHeadPlus: "universal-dragon-head-plus",
  dragonHead: "universal-dragon-head",
  drunkenpoetPrepull: "universal-drunkenpoet-prepull",
  fireBreath1HitPrepull: "universal-fire-breath-1-hit-prepull",
  fireBreath1Hit: "universal-fire-breath-1-hit",
  fireBreath2Hit: "universal-fire-breath-2-hit",
  fluteOfTheTidesCancel: "universal-flute-of-the-tides-cancel",
  fluteOfTheTidesFull: "universal-flute-of-the-tides-full",
  fluteOfTheTidesPrepull: "universal-flute-of-the-tides-prepull",
  ghostlySteps: "universal-ghostly-steps",
  goldenBodyCancel: "universal-golden-body-cancel",
  goldenBodyDeflectCancel: "universal-golden-body-deflect-cancel",
  perfectDodgeFull: "universal-perfect-dodge-full",
  perfectDodge: "universal-perfect-dodge",
  poetFinalHitCancel: "universal-poet-final-hit-cancel",
  poet1: "universal-poet1",
  poet2: "universal-poet2",
  poet3: "universal-poet3",
  poet4: "universal-poet4",
  soaring1Hit: "universal-soaring-1-hit",
  soaring: "universal-soaring",
  toadCancel: "universal-toad-cancel",
} as const

export const DEBUFF = {
  combustion: "debuff-universal-combustion",
  fluteRipple: "debuff-universal-flute-ripple",
  toadPoison: "debuff-universal-toad-poison",
} as const
