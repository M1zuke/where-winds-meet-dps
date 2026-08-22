import { CLASS_DEFS, classDefinition } from "../../../../definitions/classes/registry"
import { useI18n } from "../../../../i18n/i18nContext"
import { classKey, martialArtKey } from "../../../../i18n/contentKeys"
import { GITHUB_REPO_URL } from "../../../layout/github-link/GithubLink"
import { GithubIcon } from "../../../components/github-icon/GithubIcon"
import optionTiles from "../../../components/option-tile/OptionTile.module.scss"
import styles from "./ClassPicker.module.scss"

const WIKI_URL = `${GITHUB_REPO_URL}/wiki`

const UNVALIDATED_HINT_KEY = "setup.classPicker.unvalidatedHint"

interface Props {
  value: string
  onChange(classId: string): void
}

export function ClassPicker({ value, onChange }: Props) {
  const { t } = useI18n()

  return (
    <div className={styles.pickerRoot}>
      <div className={`${optionTiles.tileGrid} ${optionTiles.cols2}`}>
        {CLASS_DEFS().map((classDef) => {
          const martialArts = classDefinition(classDef.id)!.martialArts
          const icon = martialArts.find((martialArt) => martialArt.icon)?.icon
          const selected = classDef.id === value
          return (
            <button
              type="button"
              key={classDef.id}
              className={styles.tile + (selected ? ` ${styles.selected}` : "")}
              aria-current={selected}
              onClick={() => onChange(classDef.id)}
            >
              {icon ? (
                <img className={styles.icon} src={icon} alt="" />
              ) : (
                <div className={styles.icon} />
              )}
              <div className={styles.info}>
                <div className={styles.nameRow}>
                  <span className={styles.name}>
                    {t(classKey(classDef.id), classDef.displayName)}
                  </span>
                  {classDef.validated ? null : (
                    <span className={styles.wip} title={t(UNVALIDATED_HINT_KEY)}>
                      {t("setup.classPicker.wip")}
                    </span>
                  )}
                </div>
                {martialArts.map((martialArt, index) => (
                  <div key={martialArt.id} className={styles.weaponRow}>
                    <span className={styles.weaponLabel}>
                      {t("common.weapon")} {index + 1}
                    </span>
                    <span className={styles.weaponValue}>
                      {t(martialArtKey(martialArt.id), martialArt.name)}
                    </span>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
      <a className={styles.helpLink} href={WIKI_URL} target="_blank" rel="noreferrer">
        <span className={styles.helpIcon}>
          <GithubIcon />
        </span>
        {t("setup.classPicker.missingYourClassHelpImplement")}
      </a>
    </div>
  )
}
