// The barrel every class's modules are loaded through. A class that needs
// procedural behaviour — a skill behaviour, a mechanic — adds its file here and
// nowhere else; nothing in `src/engine` imports a class module.
//
// Set- and shared-inner-way mechanics are not class-owned, so they live in the
// engine — but they self-register the same way, and are loaded here so there is
// one place that decides what is active.
import "../../engine/mechanics/morale"
import "../../engine/mechanics/hawkwing"
import "../../engine/mechanics/bitterSeason"

import type { ClassDef } from "./define"
import { bellstrikeUmbra } from "./bellstrikeUmbra"
import { registerBuiltinBuffs } from "../../engine/builtinBuffs"
import { registerMechanic } from "../../engine/mechanics"
import { registerSkillBehavior } from "../../engine/behavior"
import { registerDisplayGate } from "../../engine/buffs/displayGates"
import { registerPoisonExtension } from "../../engine/mechanics/bitterSeason"
import { setClassDefs } from "./classDefStore"

const classDefs: readonly ClassDef[] = [bellstrikeUmbra]

for (const classDef of classDefs) {
  registerBuiltinBuffs(classDef.id, classDef.gateBuffs)
  for (const { mechanic, order } of classDef.mechanics) registerMechanic(mechanic, order)
  for (const { skillId, factory } of classDef.skillBehaviors)
    registerSkillBehavior(skillId, factory)
  for (const { defId, predicate } of classDef.displayGates) registerDisplayGate(defId, predicate)
  for (const { statusId, maxRemainingSec } of classDef.poisonExtensions)
    registerPoisonExtension(classDef.id, statusId, maxRemainingSec)
}

// After the loop, not before: `classDefinition()` memoises its `buffs` read
// off `builtinBuffsForClass`, so a call between registration and visibility
// would cache an empty gate-buffs list for the process lifetime.
setClassDefs(classDefs)
