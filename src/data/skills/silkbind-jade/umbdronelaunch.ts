import { defineSkill } from "../../../definitions/skills/skillDef"
import { applyDebuff } from "../../../definitions/skills/triggers"
import { umbdronelaunch20Hit } from "./umbdronelaunch-20hit"
import { umbdrone20HitTick } from "./umbdrone-20hit"
import { SKILL, DEBUFF } from "./ids"

export const umbdronelaunch = defineSkill({
  ...umbdronelaunch20Hit,
  id: SKILL.umbdronelaunch,
  name: "UmbDroneLaunch",
  hits: umbdronelaunch20Hit.hits.map((hit) => ({
    ...hit,
    triggers: [applyDebuff({ target: DEBUFF.umbdrone })],
  })),
})

export const umbdroneTick = defineSkill({
  ...umbdrone20HitTick,
  id: SKILL.umbdrone,
  name: "UmbDrone Tick",
})
