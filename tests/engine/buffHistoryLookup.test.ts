import { describe, expect, it } from "vitest"
import { buffEngineWith } from "../helpers/qiBars"

describe("buff history lookup", () => {
  it("reads the latest apply by timestamp even when a later-stamped entry was recorded first", () => {
    const buffs = buffEngineWith({ classId: "bamboocutDraught" }, [], [])
    buffs.applyBuff("probe", 10, 5)
    buffs.applyBuff("probe", 2, 5)

    expect(buffs.isBuffActiveAtTime("probe", 12)).toBe(true)
    expect(buffs.isBuffActiveAtTime("probe", 6)).toBe(true)
    expect(buffs.isBuffActiveAtTime("probe", 8)).toBe(false)
    expect(buffs.isBuffActiveAtTime("other", 12)).toBe(false)
  })
})
