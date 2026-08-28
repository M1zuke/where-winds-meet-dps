import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Fixed",
      items: [
        {
          text: "FP and FP(E) now report a piece's true best retune, relay and attunement, instead of understating unequipped gear.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
