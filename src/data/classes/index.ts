// The barrel every class's modules are loaded through. A class that needs
// procedural behaviour — a skill behaviour, a mechanic — adds its file here and
// nowhere else; nothing in `src/engine` imports a class module.
//
// Inner-way and set mechanics are not class-owned, so they self-register from
// their own barrels (`src/data/innerWays/`, `src/data/sets/`) instead of here.
import type { ClassDef } from "./define"
import { bellstrikeUmbra } from "./bellstrikeUmbra"
import { registerBuiltinBuffs } from "../../engine/builtinBuffs"
import { registerMechanic } from "../../engine/mechanics"
import { registerSkillBehavior } from "../../engine/behavior"
import { registerDisplayGate } from "../../engine/buffs/displayGates"
import { registerPoisonExtension } from "../innerWays/poisonExtension"

export const CLASSES: readonly ClassDef[] = [bellstrikeUmbra]

for (const classDef of CLASSES) {
  registerBuiltinBuffs(classDef.id, classDef.gateBuffs)
  for (const { mechanic, order } of classDef.mechanics) registerMechanic(mechanic, order)
  for (const { skillId, factory } of classDef.skillBehaviors)
    registerSkillBehavior(skillId, factory)
  for (const { defId, predicate } of classDef.displayGates) registerDisplayGate(defId, predicate)
  for (const { statusId, maxRemainingSec } of classDef.poisonExtensions)
    registerPoisonExtension(classDef.id, statusId, maxRemainingSec)
}
