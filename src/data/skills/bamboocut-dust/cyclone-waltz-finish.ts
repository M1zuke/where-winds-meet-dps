import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import type { Skill } from "../../../engine/skill"
import { CAST, WEAPON } from "../ids"
import { CYCLONE_WALTZ_HIT } from "./cyclone-waltz"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

function cycloneWaltzFinishSkill(
  spec: Pick<Skill, "id" | "name" | "castTag"> & { hitFrames: readonly number[] },
): Skill {
  return defineSkill({
    id: spec.id,
    classId: "bamboocutDust",
    name: spec.name,
    breakdownName: "Cyclone Waltz",
    tags: [WEAPON.umbrella],
    skillType: "weapon",
    weaponOrAttribute: "Umbrella",
    attributeAttack: "Bamboocut",
    castTag: spec.castTag,
    receives: EVERSPRING_UMBRELLA_RECEIVES,
    castFrames: 0,
    triggerable: true,
    hits: spec.hitFrames.map((frame, index) => hit(index, { frame, ...CYCLONE_WALTZ_HIT })),
    createdAt: "2026-10-12T00:00:00.000Z",
    updatedAt: "2026-10-12T00:00:00.000Z",
  })
}

export const cycloneWaltzFinish = cycloneWaltzFinishSkill({
  id: SKILL.cycloneWaltzFinish,
  name: "Cyclone Waltz (Finish)",
  castTag: CAST.dustCycloneWaltzFinish,
  hitFrames: [0, 18],
})

export const cycloneWaltzRecastFormFinish = cycloneWaltzFinishSkill({
  id: SKILL.cycloneWaltzRecastFormFinish,
  name: "Cyclone Waltz (Recast Form, Finish)",
  castTag: CAST.dustCycloneWaltzRecastFormFinish,
  hitFrames: [0],
})
