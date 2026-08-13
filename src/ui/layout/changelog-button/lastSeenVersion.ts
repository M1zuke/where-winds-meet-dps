import { kvStore } from "../../../kvStore"

const LAST_SEEN_VERSION_KEY = "wwm.lastSeenVersion"

export function loadLastSeenVersion(): string | null {
  return kvStore.get(LAST_SEEN_VERSION_KEY)
}

export function saveLastSeenVersion(version: string): void {
  kvStore.set(LAST_SEEN_VERSION_KEY, version)
}

function parseSegments(version: string): number[] | null {
  if (!/^\d+(\.\d+)*$/.test(version)) return null
  return version.split(".").map((segment) => Number(segment))
}

export function isNewerVersion(candidate: string, reference: string | null): boolean {
  if (reference === null) return true
  const referenceSegments = parseSegments(reference)
  if (referenceSegments === null) return true
  const candidateSegments = candidate.split(".").map((segment) => {
    const parsed = Number(segment)
    return Number.isFinite(parsed) ? parsed : 0
  })

  const length = Math.max(referenceSegments.length, candidateSegments.length)
  for (let index = 0; index < length; index++) {
    const candidateSegment = candidateSegments[index] ?? 0
    const referenceSegment = referenceSegments[index] ?? 0
    if (candidateSegment !== referenceSegment) return candidateSegment > referenceSegment
  }
  return false
}
