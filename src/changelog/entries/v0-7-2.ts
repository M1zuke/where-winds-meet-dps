import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "A class can ship several named graduation builds, and a profile follows one, named on the DPS header.",
          authors: ["M1zuke"],
        },
        {
          text: "A custom graduation build editor starts empty, copies a shipped build, or imports one, and exports as JSON.",
          authors: ["M1zuke"],
        },
        {
          text: "The setup wizard asks for the graduation build last, and a profile following none is asked to pick one.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear whose stat lines match a graduation build's piece is marked an heirloom with a shine in its rarity colour.",
          authors: ["M1zuke"],
        },
        {
          text: "The retunement advisor names the retune that would finish an heirloom-ready piece, and drops its pick once finished.",
          authors: ["M1zuke"],
        },
        {
          text: "The build summary marks heirloom pieces and names the build each one matches.",
          authors: ["M1zuke"],
        },
        {
          text: "A rotation can fix its own run window, so one that finishes early keeps ticking until the window ends.",
          authors: ["M1zuke"],
        },
        {
          text: "A built-in Bellstrike Umbra rotation, 36 BB's | 2 Dragon Breaths, measured over 60 seconds.",
          authors: ["M1zuke"],
        },
        {
          text: "The Additional Attack Up talent raises each martial art's flat skill damage from breakthrough 18 on.",
          authors: ["M1zuke"],
        },
        {
          text: "The Class Talents sub-tab shows that node on every art column with what it grants at the current breakthrough.",
          authors: ["M1zuke"],
        },
        {
          text: "Silkbind Jade tracks Blossoms: an umbrella drone launches only when funded, drains while it fires, and stops when empty.",
          authors: ["SchlimeyLimey"],
        },
        {
          text: "A Blossoms panel charts the balance across the rotation and exposes its gain assumptions as saved settings.",
          authors: ["SchlimeyLimey"],
        },
        {
          text: "Two built-in Silkbind Jade rotations, 2.0 DH and 30s Dummy max.",
          authors: ["SchlimeyLimey"],
        },
        {
          text: "Panel Stats reports every hit outcome as its own row: combined crit and affinity, abrasion, and normal.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Bellstrike Umbra's built-in rotations are measured over fixed 60- and 30-second windows, like a training-hall test.",
          authors: ["M1zuke"],
        },
        {
          text: "The graduation benchmark runs the rotation its build names, whatever rotation is selected.",
          authors: ["M1zuke"],
        },
        {
          text: "Each martial art's attribute attack line climbs with the breakthrough stages instead of holding one value.",
          authors: ["M1zuke"],
        },
        {
          text: "A selected gear tile is ringed in its own rarity colour instead of taking the accent border and warm surface.",
          authors: ["M1zuke"],
        },
        {
          text: "In the gear details card the piece note now follows the attunement, at the end of the card.",
          authors: ["M1zuke"],
        },
        {
          text: "Blossom Barrage's tier-four bonus reaches both Spring Away and Unfading Flower.",
          authors: ["SchlimeyLimey"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "The Panel Stats crit chance no longer rises above what a build can roll; precision is capped at 100% when rolled.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Umbra's bleed rows no longer carry a talent bonus below breakthrough 18, where that talent does not exist.",
          authors: ["M1zuke"],
        },
        {
          text: "The retunement analyzer shows the retune budget note as a sentence instead of its raw key.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
