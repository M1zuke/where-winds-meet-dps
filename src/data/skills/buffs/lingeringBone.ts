import { defineBuff } from "../../../definitions/skills/buffDef"
import { BUFF } from "./ids"
import { PROP } from "../ids"

export const lingeringBone = defineBuff({
  id: BUFF.lingeringBone,
  name: "Lingering Bone",
  duration: 2,
  extendedOnlyByProperty: PROP.isDrone,
  effects: [],
})
