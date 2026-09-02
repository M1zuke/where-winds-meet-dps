import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Rotations can open on a partly built Zenith bar, and every built-in Bellstrike Umbra rotation starts on a full one.",
          authors: ["M1zuke"],
        },
        {
          text: "The app asks for fresh inner-way screenshots whenever a new breakthrough supersedes the data an inner way was read at.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "The Qi break window belongs to the rotation and is edited there; the encounter setting is an override, off by default.",
          authors: ["M1zuke"],
        },
        {
          text: "The default breakthrough advances by itself when a new one goes live, leaving a breakthrough you picked yourself alone.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Umbra offers four built-in rotations, with 38 BB's as the class default.",
          authors: ["M1zuke"],
        },
        {
          text: "36 BB's is rebuilt around the six-hit Spear Q, a single-hit Smolder opener and reordered mid-rotation blocks.",
          authors: ["M1zuke"],
        },
        {
          text: "Nox - 1m DH follows its latest export, dropping the Spear Q cancel and a Sword Charge stage for Delay and Ghostly Steps.",
          authors: ["M1zuke"],
        },
        {
          text: "The rotation list sits in its own card beside the subtabs, so it stays reachable from the editor, graph and timeline.",
          authors: ["M1zuke"],
        },
        {
          text: "Buff chips on the rotation editor's cast rows show initials with their stack count; the tooltip keeps the full name.",
          authors: ["M1zuke"],
        },
        {
          text: "The Hawkwing cast tag no longer names a piece count.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "A buff that counts stacks shows zero before its first stack lands instead of reading as one.",
          authors: ["M1zuke"],
        },
        {
          text: "River Flow is one buff in the Skill Editor instead of two, and no longer applies without Wolfchaser's Art slotted.",
          authors: ["M1zuke"],
        },
        {
          text: "Class damage figures come down slightly: an unsourced flat bonus to attribute attack no longer applies.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
