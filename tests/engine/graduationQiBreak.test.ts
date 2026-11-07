// Scoped to Bellstrike Umbra, the class whose default build follows a graduation build.
import { describe, expect, it } from "vitest"
import { defaultInputs } from "../../src/engine/defaults"
import { classDefinition } from "../../src/definitions/classes/registry"
import { graduationInputs, graduationQiSourceInputs } from "../../src/engine/graduation"
import { graduationQiDamageLog, qiDamageLogOfSource, runEngine } from "../../src/engine/dps"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { applySetBonuses } from "../../src/engine/setBonuses"
import {
  computeGraduationQiLog,
  computeParseRunDetail,
  computeParseSimulation,
} from "../../src/engine/dpsWorker"
import { defaultRotationForClass } from "../../src/engine/builtinLibrary"
import { engineRunOptionsSharingQiOf } from "../../src/engine/qiBar"
import type { Inputs } from "../../src/engine/types"

const FOLLOWING: Inputs = {
  ...defaultInputs,
  graduationBuildId: classDefinition(defaultInputs.classId)!.graduationBuilds[0].id,
}

const WITHOUT_BUILD: Inputs = {
  ...defaultInputs,
  graduationBuildId: null,
  customGraduationBuild: null,
}

function engineReady(inputs: Inputs): Inputs {
  return applySetBonuses(withDerivedStats(inputs))
}

function withMorePhysMax(inputs: Inputs, amount: number): Inputs {
  return { ...inputs, phys: { ...inputs.phys, max: inputs.phys.max + amount } }
}

describe("the graduation Qi break setting", () => {
  it("defaults to on", () => {
    expect(defaultInputs.useGraduationQiBreak).toBe(true)
  })

  it("spends the Qi log of the followed build's max-roll benchmark on the profile's own rotation", () => {
    const source = graduationQiSourceInputs(FOLLOWING)!
    const expected = runEngine(
      engineReady(FOLLOWING),
      engineRunOptionsSharingQiOf(runEngine(engineReady(source), { qiBar: "own" })),
    )

    const actual = runEngine(engineReady(FOLLOWING))

    expect(actual.qiBreaks).toEqual(expected.qiBreaks)
    expect(actual.qiTrace).toBeDefined()
    expect(actual.qiTrace).toEqual(expected.qiTrace)
    expect(actual.dps).toBe(expected.dps)
  })

  it("keeps the graduation break when a gear stat rises", () => {
    const base = engineReady(FOLLOWING)
    const raised = withMorePhysMax(base, 800)
    const baseRun = runEngine(base)
    const raisedRun = runEngine(raised)

    expect(raisedRun.qiBreaks).toEqual(baseRun.qiBreaks)
    expect(raisedRun.dps).toBeGreaterThan(baseRun.dps)
  })

  it("lets the own bar move with damage when the setting is off", () => {
    const base = engineReady({ ...FOLLOWING, useGraduationQiBreak: false })
    const raised = withMorePhysMax(base, 20000)

    expect(runEngine(raised).qiBreaks).not.toEqual(runEngine(base).qiBreaks)
  })

  it("matches the explicit own bar and the unchanged behaviour when the setting is off", () => {
    const off = engineReady({ ...FOLLOWING, useGraduationQiBreak: false })

    expect(runEngine(off)).toEqual(runEngine(off, { qiBar: "own" }))
  })

  it("runs on the own bar when asked to, whatever the setting says", () => {
    const on = engineReady(FOLLOWING)
    const off = engineReady({ ...FOLLOWING, useGraduationQiBreak: false })

    expect(runEngine(on, { qiBar: "own" })).toEqual(runEngine(off))
  })

  it("uses the own bar without a followed graduation build", () => {
    const ready = engineReady(WITHOUT_BUILD)

    expect(graduationQiSourceInputs(WITHOUT_BUILD)).toBeNull()
    expect(runEngine(ready)).toEqual(runEngine(ready, { qiBar: "own" }))
  })

  it("leaves an explicit Qi log in charge", () => {
    const ready = engineReady(FOLLOWING)
    const ownLog = runEngine(ready, { qiBar: "own" }).qiDamageLog!

    expect(runEngine(ready, { qiDamageLog: ownLog })).toEqual(runEngine(ready, { qiBar: "own" }))
  })

  it("simulates the source's own bar rather than recursing", () => {
    const source = graduationQiSourceInputs(FOLLOWING)!

    expect(source.useGraduationQiBreak).toBe(false)
    expect(graduationQiDamageLog(source)).toBeNull()
  })

  it("takes the profile's rotation, inner ways and encounter into the source", () => {
    const encounter: Inputs = { ...FOLLOWING, dummyMode: true, food: null }
    const source = graduationQiSourceInputs(encounter)!

    expect(source.dummyMode).toBe(true)
    expect(source.food).toBeNull()
    expect(source.mindMethods).toEqual(encounter.mindMethods)
    expect(source.selectedBuiltinRotationId).toBe(encounter.selectedBuiltinRotationId)
    expect(source.activeCustomRotation).toBe(encounter.activeCustomRotation)
  })

  it("is the same source whether built from configured or engine-ready inputs", () => {
    const fromConfigured = graduationQiSourceInputs(FOLLOWING)!
    const fromEngineReady = graduationQiSourceInputs(withMorePhysMax(engineReady(FOLLOWING), 500))!

    expect(qiDamageLogOfSource(fromEngineReady)).toEqual(qiDamageLogOfSource(fromConfigured))
  })

  it("answers the worker request with the log the pass spends", () => {
    const source = graduationQiSourceInputs(FOLLOWING)!
    const response = computeGraduationQiLog({ reqId: 7, source })

    expect(response.reqId).toBe(7)
    expect(response.qiDamageLog).toEqual(graduationQiDamageLog(FOLLOWING))
    expect(runEngine(engineReady(FOLLOWING), { qiDamageLog: response.qiDamageLog! })).toEqual(
      runEngine(engineReady(FOLLOWING)),
    )
  })

  it("leaves the benchmark simulating its own bar", () => {
    expect(graduationInputs(FOLLOWING)!.useGraduationQiBreak).toBe(false)
    expect(graduationInputs(FOLLOWING, "relayed")!.useGraduationQiBreak).toBe(false)
  })

  it("simulates a seeded parse run on the own bar whatever the setting says", async () => {
    const rotation = defaultRotationForClass(FOLLOWING.classId)
    const request = { reqId: 1, rotation, runs: 3, seed: 20261021 }
    const withSetting = await computeParseSimulation({ ...request, inputs: engineReady(FOLLOWING) })
    const withoutSetting = await computeParseSimulation({
      ...request,
      inputs: engineReady({ ...FOLLOWING, useGraduationQiBreak: false }),
    })

    expect(withSetting.runs).toEqual(withoutSetting.runs)
  })

  it("details a seeded parse run on the own bar whatever the setting says", () => {
    const rotation = defaultRotationForClass(FOLLOWING.classId)
    const request = { reqId: 1, rotation, seed: 20261021 }
    const withSetting = computeParseRunDetail({ ...request, inputs: engineReady(FOLLOWING) })
    const withoutSetting = computeParseRunDetail({
      ...request,
      inputs: engineReady({ ...FOLLOWING, useGraduationQiBreak: false }),
    })

    expect(withSetting).toEqual(withoutSetting)
  })
})
