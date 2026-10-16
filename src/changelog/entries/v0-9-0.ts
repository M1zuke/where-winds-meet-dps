import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Breakthroughs 18 to 21 are available with their world level stats, talent caps and inner way values.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear enhancement reaches level 75, and each slot defaults to the highest level its gear and breakthrough allow.",
          authors: ["M1zuke"],
        },
        {
          text: "Each enhancement card shows the level a higher gear level would unlock.",
          authors: ["M1zuke"],
        },
        {
          text: "Mystic arts can be raised to level 76.",
          authors: ["M1zuke"],
        },
        {
          text: "The season 5 talent board nodes unlocked at world level 18 are available.",
          authors: ["M1zuke"],
        },
        {
          text: "The Qingzhou oddity board is available, with oddity Endurance and Vitality capped as in the game.",
          authors: ["M1zuke"],
        },
        {
          text: "Gear from level 100 rolls All Mystic Skill DMG Boost in place of the two separate mystic boosts.",
          authors: ["M1zuke"],
        },
        {
          text: "The target's Qi is shown in the cast timeline and the Rotation Editor.",
          authors: ["M1zuke"],
        },
        {
          text: "The gear editor shows each tunement's roll chance.",
          authors: ["M1zuke"],
        },
        {
          text: "Every rollable defensive gear line can be selected.",
          authors: ["M1zuke"],
        },
        {
          text: "Silkbind Jade gains Combo - Extend Mark and the water-clone return.",
          authors: ["M1zuke"],
        },
        {
          text: "Wushuang Stance enables Vagrant Sword's three-wave release, and a level-1 bolt form while the stance is up.",
          authors: ["M1zuke"],
        },
        {
          text: "Insightful Strike's Focus builds, decays and refills as a resource, from each hit's own affinity chance.",
          authors: ["M1zuke"],
        },
        {
          text: "Casts move by the distance their animation covers, stopping at the target or passing through it.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Inner Passion lasts 14 s and Exhausted needs 75% crit rate, as in the latest game update.",
          authors: ["M1zuke"],
        },
        {
          text: "Reveldrift deals half damage, and Lingering Bone lasts 5 s on bosses.",
          authors: ["M1zuke"],
        },
        {
          text: "Blossom Barrage uses its reworked form, including Spring Sorrow's charges at rank 6.",
          authors: ["M1zuke"],
        },
        {
          text: "Crosswind Blade is renamed Zenith Sword.",
          authors: ["M1zuke"],
        },
        {
          text: "Hawkwing, Etherwrath, Insightful Strike and Wine Gu use their updated values.",
          authors: ["M1zuke"],
        },
        {
          text: "The bow set bonus grows with the gear level instead of staying fixed.",
          authors: ["M1zuke"],
        },
        {
          text: "Skills start without a server wait in the training hall and dungeons, except those the game makes wait.",
          authors: ["M1zuke"],
        },
        {
          text: "Each martial art owns its own weapon slot, labelled with the art's name.",
          authors: ["M1zuke"],
        },
        {
          text: "A self-made graduation build is rated on its class's standard encounter.",
          authors: ["M1zuke"],
        },
        {
          text: "Max (94%) and FP name the gear level they are measured at.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Skill timings across the validated classes follow the in-game frames, down to fractions of a frame.",
          authors: ["M1zuke"],
        },
        {
          text: "Splendor's flying blades and Silkbind Jade's bullets land after their flight.",
          authors: ["M1zuke"],
        },
        {
          text: "Qi Imbalance applies on the hit, and Endless Gale restarts and dispels as in the game.",
          authors: ["M1zuke"],
        },
        {
          text: "Silkbind Jade's casts wait for Lingering Bone, Windrider, cooldowns and recharging charges.",
          authors: ["M1zuke"],
        },
        {
          text: "Bamboocut Draught banks Binge Points and gates Reveldrift, Tipsylay and the empowered skills as the game does.",
          authors: ["M1zuke"],
        },
        {
          text: "Burning Heart releases stage 1 when Blade Momentum is short and drains Endurance while charging.",
          authors: ["M1zuke"],
        },
        {
          text: "Umbra's Bleeding scales with Max Physical Attack, and Sword Horizon returns its two stacks as the Blood Burst lands.",
          authors: ["M1zuke"],
        },
        {
          text: "Damage-over-time effects tick on the game's own timer, so Bleeding ticks every 1023 ms.",
          authors: ["M1zuke"],
        },
        {
          text: "Hits landing on the same frame see each other's buffs, such as Throat-Pierced stacks.",
          authors: ["M1zuke"],
        },
        {
          text: "A cast's chips show once every hit it triggered has landed.",
          authors: ["M1zuke"],
        },
        {
          text: "Attack rate bonuses are pooled the way the game does, with flat attack bonuses outside the pool.",
          authors: ["M1zuke"],
        },
        {
          text: "The second back-to-back SnowpartingSlide prepull skips the server wait, and the Vagrant Sword prepull is shorter.",
          authors: ["M1zuke"],
        },
        {
          text: "The relayed benchmark breaks the boss's Qi where the max-roll benchmark does.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
