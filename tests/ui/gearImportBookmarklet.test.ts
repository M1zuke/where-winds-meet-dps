// The bookmarklet source is a .js file, so it sits outside tsc, ESLint and
// prettier. These assertions are that exemption's guard rail.
import { describe, expect, it } from "vitest"
import bookmarkletSource from "../../src/ui/features/gear/import-gear-dialog/gearImportBookmarklet.js?raw"
import {
  BOOKMARKLET_SCHEME,
  bookmarkletHref,
} from "../../src/ui/features/gear/import-gear-dialog/bookmarkletHref"

const CJK_FIRST = 0x4e00
const CJK_LAST = 0x9fff

describe("gear import bookmarklet source", () => {
  it("parses as browser-executable script", () => {
    expect(() => new Function(bookmarkletSource)).not.toThrow()
  })

  it("is self-contained", () => {
    expect(bookmarkletSource).not.toMatch(/^\s*(import|export)\b/m)
  })

  it("carries no Chinese", () => {
    const offending = [...bookmarkletSource].filter((character) => {
      const code = character.codePointAt(0) ?? 0
      return code >= CJK_FIRST && code <= CJK_LAST
    })
    expect(offending).toEqual([])
  })

  it("reads the cached payload before reaching for the token", () => {
    expect(bookmarkletSource.indexOf("getAreaServer")).toBeLessThan(
      bookmarkletSource.indexOf("h72na_data_token"),
    )
  })

  it("never copies the token or the role id", () => {
    const carried = /CARRIED_FIELDS = \[([^\]]*)\]/.exec(bookmarkletSource)
    expect(carried).not.toBeNull()
    expect(carried![1]).not.toMatch(/roleId|token/)
  })
})

describe("bookmarkletHref", () => {
  it("round-trips the source through the javascript: scheme", () => {
    const href = bookmarkletHref(bookmarkletSource)
    expect(href.startsWith(BOOKMARKLET_SCHEME)).toBe(true)
    expect(decodeURIComponent(href.slice(BOOKMARKLET_SCHEME.length))).toBe(bookmarkletSource)
  })

  it("escapes the characters that would truncate the URL", () => {
    const href = bookmarkletHref('var a = "#100%"')
    expect(href).not.toMatch(/#/)
    expect(href).toBe("javascript:var%20a%20%3D%20%22%23100%25%22")
  })
})
