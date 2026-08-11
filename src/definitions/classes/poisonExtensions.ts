// A cycle-free leaf: `src/definitions/classes/registry.ts` registers every
// class's poison extension eagerly, at module-load time, so this stays
// independent of whatever `bitterSeasonMechanic.ts` itself imports.
//
// A class inner way can extend an active poison — Sword Horizon's Zenith
// does. Keyed by class id since more than one class could declare one.
const extensionsByClassId = new Map<string, { statusId: string; maxRemainingSec: number }>()

export function registerPoisonExtension(
  classId: string,
  statusId: string,
  maxRemainingSec: number,
): void {
  extensionsByClassId.set(classId, { statusId, maxRemainingSec })
}

export function poisonExtensionForClass(
  classId: string,
): { statusId: string; maxRemainingSec: number } | undefined {
  return extensionsByClassId.get(classId)
}
