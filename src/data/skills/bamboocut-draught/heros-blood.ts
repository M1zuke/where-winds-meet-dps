import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff, applyDebuff, releaseEcho } from "../../../definitions/skills/triggers"
import { CAST, WEAPON } from "../ids"
import { SKILL, DEBUFF, STATUS } from "./ids"
import { CLASS_RECEIVES } from "./receives"
import { deepdazeEntryTriggers } from "./buffs/deepdazeEntry"

const strike = {
  physMultiplier: 0.329365,
  attributeMultiplier: 0.4940475,
  physFixed: 91.5,
  attributeFixed: 50,
}

// Two strikes on one damage share (in-game animation, 2026-09-05). The Binge
// Points grant must run before the Deepdaze threshold check on the same hit.
export const herosBloodHits = [
  hit(0, {
    ...strike,
    frame: 22,
    triggers: [
      applyBuff({ target: STATUS.bingePoints, stacks: 40 }),
      applyBuff({ target: STATUS.carouse, stacks: 1 }),
      releaseEcho({ target: DEBUFF.drunkslay }),
      applyDebuff({ target: DEBUFF.drunkslay, stacks: 1 }),
      ...deepdazeEntryTriggers(),
    ],
  }),
  hit(1, { ...strike, frame: 33 }),
]

// Cast length to the earliest next input: in-game animation, 2026-09-05.
export const herosBlood = defineSkill({
  id: SKILL.herosBlood,
  classId: "bamboocutDraught",
  name: "Twinblade Special",
  breakdownName: "Hero's Blood",
  tags: [WEAPON.twinBlades],
  skillType: "weapon",
  weaponOrAttribute: "Twin Blades",
  attributeAttack: "Bamboocut",
  castTag: CAST.herosBlood,
  receives: CLASS_RECEIVES,
  triggerable: false,
  castFrames: 46,
  hits: herosBloodHits,
  createdAt: "2026-09-03T00:00:00.000Z",
  updatedAt: "2026-09-05T00:00:00.000Z",
})
