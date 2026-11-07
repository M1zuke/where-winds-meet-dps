// v80 → v81 — a skill now starts in the input's own frame unless it is marked
// as waiting for the server. The marks "noWaitOnDummy" and "none" are gone
// (their behaviour is the new default), and an absent mark used to mean the
// round-trip wait: the skills that still wait for it (Perfect Dodge, its full
// form and SnowpartingSlide with its pre-pull forms) get the mark written on
// a Skill Editor copy that lacks it.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

type RecordValue = Record<string, unknown>

const SERVER_WAITING_ID_SUFFIXES: readonly string[] = [
  "-perfect-dodge",
  "-perfect-dodge-full",
  "-snowpartingslide",
  "-snowpartingslide-prepull",
  "-snowpartingslide-prepull-hit",
]

const REMOVED_MARKS: ReadonlySet<unknown> = new Set(["noWaitOnDummy", "none"])

const isRecord = (value: unknown): value is RecordValue =>
  !!value && typeof value === "object" && !Array.isArray(value)

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  if (REMOVED_MARKS.has(skill.startLatency)) {
    const { startLatency: _removedMark, ...rest } = skill
    void _removedMark
    return rest
  }
  const waitsForServer = SERVER_WAITING_ID_SUFFIXES.some((suffix) =>
    (skill.id as string).endsWith(suffix),
  )
  return waitsForServer && skill.startLatency === undefined
    ? { ...skill, startLatency: "serverRoundTrip" }
    : skill
}

export const V81__startWithoutServerWait: CustomSkillMigration = {
  to: 81,
  name: "V81__startWithoutServerWait",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 81, skills }
  },
}
