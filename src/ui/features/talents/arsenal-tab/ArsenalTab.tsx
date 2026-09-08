import type { Inputs } from "../../../../engine/types"
import { arsenalHp, arsenalStates, unlockedArsenalStores } from "../../../../engine/panel"
import type { ArsenalStoreState } from "../../../../definitions/baseStats/arsenal"
import {
  arsenalScoreCap,
  arsenalStoreHp,
  defaultArsenalScores,
} from "../../../../definitions/baseStats"
import { ARSENAL_STORES } from "../../../../data/baseStats"
import type { ArsenalStore } from "../../../../definitions/baseStats/arsenalStoreDef"
import { useI18n } from "../../../../i18n/i18nContext"
import { useConfirm } from "../../../components/confirm-dialog/confirmContext"
import { NumInput } from "../../../components/number-inputs/NumberInputs"
import { ARSENAL_STORE_NAME_KEYS } from "../shared/arsenalStoreKeys"
import styles from "./ArsenalTab.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
}

type ArsenalStoreVariant = "graduated" | "belowMastery" | "current"

function variantOf(state: ArsenalStoreState): ArsenalStoreVariant {
  if (!state.isPast) return "current"
  return state.graduated ? "graduated" : "belowMastery"
}

function formulaText(def: ArsenalStore, state: ArsenalStoreState): string {
  if (state.graduated) return `= ${fmtNum(def.graduationPromotion)}`
  return `${fmtNum(def.ratioA)} + ${def.ratioB} × max(0, score − ${fmtNum(def.ratioC)})`
}

function fmtNum(value: number): string {
  return Number(value.toFixed(2)).toLocaleString("en-US")
}

export function ArsenalTab({ inputs, onChange }: Props) {
  const { t } = useI18n()
  const confirm = useConfirm()

  const states = arsenalStates(inputs.breakthrough, inputs.arsenalScores)
  const lockedCount = ARSENAL_STORES.length - unlockedArsenalStores(inputs.breakthrough).length
  const totalHp = arsenalHp(inputs.breakthrough, inputs.arsenalScores)

  const pastCount = states.filter((state) => state.isPast).length
  const currentState = states.find((state) => !state.isPast)
  const currentDef = currentState ? ARSENAL_STORES[currentState.store - 1] : undefined
  const overflowHp =
    currentState && currentDef ? arsenalStoreHp(currentState) - currentDef.ratioA : 0

  function setScore(store: number, raw: number, isPast: boolean) {
    const floored = Math.max(0, raw)
    const next = isPast ? Math.min(floored, arsenalScoreCap(store)) : floored
    onChange({ ...inputs, arsenalScores: { ...inputs.arsenalScores, [store]: next } })
  }

  async function resetAll() {
    if (!(await confirm(t("talents.arsenal.resetAllArsenalScoresToDefault")))) return
    onChange({ ...inputs, arsenalScores: defaultArsenalScores() })
  }

  return (
    <div>
      <div className="toolbar">
        <span className="toolbar-label">{t("common.arsenal")}</span>
        <button type="button" className="btn danger" onClick={resetAll}>
          {t("common.resetToDefault")}
        </button>
        <span className="spacer" />
        <span>
          {t("content.statLine.maxHp")} <b>{fmtNum(totalHp)}</b>
        </span>
      </div>

      <div className={`panel ${styles.summaryPanel}`}>
        <span>
          {t("talents.arsenal.pastArsenals")} <b>{pastCount}</b>
        </span>
        <span>
          {t("talents.arsenal.currentArsenal")}{" "}
          <b>{currentState ? t(ARSENAL_STORE_NAME_KEYS[currentState.store]) : t("common.none")}</b>
        </span>
        <span>
          {t("talents.arsenal.overflowHp")} <b>+{fmtNum(overflowHp)}</b>
        </span>
      </div>

      <div className={styles.storeGrid}>
        {states.map((state) => {
          const def = ARSENAL_STORES[state.store - 1]
          if (!def) return null
          const cap = arsenalScoreCap(state.store)
          const hp = arsenalStoreHp(state)
          const variant = variantOf(state)
          return (
            <div className={`panel ${styles.storeCard}`} key={state.store}>
              <div className={styles.storeHead}>
                <h2>{t(ARSENAL_STORE_NAME_KEYS[state.store])}</h2>
                <span className={`${styles.stateChip} ${styles[variant]}`}>
                  {variant === "current"
                    ? t("talents.current")
                    : variant === "graduated"
                      ? t("talents.arsenal.stateGraduated")
                      : t("talents.arsenal.stateBelowMastery")}
                </span>
              </div>
              <div className={styles.formula}>{formulaText(def, state)}</div>
              <div className={styles.scoreRow}>
                <label>{t("talents.arsenal.score")}</label>
                <NumInput
                  value={state.score}
                  onChange={(next) => setScore(state.store, next, state.isPast)}
                />
                <span className={styles.cap}>
                  / {fmtNum(cap)}
                  {state.isPast ? "" : " +"}
                </span>
              </div>
              <div className={styles.hpRow}>
                <span>{t("content.statLine.maxHp")}</span>
                <span>{fmtNum(hp)}</span>
              </div>
            </div>
          )
        })}
      </div>

      {lockedCount > 0 && (
        <div className="hint">
          {lockedCount} {t("talents.arsenal.moreUnlockLater")}
        </div>
      )}
    </div>
  )
}
