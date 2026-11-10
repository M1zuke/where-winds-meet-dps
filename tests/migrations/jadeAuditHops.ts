import { healSkill as healUmbHeavylightFromThePress } from "../../src/migrations/customSkills/V116__umbHeavylightFromThePress"
import { healSkill as healJadeTrajectoryHitsReach } from "../../src/migrations/customSkills/V117__jadeTrajectoryHitsReach"
import { healSkill as healJadeLaunchBrokenByHigherPriority } from "../../src/migrations/customSkills/V118__jadeLaunchBrokenByHigherPriority"
import type { Skill } from "../../src/engine/skill"

export const throughJadeAuditHops = (skill: unknown): Skill =>
  healJadeLaunchBrokenByHigherPriority(
    healJadeTrajectoryHitsReach(healUmbHeavylightFromThePress(skill)),
  ) as Skill

export const withoutLaunchFollowUpGate = (skill: Skill): Skill["hits"] =>
  skill.id.startsWith("silkbindJade-umbdronelaunch")
    ? skill.hits.filter((hit) => hit.castFramesWhenGated === undefined)
    : skill.hits
