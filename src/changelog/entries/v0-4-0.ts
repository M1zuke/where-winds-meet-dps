import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Silkbind Jade is now selectable, with its Vernal Umbrella and Inkwell Fan skills, talents, attunements and inner ways.",
          authors: ["M1zuke"],
        },
        {
          text: "Silkbind Jade ships with a graduation build and two rotations, opening on the Standardized 1.7+.",
          authors: ["M1zuke"],
        },
        {
          text: "Silkbind Jade's Umbrella drone is simulated tick by tick, named in the DPS breakdown and editable in the Skill Editor.",
          authors: ["M1zuke"],
        },
        {
          text: "The Breaking Point inner way is selectable at tiers 6 and 5 on every class.",
          authors: ["M1zuke"],
        },
        {
          text: "The Mistwillow set can now be picked, with an 8% precision 2-piece and its cross-stance 4-piece buff.",
          authors: ["M1zuke"],
        },
        {
          text: "The Rainwhisper set returns, with 8% precision and crit damage that rises to 25% while a self-applied shield is up.",
          authors: ["M1zuke"],
        },
        {
          text: "The app adapts to tablets and phones: the tab strip scrolls, the titlebar tucks away and Save stays pinned.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "The Overview tab is a responsive grid of loadout, set bonuses, encounter settings and panel stats, down to one column.",
          authors: ["M1zuke"],
        },
        {
          text: "Set-bonus tiles are now one table listing each relevant choice with its bonus and DPS delta, best first, click to pick.",
          authors: ["M1zuke"],
        },
        {
          text: "Encounter settings are switches and segmented controls, and the training dummy toggle lives with them.",
          authors: ["M1zuke"],
        },
        {
          text: "The Profile tab shows each saved profile as a card with its class, DPS, total damage and active rotation.",
          authors: ["M1zuke"],
        },
        {
          text: "The Skill Editor splits into a searchable skill list beside the editor, with a cast preview and per-variant hit tabs.",
          authors: ["M1zuke"],
        },
        {
          text: "Export, Import and Delete sit as plain header buttons, and the Skill Editor opens on the first skill instead of empty.",
          authors: ["M1zuke"],
        },
        {
          text: "Buff rows list just the buff's name and effect, without the affects and triggered-by columns.",
          authors: ["M1zuke"],
        },
        {
          text: "Section sub-headers and the rotation readout pick up the theme's accent color.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Gear-granted skill boosts in the Skill Editor show the value your build actually applies.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
