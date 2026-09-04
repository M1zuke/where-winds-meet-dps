import { useMemo } from "react"
import type { Inputs } from "../../../../engine/types"
import type { TalentPointGroup, TalentPointStat } from "../../../../definitions/baseStats"
import {
  TALENT_POINT_GROUPS,
  enabledMembers,
  groupTotals,
  isTalentPointEnabled,
  withTalentPointEnabled,
} from "../../../../definitions/baseStats"
import { useI18n } from "../../../../i18n/i18nContext"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import styles from "./TalentPointsTab.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

const STAT_KEYS: Readonly<Record<TalentPointStat, string>> = {
  minPhys: "common.minPhys",
  maxPhys: "common.maxPhys",
  minFormless: "content.statLine.minFormless",
  maxFormless: "content.statLine.maxFormless",
  precisionRate: "content.statLine.precision",
  critRate: "talents.stat.critRate",
  critDamage: "talents.stat.critDamage",
  affinityRate: "content.statLine.affinity",
  affinityDamage: "talents.stat.affinityDamage",
  power: "content.statLine.power",
  agility: "content.statLine.agility",
  momentum: "content.statLine.momentum",
}

const STAT_GLYPH: Readonly<Record<TalentPointStat, string>> = {
  minPhys: "⚔",
  maxPhys: "⚔",
  minFormless: "❖",
  maxFormless: "❖",
  precisionRate: "◎",
  critRate: "✦",
  critDamage: "✧",
  affinityRate: "❈",
  affinityDamage: "❉",
  power: "◈",
  agility: "◈",
  momentum: "◈",
}

const RATE_STATS = new Set<TalentPointStat>([
  "precisionRate",
  "critRate",
  "critDamage",
  "affinityRate",
  "affinityDamage",
])

function formatValue(stat: TalentPointStat, value: number): string {
  if (RATE_STATS.has(stat)) return `+${Math.round(value * 1000) / 10}%`
  return `+${Math.round(value * 10) / 10}`
}

function formatTotal(
  group: TalentPointGroup,
  totals: Readonly<Partial<Record<TalentPointStat, number>>>,
): string {
  const values = group.stats.map((stat) => formatValue(stat, totals[stat] ?? 0))
  return values.every((value) => value === values[0]) ? values[0] : values.join(" · ")
}

export function TalentPointsTab({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const disabled = inputs.disabledTalentPoints

  const disabledCount = useMemo(
    () => Object.values(disabled ?? {}).reduce((sum, ids) => sum + ids.length, 0),
    [disabled],
  )

  function toggleAt(group: TalentPointGroup, index: number) {
    const member = group.members[index]
    const enabled = isTalentPointEnabled(disabled, member.tier, member.id)
    onChange({
      ...inputs,
      disabledTalentPoints: withTalentPointEnabled(disabled, member, !enabled),
    })
  }

  function step(group: TalentPointGroup, delta: number) {
    const on = enabledMembers(group, disabled)
    const member =
      delta < 0
        ? on[on.length - 1]
        : group.members.find(
            (candidate) => !isTalentPointEnabled(disabled, candidate.tier, candidate.id),
          )
    if (!member) return
    onChange({
      ...inputs,
      disabledTalentPoints: withTalentPointEnabled(disabled, member, delta > 0),
    })
  }

  async function resetAll() {
    if (!(await confirm(t("talents.talentPoints.resetAllTalentPointsToDefault")))) return
    onChange({ ...inputs, disabledTalentPoints: {} })
  }

  return (
    <div>
      <div className="toolbar">
        <span className="toolbar-label">{t("talents.talentPoints.talentPoints")}</span>
        <button
          type="button"
          className="btn danger"
          onClick={resetAll}
          disabled={disabledCount === 0}
        >
          {t("common.resetToDefault")}
        </button>
      </div>

      <div className={styles.groupGrid}>
        {TALENT_POINT_GROUPS.map((group) => {
          const totals = groupTotals(group, disabled)
          const onCount = enabledMembers(group, disabled).length
          return (
            <div className={`panel ${styles.groupCard}`} key={group.key}>
              <div className={styles.groupHead}>
                <span className={styles.glyph}>{STAT_GLYPH[group.stats[0]]}</span>
                <span className={styles.groupName}>
                  {group.stats.map((stat) => t(STAT_KEYS[stat])).join(" · ")}
                </span>
              </div>

              <div className={styles.groupControl}>
                <button
                  type="button"
                  className={styles.stepButton}
                  aria-label={t("talents.talentPoints.disableOne")}
                  disabled={onCount === 0}
                  onClick={() => step(group, -1)}
                >
                  −
                </button>
                <span className={styles.count}>
                  <b>{onCount}</b> / {group.members.length}
                </span>
                <button
                  type="button"
                  className={styles.stepButton}
                  aria-label={t("talents.talentPoints.enableOne")}
                  disabled={onCount === group.members.length}
                  onClick={() => step(group, 1)}
                >
                  +
                </button>
                <span className={styles.groupTotal} data-zero={onCount === 0 || undefined}>
                  {formatTotal(group, totals)}
                </span>
              </div>

              <div className={styles.meter}>
                {group.members.map((member, index) => {
                  const on = isTalentPointEnabled(disabled, member.tier, member.id)
                  return (
                    <button
                      type="button"
                      key={`${member.tier}-${member.id}`}
                      className={styles.pip}
                      data-on={on || undefined}
                      aria-pressed={on}
                      aria-label={`${t("talents.talentPoints.talentPoint")} ${index + 1}`}
                      onClick={() => toggleAt(group, index)}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
