import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Fill a gear piece from a screenshot of its in-game panel, read on your device without uploading anything.",
          authors: ["M1zuke"],
        },
        {
          text: "The scan underlines any line it was unsure of, so you only check the fields that need it.",
          authors: ["M1zuke"],
        },
        {
          text: "Pick the interface language from the title bar.",
          authors: ["M1zuke"],
        },
        {
          text: "Korean translation of the interface and of every class, skill, buff and stat name.",
          authors: ["keunhyeok-wb"],
        },
        {
          text: "See the whole equipped build in one dialog: every piece, the armor and bow sets, and your panel stats.",
          authors: ["M1zuke"],
        },
        {
          text: "Give a gear piece a label and a note, shown on its slot tile and in the inventory.",
          authors: ["M1zuke"],
        },
        {
          text: "Retunement analysis now covers Silkbind pieces.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "The Stonesplit set and its deflect buff carry their in-game name, Cleftpeak.",
          authors: ["KelvinJin"],
        },
        {
          text: "The all-martial gear word shows its full in-game name, All Martial Arts Boost.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
