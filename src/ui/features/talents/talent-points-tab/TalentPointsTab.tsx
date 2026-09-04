import { useMemo } from "react"
import type { DisabledTalentPoints, Inputs } from "../../../../engine/types"
import type { TalentPointGroup, TalentPointStat } from "../../../../definitions/baseStats"
import {
  TALENT_POINT_GROUPS,
  enabledMembers,
  groupTotals,
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

export function TalentPointsTab({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()
  const disabled = inputs.disabledTalentPoints

  const enabledByGroup = useMemo(
    () => new Map(TALENT_POINT_GROUPS.map((group) => [group.key, enabledMembers(group, disabled)])),
    [disabled],
  )

  const disabledCount = useMemo(
    () => Object.values(disabled ?? {}).reduce((sum, ids) => sum + ids.length, 0),
    [disabled],
  )

  function setEnabled(group: TalentPointGroup, count: number) {
    const enabled = enabledByGroup.get(group.key) ?? []
    let next: DisabledTalentPoints = disabled
    if (count < enabled.length) {
      next = withTalentPointEnabled(next, enabled[enabled.length - 1], false)
    } else {
      const off = group.members.find(
        (member) => !enabled.some((on) => on.tier === member.tier && on.id === member.id),
      )
      if (!off) return
      next = withTalentPointEnabled(next, off, true)
    }
    onChange({ ...inputs, disabledTalentPoints: next })
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
          const enabled = enabledByGroup.get(group.key) ?? []
          const totals = groupTotals(group, enabled.length)
          return (
            <div className={`panel ${styles.groupCard}`} key={group.key}>
              <div className={styles.groupHead}>
                <span className={styles.glyph}>{STAT_GLYPH[group.stats[0]]}</span>
                <span className={styles.groupName}>
                  {group.stats.map((stat) => t(STAT_KEYS[stat])).join(" · ")}
                </span>
              </div>

              <div className={styles.perPoint}>
                {group.stats.map((stat) => formatValue(stat, group.effects[stat] ?? 0)).join(" · ")}{" "}
                {t("talents.talentPoints.perPoint")}
              </div>

              <div className={styles.groupControl}>
                <button
                  type="button"
                  className={styles.step}
                  aria-label={t("talents.talentPoints.disableOne")}
                  disabled={enabled.length === 0}
                  onClick={() => setEnabled(group, enabled.length - 1)}
                >
                  −
                </button>
                <span className={styles.count}>
                  <b>{enabled.length}</b> / {group.members.length}
                </span>
                <button
                  type="button"
                  className={styles.step}
                  aria-label={t("talents.talentPoints.enableOne")}
                  disabled={enabled.length === group.members.length}
                  onClick={() => setEnabled(group, enabled.length + 1)}
                >
                  +
                </button>
                <span className={styles.groupTotal} data-zero={enabled.length === 0 || undefined}>
                  {group.stats.map((stat) => formatValue(stat, totals[stat] ?? 0)).join(" · ")}
                </span>
              </div>

              <div className={styles.meter}>
                {group.members.map((member) => (
                  <i
                    key={`${member.tier}-${member.id}`}
                    data-on={
                      enabled.some((on) => on.tier === member.tier && on.id === member.id) ||
                      undefined
                    }
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
