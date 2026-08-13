import { useMemo } from "react"
import type { Inputs, MartialArtsTalent, ScalingSource, TalentStat } from "../../../../engine/types"
import { alwaysActiveClassBuffs, type ClassBuffRow } from "../../../../engine/buffs/catalog"
import { useI18n } from "../../../../i18n/i18nContext"
import { buildScalingSources } from "../../../../definitions/baseStats"
import { withDerivedStats, equippedPiecesFor } from "../../../../engine/derivedInputs"
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

const STAT_LABEL: Record<TalentStat, string> = {
  minPhys: "Min Phys",
  maxPhys: "Max Phys",
  physPenetration: "Phys Penetration",
  minBellstrike: "Min Bellstrike",
  maxBellstrike: "Max Bellstrike",
  bellstrikePenetration: "Bellstrike Penetration",
  minStonesplit: "Min Stonesplit",
  maxStonesplit: "Max Stonesplit",
  stonesplitPenetration: "Stonesplit Penetration",
  minSilkbind: "Min Silkbind",
  maxSilkbind: "Max Silkbind",
  silkbindPenetration: "Silkbind Penetration",
  minBamboocut: "Min Bamboocut",
  maxBamboocut: "Max Bamboocut",
  bamboocutPenetration: "Bamboocut Penetration",
  precisionRate: "Precision Rate",
  critRate: "Crit Rate",
  affinityRate: "Affinity Rate",
  critDamage: "Crit Damage",
  affinityDamage: "Affinity Damage",
  attributeDamage: "Attribute Damage",
}

const SOURCE_LABEL: Record<ScalingSource, string> = {
  power: "Power",
  agility: "Agility",
  momentum: "Momentum",
  "phys.min": "Min Phys",
  "phys.max": "Max Phys",
  "phys.penetration": "Phys Penetration",
  "bellstrike.min": "Min Bellstrike",
  "bellstrike.max": "Max Bellstrike",
  "bellstrike.penetration": "Bellstrike Penetration",
  "stonesplit.min": "Min Stonesplit",
  "stonesplit.max": "Max Stonesplit",
  "stonesplit.penetration": "Stonesplit Penetration",
  "silkbind.min": "Min Silkbind",
  "silkbind.max": "Max Silkbind",
  "silkbind.penetration": "Silkbind Penetration",
  "bamboocut.min": "Min Bamboocut",
  "bamboocut.max": "Max Bamboocut",
  "bamboocut.penetration": "Bamboocut Penetration",
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
  | { kind: "talent"; skill: string; label?: string }
  | { kind: "talentFlatText"; skills: string[]; text: string }
  | { kind: "mechanic"; id: string; note?: string }
  | { kind: "static"; text: string; subNote?: string }

interface TalentCardConfig {
  name: string
  lines: TalentEffectLine[]
}

interface WeaponColumnConfig {
  weapon: string
  cards: TalentCardConfig[]
}

const CLASS_TALENT_COLUMNS: Record<string, WeaponColumnConfig[]> = {
  bellstrikeUmbra: [
    {
      weapon: "Strategic Sword",
      cards: [
        {
          name: "Affinity Rate UP",
          lines: [{ kind: "talent", skill: "Affinity Rate UP" }],
        },
        {
          name: "Bleed penetration Enhancement",
          lines: [
            {
              kind: "mechanic",
              id: "bellstrikeUmbraBleedPen",
              note: "Scales with Max Phys (full at 1500)",
            },
          ],
        },
        {
          name: "Bellstrike Attribute UP",
          lines: [
            {
              kind: "talentFlatText",
              skills: ["Sword Bellstrike Attack Min", "Sword Bellstrike Attack Max"],
              text: "+98 Min / +196 Max Bellstrike Attack (always)",
            },
            { kind: "talent", skill: "Bellstrike Penetration Scale" },
          ],
        },
        {
          name: "Attr. Attack DMG UP",
          lines: [
            {
              kind: "static",
              text: "Bellstrike Attack deals 50% bonus damage.",
              subNote:
                "Already applied in the damage formula (elevated attribute multiplier) — not a stat this tab contributes.",
            },
          ],
        },
      ],
    },
    {
      weapon: "Heavenquaker Spear",
      cards: [
        {
          name: "Physical Attack UP",
          lines: [{ kind: "talent", skill: "Physical Attack UP" }],
        },
        {
          name: "Damage Over Time",
          lines: [
            {
              kind: "mechanic",
              id: "bellstrikeUmbraBleedingDamage",
              note: "Affinity DMG 18% on 1500 Max Physical",
            },
          ],
        },
        {
          name: "Bellstrike Attribute UP",
          lines: [
            {
              kind: "talentFlatText",
              skills: ["Spear Bellstrike Attack Min", "Spear Bellstrike Attack Max"],
              text: "+98 Min / +196 Max Bellstrike Attack (always)",
            },
            { kind: "talent", skill: "Attribute Damage Scale", label: "Attribute Damage Boost" },
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
          {line.label && <span className={styles.classBuffName}>{t(line.label)}</span>}
          <span className={styles.classBuffEffect}>
            {formatStatValue(row.stat, row.maxBonus)} {t(STAT_LABEL[row.stat])}
          </span>
          <span className={styles.classBuffCurrent}>
            {t("Current")}: {formatStatValue(row.stat, current)}
          </span>
        </div>
        <div className={styles.classBuffAffects}>
          {t("Scales With")}: {t(SOURCE_LABEL[row.scalesWith])}
          {row.scaleMax > 0 ? ` (${t("Cap")}: ${capDisplay})` : ""}
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
          <span className={styles.classBuffEffect}>{t(line.text)}</span>
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
        <div className={styles.classBuffAffects}>
          {t("Affects")}: {buff.affects}
          {line.note ? ` · ${t(line.note)}` : ""}
        </div>
      </div>
    )
  }

  function renderStaticLine(line: Extract<TalentEffectLine, { kind: "static" }>) {
    return (
      <div className={styles.classBuffLine} key={`static:${line.text}`}>
        <div className={styles.classBuffHead}>
          <span className={styles.classBuffEffect}>{t(line.text)}</span>
        </div>
        {line.subNote && <div className={styles.classBuffAffects}>{t(line.subNote)}</div>}
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
      <div className={styles.classBuffRow} key={card.name}>
        <div className={styles.classBuffHead}>
          <span className={styles.classBuffName}>{t(card.name)}</span>
        </div>
        {lines}
      </div>
    )
  }

  function renderColumn(col: WeaponColumnConfig) {
    return (
      <div className={styles.classBuffsColumn} key={col.weapon}>
        <div className={styles.classBuffsColumnHead}>{t(col.weapon)}</div>
        <div className={styles.classBuffsList}>{col.cards.map(renderCard)}</div>
      </div>
    )
  }

  return (
    <div className="panel">
      <div>
        <div className="toolbar">
          <span className="toolbar-label">{t("Stat Buffs")}</span>
          <span className={styles.classBuffsNote}>{t("Always on (class-tied)")}</span>
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
            {talents.length === 0 && <div>{t("No stat buffs for this class yet.")}</div>}

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
                        <span className={styles.classBuffName}>{row.name}</span>
                        <span className={styles.classBuffEffect}>
                          {formatStatValue(row.stat, row.maxBonus)} {STAT_LABEL[row.stat]}
                        </span>
                        <span className={styles.classBuffCurrent}>
                          {t("Current")}: {formatStatValue(row.stat, current)}
                        </span>
                      </div>
                      <div className={styles.classBuffAffects}>
                        {t("Scales With")}: {SOURCE_LABEL[row.scalesWith]}
                        {row.scaleMax > 0 ? ` (${t("Cap")}: ${capDisplay})` : ""}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {classBuffs.length > 0 && (
              <div className={styles.classBuffs}>
                <div className="toolbar">
                  <span className="toolbar-label">{t("Class Buffs")}</span>
                  <span className={styles.classBuffsNote}>{t("Always on (class-tied)")}</span>
                </div>
                <div className={styles.classBuffsList}>
                  {classBuffs.map((buff) => (
                    <div key={buff.id} className={styles.classBuffRow}>
                      <div className={styles.classBuffHead}>
                        <span className={styles.classBuffName}>{t(buff.name)}</span>
                        <span className={styles.classBuffEffect}>{buff.effect}</span>
                      </div>
                      <div className={styles.classBuffAffects}>
                        {t("Affects")}: {buff.affects}
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
