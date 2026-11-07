import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "A notice next to the DPS asks you to check your rotation's Qi break and opens the Rotation Editor.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "The Umbra 38 BB's and 36 BB's | 2 Dragon Breaths rotations open with two Zenith Bar stacks and use reworked combos.",
          authors: ["M1zuke"],
        },
        {
          text: "Recalculating after a change is much faster, and panels that are not on screen are no longer recalculated.",
          authors: ["M1zuke"],
        },
        {
          text: "The retune suggestion lists every build one retune would complete, with the build you follow first.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Results now always arrive after many quick changes in a row instead of never finishing.",
          authors: ["M1zuke"],
        },
        {
          text: "Heirloom checks compare a level 100 or higher piece against the build at that level.",
          authors: ["M1zuke"],
        },
        {
          text: "Screenshot import reads the gear tier from the header instead of always assuming level 96.",
          authors: ["M1zuke"],
        },
        {
          text: "Screenshot and dashboard import keep the All Mystic Skill DMG Boost line on level 100 and higher pieces.",
          authors: ["M1zuke"],
        },
        {
          text: "A switch no longer stretches the page or stops it from scrolling back after a click.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
