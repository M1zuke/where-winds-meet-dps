import { defineSkill, hit } from "../define"
import { applyDebuff } from "../triggers"
import { CAST, MYSTIC } from "../ids"
import { SKILL, DEBUFF } from "./ids"

export const dragonFireSmolder2Hits = defineSkill({
  id: SKILL.dragonFireSmolder2Hits,
  classId: "bellstrikeUmbra",
  name: "Dragon's Breath: Smolder 2 Hits",
  tags: [MYSTIC.burst],
  skillType: "mystic",
  weaponOrAttribute: "",
  attributeAttack: "Bellstrike",
  castTag: CAST.dragonSBreathSmolder2Hits,
  castFrames: 100,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 40,
      physMultiplier: 1.3285,
      attributeMultiplier: 1.99275,
      physFixed: 249.66666666666666,
      attributeFixed: 0,
      triggers: [
        applyDebuff({ id: "tg-dragon-fire-smolder-2-hits-dark-fire-h0", target: DEBUFF.darkFire, extendFrames: 240 }),
      ],
    }),
    hit(1, {
      frame: 70,
      physMultiplier: 1.3285,
      attributeMultiplier: 1.99275,
      physFixed: 249.66666666666666,
      attributeFixed: 0,
      triggers: [
        applyDebuff({ id: "tg-dragon-fire-smolder-2-hits-dark-fire-h1", target: DEBUFF.darkFire, extendFrames: 240 }),
      ],
    }),
    hit(2, {
      frame: 100,
      physMultiplier: 1.3285,
      attributeMultiplier: 1.99275,
      physFixed: 249.66666666666666,
      attributeFixed: 0,
      triggers: [
        applyDebuff({ id: "tg-dragon-fire-smolder-2-hits-dark-fire-h2", target: DEBUFF.darkFire, extendFrames: 240 }),
      ],
    }),
  ],
  createdAt: "2026-07-30T00:00:00.000Z",
  updatedAt: "2026-07-30T00:00:00.000Z",
})
