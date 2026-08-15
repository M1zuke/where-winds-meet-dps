import { energySurge } from "./energysurge"
import { spearq } from "./spearq"
import { spearq0HitCancel } from "./spearq-0-hit-cancel"
import { spearqPrepull } from "./spearq-prepull"
import { swordHeavyCharged } from "./swordheavycharged"
import { swordHeavyCharged2Hit } from "./swordheavycharged-2-hit"
import { swordHeavyChargedPrepull } from "./swordheavycharged-prepull"
import { swordq } from "./swordq"
import { swordq2nd } from "./swordq-2nd"
import { swordSpecial } from "./swordspecial"
import { swordSpecial2nd } from "./swordspecial-2nd"
import { swordSpecialDeflect } from "./swordspecial-deflect"

export const CLASS_ID = "bellstrikeSplendor"

export const SKILLS = [
  swordHeavyCharged,
  swordHeavyChargedPrepull,
  swordHeavyCharged2Hit,
  energySurge,
  swordq,
  swordq2nd,
  swordSpecial,
  swordSpecial2nd,
  swordSpecialDeflect,
  spearq,
  spearqPrepull,
  spearq0HitCancel,
]
