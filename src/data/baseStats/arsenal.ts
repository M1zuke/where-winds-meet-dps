import { defineArsenalStores } from "../../definitions/baseStats/arsenalStoreDef"
import type { ArsenalAttackLadder } from "../../definitions/baseStats/arsenalStoreDef"

// In-game values as of 2026-09-08. Ten stores; an eleventh is unreachable.
// Total Mastery is not ratioC — they coincide for every store except store 2,
// whose mastery is 1000 against a ratioC of 860. Every arsenal style grants the
// same attack amounts; only the stat block they land on differs.
const STORE_1_ATTACK_LADDER: ArsenalAttackLadder = [
  { min: 1, max: 3 },
  { min: 3, max: 7 },
  { min: 5, max: 11 },
  { min: 7, max: 15 },
  { min: 9, max: 19 },
  { min: 11, max: 23 },
  { min: 12, max: 25 },
]

const STORE_2_TO_10_ATTACK_LADDER: ArsenalAttackLadder = [
  { min: 2, max: 5 },
  { min: 5, max: 10 },
  { min: 7, max: 15 },
  { min: 10, max: 20 },
  { min: 13, max: 26 },
  { min: 15, max: 31 },
  { min: 17, max: 34 },
]

export const ARSENAL_STORES = defineArsenalStores([
  {
    gearTier: 41,
    graduationPromotion: 1600,
    ratioA: 50,
    ratioB: 1.432,
    ratioC: 550,
    totalMastery: 550,
    attackLadder: STORE_1_ATTACK_LADDER,
  },
  {
    gearTier: 51,
    graduationPromotion: 3200,
    ratioA: 100,
    ratioB: 2.349,
    ratioC: 860,
    totalMastery: 1000,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
  {
    gearTier: 56,
    graduationPromotion: 3350,
    ratioA: 100,
    ratioB: 2.352,
    ratioC: 1980,
    totalMastery: 1980,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
  {
    gearTier: 61,
    graduationPromotion: 3500,
    ratioA: 100,
    ratioB: 2.35,
    ratioC: 2520,
    totalMastery: 2520,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
  {
    gearTier: 71,
    graduationPromotion: 3650,
    ratioA: 100,
    ratioB: 2.358,
    ratioC: 3300,
    totalMastery: 3300,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
  {
    gearTier: 81,
    graduationPromotion: 3800,
    ratioA: 100,
    ratioB: 2.291,
    ratioC: 3960,
    totalMastery: 3960,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
  {
    gearTier: 86,
    graduationPromotion: 4000,
    ratioA: 100,
    ratioB: 1.985,
    ratioC: 4620,
    totalMastery: 4620,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
  {
    gearTier: 91,
    graduationPromotion: 4200,
    ratioA: 100,
    ratioB: 2.185,
    ratioC: 5700,
    totalMastery: 5700,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
  {
    gearTier: 96,
    graduationPromotion: 4400,
    ratioA: 100,
    ratioB: 2.02,
    ratioC: 7020,
    totalMastery: 7020,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
  {
    gearTier: 100,
    graduationPromotion: 4600,
    ratioA: 100,
    ratioB: 2.065,
    ratioC: 7320,
    totalMastery: 7320,
    attackLadder: STORE_2_TO_10_ATTACK_LADDER,
  },
])
