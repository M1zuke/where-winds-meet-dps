import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { RotationTimelinePanel } from "../../src/ui/features/rotation/rotation-timeline-panel/RotationTimelinePanel"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import type { Result } from "../../src/engine/types"
import styles from "../../src/ui/features/rotation/rotation-timeline-panel/RotationTimelinePanel.module.scss"

const result: Result = {
  dps: 0,
  totalDamage: 0,
  rotationDuration: 12,
  graduationRate: null,
  perSkill: [],
  ranking: [],
  warnings: [],
  timeline: [
    {
      frame: 0,
      timeSec: 0,
      skillName: "Test Skill",
      type: "weapon",
      kind: "hit",
      damage: 100,
      inWindow: true,
    },
    {
      frame: 720,
      timeSec: 12,
      skillName: "Test Skill",
      type: "weapon",
      kind: "hit",
      damage: 100,
      inWindow: true,
    },
  ],
}

describe("RotationTimelinePanel axis", () => {
  it("renders five ticks with the expected labels and end-anchor classes", () => {
    const { container } = render(
      <I18nProvider>
        <RotationTimelinePanel result={result} />
      </I18nProvider>,
    )

    const ticks = container.querySelectorAll("." + styles.timelineAxisTick)
    expect(ticks).toHaveLength(5)
    expect([...ticks].map((tick) => tick.textContent)).toEqual([
      "0.0s",
      "3.0s",
      "6.0s",
      "9.0s",
      "12.0s",
    ])

    const first = ticks[0]
    const last = ticks[4]

    expect(first.classList.contains(styles.alignStart)).toBe(true)
    expect(first.classList.contains(styles.alignEnd)).toBe(false)

    expect(last.classList.contains(styles.alignEnd)).toBe(true)
    expect(last.classList.contains(styles.alignStart)).toBe(false)

    for (const middle of [ticks[1], ticks[2], ticks[3]]) {
      expect(middle.classList.contains(styles.alignStart)).toBe(false)
      expect(middle.classList.contains(styles.alignEnd)).toBe(false)
    }

    expect((first as HTMLElement).style.left).toBe("0%")
    expect((last as HTMLElement).style.left).toBe("100%")
  })
})
