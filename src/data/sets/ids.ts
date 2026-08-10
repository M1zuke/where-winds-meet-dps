// Every id is new with this conversion — `Inputs.set` used to store the
// display name directly; see the V8 migration in `src/migrations/` for the
// value-level repair of a profile saved before this.
export const SET_ID = {
  hawking: "hawking",
  jadeware: "jadeware",
  rainwhisper: "rainwhisper",
  rainwhisperNoShield: "rainwhisperNoShield",
  ivorybloom: "ivorybloom",
  swallowcall: "swallowcall",
  swiftGale: "swiftGale",
  swayingHeights: "swayingHeights",
  mistwillow: "mistwillow",
  starsAlign: "starsAlign",
  shatteredRidge: "shatteredRidge",
} as const
