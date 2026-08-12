// The barrel every class's modules are loaded through. A class that needs
// procedural behaviour — a skill behaviour, a mechanic — adds its file here and
// nowhere else; nothing in `src/engine` imports a class module.
import type { ClassDef } from "../../definitions/classes/classDef"
import { bellstrikeUmbra } from "./bellstrikeUmbra"
import { stonesplitStrength } from "./stonesplitStrength"

export const CLASSES: readonly ClassDef[] = [bellstrikeUmbra, stonesplitStrength]
