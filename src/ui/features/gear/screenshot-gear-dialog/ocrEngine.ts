import type { Worker as TesseractWorker } from "tesseract.js"

const WORKER_PATH = "/ocr/worker.min.js"
const CORE_PATH = "/ocr/core"
const LANG_PATH = "/ocr/lang"

const CHAR_WHITELIST = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-.%[]·&/ "

const UPSCALE_FACTOR = 2
const CONTRAST_AMPLIFICATION = 1.6

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

export function preprocessGearScreenshot(source: ImageBitmap): HTMLCanvasElement {
  const canvas = document.createElement("canvas")
  canvas.width = source.width * UPSCALE_FACTOR
  canvas.height = source.height * UPSCALE_FACTOR

  const context = canvas.getContext("2d")
  if (!context) return canvas
  context.imageSmoothingEnabled = true
  context.drawImage(source, 0, 0, canvas.width, canvas.height)

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data

  let minIntensity = 255
  let maxIntensity = 0
  for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex += 4) {
    const intensity =
      0.299 * pixels[pixelIndex]! +
      0.587 * pixels[pixelIndex + 1]! +
      0.114 * pixels[pixelIndex + 2]!
    pixels[pixelIndex] = intensity
    pixels[pixelIndex + 1] = intensity
    pixels[pixelIndex + 2] = intensity
    if (intensity < minIntensity) minIntensity = intensity
    if (intensity > maxIntensity) maxIntensity = intensity
  }

  const range = Math.max(maxIntensity - minIntensity, 1)
  for (let pixelIndex = 0; pixelIndex < pixels.length; pixelIndex += 4) {
    const normalized = (pixels[pixelIndex]! - minIntensity) / range
    const amplified = (normalized - 0.5) * CONTRAST_AMPLIFICATION + 0.5
    const clamped = Math.min(1, Math.max(0, amplified))
    const inverted = 255 * (1 - clamped)
    pixels[pixelIndex] = inverted
    pixels[pixelIndex + 1] = inverted
    pixels[pixelIndex + 2] = inverted
  }

  context.putImageData(imageData, 0, 0)
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
