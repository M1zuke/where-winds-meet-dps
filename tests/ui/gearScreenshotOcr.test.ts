// @vitest-environment node
import { readFileSync } from "node:fs"
import { createRequire } from "node:module"
import { dirname, join } from "node:path"
import { createWorker, type Worker } from "tesseract.js"
import { decode, encode } from "fast-png"
import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import type { Inputs } from "../../src/engine/types"
import {
  filterGearPanel,
  filterHeaderBar,
  findHeaderBar,
  type RgbaImage,
} from "../../src/ui/features/gear/screenshot-ocr/gearScreenshotFilters"
import { CHAR_WHITELIST } from "../../src/ui/features/gear/screenshot-ocr/ocrEngine"
import { parseGearScreenshot } from "../../src/ui/features/gear/screenshot-ocr/ocrGearPiece"

const inputs: Inputs = { ...defaultInputs, classId: "bellstrikeUmbra" }
const SCANNED_ARMOR = join(import.meta.dirname, "gearScreenshots", "fathomlessArmor.png")
const EXAMPLE_SCREENSHOT = join(
  import.meta.dirname,
  "../../src/ui/features/gear/new-gear-piece-dialog/screenshotExample.png",
)
const LANG_PATH = join(
  dirname(createRequire(import.meta.url).resolve("@tesseract.js-data/eng/package.json")),
  "4.0.0",
)

let worker: Worker

beforeAll(async () => {
  worker = await createWorker("eng", 1, { langPath: LANG_PATH, cacheMethod: "none" })
  await worker.setParameters({ tessedit_char_whitelist: CHAR_WHITELIST })
}, 30000)

afterAll(async () => {
  await worker.terminate()
})

function loadRgba(path: string): RgbaImage {
  const png = decode(readFileSync(path))
  const pixelCount = png.width * png.height
  const data = new Uint8ClampedArray(pixelCount * 4)
  for (let pixel = 0; pixel < pixelCount; pixel += 1) {
    for (let channel = 0; channel < 4; channel += 1) {
      data[pixel * 4 + channel] =
        channel < png.channels ? png.data[pixel * png.channels + channel]! : 255
    }
  }
  return { data, width: png.width, height: png.height }
}

function encodePng(image: RgbaImage): Buffer {
  return Buffer.from(
    encode({ width: image.width, height: image.height, data: image.data, channels: 4, depth: 8 }),
  )
}

async function scan(path: string, fallbackSlot: "helm" | "leftWeapon") {
  const image = loadRgba(path)
  const panelText = (await worker.recognize(encodePng(filterGearPanel(image)))).data.text
  const bar = findHeaderBar(image)
  const headerBarText = bar
    ? (await worker.recognize(encodePng(filterHeaderBar(image, bar)))).data.text
    : ""
  return parseGearScreenshot(panelText, inputs, fallbackSlot, headerBarText)
}

describe("gear screenshot OCR", () => {
  it("reads tier 100 off the header bar of a scanned armor piece", async () => {
    const { piece, fields } = await scan(SCANNED_ARMOR, "helm")

    expect(piece.level).toBe(100)
    expect(fields.level).toBe("read")
  }, 30000)

  it("still resolves every stat row of a scanned armor piece", async () => {
    const { piece } = await scan(SCANNED_ARMOR, "helm")

    expect(piece.slot).toBe("armor")
    expect(piece.words.map((word) => word.word)).toEqual([
      "affinity",
      "allMysticBoost",
      "momentum",
      "crit",
      "maxPhys",
    ])
    expect(piece.words[3]!.retuned).toBe(true)
    expect(piece.attunement).toBe("bleedingDamage")
  }, 30000)

  it("reads relaying and tier 96 off the header bar of the in-app example screenshot", async () => {
    const { piece, fields } = await scan(EXAMPLE_SCREENSHOT, "leftWeapon")

    expect(piece.level).toBe(96)
    expect(fields.level).toBe("read")
    expect(piece.relayed).toBe(true)
  }, 30000)

  it("finds no header bar on a uniformly dark image", () => {
    const width = 40
    const height = 20
    const data = new Uint8ClampedArray(width * height * 4)
    for (let offset = 3; offset < data.length; offset += 4) data[offset] = 255

    expect(findHeaderBar({ data, width, height })).toBeNull()
  })
})
