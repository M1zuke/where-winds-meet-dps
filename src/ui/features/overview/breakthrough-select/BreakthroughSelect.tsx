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
        <label>{t("Breakthrough")}</label>
        <Select
          ariaLabel={t("Breakthrough")}
          value={String(value)}
          onChange={(next) => onChange(Number(next))}
          options={BREAKTHROUGH_TIERS.map((tier) => ({
            value: String(tier.breakthrough),
            label: `${t("Lv.")} ${tier.breakthrough}${tier.name ? ` · ${tier.name}` : ""}`,
            meta: `${t("Lv.")} ${tier.levelRange} · ${t("def")} ${tier.defense} · ${t("res")} ${tier.resistance}%`,
          }))}
        />
      </div>
      {selected && (
        <div className="row">
          <span />
          <div className={styles.summary}>
            <span>
              {t("Lv.")} {selected.levelRange}
            </span>
            <span>
              {t("def")} {selected.defense}
            </span>
            <span>
              {t("res")} {selected.resistance}%
            </span>
          </div>
        </div>
      )}
    </>
  )
}
