import { defineArsenalStores } from "../../definitions/baseStats/arsenalStoreDef"

// Game client tables equip_box_score_attrs and equip_box_config as of
// 2026-09-08, 10 rows (store 11 has no equip_box_config row in any container
// and cannot be unlocked). Total Mastery is score_section's last entry, not
// ratioC — they coincide for every store except store 2 (mastery 1000, ratioC
// 860).
export const ARSENAL_STORES = defineArsenalStores([
  {
    gearTier: 41,
    graduationPromotion: 1600,
    ratioA: 50,
    ratioB: 1.432,
    ratioC: 550,
    totalMastery: 550,
  },
  {
    gearTier: 51,
    graduationPromotion: 3200,
    ratioA: 100,
    ratioB: 2.349,
    ratioC: 860,
    totalMastery: 1000,
  },
  {
    gearTier: 56,
    graduationPromotion: 3350,
    ratioA: 100,
    ratioB: 2.352,
    ratioC: 1980,
    totalMastery: 1980,
  },
  {
    gearTier: 61,
    graduationPromotion: 3500,
    ratioA: 100,
    ratioB: 2.35,
    ratioC: 2520,
    totalMastery: 2520,
  },
  {
    gearTier: 71,
    graduationPromotion: 3650,
    ratioA: 100,
    ratioB: 2.358,
    ratioC: 3300,
    totalMastery: 3300,
  },
  {
    gearTier: 81,
    graduationPromotion: 3800,
    ratioA: 100,
    ratioB: 2.291,
    ratioC: 3960,
    totalMastery: 3960,
  },
  {
    gearTier: 86,
    graduationPromotion: 4000,
    ratioA: 100,
    ratioB: 1.985,
    ratioC: 4620,
    totalMastery: 4620,
  },
  {
    gearTier: 91,
    graduationPromotion: 4200,
    ratioA: 100,
    ratioB: 2.185,
    ratioC: 5700,
    totalMastery: 5700,
  },
  {
    gearTier: 96,
    graduationPromotion: 4400,
    ratioA: 100,
    ratioB: 2.02,
    ratioC: 7020,
    totalMastery: 7020,
  },
  {
    gearTier: 100,
    graduationPromotion: 4600,
    ratioA: 100,
    ratioB: 2.065,
    ratioC: 7320,
    totalMastery: 7320,
  },
])
