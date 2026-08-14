import { defineClassBuff } from "../../../../definitions/skills/buffDef"
import { BUFF, PARAM } from "../../buffs/ids"
import { stat } from "../../../../engine/effects/effect"

// The same site `Nm` mechanic bleedPen.ts ports — `affinityDmg: 0.18` is its
// maxPhys-anchored value (affinity anchor 500), which clamps to 1 only
// because this app's supported level 95 gives maxPhys ≈ 2984.
export const bellstrikeUmbraBleedingDamage = defineClassBuff({
  id: BUFF.bellstrikeUmbraBleedingDamage,
  name: "Damage Over Time",
  requires: { param: PARAM.swordHorizon },
  alwaysActive: true,
  duration: 9999,
  // The pre-conversion `BuffDef` rendered this as a percent under its old
  // key name, not the app's internal fraction — pin the Skill Editor text
  // to that exact string.
  summary: "affinityDmg +18%",
  effects: (ctx) => (ctx.self.reachesEvent ? [stat("affinityDamageBoost", 0.18)] : []),
})
