import { useRef, useState } from "react"
import type { StoredProfile } from "../../../../engine/types"
import type { Skill } from "../../../../engine/skill"
import type { Buff } from "../../../../engine/buff"
import type { Debuff } from "../../../../engine/debuff"
import { exportProfile, importProfile } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { classDefinition } from "../../../../definitions/classes/registry"
import { activeRotationName } from "../../rotation/rotationOptions"
import { useProfileMetrics } from "../../../hooks/useProfileMetrics"
import { formatCompactDamage, formatNumber } from "../../../utils/numberFormatting"
import { TextInput } from "../../../components/text-input/TextInput"
import styles from "./ProfilePanel.module.scss"

interface Props {
  profiles: StoredProfile[]
  activeId: string
  customSkills: Skill[]
  customBuffs: Buff[]
  customDebuffs: Debuff[]
  onCreate: () => void
  onSelect: (id: string) => void
  onRename: (id: string, name: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onImport: (profile: StoredProfile) => void
}

export function ProfilePanel({
  profiles,
  activeId,
  customSkills,
  customBuffs,
  customDebuffs,
  onCreate,
  onSelect,
  onRename,
  onDuplicate,
  onDelete,
  onImport,
}: Props) {
  const { t } = useI18n()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { metricsByProfileId, isPending } = useProfileMetrics(
    profiles,
    customSkills,
    customBuffs,
    customDebuffs,
  )

  function startRename(profile: StoredProfile) {
    setEditingId(profile.id)
    setDraftName(profile.name)
  }
  function commitRename() {
    if (editingId !== null) {
      const trimmed = draftName.trim()
      if (trimmed) onRename(editingId, trimmed)
    }
    setEditingId(null)
    setDraftName("")
  }
  function cancelRename() {
    setEditingId(null)
    setDraftName("")
  }

  function classLabel(classId: string): string {
    const definition = classDefinition(classId)
    if (!definition) return classId
    return t(definition.displayName)
  }

  function classIcon(classId: string): string | undefined {
    return classDefinition(classId)?.martialArts.find((martialArt) => martialArt.icon)?.icon
  }

  function handleExport(profile: StoredProfile) {
    const text = exportProfile(profile)
    const blob = new Blob([text], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const safeName = (profile.name || "profile").replace(/[^\w\-.]+/g, "_")
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = `${safeName}.json`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    try {
      const text = await file.text()
      const imported = importProfile(text)
      onImport(imported)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      alert(`${t("Import failed")}: ${msg}`)
    }
  }

  return (
    <div className={styles.profilePanel}>
      <div className="toolbar">
        <span className="toolbar-label">{t("Profiles")}</span>
        <div className="spacer" />
        <button type="button" className="btn" onClick={handleImportClick}>
          {t("Import")}
        </button>
        <button type="button" className="btn primary" onClick={onCreate}>
          + {t("New profile")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          style={{ display: "none" }}
          onChange={handleImportFile}
        />
      </div>

      <div className={styles.cardGrid}>
        {profiles.map((profile) => {
          const isActive = profile.id === activeId
          const isEditing = editingId === profile.id
          const icon = classIcon(profile.inputs.classId)
          const metrics = metricsByProfileId?.[profile.id]
          const rotationName = activeRotationName(profile.inputs)
          return (
            <div key={profile.id} className={styles.card + (isActive ? ` ${styles.isActive}` : "")}>
              {icon && <img className={styles.watermark} src={icon} alt="" />}

              <div className={styles.cardHeader}>
                {icon ? (
                  <img className={styles.classIcon} src={icon} alt="" />
                ) : (
                  <div className={styles.classIcon} />
                )}
                {isEditing ? (
                  <TextInput
                    autoFocus
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename()
                      else if (e.key === "Escape") cancelRename()
                    }}
                  />
                ) : (
                  <span
                    className={styles.profileNameText}
                    onDoubleClick={() => startRename(profile)}
                    title={t("Rename")}
                  >
                    {profile.name || t("(unnamed)")}
                  </span>
                )}
                {isActive && <span className={styles.activeBadge}>{t("Active")}</span>}
                <span className={styles.classLabel}>{classLabel(profile.inputs.classId)}</span>
              </div>

              <div className={styles.stats} style={{ opacity: isPending ? 0.6 : 1 }}>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>{t("DPS")}</span>
                  <span className={styles.dpsValue}>
                    {metrics ? formatNumber(metrics.dps, 0) : "—"}
                  </span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statLabel}>{t("Total damage")}</span>
                  <span className={styles.statValue}>
                    {metrics ? formatCompactDamage(metrics.totalDamage) : "—"}
                  </span>
                </div>
                <div className={`${styles.stat} ${styles.rotationStat}`}>
                  <span className={styles.statLabel}>{t("Rotation")}</span>
                  <span className={styles.rotationValue} title={rotationName ?? undefined}>
                    {rotationName ?? "—"}
                    {metrics && (
                      <span className={styles.rotationDuration}>
                        {" "}
                        · {formatNumber(metrics.rotationDuration, 0)}s
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <div className={styles.cardActions}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => onSelect(profile.id)}
                  disabled={isActive}
                >
                  {t("Select")}
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() => startRename(profile)}
                  disabled={isEditing}
                >
                  {t("Rename")}
                </button>
                <button type="button" className="btn" onClick={() => onDuplicate(profile.id)}>
                  {t("Duplicate")}
                </button>
                <button type="button" className="btn" onClick={() => handleExport(profile)}>
                  {t("Export")}
                </button>
                <div className={styles.actionsSpacer} />
                <button
                  type="button"
                  className="btn danger"
                  onClick={() => onDelete(profile.id)}
                  disabled={profiles.length <= 1}
                  title={profiles.length <= 1 ? "" : t("Delete")}
                >
                  {t("Delete")}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
