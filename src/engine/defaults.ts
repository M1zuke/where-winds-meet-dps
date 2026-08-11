import type { Inputs } from "./types"
import { EMPTY_EQUIPPED, defaultCombatSettings } from "./types"
import { DEFAULT_ODDITIES } from "../definitions/baseStats"
import { SET_ID } from "../data/sets/ids"

export const emptyMindMethod = { name: "", stacks: "" } as const

export const defaultInputs: Inputs = {
  classId: "bellstrikeUmbra",
  breakthrough: 13,

  phys: { min: 1043.0, max: 2006.0, penetration: 0.292 },
  bellstrike: { min: 57.0, max: 0, penetration: 0 },
  stonesplit: { min: 28.0, max: 0, penetration: 0 },
  silkbind: { min: 0, max: 0, penetration: 0 },
  // This character-sheet build's bamboocut min/max bake in an OLDER arsenal
  // bonus (+114/229) than the live ARSENAL_BONUS (+131/263) — the engine
  // consumes them verbatim; do not "fix" this mismatch by re-deriving them.
  bamboocut: { min: 352.0, max: 502.0, penetration: 0.212 },

  // White values chosen to round-trip to the effective 1.0 / 0.7 / 0.164 at
  // r = 30 % — see CLAUDE.md § "White vs Yellow rates"; do not "simplify" them.
  precision: 1.105,
  critRate: 0.7 * 1.3,
  affinityRate: 0.164 * 1.3,
  directCritRate: 0.041,
  directAffinityRate: 0,
  physBoost: 0,
  critDamageBoost: 0.579,
  affinityDamageBoost: 0.35,
  attributeDamageBoost: 0.076,
  sustainDamageBoost: 0,
  allDamageBoost: 0,

  allMartialBoost: 0,
  swordBoost: 0,
  spearBoost: 0,
  fanBoost: 0,
  umbrellaBoost: 0,
  modaoBoost: 0,
  dualKnivesBoost: 0,
  ropeDartBoost: 0,
  hengDaoBoost: 0,

  bossBoost: 0,
  singleMysticBoost: 0,
  areaMysticBoost: 0,

  dingYinByTag: { "Mouse Boost": 0.153 },

  // Unslotted: no validated class allows four slottable inner ways.
  mindMethods: [
    { ...emptyMindMethod },
    { ...emptyMindMethod },
    { ...emptyMindMethod },
    { ...emptyMindMethod },
  ],

  food: true,
  tianGongElement: "fire",
  set: SET_ID.hawking,
  shareDebuff5HenZhi: false,
  shareEasyHurt: false,
  bowSet: null,
  arsenal: "bamboocut",
  dummyMode: false,

  rotation: null,

  activeCustomRotation: null,

  inventory: [],
  equipped: { ...EMPTY_EQUIPPED },

  martialArtsTalents: [],

  oddities: DEFAULT_ODDITIES,

  combatSettings: defaultCombatSettings(),
}

export const blankInputs: Inputs = {
  ...defaultInputs,
  classId: "bellstrikeUmbra",
  breakthrough: 16,
  phys: { min: 0, max: 0, penetration: 0 },
  bellstrike: { min: 0, max: 0, penetration: 0 },
  stonesplit: { min: 0, max: 0, penetration: 0 },
  silkbind: { min: 0, max: 0, penetration: 0 },
  bamboocut: { min: 0, max: 0, penetration: 0 },

  precision: 0,
  critRate: 0,
  affinityRate: 0,
  directCritRate: 0,
  directAffinityRate: 0,
  physBoost: 0,
  critDamageBoost: 0,
  affinityDamageBoost: 0,
  attributeDamageBoost: 0,
  sustainDamageBoost: 0,
  allDamageBoost: 0,

  dingYinByTag: {},

  mindMethods: [
    { ...emptyMindMethod },
    { ...emptyMindMethod },
    { ...emptyMindMethod },
    { ...emptyMindMethod },
  ],
}
