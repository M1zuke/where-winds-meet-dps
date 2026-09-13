import { blossomResource, JADE_SOURCES } from "../../../../data/classes/silkbind-jade/blossoms"
import {
  resolveResourceSettings,
  type ResourceSettings,
} from "../../../../definitions/resources/resourceDef"
import type { Inputs } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import styles from "./BlossomPanel.module.scss"

const GAIN_KEYS = {
  directHit: "overview.blossoms.directHit",
  qHit: "overview.blossoms.qHit",
  heavyLightCast: "overview.blossoms.heavyLightCast",
  chargedHit: "overview.blossoms.chargedHit",
  tier6: "overview.blossoms.tier6",
} as const

export function BlossomPanel({
  inputs,
  onChange,
}: {
  inputs: Inputs
  onChange: (next: Inputs) => void
}) {
  const { t } = useI18n()
  const settings = resolveResourceSettings(
    blossomResource,
    inputs.resourceSettings?.[blossomResource.id],
  )
  const update = (patch: Partial<ResourceSettings>) =>
    onChange({
      ...inputs,
      resourceSettings: {
        ...inputs.resourceSettings,
        [blossomResource.id]: { ...settings, ...patch },
      },
    })
  return (
    <div className={`panel ${styles.planner}`}>
      <h2>{t("overview.blossoms.title")}</h2>
      <p>{t("overview.blossoms.scope")}</p>
      <div className={styles.fields}>
        <label>
          {t("overview.blossoms.opening")}
          <NumInput
            value={settings.opening}
            min={0}
            max={100}
            onChange={(opening) => update({ opening })}
          />
        </label>
        {blossomResource.gains.map((rule) => (
          <label key={rule.id}>
            {t(GAIN_KEYS[rule.id])}
            <NumInput
              value={settings.gains[rule.id]}
              min={0}
              max={100}
              onChange={(value) => update({ gains: { ...settings.gains, [rule.id]: value } })}
            />
          </label>
        ))}
        <label>
          {t("overview.blossoms.exhaustedHit")}
          <NumInput
            value={settings.exhaustedGainPerTick}
            min={0}
            max={100}
            onChange={(exhaustedGainPerTick) => update({ exhaustedGainPerTick })}
          />
        </label>
      </div>
      <p>{t("overview.blossoms.baseGainHint")}</p>
      <details>
        <summary>{t("overview.blossoms.assumptions")}</summary>
        <p>{t("overview.blossoms.gainHint")}</p>
        <p>{t("overview.blossoms.cadenceHint")}</p>
        <p>{t("overview.blossoms.patchNote")}</p>
      </details>
      <a href={JADE_SOURCES.patch20} target="_blank" rel="noreferrer">
        {t("overview.blossoms.source20")}
      </a>
      {" · "}
      <a href={JADE_SOURCES.patch21} target="_blank" rel="noreferrer">
        {t("overview.blossoms.source21")}
      </a>
    </div>
  )
}
