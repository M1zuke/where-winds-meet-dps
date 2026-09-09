import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Sword Special and the sword charge each offer their one- and two-hit endings, and Crosswind Blade its cut form.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Bellstrike Umbra's cast lengths and hit frames follow the animations, and Sweep All lands both of its hits.",
          authors: ["M1zuke"],
        },
        {
          text: "The martial art's attribute multiplier now reaches damage-over-time ticks and a row's flat term.",
          authors: ["M1zuke"],
        },
        {
          text: "Wolfchaser's Art raises Martial Art skill damage permanently from rank three, across the sword and spear Q chains.",
          authors: ["M1zuke"],
        },
        {
          text: "Every mystic art uses the coefficients of the highest rank a player can reach, alike across all four classes.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Art of Fan and Art of Umbrella boosts are selectable again, and an imported piece keeps them.",
          authors: ["M1zuke"],
        },
        {
          text: "Either weapon can carry all four attribute attack pairs, so a relayed weapon's lines are scored again.",
          authors: ["M1zuke"],
        },
        {
          text: "Formless attack no longer appears on a disc, pendant, helm, armor, greaves or bracer.",
          authors: ["M1zuke"],
        },
        {
          text: "River Flow's window opens where its granting cast ends rather than up to 38 frames early.",
          authors: ["M1zuke"],
        },
        {
          text: "Blood Burst counts as an ordinary weapon hit, and the bleed rows add no attribute attack of their own.",
          authors: ["M1zuke"],
        },
        {
          text: "Wolfchaser's Art and Insightful Strike apply their damage-over-time bonus to every such row, not to three.",
          authors: ["M1zuke"],
        },
        {
          text: "Insightful Strike grants its all-damage bonus once, through its own Concentration mechanic.",
          authors: ["M1zuke"],
        },
        {
          text: "Soul-Shaken lasts eighteen seconds.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
