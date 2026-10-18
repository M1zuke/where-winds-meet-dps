import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Insight, Voidsky, Soullink, Waveborn, Clearfall, Purewrath, Karma and Chaos Scripts unlock with your breakthrough.",
          authors: ["M1zuke"],
        },
        {
          text: "Opportunity, Detachment and Convergence Scripts unlock with your breakthrough.",
          authors: ["M1zuke"],
        },
        {
          text: "Aqua Wax and all six refined Divinecraft items can be chosen, each showing its effect.",
          authors: ["M1zuke"],
        },
        {
          text: "Every encounter option shows its DPS difference, and options are sorted by DPS within their group.",
          authors: ["M1zuke"],
        },
        {
          text: "An Equipped Stat Lines panel on the Overview counts each stat line on your gear against your graduation build.",
          authors: ["M1zuke"],
        },
        {
          text: "The Gear Sets dialog lists 2-piece and 4-piece effects and sorts sets by their DPS gain.",
          authors: ["M1zuke"],
        },
        {
          text: "Bow and Thumb Ring can be edited and imported with their level, rarity and bow set.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Umbra has a new 1x AM (CN) graduation build.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Encounter Settings moved from the Overview into a dialog next to the DPS that shows whether dummy mode is on.",
          authors: ["M1zuke"],
        },
        {
          text: "Food is chosen from every attack and HP food your breakthrough unlocks instead of one on/off switch.",
          authors: ["M1zuke"],
        },
        {
          text: "The Qi break notice is a toast in the bottom-left corner and can be hidden for 7 days.",
          authors: ["M1zuke"],
        },
        {
          text: "Rotation warnings show as a closable toast in the bottom-left corner.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear and bow sets are set on each piece, and a set's level follows your highest set pieces.",
          authors: ["M1zuke"],
        },
        {
          text: "Armor set bonuses such as Calmwaters no longer apply.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear slot tiles are grouped into weapons, armor and bow, with set dots and an active-set strip.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear details have an editable title and chips for type, level, rarity and set.",
          authors: ["M1zuke"],
        },
        {
          text: "The set choices left the Overview, and the arsenal choice moved into the Arsenal sub-tab.",
          authors: ["M1zuke"],
        },
        {
          text: "Parse simulations run about 4–5 times faster, and gear analysis about a third faster.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Fire Oil's explosion has its 10 s lockout and now also counts bursts and direct ticks.",
          authors: ["M1zuke"],
        },
        {
          text: "Sword Morph converts Endurance at its release, before the first wave.",
          authors: ["M1zuke"],
        },
        {
          text: "The Jadeware set can proc again once its 12 s cooldown ends.",
          authors: ["M1zuke"],
        },
        {
          text: "Breaking Point no longer grants a stack from the hit that empties the Qi bar.",
          authors: ["M1zuke"],
        },
        {
          text: "The gear analysis total no longer counts the same Qi break gain once per slot.",
          authors: ["M1zuke"],
        },
        {
          text: "Dropdown menus stay inside the window and no longer escape their scroll area.",
          authors: ["M1zuke"],
        },
        {
          text: "Talent tooltips stay inside the board instead of stretching the page.",
          authors: ["M1zuke"],
        },
        {
          text: "Focusing a set choice or a screenshot upload no longer scrolls the page and leaves blank space.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
