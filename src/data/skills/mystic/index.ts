import type { Skill } from "../../../engine/skill"
import { dragonFireSmolder1Hit } from "./dragon-fire-smolder-1-hit"
import { dragonFireSmolder2Hits } from "./dragon-fire-smolder-2-hits"
import { dragonHeadPlus } from "./dragon-head-plus"
import { dragonHead } from "./dragon-head"
import { drunkenpoetPrepull } from "./drunkenpoet-prepull"
import { fireBreath1HitPrepull } from "./fire-breath-1-hit-prepull"
import { fireBreath1Hit } from "./fire-breath-1-hit"
import { fireBreath2Hit } from "./fire-breath-2-hit"
import { freeMorph } from "./free-morph"
import { fluteOfTheTidesCancel } from "./flute-of-the-tides-cancel"
import { fluteOfTheTidesFull } from "./flute-of-the-tides-full"
import { fluteOfTheTidesPrepull } from "./flute-of-the-tides-prepull"
import { ghostlyAfterimage } from "./ghostly-afterimage"
import { poetFinalHitCancel } from "./poet-final-hit-cancel"
import { poetFinalHitCancelExplosion } from "./poet-final-hit-cancel-explosion"
import { poet1 } from "./poet1"
import { poet2 } from "./poet2"
import { poet3 } from "./poet3"
import { poet4 } from "./poet4"
import { soaring1Hit } from "./soaring-1-hit"
import { soaring } from "./soaring"
import { toadCancel } from "./toad-cancel"
import { toadFury } from "./toad-fury"
import { toadFuryHit } from "./toad-fury-hit"
import { wolflikeFrenzy } from "./wolflike-frenzy"

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
  freeMorph,
  fluteOfTheTidesCancel,
  fluteOfTheTidesFull,
  fluteOfTheTidesPrepull,
  ghostlyAfterimage,
  poetFinalHitCancel,
  poetFinalHitCancelExplosion,
  poet1,
  poet2,
  poet3,
  poet4,
  soaring1Hit,
  soaring,
  toadCancel,
  toadFury,
  toadFuryHit,
  wolflikeFrenzy,
]
