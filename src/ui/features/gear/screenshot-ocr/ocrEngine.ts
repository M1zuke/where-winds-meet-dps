import type { Worker as TesseractWorker } from "tesseract.js"
import {
  filterGearPanel,
  filterHeaderBar,
  findHeaderBar,
  type RgbaImage,
} from "./gearScreenshotFilters"

const WORKER_PATH = "/ocr/worker.min.js"
const CORE_PATH = "/ocr/core"
const LANG_PATH = "/ocr/lang"

export const CHAR_WHITELIST =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-.%[]·&/ "

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

export interface PreprocessedGearScreenshot {
  panel: HTMLCanvasElement
  headerBar: HTMLCanvasElement | null
}

function toCanvas(image: RgbaImage): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = image.width
  canvas.height = image.height
  const context = canvas.getContext("2d")
  if (!context) return canvas
  const imageData = context.createImageData(image.width, image.height)
  imageData.data.set(image.data)
  context.putImageData(imageData, 0, 0)
  return canvas
}

export function preprocessGearScreenshot(bitmap: ImageBitmap): PreprocessedGearScreenshot {
  const source = document.createElement("canvas")
  source.width = bitmap.width
  source.height = bitmap.height
  const sourceContext = source.getContext("2d")
  if (!sourceContext) return { panel: source, headerBar: null }
  sourceContext.drawImage(bitmap, 0, 0)

  const { data, width, height } = sourceContext.getImageData(0, 0, source.width, source.height)
  const pixels: RgbaImage = { data, width, height }
  const bar = findHeaderBar(pixels)
  return {
    panel: toCanvas(filterGearPanel(pixels)),
    headerBar: bar ? toCanvas(filterHeaderBar(pixels, bar)) : null,
  }
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
