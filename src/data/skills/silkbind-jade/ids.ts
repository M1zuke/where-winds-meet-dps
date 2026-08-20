// Pins for Silkbind Jade built-ins. Byte-identical ids from reference JSON.
export const SKILL = {
  fanq: "silkbindJade-fanq",
  fanqcancel: "silkbindJade-fanqcancel",
  fanqPrepull: "silkbindJade-fanq-prepull",
  fanLightCharged: "silkbindJade-fanlightcharged",
  fanSpecial: "silkbindJade-fanspecial",
  fanHeavyPursuit3Hit: "silkbindJade-fanheavypursuit-3-hit",
  fanHeavyPursuit5Hit: "silkbindJade-fanheavypursuit-5-hit",
  umbq: "silkbindJade-umbq",
  umbqPrepull: "silkbindJade-umbq-prepull",
  umbLightCharge: "silkbindJade-umblightcharge",
  umbHeavyLight: "silkbindJade-umb-heavylight",
  umbDroneLaunch26Hit: "silkbindJade-umbdronelaunch-26hit",
  healerBuff: "silkbindJade-healer-buff",
  bitterSeasonTick: "silkbindJade-bitter-season-tick",
  springSorrow: "silkbindJade-spring-sorrow",
  letSpringGo: "silkbindJade-let-spring-go",
  everbloom: "silkbindJade-everbloom",
  umbrellaLight: "silkbindJade-umbrella-light",
  springAway: "silkbindJade-spring-away",
} as const

export const DEBUFF = {
  umbDrone26Hit: "debuff-silkbindJade-umbdrone-26hit",
  bitterSeasonTick: "debuff-silkbindJade-bitter-season-tick",
  combo: "debuff-silkbindJade-combo",
  collapse: "debuff-silkbindJade-collapse",
  disintegration: "debuff-silkbindJade-disintegration",
  spiritDepletion: "debuff-silkbindJade-spirit-depletion",
  springThunder: "debuff-silkbindJade-spring-thunder",
} as const

// No timeline gate statuses known from the reference set; add if needed.
export const STATUS = {} as const
