import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Qi-break doubling, teammate and low-HP toggles, and new coefficients for Dragon Head.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "The statically modelled Ivorybloom and Rainwhisper sets are gone.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Saved builds that used the removed sets are healed on load.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
