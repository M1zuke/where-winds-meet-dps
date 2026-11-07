export function mulberry32(seed: number): () => number {
  let a = seed | 0
  return function next(): number {
    a = (a + 1831565813) | 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export class MulberryBank {
  private readonly states: Int32Array

  constructor(firstSeed: number, count: number) {
    this.states = Int32Array.from({ length: count }, (_unused, index) => (firstSeed + index) | 0)
  }

  next(index: number): number {
    const advanced = (this.states[index] + 1831565813) | 0
    this.states[index] = advanced
    let mixed = Math.imul(advanced ^ (advanced >>> 15), advanced | 1)
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)) ^ mixed
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

export const RUN_SEED_STRIDE = 0x9e3779b1
export const MECHANIC_STREAM_OFFSET = 0x5bf03635
export const EXTENSION_STREAM_OFFSET = 0x2c1b3c6d

export function mechanicSubstream(seed: number, mechanicId: string): () => number {
  let hash = 0x811c9dc5
  for (let index = 0; index < mechanicId.length; index++) {
    hash ^= mechanicId.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return mulberry32((seed ^ MECHANIC_STREAM_OFFSET ^ hash) | 0)
}
