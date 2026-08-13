import type { AttributeKey, Inputs } from "./types"
import { getSchool } from "./panel"

const PRIMARY_TO_BLOCK: Readonly<Record<AttributeKey, string>> = {
  Bellstrike: "bellstrike",
  Stonesplit: "stonesplit",
  Silkbind: "silkbind",
  Bamboocut: "bamboocut",
}

export function resolveEnginePath(enginePath: string, ctx: Inputs): string {
  if (!enginePath.startsWith("primaryAttr.")) return enginePath
  const school = getSchool(ctx.classId)
  const block = PRIMARY_TO_BLOCK[school.primaryAttribute]
  return `${block}.${enginePath.slice("primaryAttr.".length)}`
}

export function addStatDelta(inputs: Inputs, path: string, delta: number): void {
  const parts = path.split(".")
  if (parts.length === 1) {
    const record = inputs as unknown as Record<string, unknown>
    if (typeof record[parts[0]] === "number") {
      record[parts[0]] = (record[parts[0]] as number) + delta
    }
    return
  }
  let cursor: unknown = inputs
  for (let i = 0; i < parts.length - 1; i++) {
    if (!cursor || typeof cursor !== "object") return
    cursor = (cursor as Record<string, unknown>)[parts[i]]
  }
  if (!cursor || typeof cursor !== "object") return
  const block = cursor as Record<string, unknown>
  const last = parts[parts.length - 1]
  if (block[last] === undefined && parts[0] === "classSpecificAttunement") {
    block[last] = 0
  }
  if (typeof block[last] === "number") {
    block[last] = (block[last] as number) + delta
  }
}

export function readStatValue(inputs: Inputs, path: string): number {
  let cursor: unknown = inputs
  for (const part of path.split(".")) {
    if (!cursor || typeof cursor !== "object") return 0
    cursor = (cursor as Record<string, unknown>)[part]
  }
  return typeof cursor === "number" && Number.isFinite(cursor) ? cursor : 0
}
