import { describe, expect, it } from "vitest"
import {
  AFFIX_MAPPINGS_FILE_VERSION,
  exportAffixChoices,
  parseAffixChoicesFile,
} from "../../src/ui/features/gear/import-gear-dialog/affixChoiceStore"

const choices = { "9793120": "word:Affinity", "280701": "attunement:physPen" }

describe("exportAffixChoices", () => {
  it("writes a versioned envelope around the mappings", () => {
    const parsed = JSON.parse(exportAffixChoices(choices))
    expect(parsed.source).toBe("wwm-gear-affix-mappings")
    expect(parsed.v).toBe(AFFIX_MAPPINGS_FILE_VERSION)
    expect(parsed.mappings).toEqual(choices)
  })

  it("sorts keys so two exports diff cleanly", () => {
    const written = exportAffixChoices(choices)
    expect(written.indexOf('"280701"')).toBeLessThan(written.indexOf('"9793120"'))
  })

  it("round-trips through the parser", () => {
    expect(parseAffixChoicesFile(exportAffixChoices(choices))).toEqual(choices)
  })

  it("stays human-editable — indented and newline-terminated", () => {
    const written = exportAffixChoices(choices)
    expect(written).toContain("\n  ")
    expect(written.endsWith("\n")).toBe(true)
  })
})

describe("parseAffixChoicesFile", () => {
  it("accepts a bare affix-id record so the shipped table can be pasted back", () => {
    expect(parseAffixChoicesFile('{"9793119":"word:Crit"}')).toEqual({ "9793119": "word:Crit" })
  })

  it("drops non-string values instead of failing the whole file", () => {
    expect(parseAffixChoicesFile('{"9793119":"word:Crit","9793120":42}')).toEqual({
      "9793119": "word:Crit",
    })
  })

  it("rejects non-JSON", () => {
    expect(() => parseAffixChoicesFile("nope")).toThrow(/not valid JSON/)
  })

  it("rejects another tool's file", () => {
    expect(() => parseAffixChoicesFile('{"source":"something-else","mappings":{}}')).toThrow(
      /not a stat-line mapping export/,
    )
  })

  it("rejects a newer file version", () => {
    expect(() =>
      parseAffixChoicesFile(
        JSON.stringify({ source: "wwm-gear-affix-mappings", v: 99, mappings: choices }),
      ),
    ).toThrow(/newer version \(v99\)/)
  })

  it("rejects a file with no mappings", () => {
    expect(() => parseAffixChoicesFile("{}")).toThrow(/no stat-line mappings/)
  })

  it("rejects an array", () => {
    expect(() => parseAffixChoicesFile("[]")).toThrow(/does not hold stat-line mappings/)
  })
})
