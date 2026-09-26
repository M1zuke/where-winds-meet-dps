import {
  isAnyOfCondition,
  isParamCondition,
  type StatusCondition,
  type TriggerCondition,
} from "../../../engine/skill"
import { FPS } from "../../../engine/timeline"
import { humanizeParamId } from "../../../engine/buffs/catalog"
import { innerWayForBuffParam } from "../../../definitions/innerWays/registry"

const OP_SYMBOL: Record<StatusCondition["op"], string> = { gte: "≥", gt: ">", eq: "=" }

type Translate = (key: string, fallback?: string) => string

function defaultParamNameOf(t: Translate, param: string): string {
  const innerWay = innerWayForBuffParam(param)
  return innerWay ? t(`content.innerWay.${innerWay.id}`, innerWay.name) : humanizeParamId(param)
}

function formatCondition(
  condition: TriggerCondition,
  nameOf: (id: string) => string | undefined,
  paramNameOf: (param: string) => string | undefined,
  t: Translate,
): string {
  if (isAnyOfCondition(condition)) {
    const joiner = ` ${t("skills.status.anyOfJoiner", "or")} `
    return `(${condition.anyOf.map((clause) => formatCondition(clause, nameOf, paramNameOf, t)).join(joiner)})`
  }
  if (isParamCondition(condition)) {
    const label = paramNameOf(condition.param) ?? condition.param
    if (condition.minTier === undefined) return label
    return `${label} ${t("skills.status.tierAbbreviation", "T")}${condition.minTier}+`
  }
  return `${nameOf(condition.buffId) ?? condition.buffId} ${OP_SYMBOL[condition.op]} ${condition.stacks}`
}

export function formatConditions(
  conditions: readonly TriggerCondition[],
  nameOf: (id: string) => string | undefined,
  t: Translate,
  paramNameOf: (param: string) => string | undefined = (param) => defaultParamNameOf(t, param),
): string {
  return conditions
    .map((condition) => formatCondition(condition, nameOf, paramNameOf, t))
    .join(" · ")
}

export function statusTooltip(name: string, t: Translate, durationFrames?: number): string {
  if (durationFrames == null) return name
  const durationSec = (durationFrames / FPS).toFixed(1)
  return `${name} · ${durationSec}${t("skills.status.windowSuffix", "s window")} · ${t(
    "skills.status.remainingCountsDownFromApplication",
    "remaining time counts down from application",
  )}`
}
