import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "The rotation editor now has its own tab beside Rotation.",
          authors: ["M1zuke"],
        },
        {
          text: "A Talent Points tab groups every talent point by what it grants and lets each one be toggled on its own.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear levels 86, 100 and 105 can be selected, each with its own roll ceilings, base stats and retune pools.",
          authors: ["M1zuke"],
        },
        {
          text: "An Arsenal tab takes a mastery score per arsenal, so the current one's overflow counts toward Max HP.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear enhancement is set per slot as a level, and the four armour slots now contribute Max HP and Physical Defense.",
          authors: ["M1zuke"],
        },
        {
          text: "The stats panel shows Max HP, Constitution, Defense and Physical Defense, counted from every source that feeds them.",
          authors: ["M1zuke"],
        },
        {
          text: "Oddity nodes that grant Max HP and Physical Defense appear beside the attack ones.",
          authors: ["M1zuke"],
        },
        {
          text: "The re-attunement advisor draws from its own pool and reports the chance and expected gain of each line.",
          authors: ["M1zuke"],
        },
        {
          text: "Korean translations are updated.",
          authors: ["hyc7575"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Inner-way panel lines follow the breakthrough, so switching a profile moves every ladder line with it.",
          authors: ["M1zuke"],
        },
        {
          text: "Every Strategic Sword and Heavenquaker Spear skill carries its own multiplier and flat damage per hit.",
          authors: ["M1zuke"],
        },
        {
          text: "Arsenal attack scales with the breakthrough and each arsenal's mastery instead of one fixed amount.",
          authors: ["M1zuke"],
        },
        {
          text: "Breakthrough 12 is no longer selectable.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Steadfast Devotion's crit rate at breakthrough 17 was too high.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear set bonuses were wrong for several sets, and Hawking is now spelled Hawkwing.",
          authors: ["M1zuke"],
        },
        {
          text: "The target's defense above breakthrough 17 was too low, and it now has penetration resistance from 20.",
          authors: ["M1zuke"],
        },
        {
          text: "Importing gear no longer maps three stat lines to the wrong ones.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
