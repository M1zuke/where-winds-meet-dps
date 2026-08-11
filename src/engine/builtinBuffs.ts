// River Flow and Spear Special Cooldown carry no stat effects on purpose —
// they are gates consumed by the timeline (HitVariant swaps, trigger
// conditions), not `{statKey, amount}` effects.
import type { Buff } from "./buff"
import { CROSSWIND_MAX_CHARGES } from "./buffs/crosswind"

export const RIVER_FLOW_DURATION_FRAMES = 900
export const SPEAR_SPECIAL_COOLDOWN_FRAMES = 690
export const DREAD_DURATION_FRAMES = 420
export const FEARFUL_BLADE_DURATION_FRAMES = 900

export const ZENITH_SMOLDER_EXTEND_FRAMES = 600

// User-verified 2026-08-07: a Zenith detonation always adds its full extend
// amount, but the resulting REMAINING duration (from that detonation's own
// frame, re-evaluated per detonation — not a lifetime cap on the window)
// never exceeds 16 s. If the window is already longer than that, the
// detonation must leave it alone — never truncate it down to the cap.
// Sword Horizon logic, not specific to any one debuff it extends (Smolder,
// Bitter Season's poison, …).
export const ZENITH_MAX_EXTENDED_DURATION_FRAMES = 960

export const RIVER_FLOW_BUFF_ID = "buff-bellstrikeUmbra-river-flow"
export const SPEAR_SPECIAL_COOLDOWN_BUFF_ID = "buff-bellstrikeUmbra-spear-special-cooldown"
export const ZENITH_BAR_BUFF_ID = "buff-bellstrikeUmbra-zenith-bar"
export const ZENITH_DETONATION_BUFF_ID = "buff-bellstrikeUmbra-zenith-detonation"
export const ZENITH_DETONATION_FRAMES = 1
export const DREAD_BUFF_ID = "buff-stonesplitStrength-dread"
export const FEARFUL_BLADE_BUFF_ID = "buff-stonesplitStrength-fearful-blade"

const BUILTIN_BUFFS: Record<string, Buff[]> = {
  bellstrikeUmbra: [
    {
      id: RIVER_FLOW_BUFF_ID,
      classId: "bellstrikeUmbra",
      name: "River Flow",
      scope: "player",
      activation: "triggered",
      durationFrames: RIVER_FLOW_DURATION_FRAMES,
      effects: [],
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: "2026-07-30T00:00:00.000Z",
      updatedAt: "2026-07-30T00:00:00.000Z",
    },
    {
      id: SPEAR_SPECIAL_COOLDOWN_BUFF_ID,
      classId: "bellstrikeUmbra",
      name: "Spear Special Cooldown",
      scope: "player",
      activation: "triggered",
      durationFrames: SPEAR_SPECIAL_COOLDOWN_FRAMES,
      effects: [],
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: "2026-07-30T00:00:00.000Z",
      updatedAt: "2026-07-30T00:00:00.000Z",
    },
    {
      id: ZENITH_BAR_BUFF_ID,
      classId: "bellstrikeUmbra",
      name: "Zenith Bar",
      scope: "player",
      activation: "permanent",
      durationFrames: 0,
      effects: [],
      maxStacks: CROSSWIND_MAX_CHARGES,
      stackScaling: "flat",
      createdAt: "2026-07-31T00:00:00.000Z",
      updatedAt: "2026-07-31T00:00:00.000Z",
    },
    {
      id: ZENITH_DETONATION_BUFF_ID,
      classId: "bellstrikeUmbra",
      name: "Zenith Detonation",
      scope: "player",
      activation: "triggered",
      durationFrames: ZENITH_DETONATION_FRAMES,
      effects: [],
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: "2026-07-30T00:00:00.000Z",
      updatedAt: "2026-07-30T00:00:00.000Z",
    },
  ],
  stonesplitStrength: [
    {
      id: DREAD_BUFF_ID,
      classId: "stonesplitStrength",
      name: "Dread",
      scope: "player",
      activation: "triggered",
      durationFrames: DREAD_DURATION_FRAMES,
      effects: [{ statKey: "allDamageBoost", amount: 0.12 }],
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: "2026-08-09T00:00:00.000Z",
      updatedAt: "2026-08-09T00:00:00.000Z",
    },
    {
      id: FEARFUL_BLADE_BUFF_ID,
      classId: "stonesplitStrength",
      name: "Fearful Blade",
      scope: "team",
      activation: "triggered",
      durationFrames: FEARFUL_BLADE_DURATION_FRAMES,
      effects: [
        { statKey: "allDamageBoost", amount: 0.08 },
        { statKey: "bellstrike.penetration", amount: 0.16 },
        { statKey: "stonesplit.penetration", amount: 0.16 },
        { statKey: "silkbind.penetration", amount: 0.16 },
        { statKey: "bamboocut.penetration", amount: 0.16 },
      ],
      maxStacks: 1,
      stackScaling: "flat",
      createdAt: "2026-08-09T00:00:00.000Z",
      updatedAt: "2026-08-09T00:00:00.000Z",
    },
  ],
}

export function builtinBuffsForClass(classId: string): Buff[] {
  return BUILTIN_BUFFS[classId] ?? []
}
