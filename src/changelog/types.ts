export type ChangelogSectionLabel = "Added" | "Changed" | "Fixed"

export interface ChangelogItem {
  text: string
  authors: string[]
}

export interface ChangelogSection {
  label: ChangelogSectionLabel
  items: ChangelogItem[]
}

export interface ChangelogEntryDetails {
  sections: ChangelogSection[]
}

export interface ChangelogEntry {
  version: string
  date: string
  headline: string
  loadDetails: () => Promise<ChangelogEntryDetails>
}
