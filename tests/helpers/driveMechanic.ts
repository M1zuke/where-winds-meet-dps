import type {
  MechanicEvent,
  MechanicHost,
  MechanicSetup,
  TimelineMechanic,
} from "../../src/engine/mechanics/types"

interface DriveOptions {
  hitTimesSec: readonly number[]
  windowEndSec: number
}

export function driveMechanic<State>(
  mechanic: TimelineMechanic<State>,
  setup: MechanicSetup,
  options: DriveOptions,
): MechanicEvent[] {
  const state = mechanic.prepare(setup)
  if (state === null) return []
  const windowEndFrame = Math.round(options.windowEndSec * setup.fps)
  const scheduled: MechanicEvent[] = []
  const pendingExtras: MechanicEvent[] = []
  const host = {
    hasStatus: () => false,
    statusDurationFrames: () => null,
    scheduleExtra: (event: MechanicEvent) => {
      if (event.frame > windowEndFrame) return
      scheduled.push(event)
      pendingExtras.push(event)
    },
  } as unknown as MechanicHost
  mechanic.start?.(state, host, setup)
  const hitFrames = options.hitTimesSec.map((timeSec) => Math.round(timeSec * setup.fps))
  let hitIndex = 0
  for (;;) {
    pendingExtras.sort((left, right) => left.frame - right.frame)
    const nextHit = hitIndex < hitFrames.length ? hitFrames[hitIndex] : Infinity
    const nextExtra = pendingExtras[0]?.frame ?? Infinity
    if (nextHit === Infinity && nextExtra === Infinity) break
    if (nextHit <= nextExtra) {
      mechanic.observeEvent?.(
        state,
        {
          source: "hit",
          timeSec: nextHit / setup.fps,
          occurrence: 1,
          direct: true,
          canRollAffinity: true,
          affinityChance: 0,
        },
        setup,
        host,
      )
      hitIndex++
    } else {
      const extra = pendingExtras.shift()!
      mechanic.observeEvent?.(
        state,
        {
          source: "extra",
          timeSec: extra.frame / setup.fps,
          occurrence: 1,
          direct: extra.direct,
          canRollAffinity: extra.art.guaranteedNormal !== 1,
          affinityChance: 0,
        },
        setup,
        host,
      )
      mechanic.afterExtraEvent?.(state, extra, host, setup)
    }
  }
  return scheduled
}
