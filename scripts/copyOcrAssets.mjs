import { createRequire } from "node:module"
import { cpSync, mkdirSync, rmSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const require = createRequire(import.meta.url)
const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(repoRoot, "public", "ocr")

const workerScript = join(
  dirname(require.resolve("tesseract.js/package.json")),
  "dist/worker.min.js",
)
const coreDir = dirname(require.resolve("tesseract.js-core/package.json"))
const languageData = join(
  dirname(require.resolve("@tesseract.js-data/eng/package.json")),
  "4.0.0/eng.traineddata.gz",
)

rmSync(outDir, { recursive: true, force: true })
mkdirSync(join(outDir, "core"), { recursive: true })
mkdirSync(join(outDir, "lang"), { recursive: true })

cpSync(workerScript, join(outDir, "worker.min.js"))
cpSync(coreDir, join(outDir, "core"), { recursive: true })
cpSync(languageData, join(outDir, "lang", "eng.traineddata.gz"))
