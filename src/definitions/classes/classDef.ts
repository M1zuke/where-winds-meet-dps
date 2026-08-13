import type { Arsenal, AttributeKey, BowSet, GearPiece, GearWordName } from "../../engine/types"
import type { Skill } from "../../engine/skill"
import type { Buff } from "../../engine/buff"
import type { Debuff } from "../../engine/debuff"
import type { Rotation } from "../../engine/rotation"
import type { BuffModule } from "../../engine/buffs/buffModule"
import type { MechanicRegistration } from "../../engine/mechanics"
import type { SkillBehaviorRegistration } from "../../engine/behavior"
import type { InnerWayId } from "../../data/innerWays/ids"
import type { DisplayGateRegistration } from "../../engine/buffs/displayGates"

export interface RetunementPool {
  stats: readonly GearWordName[]
}

export interface PoisonExtensionRegistration {
  statusId: string
  maxRemainingSec: number
}

export interface GraduationBuild {
  gear: readonly GearPiece[]
  set: string | null
  bowSet: BowSet
  arsenal: Arsenal
  relayedOverrides?: Partial<Pick<GraduationBuild, "gear" | "set" | "bowSet" | "arsenal">>
}

// Everything a class *is*. A field it does not use is an empty array — see
// docs/CLASSES.md § "One definition per class" for the generalization
// contract this closes.
export interface ClassDef {
  id: string
  displayName: string
  // The other classes carry unverified imported numbers — CLASSES.md
  // § "Implemented classes" — and the UI marks them so.
  validated: boolean
  spec: string
  primaryAttribute: AttributeKey
  attributeMultiplier: number
  generalDamageBoost?: number
  classMindGroup: InnerWayId | ""
  allowedMindMethods: readonly InnerWayId[]
  classSpecificAttunements: readonly string[]
  // The fallback pair `itemRanking.ts` reads when the active rotation casts
  // neither of the class's weapons yet.
  weapons: readonly string[]
  critBoostWeaponTypes: readonly string[]
  skills: readonly Skill[]
  debuffs: readonly Debuff[]
  rotations: readonly Rotation[]
  defaultRotationId: string | null
  graduationBuild: GraduationBuild
  retunementPool: RetunementPool | null
  // Only defs the class itself owns — docs/CLASSES.md § "Buff ownership".
  // Membership here is also what puts a row in the Skill Editor's Spec
  // Mechanics column.
  classBuffDefs: readonly BuffModule[]
  // Timeline statuses (HitVariant swaps, trigger conditions) — never carry
  // stat effects of their own, so they stay the `Buff` type rather than
  // folding into `classBuffDefs`.
  gateBuffs: readonly Buff[]
  mechanics: readonly MechanicRegistration[]
  skillBehaviors: readonly SkillBehaviorRegistration[]
  displayGates: readonly DisplayGateRegistration[]
  poisonExtensions: readonly PoisonExtensionRegistration[]
}

export function defineClass<const T extends ClassDef>(def: T): T {
  return def
}
