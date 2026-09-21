import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Bamboocut Draught has a second graduation build, so profiles of that class choose which one they follow.",
          authors: ["M1zuke"],
        },
        {
          text: "The graduation dialog shows your own DPS beside the benchmark's, and the inner ways both sides run.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "The graduation rate now runs both sides on a fixed encounter and fixed inner ways, so it compares gear alone.",
          authors: ["M1zuke"],
        },
        {
          text: "Talent Points is now the board the game draws, panning sideways with every node, its icon and its level gate.",
          authors: ["M1zuke"],
        },
        {
          text: "A talent node takes its next rank on click, and clearing a full one releases everything behind it.",
          authors: ["M1zuke"],
        },
        {
          text: "A talent node behind a higher Solo Mode level is greyed out and scores nothing until your breakthrough reaches it.",
          authors: ["M1zuke"],
        },
        {
          text: "Oddities is now each region's own board, an accordion newest first, with every melody where the game places it.",
          authors: ["M1zuke"],
        },
        {
          text: "The oddity melodies are grouped under the twelve chapter names that run across the board.",
          authors: ["M1zuke"],
        },
        {
          text: "Claiming a melody claims the chain behind it, and releasing one releases everything past it.",
          authors: ["M1zuke"],
        },
        {
          text: "The oddities summary states it sums only Min and Max Physical Attack, Physical Defense and Max HP.",
          authors: ["M1zuke"],
        },
        {
          text: "Melody names, their descriptions and the chapter names are now translated.",
          authors: ["M1zuke"],
        },
        {
          text: "The three Stonesplit Strength rotations now run a fixed 60 second window.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
