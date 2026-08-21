import { useMemo } from "react"
import type { Inputs, MartialArtsTalent, ScalingSource, TalentStat } from "../../../../engine/types"
import { alwaysActiveClassBuffs, type ClassBuffRow } from "../../../../engine/buffs/catalog"
import { useI18n } from "../../../../i18n/i18nContext"
import { buffKey, talentKey } from "../../../../i18n/contentKeys"
import { buildScalingSources } from "../../../../definitions/baseStats"
import { withDerivedStats, equippedPiecesFor } from "../../../../engine/derivedInputs"
import { TALENT_STAT_KEYS } from "../shared/talentStatKeys"
import styles from "./TalentsTab.module.scss"

interface Props {
  inputs: Inputs
}

const RATE_STATS = new Set<TalentStat>([
  "affinityRate",
  "critRate",
  "precisionRate",
  "critDamage",
  "affinityDamage",
  "attributeDamage",
  "physPenetration",
  "bellstrikePenetration",
  "stonesplitPenetration",
  "silkbindPenetration",
  "bamboocutPenetration",
])

const RATE_SOURCES = new Set<ScalingSource>([
  "phys.penetration",
  "bellstrike.penetration",
  "stonesplit.penetration",
  "silkbind.penetration",
  "bamboocut.penetration",
])

const PENETRATION_STATS = new Set<TalentStat>([
  "physPenetration",
  "bellstrikePenetration",
  "stonesplitPenetration",
  "silkbindPenetration",
  "bamboocutPenetration",
])

const SOURCE_KEYS: Record<ScalingSource, string> = {
  power: "content.statLine.power",
  agility: "content.statLine.agility",
  momentum: "content.statLine.momentum",
  "phys.min": TALENT_STAT_KEYS.minPhys,
  "phys.max": TALENT_STAT_KEYS.maxPhys,
  "phys.penetration": TALENT_STAT_KEYS.physPenetration,
  "bellstrike.min": TALENT_STAT_KEYS.minBellstrike,
  "bellstrike.max": TALENT_STAT_KEYS.maxBellstrike,
  "bellstrike.penetration": TALENT_STAT_KEYS.bellstrikePenetration,
  "stonesplit.min": TALENT_STAT_KEYS.minStonesplit,
  "stonesplit.max": TALENT_STAT_KEYS.maxStonesplit,
  "stonesplit.penetration": TALENT_STAT_KEYS.stonesplitPenetration,
  "silkbind.min": TALENT_STAT_KEYS.minSilkbind,
  "silkbind.max": TALENT_STAT_KEYS.maxSilkbind,
  "silkbind.penetration": TALENT_STAT_KEYS.silkbindPenetration,
  "bamboocut.min": TALENT_STAT_KEYS.minBamboocut,
  "bamboocut.max": TALENT_STAT_KEYS.maxBamboocut,
  "bamboocut.penetration": TALENT_STAT_KEYS.bamboocutPenetration,
}

function formatStatValue(stat: TalentStat, value: number): string {
  const sign = value >= 0 ? "+" : ""
  if (PENETRATION_STATS.has(stat)) return `${sign}${Math.round(value * 1000) / 10}`
  if (RATE_STATS.has(stat)) return `${sign}${(value * 100).toFixed(1)}%`
  return `${sign}${Math.round(value * 100) / 100}`
}

function talentCurrent(row: MartialArtsTalent, sources: Record<ScalingSource, number>): number {
  const attr = sources[row.scalesWith] ?? 0
  const scale = row.scaleMax > 0 ? Math.min(attr / row.scaleMax, 1) : 1
  return scale * row.maxBonus
}

type TalentEffectLine =
  | { kind: "talent"; skill: string; labelKey?: string }
  | { kind: "talentFlatText"; skills: string[]; textKey: string }
  | { kind: "mechanic"; id: string; noteKey?: string }
  | { kind: "static"; textKey: string; subNoteKey?: string }

interface TalentCardConfig {
  nameKey: string
  lines: TalentEffectLine[]
}

interface WeaponColumnConfig {
  weaponKey: string
  cards: TalentCardConfig[]
}

const CLASS_TALENT_COLUMNS: Record<string, WeaponColumnConfig[]> = {
  bellstrikeUmbra: [
    {
      weaponKey: "content.martialArt.strategicSword",
      cards: [
        {
          nameKey: "talents.card.affinityRateUp",
          lines: [{ kind: "talent", skill: "Affinity Rate UP" }],
        },
        {
          nameKey: "talents.card.bleedPenetrationEnhancement",
          lines: [
            {
              kind: "mechanic",
              id: "bellstrikeUmbraBleedPen",
              noteKey: "talents.note.scalesWithMaxPhysFullAt1500",
            },
          ],
        },
        {
          nameKey: "talents.card.bellstrikeAttributeUp",
          lines: [
            {
              kind: "talentFlatText",
              skills: ["Sword Bellstrike Attack Min", "Sword Bellstrike Attack Max"],
              textKey: "talents.effect.98Min196MaxBellstrike",
            },
            { kind: "talent", skill: "Bellstrike Penetration Scale" },
          ],
        },
        {
          nameKey: "talents.card.attrAttackDmgUp",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.bellstrikeAttackDeals50Bonus",
              subNoteKey: "talents.note.alreadyAppliedInTheDamageFormulaElevatedHint",
            },
          ],
        },
      ],
    },
    {
      weaponKey: "content.martialArt.heavenquakerSpear",
      cards: [
        {
          nameKey: "talents.card.physicalAttackUp",
          lines: [{ kind: "talent", skill: "Physical Attack UP" }],
        },
        {
          nameKey: "talents.card.damageOverTime",
          lines: [
            {
              kind: "mechanic",
              id: "bellstrikeUmbraBleedingDamage",
              noteKey: "talents.note.affinityDmg18On1500",
            },
          ],
        },
        {
          nameKey: "talents.card.bellstrikeAttributeUp",
          lines: [
            {
              kind: "talentFlatText",
              skills: ["Spear Bellstrike Attack Min", "Spear Bellstrike Attack Max"],
              textKey: "talents.effect.98Min196MaxBellstrike",
            },
            {
              kind: "talent",
              skill: "Attribute Damage Scale",
              labelKey: "content.statLine.attributeDamageBoost",
            },
          ],
        },
      ],
    },
  ],
  silkbindJade: [
    {
      weaponKey: "content.martialArt.vernalUmbrella",
      cards: [
        {
          nameKey: "talents.card.trajectorySkillEnhancement",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.ballisticSkillsIgnoreHint",
              subNoteKey: "talents.note.modelledAsTheTrajectoryskillHint",
            },
          ],
        },
        {
          nameKey: "talents.card.criticalRateUp",
          lines: [{ kind: "talent", skill: "Critical Rate UP" }],
        },
        {
          nameKey: "talents.card.trajectoryCalculationEnhancement",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.ballisticSkillsGainHint",
              subNoteKey: "talents.note.alreadyAppliedInTheDamageFormulaNeedsHint",
            },
          ],
        },
        {
          nameKey: "talents.card.silkbindAttributeUp",
          lines: [
            {
              kind: "talentFlatText",
              skills: ["Umbrella Silkbind Attack Min", "Umbrella Silkbind Attack Max"],
              textKey: "talents.effect.98Min196MaxSilkbind",
            },
            { kind: "talent", skill: "Silkbind Penetration Scale" },
          ],
        },
        {
          nameKey: "talents.card.attrAttackDmgUp",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.silkbindAttackDeals50Bonus",
              subNoteKey: "talents.note.alreadyAppliedInTheDamageFormulaElevatedHint",
            },
          ],
        },
      ],
    },
    {
      weaponKey: "content.martialArt.inkwellFan",
      cards: [
        {
          nameKey: "talents.card.lowQiFollowUpEnhancement",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.againstTargetsBelowHint",
              subNoteKey: "talents.note.modelledAsTheLowqifollowupHint",
            },
          ],
        },
        {
          nameKey: "talents.card.physicalAttackUp",
          lines: [{ kind: "talent", skill: "Physical Attack UP" }],
        },
        {
          nameKey: "talents.card.heavyAttackPursuitEnhancement",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.moonShatterSpringHint",
              subNoteKey: "talents.note.alreadyAppliedInTheDamageFormulaNeedsHint",
            },
          ],
        },
        {
          nameKey: "talents.card.silkbindAttributeUp",
          lines: [
            {
              kind: "talentFlatText",
              skills: ["Fan Silkbind Attack Min", "Fan Silkbind Attack Max"],
              textKey: "talents.effect.98Min196MaxSilkbind",
            },
            {
              kind: "talent",
              skill: "Attribute Damage Scale",
              labelKey: "talents.line.silkbindDmgBonus",
            },
          ],
        },
        {
          nameKey: "talents.card.attrAttackDmgUp",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.silkbindAttackDeals50Bonus",
              subNoteKey: "talents.note.alreadyAppliedInTheDamageFormulaElevatedHint",
            },
          ],
        },
      ],
    },
  ],
  bellstrikeSplendor: [
    {
      weaponKey: "content.martialArt.namelessSword",
      cards: [
        {
          nameKey: "talents.card.qiStruggleEnhancement",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.10QiDmg",
              subNoteKey: "talents.note.qiDamageDrainsHint",
            },
            {
              kind: "mechanic",
              id: "swordEnergyHpDamage",
              noteKey: "talents.note.scalesWithMaxPhysFullAt1000",
            },
          ],
        },
        {
          nameKey: "talents.card.physicalAttackUp",
          lines: [{ kind: "talent", skill: "Physical Attack UP" }],
        },
        {
          nameKey: "talents.card.swordQiAffinity",
          lines: [
            {
              kind: "mechanic",
              id: "swordEnergyEnhancement",
              noteKey: "talents.note.scalesWithMaxPhysFullAt1500",
            },
          ],
        },
        {
          nameKey: "talents.card.bellstrikeAttributeUp",
          lines: [
            {
              kind: "talentFlatText",
              skills: ["Sword Bellstrike Attack Min", "Sword Bellstrike Attack Max"],
              textKey: "talents.effect.98Min196MaxBellstrike",
            },
            { kind: "talent", skill: "Bellstrike Penetration Scale" },
          ],
        },
        {
          nameKey: "talents.card.attrAttackDmgUp",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.bellstrikeAttackDeals50Bonus",
              subNoteKey: "talents.note.alreadyAppliedInTheDamageFormulaElevatedHint",
            },
          ],
        },
      ],
    },
    {
      weaponKey: "content.martialArt.namelessSpear",
      cards: [
        {
          nameKey: "talents.card.maxEnduranceUp",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.10MaxEnduranceAndUp",
              subNoteKey: "talents.note.theEngineRunsHint",
            },
          ],
        },
        {
          nameKey: "talents.card.affinityRateUp",
          lines: [{ kind: "talent", skill: "Affinity Rate UP" }],
        },
        {
          nameKey: "talents.card.affinityDmgUp",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.18AffinityDmgHint",
              subNoteKey: "talents.note.oneBonusBehindHint",
            },
          ],
        },
        {
          nameKey: "talents.card.bellstrikeAttributeUp",
          lines: [
            {
              kind: "talentFlatText",
              skills: ["Spear Bellstrike Attack Min", "Spear Bellstrike Attack Max"],
              textKey: "talents.effect.98Min196MaxBellstrike",
            },
            {
              kind: "talent",
              skill: "Attribute Damage Scale",
              labelKey: "content.statLine.attributeDamageBoost",
            },
          ],
        },
        {
          nameKey: "talents.card.attrAttackDmgUp",
          lines: [
            {
              kind: "static",
              textKey: "talents.effect.bellstrikeAttackDeals50Bonus",
              subNoteKey: "talents.note.alreadyAppliedInTheDamageFormulaElevatedHint",
            },
          ],
        },
      ],
    },
  ],
}

export function TalentsTab({ inputs }: Props) {
  const { t } = useI18n()
  const talents = inputs.martialArtsTalents
  const classBuffs = alwaysActiveClassBuffs(inputs)

  const sources = useMemo(() => {
    const equipped = equippedPiecesFor(inputs)
    return buildScalingSources(withDerivedStats(inputs), equipped)
  }, [inputs])

  const talentsByName = useMemo(
    () => new Map(talents.map((row) => [row.name, row] as const)),
    [talents],
  )
  const classBuffsById = useMemo(
    () => new Map(classBuffs.map((buff) => [buff.id, buff] as const)),
    [classBuffs],
  )

  const columns = CLASS_TALENT_COLUMNS[inputs.classId]

  function renderTalentLine(line: Extract<TalentEffectLine, { kind: "talent" }>) {
    const row = talentsByName.get(line.skill)
    if (!row) return null
    const current = talentCurrent(row, sources)
    const capDisplay = RATE_SOURCES.has(row.scalesWith) ? row.scaleMax * 100 : row.scaleMax
    return (
      <div className={styles.classBuffLine} key={`talent:${line.skill}`}>
        <div className={styles.classBuffHead}>
          {line.labelKey && <span className={styles.classBuffName}>{t(line.labelKey)}</span>}
          <span className={styles.classBuffEffect}>
            {formatStatValue(row.stat, row.maxBonus)} {t(TALENT_STAT_KEYS[row.stat], row.stat)}
          </span>
          <span className={styles.classBuffCurrent}>
            {t("talents.current")}: {formatStatValue(row.stat, current)}
          </span>
        </div>
        <div className={styles.classBuffNote}>
          {t("talents.scalesWith")}: {t(SOURCE_KEYS[row.scalesWith])}
          {row.scaleMax > 0 ? ` (${t("talents.cap")}: ${capDisplay})` : ""}
        </div>
      </div>
    )
  }

  function renderFlatTextLine(line: Extract<TalentEffectLine, { kind: "talentFlatText" }>) {
    const present = line.skills.some((skillName) => talentsByName.has(skillName))
    if (!present) return null
    return (
      <div className={styles.classBuffLine} key={`flat:${line.skills.join("+")}`}>
        <div className={styles.classBuffHead}>
          <span className={styles.classBuffEffect}>{t(line.textKey)}</span>
        </div>
      </div>
    )
  }

  function renderMechanicLine(
    line: Extract<TalentEffectLine, { kind: "mechanic" }>,
    buff: ClassBuffRow,
  ) {
    return (
      <div className={styles.classBuffLine} key={`mechanic:${line.id}`}>
        <div className={styles.classBuffHead}>
          <span className={styles.classBuffEffect}>{buff.effect}</span>
        </div>
        {line.noteKey && <div className={styles.classBuffNote}>{t(line.noteKey)}</div>}
      </div>
    )
  }

  function renderStaticLine(line: Extract<TalentEffectLine, { kind: "static" }>) {
    return (
      <div className={styles.classBuffLine} key={`static:${line.textKey}`}>
        <div className={styles.classBuffHead}>
          <span className={styles.classBuffEffect}>{t(line.textKey)}</span>
        </div>
        {line.subNoteKey && <div className={styles.classBuffNote}>{t(line.subNoteKey)}</div>}
      </div>
    )
  }

  function renderLine(line: TalentEffectLine) {
    switch (line.kind) {
      case "talent":
        return renderTalentLine(line)
      case "talentFlatText":
        return renderFlatTextLine(line)
      case "mechanic": {
        const buff = classBuffsById.get(line.id)
        return buff ? renderMechanicLine(line, buff) : null
      }
      case "static":
        return renderStaticLine(line)
    }
  }

  function renderCard(card: TalentCardConfig) {
    const lines = card.lines.map(renderLine).filter((line) => line !== null)
    if (lines.length === 0) return null
    return (
      <div className={styles.classBuffRow} key={card.nameKey}>
        <div className={styles.classBuffHead}>
          <span className={styles.classBuffName}>{t(card.nameKey)}</span>
        </div>
        {lines}
      </div>
    )
  }

  function renderColumn(col: WeaponColumnConfig) {
    return (
      <div className={styles.classBuffsColumn} key={col.weaponKey}>
        <div className={styles.classBuffsColumnHead}>{t(col.weaponKey)}</div>
        <div className={styles.classBuffsList}>{col.cards.map(renderCard)}</div>
      </div>
    )
  }

  return (
    <div>
      <div>
        <div className="toolbar">
          <span className="toolbar-label">{t("talents.statBuffs")}</span>
          <span className={styles.classBuffsNote}>{t("talents.alwaysOnClassTied")}</span>
        </div>

        {columns ? (
          <div
            className={styles.classBuffsColumns}
            style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
          >
            {columns.map(renderColumn)}
          </div>
        ) : (
          <>
            {talents.length === 0 && <div>{t("talents.noStatBuffsForThis")}</div>}

            {talents.length > 0 && (
              <div className={styles.classBuffsList}>
                {talents.map((row) => {
                  const current = talentCurrent(row, sources)
                  const capDisplay = RATE_SOURCES.has(row.scalesWith)
                    ? row.scaleMax * 100
                    : row.scaleMax
                  return (
                    <div key={row.id} className={styles.classBuffRow}>
                      <div className={styles.classBuffHead}>
                        <span className={styles.classBuffName}>{t(talentKey(row), row.name)}</span>
                        <span className={styles.classBuffEffect}>
                          {formatStatValue(row.stat, row.maxBonus)}{" "}
                          {t(TALENT_STAT_KEYS[row.stat], row.stat)}
                        </span>
                        <span className={styles.classBuffCurrent}>
                          {t("talents.current")}: {formatStatValue(row.stat, current)}
                        </span>
                      </div>
                      <div className={styles.classBuffNote}>
                        {t("talents.scalesWith")}: {t(SOURCE_KEYS[row.scalesWith])}
                        {row.scaleMax > 0 ? ` (${t("talents.cap")}: ${capDisplay})` : ""}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {classBuffs.length > 0 && (
              <div className={styles.classBuffs}>
                <div className="toolbar">
                  <span className="toolbar-label">{t("common.classBuffs")}</span>
                  <span className={styles.classBuffsNote}>{t("talents.alwaysOnClassTied")}</span>
                </div>
                <div className={styles.classBuffsList}>
                  {classBuffs.map((buff) => (
                    <div key={buff.id} className={styles.classBuffRow}>
                      <div className={styles.classBuffHead}>
                        <span className={styles.classBuffName}>
                          {t(buffKey(buff.id), buff.name)}
                        </span>
                        <span className={styles.classBuffEffect}>{buff.effect}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
