import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF } from "../../buffs/ids"

// In-game values as of 2026-10-15: 3 s; Emerald Barrier grants it at the end of
// its cast and Peak's Springless Silence on its landing hit when the target
// already carries your Lingering Bone. It makes Moon Shatter Spring five hits.
export const windrider = defineClassBuff({
  id: BUFF.windrider,
  name: "Windrider",
  duration: 3,
  triggersFromGeneratedSkills: true,
  effects: [],
})
