import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Changed",
      items: [
        {
          text: "A saved affix mapping no longer overrides the built-in table; it only fills in ids the table does not carry.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Imported gear now maps every Bellstrike Umbra and Stonesplit Strength attune effect to the right attunement.",
          authors: ["M1zuke"],
        },
        {
          text: "Stonesplit Strength no longer shows an attunement that could never be rolled and always read zero.",
          authors: ["M1zuke"],
        },
        {
          text: "The analysis panels no longer stay blank after you leave a page and come back to it.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
