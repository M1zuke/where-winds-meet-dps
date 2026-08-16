import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "A new Simulation tab rolls a chosen rotation up to 10,000 times and reports the spread of parses it produced.",
          authors: ["M1zuke"],
        },
        {
          text: "The simulation summary averages DPS and total damage, the best and worst parse, and the hits of each outcome.",
          authors: ["M1zuke"],
        },
        {
          text: "Simulation results show a DPS distribution, a parse ladder from top-1 to top-99, and the observed outcome mix.",
          authors: ["M1zuke"],
        },
        {
          text: "A running simulation reports its progress and can be cancelled, keeping the runs it already finished.",
          authors: ["M1zuke"],
        },
        {
          text: "The Gear tab has an Analysis subtab that ranks each equipped slot by its upgrade payoff and the DPS it contributes.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "The graduation flame now appears above 94 % rather than 91 %.",
          authors: ["M1zuke"],
        },
        {
          text: "Creating a gear piece is now Create Gear, beside Import gear above the equipped slots.",
          authors: ["M1zuke"],
        },
        {
          text: "The Talents tab now marks Qi damage talents as contributing nothing to damage.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Bellstrike Splendor no longer counts Qi damage bonuses as Attribute DMG Boost, which overstated its damage.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Splendor's Sword Energy HP damage bonus now applies to the whole hit rather than only its physical part.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Splendor's Qi Imbalance now raises Bellstrike damage taken only inside the break window.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
