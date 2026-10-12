import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { applyBuff } from "../../../definitions/skills/triggers"
import { CAST } from "../ids"
import {
  DREAMWROUGHT_BACK_HIT,
  DREAMWROUGHT_OUT_HIT,
  DREAMWROUGHT_RECEIVES,
  DREAMWROUGHT_TAGS,
  dreamwroughtPhantomTriggers,
} from "./dreamwrought-bubbles"
import { SKILL, STATUS } from "./ids"

const NO_DAMAGE = {
  physMultiplier: 0,
  attributeMultiplier: 0,
  physFixed: 0,
  attributeFixed: 0,
}

export const dreamwroughtBubblesInstant = defineSkill({
  id: SKILL.dreamwroughtBubblesInstant,
  classId: "bamboocutDust",
  name: "Dreamwrought Bubbles (Fragrant Song - Delicate)",
  breakdownName: "Dreamwrought Bubbles",
  tags: DREAMWROUGHT_TAGS,
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustDreamwroughtBubblesInstant,
  receives: DREAMWROUGHT_RECEIVES,
  castConditions: [{ buffId: STATUS.fragrantSongDelicate, op: "gte", stacks: 1 }],
  castFrames: 72,
  triggerable: false,
  hits: [
    hit(0, {
      frame: 0,
      ...NO_DAMAGE,
      triggers: [applyBuff({ target: STATUS.fragrantSongDelicate, stacks: -1 })],
    }),
    hit(1, { frame: 48, ...DREAMWROUGHT_OUT_HIT, triggers: dreamwroughtPhantomTriggers() }),
    hit(2, { frame: 49, ...DREAMWROUGHT_BACK_HIT }),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
