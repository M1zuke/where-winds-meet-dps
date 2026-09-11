import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Fixed",
      items: [
        {
          text: "Retune draw chances now include the fixed first line's stat, which one of the four retunable lines can roll.",
          authors: ["M1zuke"],
        },
        {
          text: "Bamboocut gear at level 96, 100 and 105 now shows retune draw chances instead of reporting no probability data.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
