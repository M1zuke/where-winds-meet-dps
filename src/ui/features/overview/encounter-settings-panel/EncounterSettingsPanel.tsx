import type { ReactNode } from "react"
import type { Inputs } from "../../../../engine/types"
import { defaultCombatSettings } from "../../../../engine/types"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import { Switch } from "../../../components/switch/Switch"
import { useI18n } from "../../../../i18n/i18nContext"
import { DEFAULT_QI_BREAK_WINDOW } from "../../../../engine/qiBreak"
import styles from "./EncounterSettingsPanel.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.group}>
      <div className="section-label">{title}</div>
      {children}
    </div>
  )
}

function SwitchRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <div className={styles.switchRow} title={label}>
      <Switch checked={checked} label={label} onChange={onChange} />
    </div>
  )
}

function DivinecraftSegments({
  value,
  onChange,
}: {
  value: Inputs["tianGongElement"]
  onChange: (next: Inputs["tianGongElement"]) => void
}) {
  const { t } = useI18n()
  const options: { value: Inputs["tianGongElement"]; label: string }[] = [
    { value: null, label: t("common.none2") },
    { value: "fire", label: t("overview.encounterSettings.fireOil") },
    { value: "poison", label: t("overview.encounterSettings.poison") },
  ]
  return (
    <div className={styles.segmented}>
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          className={styles.segment + (value === option.value ? ` ${styles.segmentSelected}` : "")}
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export function EncounterSettingsPanel({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    onChange({ ...inputs, [key]: value })

  const settings = inputs.combatSettings ?? defaultCombatSettings()
  const setCombat = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    onChange({ ...inputs, combatSettings: { ...settings, [key]: value } })
  const override = settings.qiBreakOverride

  return (
    <div className={styles.encounterSettings}>
      <div className={styles.dummyToggle}>
        <Switch
          checked={inputs.dummyMode}
          label={t("overview.encounterSettings.enableDummy")}
          onChange={(value) => set("dummyMode", value)}
        />
      </div>

      <Section title={t("overview.encounterSettings.consumablesSelf")}>
        <div className={styles.switchGrid}>
          <SwitchRow
            label={t("overview.encounterSettings.simmeringFishSlicesFood")}
            checked={inputs.food}
            onChange={(value) => set("food", value)}
          />
          <SwitchRow
            label={t("overview.encounterSettings.revelryScript")}
            checked={settings.revelryScript}
            onChange={(value) => setCombat("revelryScript", value)}
          />
          <SwitchRow
            label={t("overview.encounterSettings.maxLowHpBonusDragon")}
            checked={settings.dragonHeadLowHpMaxBonus}
            onChange={(value) => setCombat("dragonHeadLowHpMaxBonus", value)}
          />
          <SwitchRow
            label={t("overview.encounterSettings.below60Endurance")}
            checked={settings.lowEndurance}
            onChange={(value) => setCombat("lowEndurance", value)}
          />
        </div>
      </Section>

      <Section title={t("overview.encounterSettings.divinecraft")}>
        <DivinecraftSegments
          value={inputs.tianGongElement}
          onChange={(value) => set("tianGongElement", value)}
        />
      </Section>

      <Section title={t("overview.encounterSettings.sharedDebuffs")}>
        <div className={styles.switchGrid}>
          <SwitchRow
            label={t("overview.encounterSettings.bitterSeasonFromATeammate")}
            checked={inputs.shareDebuff5HenZhi}
            onChange={(value) => set("shareDebuff5HenZhi", value)}
          />
          <SwitchRow
            label={t("overview.encounterSettings.tankSpearDebuffVulnerability")}
            checked={inputs.shareEasyHurt}
            onChange={(value) => set("shareEasyHurt", value)}
          />
        </div>
      </Section>

      <Section title={t("overview.encounterSettings.teammateBuffs")}>
        <div className={styles.switchGrid}>
          <SwitchRow
            label={t("overview.encounterSettings.dragonSBreath")}
            checked={settings.dragonsBreath}
            onChange={(value) => setCombat("dragonsBreath", value)}
          />
          <SwitchRow
            label={t("overview.encounterSettings.healerBuff")}
            checked={settings.healerBuff}
            onChange={(value) => setCombat("healerBuff", value)}
          />
          <SwitchRow
            label={t("overview.encounterSettings.breakExtension")}
            checked={settings.breakExtension}
            onChange={(value) => setCombat("breakExtension", value)}
          />
          <SwitchRow
            label={t("overview.encounterSettings.40StacksDragonHead")}
            checked={settings.dragonHeadFullStacks}
            onChange={(value) => setCombat("dragonHeadFullStacks", value)}
          />
        </div>
      </Section>

      <Section title={t("overview.encounterSettings.qiBreakOverride")}>
        <div className={styles.switchGrid}>
          <SwitchRow
            label={t("overview.encounterSettings.overrideTheRotation")}
            checked={override !== null}
            onChange={(value) =>
              setCombat("qiBreakOverride", value ? DEFAULT_QI_BREAK_WINDOW : null)
            }
          />
        </div>
        {override ? (
          <div className={styles.qiBreakFields}>
            <label className={styles.qiBreakField}>
              {t("common.startS")}
              <NumInput
                value={override.startSec}
                onChange={(value) => setCombat("qiBreakOverride", { ...override, startSec: value })}
              />
            </label>
            <label className={styles.qiBreakField}>
              {t("common.durationS")}
              <NumInput
                value={override.durationSec}
                onChange={(value) =>
                  setCombat("qiBreakOverride", { ...override, durationSec: value })
                }
              />
            </label>
            <label className={styles.qiBreakField}>
              {t("common.lowQiLeadS")}
              <NumInput
                value={override.lowQiLeadSec}
                onChange={(value) =>
                  setCombat("qiBreakOverride", { ...override, lowQiLeadSec: value })
                }
              />
            </label>
          </div>
        ) : (
          <p className={styles.qiBreakHint}>
            {t("overview.encounterSettings.eachRotationRunsItsOwnBreakWindow")}
          </p>
        )}
      </Section>
    </div>
  )
}
