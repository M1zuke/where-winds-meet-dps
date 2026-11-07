// v31 → v32 — a class's two martial arts own the two weapon slots in the order
// the class lists them, and a weapon slot only rolls its own art's boost. A
// weapon stored in the other art's slot stops scoring its boost, so each piece
// moves to the slot its own boost belongs to. The table is frozen at the slot
// assignment this step introduced.
import type { Migration, RawProfilesBlob } from "./types"

type WeaponSlot = "leftWeapon" | "rightWeapon"

const BOOST_BY_WEAPON_SLOT: Readonly<Record<string, Readonly<Record<WeaponSlot, string>>>> = {
  bellstrikeUmbra: { leftWeapon: "swordBoost", rightWeapon: "spearBoost" },
  bellstrikeSplendor: { leftWeapon: "swordBoost", rightWeapon: "spearBoost" },
  silkbindJade: { leftWeapon: "umbrellaBoost", rightWeapon: "fanBoost" },
  stonesplitStrength: { leftWeapon: "modaoBoost", rightWeapon: "hengDaoBoost" },
  bamboocutDraught: { leftWeapon: "gauntletsBoost", rightWeapon: "dualKnivesBoost" },
}

const OPPOSITE_SLOT: Readonly<Record<WeaponSlot, WeaponSlot>> = {
  leftWeapon: "rightWeapon",
  rightWeapon: "leftWeapon",
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

function isWeaponSlot(value: unknown): value is WeaponSlot {
  return value === "leftWeapon" || value === "rightWeapon"
}

function wordsOf(entry: Record<string, unknown>): string[] {
  if (!Array.isArray(entry.words)) return []
  return entry.words.map((word) => (isRecord(word) ? word.word : word)).filter(isString)
}

function isString(value: unknown): value is string {
  return typeof value === "string"
}

function holdsOnlyOtherSlotsBoost(
  entry: Record<string, unknown>,
  slot: WeaponSlot,
  boosts: Readonly<Record<WeaponSlot, string>>,
): boolean {
  const words = wordsOf(entry)
  return words.includes(boosts[OPPOSITE_SLOT[slot]]) && !words.includes(boosts[slot])
}

function slotOf(entry: Record<string, unknown>): WeaponSlot | null {
  return isWeaponSlot(entry.slot) ? entry.slot : null
}

function needsOppositeSlot(
  entry: Record<string, unknown>,
  boosts: Readonly<Record<WeaponSlot, string>>,
): boolean {
  const slot = slotOf(entry)
  return slot !== null && holdsOnlyOtherSlotsBoost(entry, slot, boosts)
}

function holdsOwnSlotsBoost(
  entry: Record<string, unknown>,
  boosts: Readonly<Record<WeaponSlot, string>>,
): boolean {
  const slot = slotOf(entry)
  return slot !== null && wordsOf(entry).includes(boosts[slot])
}

export function moveCustomBuildWeaponsToMartialArtSlots(
  classId: unknown,
  slots: readonly unknown[],
): unknown[] {
  const boosts = isString(classId) ? BOOST_BY_WEAPON_SLOT[classId] : undefined
  if (!boosts) return [...slots]
  const weaponEntries = slots.filter(
    (entry): entry is Record<string, unknown> => isRecord(entry) && slotOf(entry) !== null,
  )
  if (!weaponEntries.some((entry) => needsOppositeSlot(entry, boosts))) return [...slots]
  if (weaponEntries.some((entry) => holdsOwnSlotsBoost(entry, boosts))) return [...slots]
  const destinations = weaponEntries.map((entry) => OPPOSITE_SLOT[slotOf(entry)!])
  if (new Set(destinations).size !== destinations.length) return [...slots]
  return slots.map((entry) =>
    isRecord(entry) && slotOf(entry) ? { ...entry, slot: OPPOSITE_SLOT[slotOf(entry)!] } : entry,
  )
}

export function moveWeaponsToMartialArtSlots(
  inputs: Record<string, unknown>,
): Record<string, unknown> {
  const classId = inputs.classId
  const boosts = isString(classId) ? BOOST_BY_WEAPON_SLOT[classId] : undefined
  if (!boosts || !Array.isArray(inputs.inventory) || !isRecord(inputs.equipped)) return inputs

  const equipped = inputs.equipped
  const pieceById = new Map<string, Record<string, unknown>>()
  for (const piece of inputs.inventory)
    if (isRecord(piece) && isString(piece.id)) pieceById.set(piece.id, piece)

  const equippedLeft = isString(equipped.leftWeapon)
    ? pieceById.get(equipped.leftWeapon)
    : undefined
  const equippedRight = isString(equipped.rightWeapon)
    ? pieceById.get(equipped.rightWeapon)
    : undefined
  const equippedPieces = [equippedLeft, equippedRight].filter(
    (piece): piece is Record<string, unknown> => piece !== undefined,
  )

  const swapEquippedPair =
    equippedPieces.some((piece) => needsOppositeSlot(piece, boosts)) &&
    !equippedPieces.some((piece) => holdsOwnSlotsBoost(piece, boosts))
  const destinations = equippedPieces.map((piece) => {
    const slot = slotOf(piece)
    return slot && swapEquippedPair ? OPPOSITE_SLOT[slot] : slot
  })
  const pairCollides = new Set(destinations).size !== destinations.length
  const swapped = swapEquippedPair && !pairCollides

  const equippedIds = new Set(equippedPieces.map((piece) => piece.id))
  const inventory = inputs.inventory.map((piece) => {
    if (!isRecord(piece)) return piece
    const slot = slotOf(piece)
    if (!slot) return piece
    if (equippedIds.has(piece.id)) return swapped ? { ...piece, slot: OPPOSITE_SLOT[slot] } : piece
    return needsOppositeSlot(piece, boosts) ? { ...piece, slot: OPPOSITE_SLOT[slot] } : piece
  })

  return {
    ...inputs,
    inventory,
    equipped: swapped
      ? { ...equipped, leftWeapon: equipped.rightWeapon, rightWeapon: equipped.leftWeapon }
      : equipped,
  }
}

export const V32__weaponSlotsByMartialArt: Migration = {
  to: 32,
  name: "V32__weaponSlotsByMartialArt",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRecord(profile) && isRecord(profile.inputs)
            ? { ...profile, inputs: moveWeaponsToMartialArtSlots(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 32, profiles }
  },
}
