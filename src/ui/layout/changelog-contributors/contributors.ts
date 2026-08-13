import { APP_VERSION } from "../../../appVersion"
import { kvStore } from "../../../kvStore"
import { GITHUB_REPO_URL } from "../github-link/GithubLink"

export interface Contributor {
  login: string
  avatarUrl: string
  profileUrl: string
}

const CONTRIBUTORS_CACHE_KEY = "wwm.contributors"
const CONTRIBUTORS_URL = `https://api.github.com/repos${new URL(GITHUB_REPO_URL).pathname}/contributors?per_page=100`

interface ContributorPayload {
  login: string
  avatar_url: string
  html_url: string
  type?: string
}

function isContributorPayload(candidate: unknown): candidate is ContributorPayload {
  if (typeof candidate !== "object" || candidate === null) return false
  const record = candidate as Record<string, unknown>
  return (
    typeof record.login === "string" &&
    typeof record.avatar_url === "string" &&
    typeof record.html_url === "string" &&
    record.type !== "Bot"
  )
}

function isContributor(candidate: unknown): candidate is Contributor {
  if (typeof candidate !== "object" || candidate === null) return false
  const record = candidate as Record<string, unknown>
  return (
    typeof record.login === "string" &&
    typeof record.avatarUrl === "string" &&
    typeof record.profileUrl === "string"
  )
}

function readCache(): { version: string; contributors: Contributor[] } | null {
  const stored = kvStore.get(CONTRIBUTORS_CACHE_KEY)
  if (stored === null) return null
  try {
    const parsed: unknown = JSON.parse(stored)
    if (typeof parsed !== "object" || parsed === null) return null
    const record = parsed as Record<string, unknown>
    if (typeof record.version !== "string" || !Array.isArray(record.contributors)) return null
    return { version: record.version, contributors: record.contributors.filter(isContributor) }
  } catch {
    return null
  }
}

function writeCache(contributors: Contributor[]): void {
  kvStore.set(CONTRIBUTORS_CACHE_KEY, JSON.stringify({ version: APP_VERSION, contributors }))
}

async function fetchContributors(): Promise<Contributor[]> {
  const response = await fetch(CONTRIBUTORS_URL, {
    headers: { Accept: "application/vnd.github+json" },
  })
  if (!response.ok) throw new Error(`GitHub responded with ${response.status}`)
  const payload: unknown = await response.json()
  if (!Array.isArray(payload)) return []
  return payload.filter(isContributorPayload).map((entry) => ({
    login: entry.login,
    avatarUrl: entry.avatar_url,
    profileUrl: entry.html_url,
  }))
}

async function refreshContributors(cached: Contributor[] | null): Promise<Contributor[]> {
  try {
    const fetched = await fetchContributors()
    if (fetched.length > 0) writeCache(fetched)
    return fetched
  } catch (error: unknown) {
    if (cached !== null) return cached
    throw error
  }
}

let pendingContributors: Promise<Contributor[]> | null = null

export function loadContributors(): Promise<Contributor[]> {
  const cache = readCache()
  if (cache !== null && cache.version === APP_VERSION) return Promise.resolve(cache.contributors)

  pendingContributors ??= refreshContributors(cache?.contributors ?? null).catch(
    (error: unknown) => {
      pendingContributors = null
      throw error
    },
  )
  return pendingContributors
}
