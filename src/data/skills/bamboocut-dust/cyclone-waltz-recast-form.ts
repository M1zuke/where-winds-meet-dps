import { CAST } from "../ids"
import { cycloneWaltzSpin } from "./cyclone-waltz"
import { SKILL } from "./ids"

export const cycloneWaltzRecastForm = cycloneWaltzSpin({
  id: SKILL.cycloneWaltzRecastForm,
  name: "Cyclone Waltz (Recast Form)",
  breakdownName: "Cyclone Waltz",
  castTag: CAST.dustCycloneWaltzRecastForm,
  castFrames: 187,
  finishSkillId: SKILL.cycloneWaltzRecastFormFinish,
})
