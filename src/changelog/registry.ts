import type { ChangelogEntry } from "./types"

export const CHANGELOG_ENTRIES: ChangelogEntry[] = [
  {
    version: "0.1.13",
    date: "2026-08-12",
    headline: "Gear import from the official dashboard",
    loadDetails: () => import("./entries/v0-1-13").then((module) => module.details),
  },
  {
    version: "0.1.12",
    date: "2026-08-11",
    headline: "In-game names for two inner ways",
    loadDetails: () => import("./entries/v0-1-12").then((module) => module.details),
  },
  {
    version: "0.1.11",
    date: "2026-08-11",
    headline: "Stonesplit Strength",
    loadDetails: () => import("./entries/v0-1-11").then((module) => module.details),
  },
  {
    version: "0.1.10",
    date: "2026-08-11",
    headline: "Dragon Head depth, and a trimmed set list",
    loadDetails: () => import("./entries/v0-1-10").then((module) => module.details),
  },
  {
    version: "0.1.9",
    date: "2026-08-09",
    headline: "More rotations, and attunement ranking",
    loadDetails: () => import("./entries/v0-1-9").then((module) => module.details),
  },
  {
    version: "0.1.8",
    date: "2026-08-07",
    headline: "Bitter Season",
    loadDetails: () => import("./entries/v0-1-8").then((module) => module.details),
  },
  {
    version: "0.1.7",
    date: "2026-08-06",
    headline: "All Martial reaches damage over time",
    loadDetails: () => import("./entries/v0-1-7").then((module) => module.details),
  },
  {
    version: "0.1.6",
    date: "2026-08-06",
    headline: "Dragon Head mystic skills",
    loadDetails: () => import("./entries/v0-1-6").then((module) => module.details),
  },
]
