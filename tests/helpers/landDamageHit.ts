import type { BuffEngine } from "../../src/engine/buffs/buffEngine"
import type { Skill } from "../../src/engine/skill"

export function landDamageHit(
  engine: BuffEngine,
  timeSec: number,
  skill?: Skill,
  fromGeneratedSkill = false,
): void {
  engine.processDamageHitPreScore(timeSec, skill)
  engine.processDamageHitPostQi(timeSec, skill, fromGeneratedSkill)
}
