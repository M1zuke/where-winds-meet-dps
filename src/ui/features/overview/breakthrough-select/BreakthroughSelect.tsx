import { BREAKTHROUGH_TIERS } from "../../../../definitions/baseStats/breakthroughs"
import { useI18n } from "../../../../i18n/i18nContext"
import { Select } from "../../../components/select/Select"
import styles from "./BreakthroughSelect.module.scss"

interface Props {
  value: number
  onChange: (next: number) => void
}

export function BreakthroughSelect({ value, onChange }: Props) {
  const { t } = useI18n()
  const selected = BREAKTHROUGH_TIERS.find((tier) => tier.breakthrough === value)
  return (
    <>
      <div className="row">
        <label>{t("overview.breakthroughSelect.breakthrough")}</label>
        <Select
          ariaLabel={t("overview.breakthroughSelect.breakthrough")}
          value={String(value)}
          onChange={(next) => onChange(Number(next))}
          options={BREAKTHROUGH_TIERS.map((tier) => ({
            value: String(tier.breakthrough),
            label: `${t("overview.breakthroughSelect.lv")} ${tier.breakthrough}${tier.name ? ` · ${tier.name}` : ""}`,
            meta: `${t("overview.breakthroughSelect.lv")} ${tier.levelRange} · ${t("overview.breakthroughSelect.def")} ${tier.defense} · ${t("overview.breakthroughSelect.res")} ${tier.resistance}%`,
          }))}
        />
      </div>
      {selected && (
        <div className="row">
          <span />
          <div className={styles.summary}>
            <span>
              {t("overview.breakthroughSelect.lv")} {selected.levelRange}
            </span>
            <span>
              {t("overview.breakthroughSelect.def")} {selected.defense}
            </span>
            <span>
              {t("overview.breakthroughSelect.res")} {selected.resistance}%
            </span>
          </div>
        </div>
      )}
    </>
  )
}
