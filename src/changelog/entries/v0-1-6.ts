import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        { text: "Dragon Head mystic skills.", authors: ["M1zuke"] },
        { text: "A GitHub contribute link in the header.", authors: ["M1zuke"] },
      ],
    },
    {
      label: "Changed",
      items: [
        { text: "Universal skills are deduplicated.", authors: ["M1zuke"] },
        { text: "The rotation breakdown reads more clearly.", authors: ["M1zuke"] },
        { text: "The Graduation % tile is gone from the metrics card.", authors: ["M1zuke"] },
        { text: "The page is titled Where Winds Meet DPS.", authors: ["M1zuke"] },
        { text: "Saved builds no longer carry stats the app can derive.", authors: ["M1zuke"] },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Dropdown lists are no longer clipped by the panel around them.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
