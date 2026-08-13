import { describe, expect, it } from "vitest"
import { readdirSync } from "node:fs"
import { join } from "node:path"
import { APP_VERSION } from "../../src/appVersion"
import { CHANGELOG_ENTRIES } from "../../src/changelog/registry"
import type { ChangelogSectionLabel } from "../../src/changelog/types"

const ENTRIES_DIR = join(process.cwd(), "src/changelog/entries")
const CANONICAL_SECTION_ORDER: ChangelogSectionLabel[] = ["Added", "Changed", "Fixed"]

function versionSegments(version: string): number[] {
  return version.split(".").map(Number)
}

function compareVersions(left: string, right: string): number {
  const leftSegments = versionSegments(left)
  const rightSegments = versionSegments(right)
  const length = Math.max(leftSegments.length, rightSegments.length)
  for (let index = 0; index < length; index++) {
    const diff = (leftSegments[index] ?? 0) - (rightSegments[index] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function entryFilename(version: string): string {
  return `v${version.replace(/\./g, "-")}.ts`
}

describe("changelog registry shape", () => {
  it("names the newest entry after the app version", () => {
    expect(CHANGELOG_ENTRIES[0].version).toBe(APP_VERSION)
  })

  it("gives every entry a well-formed, unique, strictly descending version", () => {
    const versions = CHANGELOG_ENTRIES.map((entry) => entry.version)
    for (const version of versions) {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/)
    }
    expect(new Set(versions).size).toBe(versions.length)
    for (let index = 1; index < versions.length; index++) {
      expect(compareVersions(versions[index - 1], versions[index])).toBeGreaterThan(0)
    }
  })

  it("gives every entry a well-formed date, non-increasing from newest to oldest", () => {
    const dates = CHANGELOG_ENTRIES.map((entry) => entry.date)
    for (const date of dates) {
      expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    for (let index = 1; index < dates.length; index++) {
      expect(dates[index - 1] >= dates[index]).toBe(true)
    }
  })

  it("gives every entry a short headline with no trailing period", () => {
    for (const entry of CHANGELOG_ENTRIES) {
      expect(entry.headline.length).toBeGreaterThan(0)
      expect(entry.headline.length).toBeLessThanOrEqual(60)
      expect(entry.headline.endsWith(".")).toBe(false)
    }
  })

  it("has exactly one entry module per registry version, named after its version", () => {
    const expectedFilenames = new Set(
      CHANGELOG_ENTRIES.map((entry) => entryFilename(entry.version)),
    )
    const actualFilenames = new Set(readdirSync(ENTRIES_DIR))
    expect(actualFilenames).toEqual(expectedFilenames)
  })

  it("credits at least one author on every item", async () => {
    for (const entry of CHANGELOG_ENTRIES) {
      const details = await entry.loadDetails()
      for (const section of details.sections) {
        for (const item of section.items) {
          expect(item.authors.length).toBeGreaterThanOrEqual(1)
          for (const author of item.authors) {
            expect(author).toMatch(/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/)
          }
        }
      }
    }
  })

  it("loads sections in canonical order with well-formed items", async () => {
    for (const entry of CHANGELOG_ENTRIES) {
      const details = await entry.loadDetails()
      expect(details.sections.length).toBeGreaterThan(0)

      const labels = details.sections.map((section) => section.label)
      expect(new Set(labels).size).toBe(labels.length)
      const orderedIndices = labels.map((label) => CANONICAL_SECTION_ORDER.indexOf(label))
      const sortedIndices = [...orderedIndices].sort((left, right) => left - right)
      expect(orderedIndices).toEqual(sortedIndices)

      for (const section of details.sections) {
        expect(section.items.length).toBeGreaterThanOrEqual(1)
        expect(section.items.length).toBeLessThanOrEqual(25)
        for (const item of section.items) {
          expect(item.text.length).toBeGreaterThan(0)
          expect(item.text.length).toBeLessThanOrEqual(120)
          expect(item.text.toLowerCase().startsWith(`${section.label.toLowerCase()}:`)).toBe(false)
        }
      }
    }
  })
})
