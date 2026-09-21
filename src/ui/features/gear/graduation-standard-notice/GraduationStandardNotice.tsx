import type { StandardizedEncounter } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import { STANDARDIZED_ENCOUNTER_OFF } from "../../../../definitions/graduationBuilds/graduationBuildDef"
import type { Inputs, ScriptId } from "../../../../engine/types"
import { useI18n } from "../../../../i18n/i18nContext"
import styles from "./GraduationStandardNotice.module.scss"

type SwitchedSetting = {
  [Key in keyof StandardizedEncounter]: StandardizedEncounter[Key] extends boolean ? Key : never
}[keyof StandardizedEncounter]

const SWITCHED_LABEL_KEYS: Record<SwitchedSetting, string> = {
  dummyMode: "overview.encounterSettings.enableDummy",
  food: "overview.encounterSettings.simmeringFishSlicesFood",
  dragonHeadLowHpMaxBonus: "overview.encounterSettings.maxLowHpBonusDragon",
  lowEndurance: "overview.encounterSettings.below60Endurance",
  shareDebuff5HenZhi: "overview.encounterSettings.bitterSeasonFromATeammate",
  shareEasyHurt: "overview.encounterSettings.tankSpearDebuffVulnerability",
  dragonsBreath: "overview.encounterSettings.dragonSBreath",
  healerBuff: "overview.encounterSettings.healerBuff",
  breakExtension: "overview.encounterSettings.breakExtension",
  dragonHeadFullStacks: "overview.encounterSettings.40StacksDragonHead",
}

const SCRIPT_LABEL_KEYS: Record<ScriptId, string> = {
  wraithstrikeScript: "overview.encounterSettings.wraithstrikeScript",
  voidrotScript: "overview.encounterSettings.voidrotScript",
}

const DIVINECRAFT_LABEL_KEYS: Record<Exclude<Inputs["divinecraft"], null>, string> = {
  fire: "overview.encounterSettings.fireOil",
  poison: "overview.encounterSettings.poison",
}

export function GraduationStandardNotice({
  encounter: fixed,
}: {
  encounter: Partial<StandardizedEncounter> | undefined
}) {
  const { t } = useI18n()
  const encounter: StandardizedEncounter = { ...STANDARDIZED_ENCOUNTER_OFF, ...fixed }

  const enabled = (Object.keys(SWITCHED_LABEL_KEYS) as SwitchedSetting[])
    .filter((setting) => encounter[setting])
    .map((setting) => t(SWITCHED_LABEL_KEYS[setting]))
  if (encounter.script) enabled.push(t(SCRIPT_LABEL_KEYS[encounter.script]))
  if (encounter.divinecraft)
    enabled.push(
      `${t("overview.encounterSettings.divinecraft")}: ${t(DIVINECRAFT_LABEL_KEYS[encounter.divinecraft])}`,
    )

  return (
    <section className={styles.standardNotice}>
      <p className={styles.headline}>{t("gear.graduationStandard.standardizedBenchmark")}</p>
      <p className={styles.body}>
        {t("gear.graduationStandard.bothSidesRunAFixedSetup")}{" "}
        {enabled.length > 0
          ? `${enabled.join(", ")} — ${t("gear.graduationStandard.everythingElseOff")}`
          : t("gear.graduationStandard.everythingOff")}
      </p>
    </section>
  )
}
