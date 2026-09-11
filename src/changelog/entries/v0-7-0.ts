import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "Bamboocut Draught is selectable and validated, with its Binge Point loop, Tiltrim and its four inner ways.",
          authors: ["M1zuke"],
        },
        {
          text: "Its one-minute dummy rotation is the class default, with cancel forms ending where the game opens its interrupt window.",
          authors: ["M1zuke"],
        },
        {
          text: "A Runs panel lists every simulated parse and opens one for its breakdown; the Outcome Mix shows damage per outcome.",
          authors: ["M1zuke"],
        },
        {
          text: "The simulation run count accepts 10 to 10,000 and starts at 100.",
          authors: ["M1zuke"],
        },
        {
          text: "A Script setting picks Wraithstrike or Voidrot, raising critical or affinity damage while the target's Qi is low.",
          authors: ["M1zuke"],
        },
        {
          text: "Fire Oil applies Burn, which ticks every second and appears on its own Divinecraft - Fire row.",
          authors: ["M1zuke"],
        },
        {
          text: "Mistwing's tier-six penetration climbs as the target loses health, against the health pool of the chosen breakthrough.",
          authors: ["M1zuke"],
        },
        {
          text: "A damage-over-time tick follows the game's cadence: its own first-tick timing, and a timer that runs a little long.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Every mystic art is authored once and shared by every class, so each class carries the flute, breath and toad effects.",
          authors: ["M1zuke"],
        },
        {
          text: "A pre-pull cast only sets up: it adds no damage, no breakdown row and no echo, and a grant-only cast shows no row.",
          authors: ["M1zuke"],
        },
        {
          text: "A skill that cannot trigger Abrasion follows the game's roll: a failed precision roll is a normal hit, never a crit.",
          authors: ["M1zuke"],
        },
        {
          text: "The Qi-break bonus multiplies on its own instead of joining the additive damage-boost sum.",
          authors: ["M1zuke"],
        },
        {
          text: "Every damage event is scored in time order, so a status a tick applies reaches the hits that follow it.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Umbra's bonuses reach only the rows the game gives them, and the spear charged art uses its own coefficients.",
          authors: ["M1zuke"],
        },
        {
          text: "Blood Burst counts as an empowered damage-over-time effect, and Strategic Sword scales the bleed coefficients.",
          authors: ["M1zuke"],
        },
        {
          text: "Critical and affinity damage multipliers are clamped as in game.",
          authors: ["M1zuke"],
        },
        {
          text: "Dummy mode keeps every debuff the player applies on the target and drops only the target's own vulnerability.",
          authors: ["M1zuke"],
        },
        {
          text: "Bellstrike Splendor is validated against a measured build.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "Cleftpeak's per-stack bonus applies to every class that can wear the set.",
          authors: ["M1zuke"],
        },
        {
          text: "Mistwillow's four-piece bonus no longer reaches the spear arts, and its stance opens only from the attacks that open it.",
          authors: ["M1zuke"],
        },
        {
          text: "Dragon Head's low-health bonus covers both of its variants.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
