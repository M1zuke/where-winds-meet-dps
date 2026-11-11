import { getAttunement, type AttunementOption } from "../../../../engine/attunements"
import { attunementKey } from "../../../../i18n/contentKeys"
import type { I18nValue } from "../../../../i18n/i18nContext"
import type { ComboboxOption } from "../../../components/combobox/Combobox"

export function attunementComboboxOptions(
  t: I18nValue["t"],
  offered: readonly AttunementOption[],
  storedId: string,
): ComboboxOption[] {
  const storedUnavailable = storedId !== "" && !offered.some((option) => option.id === storedId)
  return [
    { value: "", label: t("common.none") },
    ...(storedUnavailable
      ? [
          {
            value: storedId,
            label: t(attunementKey(storedId), getAttunement(storedId)?.label ?? storedId),
            detail: t("common.noLongerAvailable"),
            disabled: true,
          },
        ]
      : []),
    ...offered.map((option) => ({
      value: option.id,
      label: t(attunementKey(option.id), option.label),
    })),
  ]
}
