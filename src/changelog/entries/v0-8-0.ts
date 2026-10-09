import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Rotations simulate ping, frame rate and server processing time, each set per rotation in the Rotation Editor.",
          authors: ["M1zuke"],
        },
        {
          text: "Each rotation has a preferred distance to the target; Bellstrike Umbra's built-in rotations start at 6 m.",
          authors: ["M1zuke"],
        },
        {
          text: "Every hit reads its own distance to the target, and projectiles land after their flight time.",
          authors: ["M1zuke"],
        },
        {
          text: "Endurance and Blade Momentum are simulated from each cast's costs, refunds and regeneration.",
          authors: ["M1zuke"],
        },
        {
          text: "The boss's Qi bar is simulated from your damage, and the Rotation Editor lists the breaks it lands on.",
          authors: ["M1zuke"],
        },
        {
          text: "A cast the game would not allow is flagged in the Rotation Editor with the reason, such as a missing inner way.",
          authors: ["M1zuke"],
        },
        {
          text: "The output panel warns when a skill's damage depends on landing just inside or outside a Qi break.",
          authors: ["M1zuke"],
        },
        {
          text: "Switching weapons between steps is simulated as a direct swap, including its short repeat limit.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear sets Ivorybloom, Starweave, Swaying Heights, Etherwrath, Swallowcall, Swift Gale and Calmwaters.",
          authors: ["M1zuke"],
        },
        {
          text: "Mystic arts Free Morph, Wolflike Frenzy, Ghostly Steps - Umbra and Leaping Toad - Fury.",
          authors: ["M1zuke"],
        },
        {
          text: "The Evasive Charge inner way refunds Endurance on a perfect dodge.",
          authors: ["M1zuke"],
        },
        {
          text: "Divinecraft: Poison adds its Poisoned damage, and Divinecraft: Fire gains Solid Foundation.",
          authors: ["M1zuke"],
        },
        {
          text: "The Fragrant Orchid Bath Bean is an encounter toggle that raises Max Endurance by 20.",
          authors: ["M1zuke"],
        },
        {
          text: "Every class's Dual-Weapon Skills can be placed in a rotation.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Umbra gains charge stage 2, light and heavy attacks, and both dashes.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Splendor gains Storm Dance, Legion Crusher, Sword - Dash, the single-bolt Vagrant Sword and basic attacks.",
          authors: ["M1zuke"],
        },
        {
          text: "Silkbind Jade gains Apricot Heaven, Glow & Flow, Bamboo Breeze, Gourd Toss, Hidden Sword, the fan attacks and dashes.",
          authors: ["M1zuke"],
        },
        {
          text: "Stonesplit Strength gains Total Annihilation: Supreme, General's Bane - Slash, Burning Heart 1-2 and Break Defense.",
          authors: ["M1zuke"],
        },
        {
          text: "Bamboocut Draught gains Blade Vessel, the held Whaledraft, the twinblade falcon, Blade Against Waves and Tidepour.",
          authors: ["M1zuke"],
        },
        {
          text: "The Class Talents tab lists Stonesplit Strength's talents.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Every class's skill values, conditions and reach now match the in-game ones.",
          authors: ["M1zuke"],
        },
        {
          text: "Skill damage coefficients use the in-game values at each art's highest stage.",
          authors: ["M1zuke"],
        },
        {
          text: "Skill cast lengths and hit frames of every class follow the in-game timings.",
          authors: ["M1zuke"],
        },
        {
          text: "Shared mystic arts, gear sets and inner ways use their in-game values.",
          authors: ["M1zuke"],
        },
        {
          text: "The fight timer runs from the first damaging hit to the last one, unless the rotation sets a fixed window.",
          authors: ["M1zuke"],
        },
        {
          text: "Every time shown counts from the first damaging hit, with negative times before it.",
          authors: ["M1zuke"],
        },
        {
          text: "The Qi break is always computed from your damage; it can no longer be set by hand.",
          authors: ["M1zuke"],
        },
        {
          text: "The hit that empties the Qi bar no longer counts as landing on a broken target.",
          authors: ["M1zuke"],
        },
        {
          text: "Cancel forms add their Deflect Cancel automatically, so rotations no longer place it by hand.",
          authors: ["M1zuke"],
        },
        {
          text: "New profiles and class switches fill empty inner-way slots with the class's standard inner ways.",
          authors: ["M1zuke"],
        },
        {
          text: "Silkbind Jade's 2.0 DH and Bellstrike Umbra's 36 BB's and 38 BB's rotations follow updated routes.",
          authors: ["M1zuke"],
        },
        {
          text: "Skills no class casts in PvE, such as Healer Extension, are removed; saved rotation steps are kept.",
          authors: ["M1zuke"],
        },
        {
          text: "Bamboocut Draught's Nightwick skill is removed; saved rotations now cast Tipsylay.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "The Skill Editor's trigger column names meter, cooldown and status triggers instead of asking for a target.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
