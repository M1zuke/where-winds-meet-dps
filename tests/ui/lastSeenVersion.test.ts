import { beforeEach, describe, expect, it } from "vitest"
import {
  isNewerVersion,
  loadLastSeenVersion,
  saveLastSeenVersion,
} from "../../src/ui/layout/changelog-button/lastSeenVersion"

describe("last-seen-version store", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("round-trips a version under the exact wwm.lastSeenVersion key", () => {
    saveLastSeenVersion("0.1.14")
    expect(localStorage.getItem("wwm.lastSeenVersion")).toBe("0.1.14")
    expect(loadLastSeenVersion()).toBe("0.1.14")
  })

  it("leaves wwm.profiles untouched when writing", () => {
    localStorage.setItem("wwm.profiles", "untouched")
    saveLastSeenVersion("0.1.14")
    expect(localStorage.getItem("wwm.profiles")).toBe("untouched")
  })

  it("treats nothing stored as unseen", () => {
    expect(loadLastSeenVersion()).toBeNull()
    expect(isNewerVersion("0.1.14", null)).toBe(true)
  })

  it("treats an older stored version as unseen and the same version as seen", () => {
    expect(isNewerVersion("0.1.14", "0.1.13")).toBe(true)
    expect(isNewerVersion("0.1.14", "0.1.14")).toBe(false)
  })

  it("treats a newer stored version (a downgrade) as seen", () => {
    expect(isNewerVersion("0.1.14", "0.1.15")).toBe(false)
  })

  it("compares segments numerically, not lexicographically", () => {
    expect(isNewerVersion("0.1.10", "0.1.9")).toBe(true)
    expect(isNewerVersion("0.1.9", "0.1.10")).toBe(false)
  })

  it("never throws on unparsable stored values, and treats them as unseen", () => {
    for (const garbage of ["", "abc", "0.x.1"]) {
      expect(() => isNewerVersion("0.1.14", garbage)).not.toThrow()
      expect(isNewerVersion("0.1.14", garbage)).toBe(true)
    }
  })
})
