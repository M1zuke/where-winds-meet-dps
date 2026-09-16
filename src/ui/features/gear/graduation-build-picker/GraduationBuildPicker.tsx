import { useId } from "react"
import type { GraduationBuild } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { classDefinition } from "../../../../definitions/classes/registry"
import { SET_BY_ID } from "../../../../definitions/sets/registry"
import { graduationBuildKey, rotationKey, setKey } from "../../../../i18n/contentKeys"
import { useI18n } from "../../../../i18n/i18nContext"
import { BOW_SET_KEYS } from "../shared/buildSetKeys"
import styles from "./GraduationBuildPicker.module.scss"

interface Props {
  builds: readonly GraduationBuild[]
  followedBuildId: string | null
  onFollow(buildId: string): void
}

export function GraduationBuildPicker({ builds, followedBuildId, onFollow }: Props) {
  const { t } = useI18n()
  const groupName = useId()

  return (
    <fieldset className={styles.picker}>
      <legend className={styles.legend}>{t("gear.graduationBuildPicker.buildToFollow")}</legend>
      <div className={styles.options}>
        {builds.map((build) => {
          const followed = build.id === followedBuildId
          const armorSet = build.set ? SET_BY_ID[build.set] : null
          const rotation = classDefinition(build.classId)?.rotations.find(
            (candidate) => candidate.id === build.rotationId,
          )
          return (
            <label
              key={build.id}
              className={followed ? `${styles.option} ${styles.followed}` : styles.option}
            >
              <input
                type="radio"
                name={groupName}
                value={build.id}
                checked={followed}
                onChange={() => onFollow(build.id)}
              />
              <span className={styles.body}>
                <span className={styles.nameRow}>
                  <span className={styles.name}>{t(graduationBuildKey(build.id), build.name)}</span>
                  {followed && (
                    <span className={styles.following}>
                      {t("gear.graduationBuildPicker.following")}
                    </span>
                  )}
                </span>
                <span className={styles.facts}>
                  <span>
                    {t("common.armorSet")}{" "}
                    <span className={styles.factValue}>
                      {armorSet ? t(setKey(armorSet.id), armorSet.name) : t("common.unselected")}
                    </span>
                  </span>
                  <span>
                    {t("common.bowSet")}{" "}
                    <span className={styles.factValue}>
                      {build.bowSet ? t(BOW_SET_KEYS[build.bowSet]) : t("common.unselected")}
                    </span>
                  </span>
                  <span>
                    {t("common.rotation")}{" "}
                    <span className={styles.factValue}>
                      {rotation ? t(rotationKey(rotation.id), rotation.name) : build.rotationId}
                    </span>
                  </span>
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
