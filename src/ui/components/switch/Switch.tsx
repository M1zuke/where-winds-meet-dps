import styles from "./Switch.module.scss"

export function Switch({
  checked,
  label,
  onChange,
}: {
  checked: boolean
  label: string
  onChange: (next: boolean) => void
}) {
  return (
    <label className={styles.switch}>
      <span className={styles.label + (checked ? ` ${styles.on}` : "")}>{label}</span>
      <input
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.knob} />
      </span>
    </label>
  )
}
