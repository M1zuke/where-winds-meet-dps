import { CLASS_IDS, classDefinition } from "../../../../definitions/classes/registry"
import { useI18n } from "../../../../i18n/i18nContext"
import { Select } from "../../../components/select/Select"

interface Props {
  value: string
  onChange: (next: string) => void
}

export function ClassSelect({ value, onChange }: Props) {
  const { t } = useI18n()
  const visible = CLASS_IDS().map((id) => classDefinition(id)!)
  return (
    <div className="row">
      <label>{t("Class")}</label>
      <Select
        ariaLabel={t("Class")}
        value={value}
        onChange={onChange}
        options={visible.map((def) => ({
          value: def.id,
          label: t(def.displayName),
          meta: def.martialArts.map((art) => t(art.weaponType)).join(" · "),
        }))}
      />
    </div>
  )
}
