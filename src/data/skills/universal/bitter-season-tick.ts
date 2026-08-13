import { defineSkill, dotTicks } from "../../../definitions/skills/skillDef"
import { CAST, SOURCE } from "../ids"
import { SKILL } from "./ids"

// `physMultiplier` is an UNVERIFIED placeholder — no workbook row or
// reference-site def exists for this inner way. It was picked to sit between
// the bleed tick's per-stack base and the other universal DoT's per-tick
// coefficient. `weaponOrAttribute` is empty on purpose: an inner-way proc is
// not a martial art, so it takes no weapon, all-martial or mystic boost.
export const bitterSeasonTick = defineSkill({
  id: SKILL.bitterSeasonTick,
  classId: "universal",
  name: "Bitter Season Tick",
  tags: [SOURCE.innerWayDot],
  skillType: "sustain",
  weaponOrAttribute: "",
  attributeAttack: "",
  castTag: CAST.bitterSeasonTick,
  elevatedAttributeMultiplier: false,
  castFrames: 0,
  triggerable: true,
  hits: dotTicks({
    count: 5,
    everyFrames: 60,
    physMultiplier: 0.15,
    attributeMultiplier: 0.225,
    physFixed: 0,
    attributeFixed: 0,
  }),
  createdAt: "2026-08-06T00:00:00.000Z",
  updatedAt: "2026-08-06T00:00:00.000Z",
})
