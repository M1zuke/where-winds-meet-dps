import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { CYCLONE_WALTZ_HIT } from "./cyclone-waltz"
import { SKILL } from "./ids"
import { EVERSPRING_UMBRELLA_RECEIVES } from "./receives"

export const cycloneWaltzFinish = defineSkill({
  id: SKILL.cycloneWaltzFinish,
  classId: "bamboocutDust",
  name: "Cyclone Waltz (Finish)",
  breakdownName: "Cyclone Waltz",
  tags: [WEAPON.umbrella],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustCycloneWaltzFinish,
  receives: EVERSPRING_UMBRELLA_RECEIVES,
  castFrames: 0,
  triggerable: true,
  hits: [hit(0, { frame: 0, ...CYCLONE_WALTZ_HIT }), hit(1, { frame: 18, ...CYCLONE_WALTZ_HIT })],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
