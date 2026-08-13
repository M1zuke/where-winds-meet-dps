import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "This changelog, reachable from the version next to the title.",
          authors: ["M1zuke"],
        },
        { text: "Every change names who shipped it.", authors: ["M1zuke"] },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Stonesplit Strength is validated — its output is checked against a measured build.",
          authors: ["KelvinJin"],
        },
        {
          text: "The inner way list keeps the five implemented ways; 23 unimplemented entries are gone.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        { text: "Concentration is applied once instead of twice.", authors: ["M1zuke"] },
        {
          text: "A cast's buff chips no longer include what the next cast applies.",
          authors: ["M1zuke"],
        },
        { text: "Every defined class can be selected.", authors: ["M1zuke"] },
      ],
    },
  ],
}
