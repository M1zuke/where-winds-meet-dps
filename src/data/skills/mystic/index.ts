import type { Skill } from "../../../engine/skill"
import { dragonFireSmolder1Hit } from "./dragon-fire-smolder-1-hit"
import { dragonFireSmolder2Hits } from "./dragon-fire-smolder-2-hits"
import { dragonHeadPlus } from "./dragon-head-plus"
import { dragonHead } from "./dragon-head"
import { drunkenpoetPrepull } from "./drunkenpoet-prepull"
import { fireBreath1HitPrepull } from "./fire-breath-1-hit-prepull"
import { fireBreath1Hit } from "./fire-breath-1-hit"
import { fireBreath2Hit } from "./fire-breath-2-hit"
import { fluteOfTheTidesCancel } from "./flute-of-the-tides-cancel"
import { fluteOfTheTidesFull } from "./flute-of-the-tides-full"
import { fluteOfTheTidesPrepull } from "./flute-of-the-tides-prepull"
import { poetFinalHitCancel } from "./poet-final-hit-cancel"
import { poet1 } from "./poet1"
import { poet2 } from "./poet2"
import { poet3 } from "./poet3"
import { poet4 } from "./poet4"
import { soaring1Hit } from "./soaring-1-hit"
import { soaring } from "./soaring"
import { toadCancel } from "./toad-cancel"

export { MYSTIC_DEBUFFS } from "./debuffs"

export const MYSTIC_SKILLS: readonly Skill[] = [
  dragonFireSmolder1Hit,
  dragonFireSmolder2Hits,
  dragonHeadPlus,
  dragonHead,
  drunkenpoetPrepull,
  fireBreath1HitPrepull,
  fireBreath1Hit,
  fireBreath2Hit,
  fluteOfTheTidesCancel,
  fluteOfTheTidesFull,
  fluteOfTheTidesPrepull,
  poetFinalHitCancel,
  poet1,
  poet2,
  poet3,
  poet4,
  soaring1Hit,
  soaring,
  toadCancel,
]
