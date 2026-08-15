import { useEffect, useRef, useState } from "react"
import styles from "./NumberInputs.module.scss"

interface NumProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number
  onChange: (next: number) => void
}

function NumberLikeInput({
  value,
  onChange,
  format,
  parse,
  className,
  ...rest
}: NumProps & { format: (v: number) => string; parse: (s: string) => number }) {
  const [text, setText] = useState(() => (Number.isFinite(value) ? format(value) : "0"))
  const focusedRef = useRef(false)

  useEffect(() => {
    if (!focusedRef.current) setText(Number.isFinite(value) ? format(value) : "0")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <input
      type="number"
      step="any"
      className={styles.numberInput + (className ? ` ${className}` : "")}
      value={text}
      onFocus={() => {
        focusedRef.current = true
      }}
      onChange={(e) => {
        const raw = e.target.value
        setText(raw)
        if (raw === "") return
        const n = parse(raw)
        if (Number.isFinite(n)) onChange(n)
      }}
      onBlur={() => {
        focusedRef.current = false
        const n = parse(text)
        if (text === "" || !Number.isFinite(n)) {
          setText("0")
          onChange(0)
        } else {
          setText(Number.isFinite(value) ? format(value) : "0")
        }
      }}
      {...rest}
    />
  )
}

// Display only — the stored value keeps its full precision until the user edits
// the field. Imported gear rolls carry many decimals (45.568999…), and the
// sub-0.01 branch is what stops a small coefficient from rendering as plain 0.
const numFormat = (v: number) =>
  String(v !== 0 && Math.abs(v) < 0.01 ? +v.toFixed(4) : +v.toFixed(2))
const numParse = (s: string) => Number(s)
const pctFormat = (v: number) => String(+(v * 100).toFixed(2))
const pctParse = (s: string) => Number(s) / 100

export function NumInput(props: NumProps) {
  return <NumberLikeInput {...props} format={numFormat} parse={numParse} />
}

export function PercentInput(props: NumProps) {
  return <NumberLikeInput {...props} format={pctFormat} parse={pctParse} />
}
