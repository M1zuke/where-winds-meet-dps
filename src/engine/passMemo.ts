import type { EngineRunOptions, Inputs, Result } from "./types"

const MEMO_CAPACITY = 8
const TAG_KEY = "\u0000passMemoTag"

let activeMemo: Map<string, Result> | null = null

class UnkeyableValue extends Error {}

function tagged(tag: string, payload?: unknown): { [TAG_KEY]: string; payload?: unknown } {
  return payload === undefined ? { [TAG_KEY]: tag } : { [TAG_KEY]: tag, payload }
}

function exactKeyReplacer(_key: string, value: unknown): unknown {
  if (value === undefined) return tagged("undefined")
  if (typeof value === "number") {
    if (Number.isNaN(value)) return tagged("NaN")
    if (value === Infinity) return tagged("+Infinity")
    if (value === -Infinity) return tagged("-Infinity")
    if (Object.is(value, -0)) return tagged("-0")
    return value
  }
  if (value instanceof Map) return tagged("Map", [...value.entries()])
  if (value instanceof Set) return tagged("Set", [...value.values()])
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    throw new UnkeyableValue()
  }
  return value
}

export function passKey(inputs: Inputs, options: EngineRunOptions | undefined): string | null {
  try {
    return JSON.stringify([inputs, options], exactKeyReplacer)
  } catch {
    return null
  }
}

export function withPassMemo<Value>(compute: () => Value): Value {
  if (activeMemo !== null) return compute()
  activeMemo = new Map()
  try {
    return compute()
  } finally {
    activeMemo = null
  }
}

export function rememberedPass(
  inputs: Inputs,
  options: EngineRunOptions | undefined,
  run: () => Result,
): Result {
  const memo = activeMemo
  if (memo === null) return run()
  const key = passKey(inputs, options)
  if (key === null) return run()
  const remembered = memo.get(key)
  if (remembered !== undefined) {
    memo.delete(key)
    memo.set(key, remembered)
    return remembered
  }
  const result = run()
  memo.set(key, result)
  if (memo.size > MEMO_CAPACITY) memo.delete(memo.keys().next().value as string)
  return result
}
