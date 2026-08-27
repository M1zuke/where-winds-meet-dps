import type { Worker as TesseractWorker } from "tesseract.js"

const WORKER_PATH = "/ocr/worker.min.js"
const CORE_PATH = "/ocr/core"
const LANG_PATH = "/ocr/lang"

const CHAR_WHITELIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-.%[]·&/ "

// Inverted (the panel is light-on-dark, tesseract wants dark-on-light) and
// contrast-pushed — measured to make the italic value digits legible. CONTRAST
// is on the -255..255 scale of the standard
// `factor = (259*(c+255))/(255*(259-c))` formula.
const CONTRAST = 71
const BRIGHTNESS = 5
const UPSCALE = 2

let workerPromise: Promise<TesseractWorker> | null = null
let currentProgressHandler: ((progress: number) => void) | null = null
let recognitionQueue: Promise<unknown> = Promise.resolve()

async function getWorker(): Promise<TesseractWorker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import("tesseract.js")
      const worker = await createWorker("eng", 1, {
        workerPath: WORKER_PATH,
        corePath: CORE_PATH,
        langPath: LANG_PATH,
        logger: (message) => {
          if (message.status === "recognizing text") currentProgressHandler?.(message.progress)
        },
      })
      await worker.setParameters({ tessedit_char_whitelist: CHAR_WHITELIST })
      return worker
    })()
  }
  return workerPromise
}

export async function terminateOcrWorker(): Promise<void> {
  if (!workerPromise) return
  const pending = workerPromise
  workerPromise = null
  const worker = await pending
  await worker.terminate()
}

export async function decodeGearScreenshot(source: File | Blob): Promise<ImageBitmap> {
  return createImageBitmap(source)
}

export function preprocessGearScreenshot(bitmap: ImageBitmap): HTMLCanvasElement {
  const source = document.createElement("canvas")
  source.width = bitmap.width
  source.height = bitmap.height
  const sourceContext = source.getContext("2d")
  if (!sourceContext) return source
  sourceContext.drawImage(bitmap, 0, 0)

  const imageData = sourceContext.getImageData(0, 0, source.width, source.height)
  const pixels = imageData.data
  const factor = (259 * (CONTRAST + 255)) / (255 * (259 - CONTRAST))
  for (let index = 0; index < pixels.length; index += 4) {
    const inverted = [255 - pixels[index]!, 255 - pixels[index + 1]!, 255 - pixels[index + 2]!]
    const grey = 0.299 * inverted[0]! + 0.587 * inverted[1]! + 0.114 * inverted[2]!
    const adjusted = Math.min(255, Math.max(0, factor * (grey - 128) + 128 + BRIGHTNESS))
    pixels[index] = adjusted
    pixels[index + 1] = adjusted
    pixels[index + 2] = adjusted
  }
  sourceContext.putImageData(imageData, 0, 0)

  // Upscale AFTER tone-mapping, with smoothing off: a smoothed upscale done
  // first blurs glyph edges, and contrast then amplifies the blurred midtones
  // instead of the hard edges tesseract needs — measured to read digits worse
  // (an extra spurious digit, more junk lines) on the sample screenshots.
  const canvas = document.createElement("canvas")
  canvas.width = source.width * UPSCALE
  canvas.height = source.height * UPSCALE
  const context = canvas.getContext("2d")
  if (!context) return canvas
  context.imageSmoothingEnabled = false
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

export async function recognizeGearScreenshot(
  image: HTMLCanvasElement,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const recognition = recognitionQueue.then(async () => {
    const worker = await getWorker()
    currentProgressHandler = onProgress ?? null
    try {
      const {
        data: { text },
      } = await worker.recognize(image)
      return text
    } finally {
      currentProgressHandler = null
    }
  })
  recognitionQueue = recognition.catch(() => undefined)
  return recognition
}
