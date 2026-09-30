import type { ReactNode } from "react"
import type { Inputs, ScriptId } from "../../../../engine/types"
import { defaultCombatSettings } from "../../../../engine/types"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import { Switch } from "../../../components/switch/Switch"
import { useI18n } from "../../../../i18n/i18nContext"
import { SCRIPT_IDS } from "../../../../data/skills/buffs/scriptOptions"
import { buildReadsTargetDistance } from "../../../../engine/buffs/catalog"
import {
  PREFERRED_DISTANCE_METERS_MAX,
  PREFERRED_DISTANCE_METERS_MIN,
} from "../../../../engine/distance"
import { QI_TARGET_IDS, type QiTargetId } from "../../../../definitions/baseStats/qiTargetDef"
import styles from "./EncounterSettingsPanel.module.scss"

const SCRIPT_LABEL_KEYS: Record<ScriptId, string> = {
  wraithstrikeScript: "overview.encounterSettings.wraithstrikeScript",
  voidrotScript: "overview.encounterSettings.voidrotScript",
}

const QI_TARGET_LABEL_KEYS: Record<QiTargetId, string> = {
  swordTrial: "overview.encounterSettings.qiTargetSwordTrial",
  swordTrialResistanceUp: "overview.encounterSettings.qiTargetSwordTrialResistanceUp",
  herosRealm: "overview.encounterSettings.qiTargetHerosRealm",
}

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

function SegmentedControl<T>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (next: T) => void
}) {
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

function DivinecraftSegments({
  value,
  onChange,
}: {
  value: Inputs["divinecraft"]
  onChange: (next: Inputs["divinecraft"]) => void
}) {
  const { t } = useI18n()
  const options: { value: Inputs["divinecraft"]; label: string }[] = [
    { value: null, label: t("common.none2") },
    { value: "fire", label: t("overview.encounterSettings.fireOil") },
    { value: "poison", label: t("overview.encounterSettings.poison") },
  ]
  return <SegmentedControl value={value} options={options} onChange={onChange} />
}

function QiTargetSegments({
  value,
  onChange,
}: {
  value: QiTargetId
  onChange: (next: QiTargetId) => void
}) {
  const { t } = useI18n()
  const options = QI_TARGET_IDS.map((id) => ({ value: id, label: t(QI_TARGET_LABEL_KEYS[id]) }))
  return <SegmentedControl value={value} options={options} onChange={onChange} />
}

function ScriptSegments({
  value,
  onChange,
}: {
  value: ScriptId | null
  onChange: (next: ScriptId | null) => void
}) {
  const { t } = useI18n()
  const options: { value: ScriptId | null; label: string }[] = [
    { value: null, label: t("common.none2") },
    ...SCRIPT_IDS.map((id) => ({ value: id, label: t(SCRIPT_LABEL_KEYS[id]) })),
  ]
  return <SegmentedControl value={value} options={options} onChange={onChange} />
}

export function EncounterSettingsPanel({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    onChange({ ...inputs, [key]: value })

  const settings = inputs.combatSettings ?? defaultCombatSettings()
  const setCombat = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    onChange({ ...inputs, combatSettings: { ...settings, [key]: value } })
  const showPreferredDistance = buildReadsTargetDistance(inputs)

  return (
    <div className={styles.encounterSettings}>
      <div className={styles.dummyToggle}>
        <Switch
          checked={inputs.dummyMode}
          label={t("overview.encounterSettings.enableDummy")}
          onChange={(value) => set("dummyMode", value)}
        />
        {showPreferredDistance ? (
          <div className={styles.inlineFields}>
            <label className={styles.inlineField}>
              {t("overview.encounterSettings.preferredDistanceM")}
              <NumInput
                value={settings.preferredDistanceMeters}
                onChange={(value) =>
                  setCombat(
                    "preferredDistanceMeters",
                    Math.min(
                      PREFERRED_DISTANCE_METERS_MAX,
                      Math.max(PREFERRED_DISTANCE_METERS_MIN, value),
                    ),
                  )
                }
              />
            </label>
          </div>
        ) : null}
        {showPreferredDistance ? (
          <p className={styles.inlineHint}>
            {t("overview.encounterSettings.preferredDistanceHint")}
          </p>
        ) : null}
      </div>

      <Section title={t("overview.encounterSettings.consumablesSelf")}>
        <div className={styles.switchGrid}>
          <SwitchRow
            label={t("overview.encounterSettings.simmeringFishSlicesFood")}
            checked={inputs.food}
            onChange={(value) => set("food", value)}
          />
          <SwitchRow
            label={t("overview.encounterSettings.maxLowHpBonusDragon")}
            checked={settings.dragonHeadLowHpMaxBonus}
            onChange={(value) => setCombat("dragonHeadLowHpMaxBonus", value)}
          />
        </div>
      </Section>

      <Section title={t("overview.encounterSettings.fragrantOrchidBathBean")}>
        <div className={styles.switchGrid}>
          <SwitchRow
            label={t("overview.encounterSettings.fragrantOrchidBathBean")}
            checked={settings.fragrantOrchidBathBean}
            onChange={(value) => setCombat("fragrantOrchidBathBean", value)}
          />
        </div>
        <p className={styles.inlineHint}>
          {t("overview.encounterSettings.fragrantOrchidBathBeanHint")}
        </p>
      </Section>

      <Section title={t("overview.encounterSettings.script")}>
        <ScriptSegments value={settings.script} onChange={(value) => setCombat("script", value)} />
      </Section>

      <Section title={t("overview.encounterSettings.divinecraft")}>
        <DivinecraftSegments
          value={inputs.divinecraft}
          onChange={(value) => set("divinecraft", value)}
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
            label={t("overview.encounterSettings.healerPanaceaFan")}
            checked={settings.healerPanaceaFan}
            onChange={(value) => setCombat("healerPanaceaFan", value)}
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

      <Section title={t("overview.encounterSettings.qiTarget")}>
        <QiTargetSegments
          value={inputs.qiTarget ?? "swordTrial"}
          onChange={(value) => set("qiTarget", value)}
        />
      </Section>
    </div>
  )
}
