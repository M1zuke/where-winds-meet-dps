// Which of a class's arts is drawn, and the free direct swap a weapon change
// needs before a step of the other art — see docs/TIMELINE.md § "Drawn
// weapon". Pure functions only: the layout pass owns the sequencing and the
// frame-accurate cooldown wait, this module only owns which steps a rotation
// needs a direct swap in front of.

import { isPrePullSkill, type Skill } from "./skill"
import { weaponTagOf, WEAPON_TAG } from "./buffs/tags"
import type { ResolvedStep } from "./rotation"

export const DRAWN_STATUS_PREFIX = "drawn:"

export function drawnWeaponStatusId(weapon: string): string {
  return DRAWN_STATUS_PREFIX + weapon
}

export function weaponIdentitiesOf(skills: readonly Skill[]): Set<string> {
  const weapons = new Set<string>()
  for (const skill of skills) {
    const weapon = weaponTagOf(skill)
    if (weapon) weapons.add(weapon)
  }
  return weapons
}

// Inserts a direct swap before a step whose weapon differs from the one last
// drawn, pre-pull steps included. A step that already performs its own
// weapon change (`isWeaponSwap`) counts as the swap and needs no insertion —
// a rotation step is never edited, only the fresh synthetic steps this
// returns are new. The very first weapon-bearing step of the sequence draws
// for free — there is nothing to swap from yet.
export function expandStepsWithWeaponSwaps(
  steps: readonly ResolvedStep[],
  makeDirectSwapStep: (weapon: string, prePull: boolean) => ResolvedStep,
): ResolvedStep[] {
  const expanded: ResolvedStep[] = []
  let drawnWeapon: string | null = null
  for (const resolvedStep of steps) {
    const weapon = weaponTagOf(resolvedStep.skill)
    if (weapon && weapon !== drawnWeapon) {
      if (drawnWeapon !== null && !resolvedStep.skill.isWeaponSwap) {
        expanded.push(makeDirectSwapStep(weapon, isPrePullSkill(resolvedStep.skill)))
      }
      drawnWeapon = weapon
    }
    expanded.push(resolvedStep)
  }
  return expanded
}

// A plain weapon change, the caller's own cast length. No hits, so it deals
// no damage and adds no breakdown row.
export function makeDirectWeaponSwapSkill(
  classId: string,
  weapon: string,
  prePull: boolean,
  castFrames: number,
): Skill {
  const stamp = "2026-09-28T00:00:00.000Z"
  return {
    id: `direct-swap-${classId}-${weapon}-${prePull ? "prepull" : "active"}`,
    classId,
    name: `Weapon Swap (${weapon})${prePull ? " Prepull" : ""}`,
    skillType: "weapon",
    weaponOrAttribute: "",
    attributeAttack: "",
    tags: [WEAPON_TAG + weapon],
    hits: [],
    castFrames,
    triggerable: false,
    prePull,
    // Stationary with a large reach: a weapon change never pulls the player
    // toward the target, and a default melee reach would wrongly shrink a
    // live ranged distance every time it fires.
    reachMeters: 100,
    approach: "stationary",
    createdAt: stamp,
    updatedAt: stamp,
  }
}
