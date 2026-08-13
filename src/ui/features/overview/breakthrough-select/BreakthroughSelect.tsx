import { BREAKTHROUGH_TIERS } from "../../../../definitions/baseStats/breakthroughs"
import { useI18n } from "../../../../i18n/i18nContext"

interface Props {
  value: number
  onChange: (next: number) => void
}

export function BreakthroughSelect({ value, onChange }: Props) {
  const { t } = useI18n()
  return (
    <div className="row">
      <label>{t("Breakthrough")}</label>
      <select value={String(value)} onChange={(e) => onChange(Number(e.target.value))}>
        {BREAKTHROUGH_TIERS.map((tier) => (
          <option key={tier.breakthrough} value={tier.breakthrough}>
            {`${t("Lv.")} ${tier.breakthrough}${tier.name ? ` · ${tier.name}` : ""} (${t("Lv.")} ${tier.levelRange}, def ${tier.defense}, res ${tier.resistance}%)`}
          </option>
        ))}
      </select>
    </div>
  )
}
