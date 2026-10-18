import { readFileSync } from "node:fs"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const SET_BONUSES = "src/ui/features/talents/arsenal-tab/ArsenalChoicePanel.module.scss"
const SCAN_CARD = "src/ui/features/gear/new-gear-piece-dialog/scan-card/ScanCard.module.scss"

function ruleBody(stylesheetPath: string, className: string): string {
  const source = readFileSync(join(process.cwd(), stylesheetPath), "utf8")
  const match = source.match(new RegExp(`(?:^|\\n)\\.${className}\\s*\\{([^}]*)\\}`))
  if (!match) throw new Error(`.${className} not found in ${stylesheetPath}`)
  return match[1]
}

describe("a visually hidden input stays inside its own scroll container", () => {
  it.each([
    [SET_BONUSES, "optionLabel"],
    [SCAN_CARD, "dropzone"],
    [SCAN_CARD, "scanAnotherButton"],
  ])("%s .%s is a positioned ancestor", (stylesheetPath, className) => {
    expect(ruleBody(stylesheetPath, className)).toMatch(/position:\s*relative/)
  })

  it.each([
    [SET_BONUSES, "radioInput"],
    [SCAN_CARD, "hiddenFileInput"],
  ])("%s .%s is pinned to its ancestor's corner", (stylesheetPath, className) => {
    const body = ruleBody(stylesheetPath, className)
    expect(body).toMatch(/top:\s*0/)
    expect(body).toMatch(/left:\s*0/)
  })
})
