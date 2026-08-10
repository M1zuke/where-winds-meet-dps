// The barrel every class's modules are loaded through. A class that needs
// procedural behaviour — a skill behaviour, a mechanic — adds its file here and
// nowhere else; nothing in `src/engine` imports a class module.
//
// Side-effect imports on purpose: each module registers itself.
import "./bellstrikeUmbraCrosswind"
import "./bellstrikeUmbraConcentration"
import "./bellstrikeUmbraLevelBonus"

// Set- and shared-inner-way mechanics are not class-owned, so they live in the
// engine — but they self-register the same way, and are loaded here so there is
// one place that decides what is active.
import "../../engine/mechanics/morale"
import "../../engine/mechanics/hawkwing"
import "../../engine/mechanics/bitterSeason"
