// No imports of its own. Ids here are in their PRE-RETARGET form — `SKILL.*`
// carries the bare `universal-*` id exactly as authored;
// `src/definitions/skills/universalSkills.ts`'s `instantiateUniversal` /
// `retargetId` rewrite them onto each class at load time.
export const SKILL = {
  bitterSeasonTick: "universal-bitter-season-tick",
  deflectCancelPrepull: "universal-deflect-cancel-prepull",
  deflectCancel: "universal-deflect-cancel",
  delay: "universal-delay",
  ghostlySteps: "universal-ghostly-steps",
  goldenBodyCancel: "universal-golden-body-cancel",
  goldenBodyDeflectCancel: "universal-golden-body-deflect-cancel",
  perfectDodgeFull: "universal-perfect-dodge-full",
  perfectDodge: "universal-perfect-dodge",
} as const
