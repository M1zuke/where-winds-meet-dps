export interface RgbaImage {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface HeaderBar {
  top: number
  height: number
  left: number
}

// On the -255..255 scale of the standard `factor = (259*(c+255))/(255*(259-c))` formula.
const CONTRAST = 71
const BRIGHTNESS = 5
const UPSCALE = 2

const HEADER_BACKGROUND_GREY = 140
const HEADER_MIN_RUN_FRACTION = 0.05
const HEADER_MIN_HEIGHT_TO_RUN = 0.1
const HEADER_MIN_BRIGHT_COLUMN_FRACTION = 0.4

const CONTRAST_FACTOR = (259 * (CONTRAST + 255)) / (255 * (259 - CONTRAST))

interface Run {
  start: number
  length: number
}

function greyAt(image: RgbaImage, column: number, row: number): number {
  const offset = (row * image.width + column) * 4
  return (
    0.299 * image.data[offset]! + 0.587 * image.data[offset + 1]! + 0.114 * image.data[offset + 2]!
  )
}

function toneMap(grey: number): number {
  return Math.min(255, Math.max(0, CONTRAST_FACTOR * (grey - 128) + 128 + BRIGHTNESS))
}

function upscaleNearest(image: RgbaImage): RgbaImage {
  const width = image.width * UPSCALE
  const height = image.height * UPSCALE
  const data = new Uint8ClampedArray(width * height * 4)
  for (let row = 0; row < height; row += 1) {
    const sourceRow = Math.floor(row / UPSCALE)
    for (let column = 0; column < width; column += 1) {
      const sourceOffset = (sourceRow * image.width + Math.floor(column / UPSCALE)) * 4
      data.set(image.data.subarray(sourceOffset, sourceOffset + 4), (row * width + column) * 4)
    }
  }
  return { data, width, height }
}

function longestRun(length: number, isBright: (index: number) => boolean): Run {
  let longest: Run = { start: 0, length: 0 }
  let start = -1
  for (let index = 0; index <= length; index += 1) {
    const bright = index < length && isBright(index)
    if (bright && start < 0) start = index
    if (!bright && start >= 0) {
      if (index - start > longest.length) longest = { start, length: index - start }
      start = -1
    }
  }
  return longest
}

function brightestGreyInColumn(image: RgbaImage, column: number, bar: HeaderBar): number {
  let brightest = 1
  for (let row = 0; row < bar.height; row += 1) {
    brightest = Math.max(brightest, greyAt(image, column, bar.top + row))
  }
  return brightest
}

function barLeft(image: RgbaImage, top: number, height: number): number {
  const brightColumns = longestRun(image.width, (column) => {
    let brightRows = 0
    for (let row = top; row < top + height; row += 1) {
      if (greyAt(image, column, row) >= HEADER_BACKGROUND_GREY) brightRows += 1
    }
    return brightRows >= height * HEADER_MIN_BRIGHT_COLUMN_FRACTION
  })
  return brightColumns.start
}

export function filterGearPanel(image: RgbaImage): RgbaImage {
  const data = new Uint8ClampedArray(image.data)
  for (let row = 0; row < image.height; row += 1) {
    for (let column = 0; column < image.width; column += 1) {
      const offset = (row * image.width + column) * 4
      const value = toneMap(255 - greyAt(image, column, row))
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
    }
  }
  return upscaleNearest({ data, width: image.width, height: image.height })
}

export function findHeaderBar(image: RgbaImage): HeaderBar | null {
  const minimumRun = image.width * HEADER_MIN_RUN_FRACTION
  let bandTop = -1
  let widestRun = 0
  for (let row = 0; row <= image.height; row += 1) {
    const run =
      row < image.height
        ? longestRun(image.width, (column) => greyAt(image, column, row) >= HEADER_BACKGROUND_GREY)
            .length
        : 0
    if (run >= minimumRun) {
      if (bandTop < 0) {
        bandTop = row
        widestRun = 0
      }
      widestRun = Math.max(widestRun, run)
      continue
    }
    if (bandTop < 0) continue
    const height = row - bandTop
    if (height >= widestRun * HEADER_MIN_HEIGHT_TO_RUN) {
      return { top: bandTop, height, left: barLeft(image, bandTop, height) }
    }
    bandTop = -1
  }
  return null
}

export function filterHeaderBar(image: RgbaImage, bar: HeaderBar): RgbaImage {
  const width = image.width - bar.left
  const data = new Uint8ClampedArray(width * bar.height * 4)
  for (let column = 0; column < width; column += 1) {
    const brightest = brightestGreyInColumn(image, bar.left + column, bar)
    for (let row = 0; row < bar.height; row += 1) {
      const offset = (row * width + column) * 4
      const value = toneMap((greyAt(image, bar.left + column, bar.top + row) / brightest) * 255)
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = 255
    }
  }
  return upscaleNearest({ data, width, height: bar.height })
}
