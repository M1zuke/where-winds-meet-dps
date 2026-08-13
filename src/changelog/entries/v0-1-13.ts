import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Import a build straight from the official Where Winds Meet dashboard.",
          authors: ["M1zuke"],
        },
        { text: "The affix table covers 744 entries instead of 44.", authors: ["M1zuke"] },
        { text: "13 more affix ids are mapped.", authors: ["M1zuke"] },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Level 96 armor base stats are corrected, and a piece's tier is recovered from them.",
          authors: ["M1zuke"],
        },
        {
          text: "Legendary level 96 greaves report their real defense value.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear values show two decimals, and the max column stops drifting.",
          authors: ["M1zuke"],
        },
        { text: "The confirm dialog sits above the gear dialogs.", authors: ["M1zuke"] },
      ],
    },
  ],
}
