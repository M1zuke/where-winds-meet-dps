import schools from "../../../../data/classes/schools.json"
import { useI18n } from "../../../../i18n/i18nContext"

const SCHOOLS = schools as { id: string; cn: string; en: string }[]

const SUPPORTED_CLASS_IDS: ReadonlySet<string> = new Set(["bellstrikeUmbra", "stonesplitStrength"])

interface Props {
  value: string
  onChange: (next: string) => void
}

export function ClassSelect({ value, onChange }: Props) {
  const { t } = useI18n()
  const visible = SCHOOLS.filter((school) => SUPPORTED_CLASS_IDS.has(school.id))
  const legacy = SUPPORTED_CLASS_IDS.has(value)
    ? undefined
    : SCHOOLS.find((school) => school.id === value)
  return (
    <div className="row">
      <label>{t("Class")}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {visible.map((school) => (
          <option key={school.id} value={school.id}>
            {t(school.cn)}
          </option>
        ))}
        {legacy && (
          <option value={legacy.id} disabled>
            {t(legacy.cn)}
          </option>
        )}
      </select>
    </div>
  )
}
