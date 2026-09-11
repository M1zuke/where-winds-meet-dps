import { defineBuff } from "../../definitions/skills/buffDef"
import { BUFF } from "../skills/buffs/ids"
import { echo } from "../../engine/effects/effect"
import { DEBUFF } from "../skills/bamboocut-draught/ids"
import { isInebriate } from "../skills/bamboocut-draught/buffs/inebriate"

// The echo lives on the Drunkslay mark itself, so any source of the mark
// brings it — Skyspeak gates who can apply the mark, not whether it echoes.
export const drunkslayEcho = defineBuff({
  id: BUFF.drunkslayEcho,
  name: "Drunkslay",
  requires: { classId: "bamboocutDraught" },
  alwaysActive: true,
  duration: 9999,
  summary:
    "Inebriate-enhanced skill damage feeds the Drunkslay echo while the mark is on the target",
  effects: (ctx) => {
    if (!ctx.self.reachesEvent || !isInebriate(ctx) || !ctx.status.isActive(DEBUFF.drunkslay))
      return []
    return [echo(DEBUFF.drunkslay)]
  },
})
