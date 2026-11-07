import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"
import { ROLE } from "../../ids"
import { stat } from "../../../../engine/effects/effect"

// Binge Points' own permanent controller — Skystrike Gauntlets or Riven
// Twinblades equipped, always true for the class — as of 2026-09-25:
// Falcon's Pursuit's own Qi rate +0.625, and against a non-player target,
// Dragonquench - Inebriate's and Falcon's Pursuit's Qi damage +53.8%.
export const draughtQiBonuses = defineClassBuff({
  id: BUFF.draughtQiBonuses,
  name: "Draught Qi Bonuses",
  affectsAll: true,
  alwaysActive: true,
  duration: 9999,
  summary:
    "Falcon's Pursuit qiRateAdd +0.625; Falcon's Pursuit/Dragonquench - Inebriate qiDamageBoost +53.8%",
  effects: (ctx) => {
    if (ctx.event.kind !== "damage") return []
    const isFalconsPursuit = ctx.event.tags.has(ROLE.falconsPursuit)
    const isDragonquenchInebriate = ctx.event.tags.has(ROLE.dragonquenchInebriate)
    if (!isFalconsPursuit && !isDragonquenchInebriate) return []
    return [...(isFalconsPursuit ? [stat("qiRateAdd", 0.625)] : []), stat("qiDamageBoost", 0.538)]
  },
})
