import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Changed",
      items: [
        {
          text: "Frostwhite Night is now Frost-Clad Night, matching the in-game term.",
          authors: ["KelvinJin"],
        },
        {
          text: "Lone Loyalty is now Steadfast Devotion, matching the in-game term.",
          authors: ["KelvinJin"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Snowparting VS coefficients no longer double-apply the Frost-Clad Night bonus.",
          authors: ["KelvinJin"],
        },
        { text: "A typo in the default rotation's description.", authors: ["KelvinJin"] },
      ],
    },
  ],
}
