import { describe, it, expect } from "vitest"
import { render } from "@testing-library/react"
import { RotationTimelinePanel } from "../../src/ui/features/rotation/rotation-timeline-panel/RotationTimelinePanel"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import type { Result, SkillTickResult, TimelineEvent } from "../../src/engine/types"
import styles from "../../src/ui/features/rotation/rotation-timeline-panel/RotationTimelinePanel.module.scss"

function event(skillName: string, timeSec: number): TimelineEvent {
  return {
    frame: timeSec * 60,
    timeSec,
    skillName,
    type: "weapon",
    kind: "hit",
    damage: 100,
    inWindow: true,
  }
}

function skill(name: string, breakdownName: string): SkillTickResult {
  return { name, breakdownName, type: "weapon", count: 1, expectedDamage: 100, percentOfTotal: 1 }
}

function resultWith(perSkill: SkillTickResult[], timeline: TimelineEvent[]): Result {
  return {
    dps: 0,
    totalDamage: 0,
    rotationDuration: 12,
    graduationRate: null,
    perSkill,
    ranking: [],
    warnings: [],
    timeline,
  }
}

function lanes(result: Result) {
  const { container } = render(
    <I18nProvider>
      <RotationTimelinePanel result={result} />
    </I18nProvider>,
  )
  return [...container.querySelectorAll("." + styles.timelineLane)].map((lane) => ({
    label: lane.querySelector("." + styles.timelineLaneLabel)?.textContent,
    marks: lane.querySelectorAll("." + styles.timelineEvent).length,
  }))
}

describe("grouping timeline lanes by breakdown name", () => {
  it("puts every variant sharing one breakdown name into a single lane", () => {
    const rendered = lanes(
      resultWith(
        [skill("Skill 3-Hit", "In-Game Skill"), skill("Skill 4-Hit", "In-Game Skill")],
        [event("Skill 3-Hit", 0), event("Skill 4-Hit", 4), event("Skill 3-Hit", 8)],
      ),
    )

    expect(rendered).toEqual([{ label: "In-Game Skill", marks: 3 }])
  })

  it("keeps lanes apart when their breakdown names differ", () => {
    const rendered = lanes(
      resultWith(
        [skill("Sword Slash", "Sword"), skill("Spear Thrust", "Spear")],
        [event("Sword Slash", 0), event("Spear Thrust", 4)],
      ),
    )

    expect(rendered).toEqual([
      { label: "Sword", marks: 1 },
      { label: "Spear", marks: 1 },
    ])
  })

  it("falls back to the skill name when the breakdown name is blank", () => {
    const rendered = lanes(resultWith([skill("Unnamed Skill", "   ")], [event("Unnamed Skill", 0)]))

    expect(rendered).toEqual([{ label: "Unnamed Skill", marks: 1 }])
  })

  it("falls back to the skill name for an event no per-skill row covers", () => {
    const rendered = lanes(resultWith([], [event("Orphan Skill", 0)]))

    expect(rendered).toEqual([{ label: "Orphan Skill", marks: 1 }])
  })
})
