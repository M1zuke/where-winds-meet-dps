import type { AttributeKey, Inputs } from "../../engine/types"
import type { Skill } from "../../engine/skill"
import type { Buff } from "../../engine/buff"
import type { Debuff } from "../../engine/debuff"
import type { Rotation } from "../../engine/rotation"
import type { BuffModule } from "../../engine/buffs/buffModule"
import type { AnyMechanic, TimelineMechanic } from "../../engine/mechanics"
import type { SkillBehaviorFactory } from "../../engine/behavior"
import type { RetunementPool } from "./retunementPools"
import type { InnerWayId } from "./innerWayRegistry"

export interface MechanicRegistration {
  mechanic: AnyMechanic
  order: number
}

export interface SkillBehaviorRegistration {
  skillId: string
  factory: SkillBehaviorFactory
}

export interface DisplayGateRegistration {
  defId: string
  predicate: (inputs: Inputs) => boolean
}

export interface PoisonExtensionRegistration {
  statusId: string
  maxRemainingSec: number
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
  // The class's own signature inner way, or "" if it has none.
  classMindGroup: InnerWayId | ""
  // The inner ways it may slot alongside its signature.
  allowedMindMethods: readonly InnerWayId[]
  // Visible dingYin attunement tags.
  dingYinTags: readonly string[]
  // Fallback weapon pair `itemRanking.ts` reads when the active rotation casts
  // neither of the class's weapons yet.
  weapons: readonly string[]
  critBoostWeaponTypes: readonly string[]
  skills: readonly Skill[]
  debuffs: readonly Debuff[]
  rotations: readonly Rotation[]
  defaultRotationId: string | null
  retunementPool: RetunementPool | null
  // docs/CLASSES.md § "Buff category" — reachable because being this class is
  // sufficient, and mechanicBuffDefs vs classBuffDefs only changes how the
  // Skill Editor groups the row, not how the engine applies it.
  classBuffDefs: readonly BuffModule[]
  mechanicBuffDefs: readonly BuffModule[]
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

// `registerMechanic`'s generic keeps a mechanic's `State` type checked all
// the way to `TimelineMechanic<State>`; this mirrors it for `ClassDef.mechanics`
// so a class writes one `MechanicRegistration` per mechanic without an
// `as unknown as AnyMechanic` cast of its own — the erasure to `AnyMechanic`
// happens once, here, instead of once per class per mechanic.
export function classMechanic<State>(
  mechanic: TimelineMechanic<State>,
  order: number,
): MechanicRegistration {
  return { mechanic: mechanic as unknown as AnyMechanic, order }
}
