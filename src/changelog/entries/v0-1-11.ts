import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Stonesplit Strength is selectable, merging the former Dual Cut and Pure Hence variants.",
          authors: ["KelvinJin"],
        },
        { text: "Stonesplit Strength class skill boosts.", authors: ["KelvinJin"] },
        {
          text: "The Shattered Ridge armor set, with its set bonus and stack mechanic.",
          authors: ["KelvinJin"],
        },
        { text: "Stonesplit retunement pools and attunements.", authors: ["KelvinJin"] },
        { text: "Steadfast Devotion, with the Mountain Splitter buff.", authors: ["KelvinJin"] },
        { text: "The Fearful Blade and Dread buffs.", authors: ["KelvinJin"] },
        { text: "Phalanx Charge Boost applies to skills.", authors: ["KelvinJin"] },
        { text: "A switch rotation without Toad.", authors: ["KelvinJin"] },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Phalanx Charged S3 and the remaining Stonesplit skill coefficients match in-game values.",
          authors: ["KelvinJin"],
        },
        { text: "Throat Pierce effects are updated.", authors: ["KelvinJin"] },
        { text: "Flute Ripple damage-over-time coefficients are updated.", authors: ["KelvinJin"] },
        { text: "Mo Sweep is no longer affected by Mountain Splitter.", authors: ["KelvinJin"] },
        {
          text: "The 8% general damage boost is gone from Stonesplit Strength.",
          authors: ["KelvinJin"],
        },
        { text: "Prepull hit coefficients are corrected.", authors: ["KelvinJin"] },
        {
          text: "The Test A and Test B rotations are gone from Stonesplit Strength.",
          authors: ["KelvinJin"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        { text: "Throat Pierce applies to every skill.", authors: ["KelvinJin"] },
        { text: "Inner Passion is no longer counted twice.", authors: ["KelvinJin"] },
        {
          text: "Snowparting VS no longer double-counts after Inner Passion during Qi Break.",
          authors: ["KelvinJin"],
        },
        { text: "Buff stacks are consumed correctly in the UI.", authors: ["KelvinJin"] },
        {
          text: "Effective max Phys is applied after food buffs, and used when min Phys is higher.",
          authors: ["KelvinJin"],
        },
        {
          text: "Mo Blade Charge Boost applies to Mo Blade Anxi skills.",
          authors: ["KelvinJin"],
        },
        { text: "Shattered Ridge attack triggers.", authors: ["KelvinJin"] },
        {
          text: "The Stonesplit Strength class boost is applied reliably.",
          authors: ["KelvinJin"],
        },
      ],
    },
  ],
}
