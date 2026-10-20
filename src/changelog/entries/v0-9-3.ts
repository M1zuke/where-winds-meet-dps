import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "A Use Graduation Qi break encounter setting, on by default, keeps the Qi break steady across gear comparisons.",
          authors: ["M1zuke"],
        },
        {
          text: "The Rotation tab and Rotation Editor show the graduation build's Qi break while the setting is on.",
          authors: ["M1zuke"],
        },
        {
          text: "The Simulation tab notes that it always uses your own Qi break.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Raising a stat no longer shows a DPS loss because the Qi break moved by a hit.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
