// Pins for Silkbind Jade built-ins. Byte-identical ids from reference JSON.
export const SKILL = {
  fanq: "silkbindJade-fanq",
  fanqcancel: "silkbindJade-fanqcancel",
  fanqPrepull: "silkbindJade-fanq-prepull",
  fanLightCharged: "silkbindJade-fanlightcharged",
  fanSpecial: "silkbindJade-fanspecial",
  fanHeavyPursuit3Hit: "silkbindJade-fanheavypursuit-3-hit",
  umbq: "silkbindJade-umbq",
  umbqPrepull: "silkbindJade-umbq-prepull",
  umbLightCharge: "silkbindJade-umblightcharge",
  umbHeavyLight: "silkbindJade-umb-heavylight",
  umbDroneLaunch26Hit: "silkbindJade-umbdronelaunch-26hit",
  healerBuff: "silkbindJade-healer-buff",
  bitterSeasonTick: "silkbindJade-bitter-season-tick",
} as const

export const DEBUFF = {
  umbDrone26Hit: "debuff-silkbindJade-umbdrone-26hit",
  bitterSeasonTick: "debuff-silkbindJade-bitter-season-tick",
} as const

// No timeline gate statuses known from the reference set; add if needed.
export const STATUS = {} as const
