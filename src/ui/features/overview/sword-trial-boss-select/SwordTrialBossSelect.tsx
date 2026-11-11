import {
  DEFAULT_SWORD_TRIAL_BOSS_ID,
  SWORD_TRIAL_BOSSES,
  isSwordTrialBossId,
  qiBreakTalentDamageBoostAt,
  swordTrialBossFor,
  type SwordTrialBossDef,
  type SwordTrialBossId,
} from "../../../../definitions/baseStats/swordTrialBosses"
import type { Inputs } from "../../../../engine/types"
import { swordTrialBossKey } from "../../../../i18n/contentKeys"
import { useI18n } from "../../../../i18n/i18nContext"
import { Select, type SelectOption } from "../../../components/select/Select"
import styles from "./SwordTrialBossSelect.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: SwordTrialBossId) => void
}

const percentOf = (fraction: number): string => String(Math.round(fraction * 1000) / 10)

export function SwordTrialBossSelect({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const stored = inputs.swordTrialBoss ?? DEFAULT_SWORD_TRIAL_BOSS_ID
  const scored = swordTrialBossFor(inputs)
  const talentText = (boss: SwordTrialBossDef): string => {
    const parts = [
      t("overview.swordTrialBossSelect.talent").replace("{pct}", percentOf(boss.damageBoost)),
    ]
    const qiBreak = qiBreakTalentDamageBoostAt(boss, inputs.breakthrough)
    if (qiBreak > 0)
      parts.push(t("overview.swordTrialBossSelect.qiBreak").replace("{pct}", percentOf(qiBreak)))
    return parts.join(" · ")
  }
  const options: SelectOption<string>[] = SWORD_TRIAL_BOSSES.map((boss) => {
    const locked = boss.minBreakthrough > inputs.breakthrough
    return {
      value: boss.id,
      label: t(swordTrialBossKey(boss.id), boss.name),
      disabled: locked,
      meta: locked
        ? t("overview.swordTrialBossSelect.unlocksAt").replace("{bt}", String(boss.minBreakthrough))
        : talentText(boss),
    }
  })
  if (!isSwordTrialBossId(stored))
    options.unshift({ value: stored, label: t("common.noLongerAvailable"), disabled: true })
  return (
    <>
      <div className="row">
        <label>{t("overview.swordTrialBossSelect.label")}</label>
        <Select
          ariaLabel={t("overview.swordTrialBossSelect.label")}
          value={stored}
          options={options}
          disabled={inputs.dummyMode}
          onChange={(next) => onChange(next as SwordTrialBossId)}
        />
      </div>
      <div className="row">
        <span />
        <div className={styles.summary}>
          <span>
            {inputs.dummyMode
              ? t("overview.swordTrialBossSelect.dummy")
              : scored.id !== stored
                ? t("overview.swordTrialBossSelect.scoredAsDefault")
                    .replace("{bt}", String(inputs.breakthrough))
                    .replace("{boss}", t(swordTrialBossKey(scored.id), scored.name))
                : talentText(scored)}
          </span>
        </div>
      </div>
    </>
  )
}
