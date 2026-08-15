import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Bellstrike Splendor is now selectable, with its Nameless Sword and Nameless Spear skills, talents and inner ways.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Splendor ships with a graduation build and three built-in rotations.",
          authors: ["M1zuke"],
        },
        {
          text: "Classes with unverified numbers carry a WIP badge in the class picker.",
          authors: ["M1zuke"],
        },
        {
          text: "The Rotation tab opens on a new Overview: DPS breakdown, a DPS graph and the cast timeline in one place.",
          authors: ["M1zuke"],
        },
        {
          text: "The Overview lists every rotation with its DPS against the current one, and clicking an entry switches to it.",
          authors: ["M1zuke"],
        },
        {
          text: "The DPS graph plots per-second DPS beside the running average and reads out time and DPS under the pointer.",
          authors: ["M1zuke"],
        },
        {
          text: "The retunement analyzer scores each candidate a second time with the whole piece relayed to 94%.",
          authors: ["M1zuke"],
        },
        {
          text: "The boss now enters a low-Qi window before the Qi break, drawn as its own band in the cast timeline.",
          authors: ["M1zuke"],
        },
        {
          text: "Every martial art shows its path icon in the class picker.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "The setup wizard walks class, gear import or manual entry, then profile name; imports take it from the capture.",
          authors: ["M1zuke"],
        },
        {
          text: "A skill's DPS is measured over the rotation instead of its own cast time, so the breakdown sums to the total.",
          authors: ["M1zuke"],
        },
        {
          text: "Breakdown rows and cast-timeline lanes group under in-game skill names.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Umbra's skills report under the names the game gives them.",
          authors: ["M1zuke"],
        },
        {
          text: "Pre-pull damage always counts toward the total, and the pre-pull checkbox in the Rotation Editor is gone.",
          authors: ["M1zuke"],
        },
        {
          text: "Attunements and stat lines carry their official in-game names, and a shared weapon-art attunement is named per class.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear import recognizes the full official affix table, so far fewer affixes need mapping by hand.",
          authors: ["M1zuke"],
        },
        {
          text: "Every dropdown is a styled, keyboard-driven select instead of the native control.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear tiles carry rarity as a left bar, and gear details gains an identity strip, read-only base stats and hover hints.",
          authors: ["M1zuke"],
        },
        {
          text: "The gear import screen reads as a numbered step rail with a draggable bookmarklet seal and a parsed-gear banner.",
          authors: ["M1zuke"],
        },
        {
          text: "Text and number fields, sub-tab panels and focus styles share one consistent look across the app.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "The final affinity rate is now calculated correctly.",
          authors: ["KelvinJin"],
        },
        {
          text: "Jadeware's 4-piece bonus only pays out against a target in a low-Qi state, as the set describes.",
          authors: ["M1zuke"],
        },
        {
          text: "Class Buffs no longer lists the buffs a slotted inner way owns.",
          authors: ["M1zuke"],
        },
        {
          text: "Imported stat lines show their display name instead of an internal id, and no longer report phantom clamp corrections.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
