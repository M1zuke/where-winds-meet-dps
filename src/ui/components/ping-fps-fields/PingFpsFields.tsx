import { useEffect, useRef, useState } from "react"
import { useI18n } from "../../../i18n/i18nContext"
import styles from "./PingFpsFields.module.scss"

interface NullableNumberInputProps {
  value: number | null
  onChange: (next: number | null) => void
  parse: (raw: string) => number
  disabled?: boolean
}

function NullableNumberInput({ value, onChange, parse, disabled }: NullableNumberInputProps) {
  const [text, setText] = useState(() => (value === null ? "" : String(value)))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) setText(value === null ? "" : String(value))
  }, [value])

  return (
    <input
      type="number"
      step="any"
      className={styles.numberInput}
      value={text}
      disabled={disabled}
      onFocus={() => {
        focusedRef.current = true
      }}
      onChange={(event) => {
        const raw = event.target.value
        setText(raw)
        if (raw === "") {
          onChange(null)
          return
        }
        const parsed = parse(raw)
        if (Number.isFinite(parsed)) onChange(parsed)
      }}
      onBlur={() => {
        focusedRef.current = false
      }}
    />
  )
}

interface Props {
  pingMs: number | null
  averageFps: number | null
  serverProcessingMs: number | null
  onPingMsChange: (next: number | null) => void
  onAverageFpsChange: (next: number | null) => void
  onServerProcessingMsChange: (next: number | null) => void
  disabled?: boolean
}

export function PingFpsFields({
  pingMs,
  averageFps,
  serverProcessingMs,
  onPingMsChange,
  onAverageFpsChange,
  onServerProcessingMsChange,
  disabled,
}: Props) {
  const { t } = useI18n()
  return (
    <div className={styles.fields}>
      <label className={styles.field}>
        {t("common.pingMs")}
        <NullableNumberInput
          value={pingMs}
          onChange={onPingMsChange}
          parse={(raw) => Math.round(Number(raw))}
          disabled={disabled}
        />
      </label>
      <label className={styles.field}>
        {t("common.averageFps")}
        <NullableNumberInput
          value={averageFps}
          onChange={onAverageFpsChange}
          parse={Number}
          disabled={disabled}
        />
      </label>
      <label className={styles.field}>
        {t("common.serverProcessingMs")}
        <NullableNumberInput
          value={serverProcessingMs}
          onChange={onServerProcessingMsChange}
          parse={Number}
          disabled={disabled}
        />
      </label>
    </div>
  )
}
