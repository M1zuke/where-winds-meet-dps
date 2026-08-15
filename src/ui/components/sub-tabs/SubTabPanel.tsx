import type { ReactNode } from "react"
import styles from "./SubTabPanel.module.scss"

export function SubTabPanel({ children }: { children: ReactNode }) {
  return (
    <div className={styles.subtabPanel} role="tabpanel">
      {children}
    </div>
  )
}
