import styles from "./BuildSummary.module.scss"

export interface BuildSummaryItem {
  label: string
  value: string
}

export function BuildSummary({ items }: { items: readonly BuildSummaryItem[] }) {
  return (
    <div className={styles.buildSummary}>
      {items.map((item) => (
        <SummaryItem key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.summaryItem}>
      <span className={styles.summaryLabel}>{label}</span>
      <span className={styles.summaryValue}>{value}</span>
    </div>
  )
}
