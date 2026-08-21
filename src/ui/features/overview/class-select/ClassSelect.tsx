import { CLASS_IDS, classDefinition } from "../../../../definitions/classes/registry"
import { useI18n } from "../../../../i18n/i18nContext"
import { classKey, weaponKey } from "../../../../i18n/contentKeys"
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
      <label>{t("overview.classSelect.class")}</label>
      <Select
        ariaLabel={t("overview.classSelect.class")}
        value={value}
        onChange={onChange}
        options={visible.map((def) => ({
          value: def.id,
          label: t(classKey(def.id), def.displayName),
          meta: def.martialArts
            .map((art) => t(weaponKey(art.weaponType), art.weaponType))
            .join(" · "),
        }))}
      />
    </div>
  )
}
