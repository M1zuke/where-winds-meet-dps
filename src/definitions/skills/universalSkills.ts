import type { Skill } from "../../engine/skill"
import { UNIVERSAL_SKILLS } from "../../data/skills/universal"

// Universal skills live once in src/data/skills/universal, carrying a
// "universal" id segment. Each class receives its own instance with
// `<classId>-<slug>` ids —
// that id shape is load-bearing: saved rotations and user skill overrides
// match built-ins by id, so universal skills must never surface with a
// class-less id.
export function retargetId(id: string, classId: string): string {
  return id.replace(/^((?:debuff|buff)-)?universal-/, `$1${classId}-`)
}

function instantiateUniversal(skill: Skill, classId: string, primaryAttribute: string): Skill {
  return {
    ...skill,
    id: retargetId(skill.id, classId),
    classId,
    attributeAttack: primaryAttribute,
    hits: skill.hits.map((hit) => ({
      ...hit,
      variants: hit.variants?.map((variant) => ({
        ...variant,
        conditions: variant.conditions.map((cond) => ({
          ...cond,
          buffId: retargetId(cond.buffId, classId),
        })),
      })),
      triggers: hit.triggers.map((trigger) => ({
        ...trigger,
        targetId: retargetId(trigger.targetId, classId),
        condition: trigger.condition
          ? { ...trigger.condition, buffId: retargetId(trigger.condition.buffId, classId) }
          : trigger.condition,
        conditions: trigger.conditions?.map((cond) => ({
          ...cond,
          buffId: retargetId(cond.buffId, classId),
        })),
      })),
    })),
  }
}

// A class calls this with its own id, primary attribute and skill list to get
// the full built-in roster — its own skills plus the universal pool stamped
// with its id.
export function withUniversalSkills(
  classId: string,
  primaryAttribute: string,
  classSkills: readonly Skill[],
): readonly Skill[] {
  return [
    ...classSkills,
    ...UNIVERSAL_SKILLS.map((skill) => instantiateUniversal(skill, classId, primaryAttribute)),
  ]
}
