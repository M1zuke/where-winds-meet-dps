import {
  isAnyOfCondition,
  isParamCondition,
  OP_SYMBOL,
  type ConditionFailureReason,
  type TriggerCondition,
} from "../../../engine/skill"
import { FPS } from "../../../engine/timeline"
import { humanizeParamId } from "../../../engine/buffs/catalog"
import { innerWayForBuffParam } from "../../../definitions/innerWays/registry"
import { buffKey, debuffKey, innerWayKey, meterKey, weaponKey } from "../../../i18n/contentKeys"

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

function conditionFailureText(reason: ConditionFailureReason, t: Translate): string {
  const needs = t("rotation.editor.reasonNeeds", "needs")
  const has = t("rotation.editor.reasonHas", "has")
  const active = t("rotation.editor.reasonActive", "active")
  const notActive = t("rotation.editor.reasonNotActive", "not active")
  const tier = t("common.tier", "tier")
  const drawn = t("rotation.editor.reasonDrawn", "drawn")
  switch (reason.kind) {
    case "anyOf": {
      const joiner = ` ${t("skills.status.anyOfJoiner", "or")} `
      return `(${reason.reasons.map((clause) => conditionFailureText(clause, t)).join(joiner)})`
    }
    case "weapon": {
      const needed = t(weaponKey(reason.id), reason.name)
      const actual = reason.actualId ? t(weaponKey(reason.actualId), reason.actualName) : notActive
      return `${t("rotation.editor.reasonNeedsThe", "needs the")} ${needed} ${drawn} (${actual} ${drawn})`
    }
    case "param": {
      const label = reason.innerWayId ? t(innerWayKey(reason.innerWayId), reason.name) : reason.name
      if (reason.minTier === undefined)
        return `${needs} ${label} ${active} (${reason.actualOn ? active : notActive})`
      const actual = reason.actualOn ? `${tier} ${reason.actualTier}` : notActive
      return `${needs} ${label} ${tier} ${reason.minTier}+ (${actual})`
    }
    default: {
      const key =
        reason.kind === "meter"
          ? meterKey(reason.id)
          : reason.kind === "debuff"
            ? debuffKey(reason.id)
            : buffKey(reason.id)
      const label = t(key, reason.name)
      return `${needs} ${label} ${OP_SYMBOL[reason.op]} ${reason.required} (${has} ${reason.actual})`
    }
  }
}

export function conditionFailureReasonsText(
  reasons: readonly ConditionFailureReason[],
  t: Translate,
): string {
  const joiner = ` ${t("rotation.editor.reasonAnd", "and")} `
  return reasons.map((reason) => conditionFailureText(reason, t)).join(joiner)
}

export function statusTooltip(name: string, t: Translate, durationFrames?: number): string {
  if (durationFrames == null) return name
  const durationSec = (durationFrames / FPS).toFixed(1)
  return `${name} · ${durationSec}${t("skills.status.windowSuffix", "s window")} · ${t(
    "skills.status.remainingCountsDownFromApplication",
    "remaining time counts down from application",
  )}`
}
