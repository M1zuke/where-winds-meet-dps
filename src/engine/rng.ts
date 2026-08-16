export function mulberry32(seed: number): () => number {
  let a = seed | 0
  return function next(): number {
    a = (a + 1831565813) | 0
    let t = Math.imul(a ^ (a >>> 15), a | 1)
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export const RUN_SEED_STRIDE = 0x9e3779b1
export const MECHANIC_STREAM_OFFSET = 0x5bf03635
