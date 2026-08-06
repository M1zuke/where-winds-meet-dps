import type { Skill } from "../../../engine/skill"
import spearqPrepull from "./spearq-prepull.json"
import swordheavychargedPrepull from "./swordheavycharged-prepull.json"
import swordq from "./swordq.json"
import energysurge from "./energysurge.json"
import swordheavycharged from "./swordheavycharged.json"
import spearq from "./spearq.json"
import spearq0HitCancel from "./spearq-0-hit-cancel.json"
import swordheavycharged2Hit from "./swordheavycharged-2-hit.json"
import swordq2nd from "./swordq-2nd.json"
import swordspecial from "./swordspecial.json"
import swordspecial2nd from "./swordspecial-2nd.json"
import swordspecialDeflect from "./swordspecial-deflect.json"

export const CLASS_ID = "bellstrikeRainbow"

export const SKILLS = [
  spearqPrepull,
  swordheavychargedPrepull,
  swordq,
  energysurge,
  swordheavycharged,
  spearq,
  spearq0HitCancel,
  swordheavycharged2Hit,
  swordq2nd,
  swordspecial,
  swordspecial2nd,
  swordspecialDeflect,
] as unknown as Skill[]
