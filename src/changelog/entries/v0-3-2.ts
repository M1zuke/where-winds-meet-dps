import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "A parse simulation keeps running when you leave its tab, and a toast tracks it, cancels it, or opens the results.",
          authors: ["M1zuke"],
        },
        {
          text: "A toast shows how many gear and DPS calculations are still running, and pending numbers dim until they land.",
          authors: ["M1zuke"],
        },
        {
          text: "Controls that would change the build are locked while a simulation runs, and unlock when it ends or is cancelled.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Analyses reopen with their last result instead of an empty panel, and a repeated one answers straight from memory.",
          authors: ["M1zuke"],
        },
        {
          text: "The equipped slot tiles fill in on their own, without waiting for the whole inventory to be recalculated.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear sweeps now run in parallel, so their numbers land sooner.",
          authors: ["M1zuke"],
        },
        {
          text: "The gear inventory lists only the active profile's pieces; the global view and its owner badges are gone.",
          authors: ["M1zuke"],
        },
        {
          text: "The gear swap preview sits directly under the subtab card, in its own column beside the piece details.",
          authors: ["M1zuke"],
        },
        {
          text: "The Simulation tab keeps its rotation choice and run count when you leave and come back.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Power, agility and momentum raise minimum attack at the same rate whether they came from gear words or points.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
