import type { BowSlot, GearSlot } from "../../../../engine/types"
import { martialArtForWeaponSlot } from "../../../../definitions/classes/registry"
import { martialArtKey } from "../../../../i18n/contentKeys"

export function gearSlotLabelKey(slot: GearSlot, classId: string): string {
  const martialArt = martialArtForWeaponSlot(classId, slot)
  if (martialArt) return martialArtKey(martialArt.id)
  switch (slot) {
    case "leftWeapon":
      return "gear.slot.leftWeapon"
    case "rightWeapon":
      return "gear.slot.rightWeapon"
    case "disc":
      return "gear.slot.disc"
    case "pendant":
      return "gear.slot.pendant"
    case "helm":
      return "gear.slot.helm"
    case "armor":
      return "gear.slot.armor"
    case "greaves":
      return "gear.slot.greaves"
    case "bracer":
      return "gear.slot.bracer"
  }
}

export function bowSlotLabelKey(slot: BowSlot): string {
  switch (slot) {
    case "bow":
      return "gear.slot.bow"
    case "thumbRing":
      return "gear.slot.thumbRing"
  }
}
