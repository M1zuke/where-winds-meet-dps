// No imports of its own. Every value byte-identical to the current JSON —
// this file PINS ids, it does not mint new ones.
export const SKILL = {
  swordq: "bellstrikeUmbra-swordq",
  swordqfollowup: "bellstrikeUmbra-swordqfollowup",
  spearheavy: "bellstrikeUmbra-spearheavy",
  spearq: "bellstrikeUmbra-spearq",
  swordspecial3Hit: "bellstrikeUmbra-swordspecial-3-hit",
  crosswindBlade: "bellstrikeUmbra-crosswind-blade",
  spearheavy1HitPrepull: "bellstrikeUmbra-spearheavy-1-hit-prepull",
  spearq5HitCancel: "bellstrikeUmbra-spearq-5-hit-cancel",
  swordspecial4Hit: "bellstrikeUmbra-swordspecial-4-hit",
  swordChargeStage14Hit: "bellstrikeUmbra-sword-charge-stage-1-4-hit",
  swordqFollowUp1HitCancel: "bellstrikeUmbra-swordq-follow-up-1-hit-cancel",
  swordqFollowUp2HitCancel: "bellstrikeUmbra-swordq-follow-up-2-hit-cancel",
  swordMartialQqq: "bellstrikeUmbra-sword-martial-qqq",
  swordChargeStage13Hit: "bellstrikeUmbra-sword-charge-stage-1-3-hit",
  swordChargeStage15Hit: "bellstrikeUmbra-sword-charge-stage-1-5-hit",
  swordRChargeFollowUp: "bellstrikeUmbra-sword-r-charge-follow-up",
  swordRChargeFollowUp1HitCancel: "bellstrikeUmbra-sword-r-charge-follow-up-1-hit-cancel",
  spearheavy1Hit: "bellstrikeUmbra-spearheavy-1-hit",
  spearspecial1HitCancel: "bellstrikeUmbra-spearspecial-1-hit-cancel",
  spearspecial: "bellstrikeUmbra-spearspecial",
  bleedTick: "bellstrikeUmbra-bleed-tick",
  bleedDetonation: "bellstrikeUmbra-bleed-detonation",
  dragonFireSmolder1Hit: "bellstrikeUmbra-dragon-fire-smolder-1-hit",
  dragonFireSmolder2Hits: "bellstrikeUmbra-dragon-fire-smolder-2-hits",
} as const

export const DEBUFF = {
  toadPoison: "debuff-bellstrikeUmbra-toad-poison",
  combustion: "debuff-bellstrikeUmbra-combustion",
  darkFire: "debuff-bellstrikeUmbra-dark-fire",
  fluteRipple: "debuff-bellstrikeUmbra-flute-ripple",
  bleedTick: "debuff-bellstrikeUmbra-bleed-tick",
  bitterSeasonTick: "debuff-bellstrikeUmbra-bitter-season-tick",
} as const

// The four gate buffs `bellstrikeUmbraGates.ts` registers — consumed by the
// timeline (`HitVariant` swaps, trigger conditions), never carrying stat
// effects of their own.
export const STATUS = {
  riverFlow: "buff-bellstrikeUmbra-river-flow",
  spearSpecialCooldown: "buff-bellstrikeUmbra-spear-special-cooldown",
  zenithBar: "buff-bellstrikeUmbra-zenith-bar",
  zenithDetonation: "buff-bellstrikeUmbra-zenith-detonation",
} as const

export const ZENITH_SMOLDER_EXTEND_FRAMES = 600

// User-verified 2026-08-07: a Zenith detonation always adds its full extend
// amount, but the resulting REMAINING duration (from that detonation's own
// frame, re-evaluated per detonation — not a lifetime cap on the window)
// never exceeds 16 s. If the window is already longer than that, the
// detonation must leave it alone — never truncate it down to the cap.
// Sword Horizon logic, not specific to any one debuff it extends (Smolder,
// Bitter Season's poison, …).
export const ZENITH_MAX_EXTENDED_DURATION_FRAMES = 960
