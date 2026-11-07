import {
  defineClassSkillBoosts,
  type ClassSkillBoost,
} from "../../definitions/baseStats/classSkillBoostDef"

const BELLSTRIKE_PENETRATION_PER_POINT = 0.0336
const PENETRATION_PER_POINT = 0.0672

const BELLSTRIKE_SCALE_MAX = 22 / BELLSTRIKE_PENETRATION_PER_POINT
const BELLSTRIKE_SCALE_MAX_BY_BREAKTHROUGH = {
  18: 23.6 / BELLSTRIKE_PENETRATION_PER_POINT,
  19: 25.2 / BELLSTRIKE_PENETRATION_PER_POINT,
  20: 27.6 / BELLSTRIKE_PENETRATION_PER_POINT,
  21: 29.6 / BELLSTRIKE_PENETRATION_PER_POINT,
}

const SCALE_MAX = 22 / PENETRATION_PER_POINT
const SCALE_MAX_BY_BREAKTHROUGH = {
  18: 23.6 / PENETRATION_PER_POINT,
  19: 25.2 / PENETRATION_PER_POINT,
  20: 27.6 / PENETRATION_PER_POINT,
  21: 29.6 / PENETRATION_PER_POINT,
}

export const CLASS_SKILL_BOOSTS: Readonly<Record<string, readonly ClassSkillBoost[]>> = {
  bellstrikeUmbra: defineClassSkillBoosts([
    {
      skill: "Affinity Rate UP",
      stat: "affinityRate",
      maxBonus: 0.04256,
      scalesWith: "power",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.0456, 19: 0.0494, 20: 0.05548, 21: 0.06156 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Physical Attack UP",
      stat: "maxPhys",
      maxBonus: 73.92,
      scalesWith: "power",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 79.2, 19: 85.8, 20: 96.36, 21: 106.92 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Sword Bellstrike Attack Min",
      stat: "minBellstrike",
      stage: "min",
      scalesWith: "power",
      scaleMax: 0,
    },
    {
      skill: "Sword Bellstrike Attack Max",
      stat: "maxBellstrike",
      stage: "max",
      scalesWith: "power",
      scaleMax: 0,
    },
    {
      skill: "Spear Bellstrike Attack Min",
      stat: "minBellstrike",
      stage: "min",
      scalesWith: "power",
      scaleMax: 0,
    },
    {
      skill: "Spear Bellstrike Attack Max",
      stat: "maxBellstrike",
      stage: "max",
      scalesWith: "power",
      scaleMax: 0,
    },
    {
      skill: "Bellstrike Penetration Scale",
      stat: "bellstrikePenetration",
      maxBonus: 0.22,
      scalesWith: "bellstrike.max",
      scaleMax: BELLSTRIKE_SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.236, 19: 0.252, 20: 0.276, 21: 0.296 },
      scaleMaxByBreakthrough: BELLSTRIKE_SCALE_MAX_BY_BREAKTHROUGH,
    },
    {
      skill: "Attribute Damage Scale",
      stat: "attributeDamage",
      maxBonus: 0.11,
      scalesWith: "bellstrike.max",
      scaleMax: BELLSTRIKE_SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.118, 19: 0.126, 20: 0.138, 21: 0.148 },
      scaleMaxByBreakthrough: BELLSTRIKE_SCALE_MAX_BY_BREAKTHROUGH,
    },
  ]),
  bellstrikeSplendor: defineClassSkillBoosts([
    {
      skill: "Affinity Rate UP",
      stat: "affinityRate",
      maxBonus: 0.04256,
      scalesWith: "momentum",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.0456, 19: 0.0494, 20: 0.05548, 21: 0.06156 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Physical Attack UP",
      stat: "maxPhys",
      maxBonus: 73.92,
      scalesWith: "momentum",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 79.2, 19: 85.8, 20: 96.36, 21: 106.92 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Sword Bellstrike Attack Min",
      stat: "minBellstrike",
      stage: "min",
      scalesWith: "momentum",
      scaleMax: 0,
    },
    {
      skill: "Sword Bellstrike Attack Max",
      stat: "maxBellstrike",
      stage: "max",
      scalesWith: "momentum",
      scaleMax: 0,
    },
    {
      skill: "Spear Bellstrike Attack Min",
      stat: "minBellstrike",
      stage: "min",
      scalesWith: "momentum",
      scaleMax: 0,
    },
    {
      skill: "Spear Bellstrike Attack Max",
      stat: "maxBellstrike",
      stage: "max",
      scalesWith: "momentum",
      scaleMax: 0,
    },
    {
      skill: "Bellstrike Penetration Scale",
      stat: "bellstrikePenetration",
      maxBonus: 0.22,
      scalesWith: "bellstrike.max",
      scaleMax: BELLSTRIKE_SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.236, 19: 0.252, 20: 0.276, 21: 0.296 },
      scaleMaxByBreakthrough: BELLSTRIKE_SCALE_MAX_BY_BREAKTHROUGH,
    },
    {
      skill: "Attribute Damage Scale",
      stat: "attributeDamage",
      maxBonus: 0.11,
      scalesWith: "bellstrike.max",
      scaleMax: BELLSTRIKE_SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.118, 19: 0.126, 20: 0.138, 21: 0.148 },
      scaleMaxByBreakthrough: BELLSTRIKE_SCALE_MAX_BY_BREAKTHROUGH,
    },
  ]),
  stonesplitStrength: defineClassSkillBoosts([
    {
      skill: "Critical Rate UP",
      stat: "critRate",
      maxBonus: 0.08512,
      scalesWith: "agility",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.0912, 19: 0.0988, 20: 0.11096, 21: 0.12312 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Physical Attack UP",
      stat: "minPhys",
      maxBonus: 73.92,
      scalesWith: "agility",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 79.2, 19: 85.8, 20: 96.36, 21: 106.92 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Mo Blade Stonesplit Attack Min",
      stat: "minStonesplit",
      stage: "min",
      scalesWith: "power",
      scaleMax: 0,
    },
    {
      skill: "Mo Blade Stonesplit Attack Max",
      stat: "maxStonesplit",
      stage: "max",
      scalesWith: "power",
      scaleMax: 0,
    },
    {
      skill: "Heng Blade Stonesplit Attack Min",
      stat: "minStonesplit",
      stage: "min",
      scalesWith: "power",
      scaleMax: 0,
    },
    {
      skill: "Heng Blade Stonesplit Attack Max",
      stat: "maxStonesplit",
      stage: "max",
      scalesWith: "power",
      scaleMax: 0,
    },
    {
      skill: "Stonesplit Penetration Scale",
      stat: "stonesplitPenetration",
      maxBonus: 0.22,
      scalesWith: "stonesplit.min",
      scaleMax: SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.236, 19: 0.252, 20: 0.276, 21: 0.296 },
      scaleMaxByBreakthrough: SCALE_MAX_BY_BREAKTHROUGH,
    },
    {
      skill: "Attribute Damage Scale",
      stat: "attributeDamage",
      maxBonus: 0.11,
      scalesWith: "stonesplit.min",
      scaleMax: SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.118, 19: 0.126, 20: 0.138, 21: 0.148 },
      scaleMaxByBreakthrough: SCALE_MAX_BY_BREAKTHROUGH,
    },
  ]),
  silkbindJade: defineClassSkillBoosts([
    {
      skill: "Critical Rate UP",
      stat: "critRate",
      maxBonus: 0.08512,
      scalesWith: "agility",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.0912, 19: 0.0988, 20: 0.11096, 21: 0.12312 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Physical Attack UP",
      stat: "minPhys",
      maxBonus: 73.92,
      scalesWith: "agility",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 79.2, 19: 85.8, 20: 96.36, 21: 106.92 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Umbrella Silkbind Attack Min",
      stat: "minSilkbind",
      stage: "min",
      scalesWith: "agility",
      scaleMax: 0,
    },
    {
      skill: "Umbrella Silkbind Attack Max",
      stat: "maxSilkbind",
      stage: "max",
      scalesWith: "agility",
      scaleMax: 0,
    },
    {
      skill: "Fan Silkbind Attack Min",
      stat: "minSilkbind",
      stage: "min",
      scalesWith: "agility",
      scaleMax: 0,
    },
    {
      skill: "Fan Silkbind Attack Max",
      stat: "maxSilkbind",
      stage: "max",
      scalesWith: "agility",
      scaleMax: 0,
    },
    {
      skill: "Silkbind Penetration Scale",
      stat: "silkbindPenetration",
      maxBonus: 0.22,
      scalesWith: "silkbind.min",
      scaleMax: SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.236, 19: 0.252, 20: 0.276, 21: 0.296 },
      scaleMaxByBreakthrough: SCALE_MAX_BY_BREAKTHROUGH,
    },
    {
      skill: "Attribute Damage Scale",
      stat: "attributeDamage",
      maxBonus: 0.11,
      scalesWith: "silkbind.min",
      scaleMax: SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.118, 19: 0.126, 20: 0.138, 21: 0.148 },
      scaleMaxByBreakthrough: SCALE_MAX_BY_BREAKTHROUGH,
    },
  ]),
  bamboocutDraught: defineClassSkillBoosts([
    {
      skill: "Critical Rate UP",
      stat: "critRate",
      maxBonus: 0.08512,
      scalesWith: "agility",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.0912, 19: 0.0988, 20: 0.11096, 21: 0.12312 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Physical Attack UP",
      stat: "minPhys",
      maxBonus: 73.92,
      scalesWith: "agility",
      scaleMax: 280,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 79.2, 19: 85.8, 20: 96.36, 21: 106.92 },
      scaleMaxByBreakthrough: { 18: 300, 19: 325, 20: 365, 21: 405 },
    },
    {
      skill: "Gauntlets Bamboocut Attack Min",
      stat: "minBamboocut",
      stage: "min",
      scalesWith: "agility",
      scaleMax: 0,
    },
    {
      skill: "Gauntlets Bamboocut Attack Max",
      stat: "maxBamboocut",
      stage: "max",
      scalesWith: "agility",
      scaleMax: 0,
    },
    {
      skill: "Twin Blades Bamboocut Attack Min",
      stat: "minBamboocut",
      stage: "min",
      scalesWith: "agility",
      scaleMax: 0,
    },
    {
      skill: "Twin Blades Bamboocut Attack Max",
      stat: "maxBamboocut",
      stage: "max",
      scalesWith: "agility",
      scaleMax: 0,
    },
    {
      skill: "Bamboocut Penetration Scale",
      stat: "bamboocutPenetration",
      maxBonus: 0.22,
      scalesWith: "bamboocut.min",
      scaleMax: SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.236, 19: 0.252, 20: 0.276, 21: 0.296 },
      scaleMaxByBreakthrough: SCALE_MAX_BY_BREAKTHROUGH,
    },
    {
      skill: "Attribute Damage Scale",
      stat: "attributeDamage",
      maxBonus: 0.11,
      scalesWith: "bamboocut.min",
      scaleMax: SCALE_MAX,
      // In-game talent caps as of 2026-10-15.
      maxBonusByBreakthrough: { 18: 0.118, 19: 0.126, 20: 0.138, 21: 0.148 },
      scaleMaxByBreakthrough: SCALE_MAX_BY_BREAKTHROUGH,
    },
  ]),
}
