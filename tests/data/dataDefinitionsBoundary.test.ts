// Mechanically holds the promise that implementing a class touches only
// `src/data/`: nothing under `src/data/` may declare a `define*` contract or
// call a registration entry point, and nothing under `src/definitions/` may
// reach past a `src/data/` folder barrel, `ids.ts` or JSON table into an
// individual content module.
import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, join, resolve } from "node:path"

const ROOT = process.cwd()
const DATA_DIR = join(ROOT, "src/data")
const DEFINITIONS_DIR = join(ROOT, "src/definitions")

function tsFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) return tsFiles(path)
    return path.endsWith(".ts") ? [path] : []
  })
}

function repoRelative(path: string): string {
  return path
    .slice(ROOT.length + 1)
    .split("\\")
    .join("/")
}

function importSpecifiers(text: string): string[] {
  const fromImports = [...text.matchAll(/\bfrom\s+["']([^"']+)["']/g)].map((match) => match[1])
  // `import "../../data/classes/bellstrikeUmbra"` has no `from` clause but
  // still reaches the target module for its side effect — the exact form
  // this guard exists to catch.
  const bareImports = [...text.matchAll(/^\s*import\s+["']([^"']+)["']/gm)].map((match) => match[1])
  return [...fromImports, ...bareImports]
}

function resolvedTarget(fromFile: string, specifier: string): string | null {
  if (!specifier.startsWith(".")) return null
  const resolved = resolve(dirname(fromFile), specifier)
  if (/\.json$/.test(resolved)) return resolved.split("\\").join("/")
  const filePath = statSyncOrNull(resolved)?.isDirectory()
    ? join(resolved, "index.ts")
    : `${resolved}.ts`
  return filePath.split("\\").join("/")
}

function statSyncOrNull(path: string): ReturnType<typeof statSync> | null {
  try {
    return statSync(path)
  } catch {
    return null
  }
}

const dataSources = tsFiles(DATA_DIR).map((path) => ({
  path: repoRelative(path),
  text: readFileSync(path, "utf8"),
}))

describe("src/data/ contains no definition machinery", () => {
  it("declares no define* factory", () => {
    const offenders = dataSources
      .filter(({ text }) => /export\s+function\s+define[A-Z]\w*/.test(text))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })

  it("calls no registration entry point", () => {
    const registrationCalls =
      /\b(registerMechanic|registerBuiltinBuffs|registerSkillBehavior|registerDisplayGate|registerPoisonExtension)\(/
    const offenders = dataSources
      .filter(({ text }) => registrationCalls.test(text))
      .map(({ path }) => path)
    expect(offenders).toEqual([])
  })
})

describe("src/definitions/ never reaches past a src/data/ barrel", () => {
  it("every import into src/data/ targets a folder barrel, ids.ts, or a JSON table", () => {
    const dataRoot = DATA_DIR.split("\\").join("/")
    const offenders: string[] = []
    for (const path of tsFiles(DEFINITIONS_DIR)) {
      const text = readFileSync(path, "utf8")
      for (const specifier of importSpecifiers(text)) {
        const target = resolvedTarget(path, specifier)
        if (!target || !target.startsWith(`${dataRoot}/`)) continue
        const isAllowed =
          target.endsWith(".json") || target.endsWith("/index.ts") || target.endsWith("/ids.ts")
        if (!isAllowed) offenders.push(`${repoRelative(path)} -> ${repoRelative(target)}`)
      }
    }
    expect(offenders).toEqual([])
  })
})
