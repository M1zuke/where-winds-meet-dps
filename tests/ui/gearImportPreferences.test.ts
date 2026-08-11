import { beforeEach, describe, expect, it } from "vitest"
import {
  DEFAULT_KEEP_DISPLACED,
  loadKeepDisplaced,
  saveKeepDisplaced,
} from "../../src/ui/features/gear/import-gear-dialog/importPreferences"

describe("gear import preferences", () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it("defaults to removing the pieces an import replaces", () => {
    expect(DEFAULT_KEEP_DISPLACED).toBe(false)
    expect(loadKeepDisplaced()).toBe(false)
  })

  it("round-trips either choice", () => {
    saveKeepDisplaced(true)
    expect(loadKeepDisplaced()).toBe(true)
    saveKeepDisplaced(false)
    expect(loadKeepDisplaced()).toBe(false)
  })

  it("falls back to the default when the stored value is not a boolean", () => {
    localStorage.setItem("wwm.gearImportKeepDisplaced", "maybe")
    expect(loadKeepDisplaced()).toBe(DEFAULT_KEEP_DISPLACED)
  })
})
