import type { BuffEngine } from "./buffEngine"

export const onApplyHandlers: Record<string, (engine: BuffEngine, time: number) => void> = {
  lingeringBone(engine, time) {
    if (!engine.params.starReacher) return
    const phase = engine.qiPhase(time)
    if (phase === "exhausted") engine.applyBuff("starReacherExhausted", time)
    else if (phase === "below30") engine.applyBuff("starReacherBelow30", time)
    else engine.applyBuff("starReacherNormal", time)
  },
  throatPiercedDeflect(engine, time) {
    engine.applyBuff("throatPierced", time, null, 5)
  },
}
