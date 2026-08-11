import { CLASS_IDS, classDefinition } from "../../../../definitions/classes/registry"
import { useI18n } from "../../../../i18n/i18nContext"

interface Props {
  value: string
  onChange: (next: string) => void
}

export function ClassSelect({ value, onChange }: Props) {
  const { t } = useI18n()
  const visible = CLASS_IDS()
    .map((id) => classDefinition(id)!)
    .filter((def) => def.validated)
  return (
    <div className="row">
      <label>{t("Class")}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {visible.map((def) => (
          <option key={def.id} value={def.id}>
            {t(def.displayName)}
          </option>
        ))}
      </select>
    </div>
  )
}
