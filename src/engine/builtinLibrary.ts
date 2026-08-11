import type { Skill } from "./skill"
import type { Rotation } from "./rotation"
import type { Debuff } from "./debuff"
import { classDefinition } from "../definitions/classes/registry"

export { builtinBuffsForClass } from "./builtinBuffs"

export function builtinSkillsForClass(classId: string): Skill[] {
  return [...(classDefinition(classId)?.skills ?? [])]
}

export function builtinRotationsForClass(classId: string): Rotation[] {
  return [...(classDefinition(classId)?.rotations ?? [])]
}

export function defaultRotationForClass(classId: string): Rotation | null {
  const definition = classDefinition(classId)
  if (!definition) return null
  const byId = definition.rotations.find((rotation) => rotation.id === definition.defaultRotationId)
  return byId ?? definition.rotations[0] ?? null
}

export function builtinDebuffsForClass(classId: string): Debuff[] {
  return [...(classDefinition(classId)?.debuffs ?? [])]
}
