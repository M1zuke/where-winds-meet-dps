import type { Skill } from "../../engine/skill"
import schools from "../classes/schools.json"
import { UNIVERSAL_SKILLS } from "./universal"
import * as bellstrikeRainbow from "./bellstrike-rainbow"
import * as bellstrikeUmbra from "./bellstrike-umbra"
import * as silkbindJade from "./silkbind-jade"
import * as stonesplitPower from "./stonesplit-power"
import * as stonesplitBalancePureTang from "./stonesplit-balance-pure-tang"
import * as bamboocutWindTwinblade from "./bamboocut-wind-twinblade"
import * as bamboocutDust from "./bamboocut-dust"
import * as stonesplitBalanceDualCut from "./stonesplit-balance-dual-cut"

const PRIMARY_ATTRIBUTE: Record<string, string> = Object.fromEntries(
  (schools as { id: string; primaryAttribute: string }[]).map((school) => [
    school.id,
    school.primaryAttribute,
  ]),
)

// Universal skills live once in ./universal, carrying a "universal" id
// segment. Each class receives its own instance with `<classId>-<slug>` ids —
// that id shape is load-bearing: saved rotations and user skill overrides
// match built-ins by id, so universal skills must never surface with a
// class-less id.
function retargetId(id: string, classId: string): string {
  return id.replace(/^((?:debuff|buff)-)?universal-/, `$1${classId}-`)
}

function instantiateUniversal(skill: Skill, classId: string): Skill {
  return {
    ...skill,
    id: retargetId(skill.id, classId),
    classId,
    attributeAttack: PRIMARY_ATTRIBUTE[classId] ?? "",
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

function withUniversal(classId: string, classSkills: readonly Skill[]): readonly Skill[] {
  return [...classSkills, ...UNIVERSAL_SKILLS.map((skill) => instantiateUniversal(skill, classId))]
}

export const BUILTIN_SKILLS_BY_CLASS: Record<string, readonly Skill[]> = {
  [bellstrikeRainbow.CLASS_ID]: withUniversal(bellstrikeRainbow.CLASS_ID, bellstrikeRainbow.SKILLS),
  [bellstrikeUmbra.CLASS_ID]: withUniversal(bellstrikeUmbra.CLASS_ID, bellstrikeUmbra.SKILLS),
  [silkbindJade.CLASS_ID]: withUniversal(silkbindJade.CLASS_ID, silkbindJade.SKILLS),
  [stonesplitPower.CLASS_ID]: withUniversal(stonesplitPower.CLASS_ID, stonesplitPower.SKILLS),
  [stonesplitBalancePureTang.CLASS_ID]: withUniversal(
    stonesplitBalancePureTang.CLASS_ID,
    stonesplitBalancePureTang.SKILLS,
  ),
  [bamboocutWindTwinblade.CLASS_ID]: withUniversal(
    bamboocutWindTwinblade.CLASS_ID,
    bamboocutWindTwinblade.SKILLS,
  ),
  [bamboocutDust.CLASS_ID]: withUniversal(bamboocutDust.CLASS_ID, bamboocutDust.SKILLS),
  [stonesplitBalanceDualCut.CLASS_ID]: withUniversal(
    stonesplitBalanceDualCut.CLASS_ID,
    stonesplitBalanceDualCut.SKILLS,
  ),
}
