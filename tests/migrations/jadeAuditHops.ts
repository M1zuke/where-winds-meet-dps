import { healSkill as healUmbHeavylightFromThePress } from "../../src/migrations/customSkills/V116__umbHeavylightFromThePress"
import { healSkill as healJadeTrajectoryHitsReach } from "../../src/migrations/customSkills/V117__jadeTrajectoryHitsReach"
import { healSkill as healJadeLaunchBrokenByHigherPriority } from "../../src/migrations/customSkills/V118__jadeLaunchBrokenByHigherPriority"
import { healSkill as healUmbrellaDualTwoBullets } from "../../src/migrations/customSkills/V119__umbrellaDualTwoBullets"
import { healSkill as healApricotHeavenRiseSplitAndTiming } from "../../src/migrations/customSkills/V120__apricotHeavenRiseSplitAndTiming"
import { healSkill as healJadeSpringThunderAndComboReach } from "../../src/migrations/customSkills/V121__jadeSpringThunderAndComboReach"
import { healSkill as healForsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame } from "../../src/migrations/customSkills/V122__forsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame"
import { healSkill as healGourdTossPursuitCutOncePerSecond } from "../../src/migrations/customSkills/V123__gourdTossPursuitCutOncePerSecond"
import { healSkill as healVernalUmbrellaAttuneTags } from "../../src/migrations/customSkills/V133__vernalUmbrellaAttuneTags"
import { healSkill as healSwiftGaleReachesMoonShatterSpring } from "../../src/migrations/customSkills/V136__swiftGaleReachesMoonShatterSpring"
import type { Skill } from "../../src/engine/skill"

export const throughJadeAuditHops = (skill: unknown): Skill =>
  healSwiftGaleReachesMoonShatterSpring(
    healVernalUmbrellaAttuneTags(
      healGourdTossPursuitCutOncePerSecond(
        healForsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame(
          healJadeSpringThunderAndComboReach(
            healApricotHeavenRiseSplitAndTiming(
              healUmbrellaDualTwoBullets(
                healJadeLaunchBrokenByHigherPriority(
                  healJadeTrajectoryHitsReach(healUmbHeavylightFromThePress(skill)),
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  ) as Skill

export const withoutLaunchFollowUpGate = (skill: Skill): Skill["hits"] =>
  skill.id.startsWith("silkbindJade-umbdronelaunch")
    ? skill.hits.filter((hit) => hit.castFramesWhenGated === undefined)
    : skill.hits

export const throughLateJadeAuditHops = (skill: unknown): Skill =>
  healGourdTossPursuitCutOncePerSecond(
    healForsakenFameEnduranceOnTheHitAndHiddenSwordHeavyFrame(skill),
  ) as Skill
