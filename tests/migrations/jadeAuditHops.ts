import { healSkill as healUmbHeavylightFromThePress } from "../../src/migrations/customSkills/V116__umbHeavylightFromThePress"
import { healSkill as healJadeTrajectoryHitsReach } from "../../src/migrations/customSkills/V117__jadeTrajectoryHitsReach"
import type { Skill } from "../../src/engine/skill"

export const throughJadeAuditHops = (skill: unknown): Skill =>
  healJadeTrajectoryHitsReach(healUmbHeavylightFromThePress(skill)) as Skill
