import { useRef, useState } from "react"
import type { StoredProfile } from "../../../../engine/types"
import { exportProfile, importProfile } from "../../../../storage"
import { useI18n } from "../../../../i18n/i18nContext"
import { classDefinition } from "../../../../data/classes/registry"
import styles from "./ProfilePanel.module.scss"

interface Props {
  profiles: StoredProfile[]
  activeId: string
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

      <div className={styles.profileList}>
        {profiles.map((profile) => {
          const isActive = profile.id === activeId
          const isEditing = editingId === profile.id
          return (
            <div
              key={profile.id}
              className={styles.profileRow + (isActive ? ` ${styles.isActive}` : "")}
            >
              <div className={styles.profileName}>
                {isEditing ? (
                  <input
                    type="text"
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
                {isActive && <span className={styles.profileActiveBadge}>{t("Active")}</span>}
              </div>

              <div className={styles.profileClass}>{classLabel(profile.inputs.classId)}</div>

              <div className={styles.profileActions}>
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

      <div className="hint">
        {t(
          "Each profile stores the entire input set. Custom rotations are shared globally but only those matching the active profile's class are shown.",
        )}
      </div>
    </div>
  )
}
