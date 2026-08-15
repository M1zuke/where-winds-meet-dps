import type { Inputs } from "../../../../engine/types"
import { defaultCombatSettings } from "../../../../engine/types"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import { useI18n } from "../../../../i18n/i18nContext"
import styles from "./EncounterSettingsPanel.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

function ToggleChip({ label, on, onToggle }: { label: string; on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={styles.toggleChip + (on ? ` ${styles.isOn}` : "")}
      aria-pressed={on}
      onClick={onToggle}
    >
      {label}
    </button>
  )
}

export function EncounterSettingsPanel({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const set = <K extends keyof Inputs>(key: K, value: Inputs[K]) =>
    onChange({ ...inputs, [key]: value })

  const settings = inputs.combatSettings ?? defaultCombatSettings()
  const setCombat = <K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) =>
    onChange({ ...inputs, combatSettings: { ...settings, [key]: value } })

  return (
    <div className={styles.encounterSettings}>
      <div className={styles.toggleChipGroup}>
        <div className="section-label">{t("Consumables & Self")}</div>
        <div className={styles.toggleChips}>
          <ToggleChip
            label={t("Simmering Fish Slices (Food)")}
            on={inputs.food}
            onToggle={() => set("food", !inputs.food)}
          />
          <ToggleChip
            label={t("Revelry Script")}
            on={settings.revelryScript}
            onToggle={() => setCombat("revelryScript", !settings.revelryScript)}
          />
          <ToggleChip
            label={t("Max Low-HP Bonus (Dragon Head)")}
            on={settings.dragonHeadLowHpMaxBonus}
            onToggle={() => setCombat("dragonHeadLowHpMaxBonus", !settings.dragonHeadLowHpMaxBonus)}
          />
        </div>
      </div>

      <div className={styles.toggleChipGroup}>
        <div className="section-label">{t("Divinecraft")}</div>
        <div className={styles.toggleChips}>
          <ToggleChip
            label={t("None")}
            on={inputs.tianGongElement == null}
            onToggle={() => set("tianGongElement", null)}
          />
          <ToggleChip
            label={t("Fire Oil")}
            on={inputs.tianGongElement === "fire"}
            onToggle={() => set("tianGongElement", "fire")}
          />
          <ToggleChip
            label={t("Poison")}
            on={inputs.tianGongElement === "poison"}
            onToggle={() => set("tianGongElement", "poison")}
          />
        </div>
      </div>

      <div className={styles.toggleChipGroup}>
        <div className="section-label">{t("Shared Debuffs")}</div>
        <div className={styles.toggleChips}>
          <ToggleChip
            label={t("Bitter Season (from a teammate)")}
            on={inputs.shareDebuff5HenZhi}
            onToggle={() => set("shareDebuff5HenZhi", !inputs.shareDebuff5HenZhi)}
          />
          <ToggleChip
            label={t("Tank Spear Debuff (Vulnerability)")}
            on={inputs.shareEasyHurt}
            onToggle={() => set("shareEasyHurt", !inputs.shareEasyHurt)}
          />
        </div>
      </div>

      <div className={styles.toggleChipGroup}>
        <div className="section-label">{t("Teammate Buffs")}</div>
        <div className={styles.toggleChips}>
          <ToggleChip
            label={t("Dragon's Breath")}
            on={settings.dragonsBreath}
            onToggle={() => setCombat("dragonsBreath", !settings.dragonsBreath)}
          />
          <ToggleChip
            label={t("Healer Buff")}
            on={settings.healerBuff}
            onToggle={() => setCombat("healerBuff", !settings.healerBuff)}
          />
          <ToggleChip
            label={t("Break Extension")}
            on={settings.breakExtension}
            onToggle={() => setCombat("breakExtension", !settings.breakExtension)}
          />
          <ToggleChip
            label={t("40 Stacks (Dragon Head)")}
            on={settings.dragonHeadFullStacks}
            onToggle={() => setCombat("dragonHeadFullStacks", !settings.dragonHeadFullStacks)}
          />
        </div>
      </div>

      <div className={styles.toggleChipGroup}>
        <div className="section-label">{t("Qi Break")}</div>
        <div className={styles.toggleChips}>
          <ToggleChip
            label={t("Qi Break Window")}
            on={settings.qiBreak.enabled}
            onToggle={() =>
              setCombat("qiBreak", { ...settings.qiBreak, enabled: !settings.qiBreak.enabled })
            }
          />
          {settings.qiBreak.enabled && (
            <span className={styles.toggleChipInline}>
              <label>{t("Start (s)")}</label>
              <NumInput
                value={settings.qiBreak.startSec}
                onChange={(value) => setCombat("qiBreak", { ...settings.qiBreak, startSec: value })}
              />
              <label>{t("Duration (s)")}</label>
              <NumInput
                value={settings.qiBreak.durationSec}
                onChange={(value) =>
                  setCombat("qiBreak", { ...settings.qiBreak, durationSec: value })
                }
              />
              <label>{t("Low Qi Lead (s)")}</label>
              <NumInput
                value={settings.qiBreak.lowQiLeadSec}
                onChange={(value) =>
                  setCombat("qiBreak", { ...settings.qiBreak, lowQiLeadSec: value })
                }
              />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
