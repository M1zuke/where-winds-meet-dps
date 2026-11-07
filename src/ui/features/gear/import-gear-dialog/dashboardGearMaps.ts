import type { BowSlot, GearSlot } from "../../../../engine/types"

/**
 * Game equip-slot ids as used by the official dashboard's `wearEquips` /
 * `wearEquipsDetailed` maps. Mapping confirmed against a live account
 * (user report, 2026-08-11).
 *
 * A key mapped to null is a game slot we know about and have no app slot for; a
 * key that is absent entirely means the payload surprised us.
 */
export const GAME_SLOT_TO_GEAR_SLOT: Readonly<Record<string, GearSlot | null>> = {
  "1": "leftWeapon",
  "2": "rightWeapon",
  "3": "helm",
  "4": "armor",
  "5": "greaves",
  "8": "bracer",
  "10": "disc",
  "11": "pendant",
}

export const GAME_SLOT_TO_BOW_SLOT: Readonly<Record<string, BowSlot>> = {
  "9": "thumbRing",
  "21": "bow",
}
