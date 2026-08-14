import type { Arsenal, Inputs } from "../../../../engine/types"
import { ARSENAL_BONUS, swapArsenal } from "../../../../engine/panel"
import { useI18n } from "../../../../i18n/i18nContext"
import { OptionTile } from "../../../components/option-tile/OptionTile"
import { deltaTone } from "../../../components/option-tile/optionTileTone"
import optionTiles from "../../../components/option-tile/OptionTile.module.scss"

interface Props {
  inputs: Inputs
  onChange: (next: Inputs) => void
  arsenalDpsByChoice?: Record<string, number>
  isPending?: boolean
}

interface ArsenalTile {
  choice: Arsenal
  label: string
  statKey: string
}

const ARSENAL_TILES: ArsenalTile[] = [
  { choice: "general", label: "General Arsenal", statKey: "Phys" },
  { choice: "bellstrike", label: "Bellstrike Arsenal", statKey: "Bellstrike" },
  { choice: "stonesplit", label: "Stonesplit Arsenal", statKey: "Stonesplit" },
  { choice: "silkbind", label: "Silkbind Arsenal", statKey: "Silkbind" },
  { choice: "bamboocut", label: "Bamboocut Arsenal", statKey: "Bamboocut" },
]

const fmtDelta = (delta: number) => {
  if (!Number.isFinite(delta)) return "—"
  const sign = delta > 0 ? "+" : ""
  return `${sign}${delta.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function ArsenalPanel({ inputs, onChange, arsenalDpsByChoice, isPending }: Props) {
  const { t } = useI18n()

  const currentDps = arsenalDpsByChoice?.[inputs.arsenal] ?? Number.NaN

  return (
    <div
      className={`${optionTiles.tileGrid} ${optionTiles.cols3}`}
      style={{ opacity: isPending ? 0.6 : 1 }}
    >
      {ARSENAL_TILES.map((tile) => {
        const dps = arsenalDpsByChoice?.[tile.choice] ?? Number.NaN
        const delta = dps - currentDps
        const selected = inputs.arsenal === tile.choice
        return (
          <OptionTile
            key={tile.choice}
            label={t(tile.label)}
            note={`+${ARSENAL_BONUS.min} / +${ARSENAL_BONUS.max} ${tile.statKey}`}
            detail={selected ? t("Active") : fmtDelta(delta)}
            tone={selected ? "current" : deltaTone(delta)}
            selected={selected}
            onClick={() => onChange(swapArsenal(inputs, tile.choice))}
          />
        )
      })}
    </div>
  )
}
