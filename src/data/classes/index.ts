// The barrel every class's modules are loaded through. A class that needs
// procedural behaviour — a skill behaviour, a mechanic — adds its folder here
// and nowhere else; nothing in `src/engine` imports a class module.
import type { ClassDef } from "../../definitions/classes/classDef"
import { bellstrikeSplendor } from "./bellstrike-splendor"
import { bellstrikeUmbra } from "./bellstrike-umbra"
import { silkbindJade } from "./silkbind-jade"
import { stonesplitStrength } from "./stonesplit-strength"

export const CLASSES: readonly ClassDef[] = [
  bellstrikeUmbra,
  stonesplitStrength,
  bellstrikeSplendor,
  silkbindJade,
]

export { RETUNEMENT_POOLS } from "./retunementPools"
