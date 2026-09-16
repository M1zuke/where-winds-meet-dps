import { fireEvent, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { defaultInputs } from "../../src/engine/defaults"
import { graduationInputs } from "../../src/engine/graduation"
import { statLineLabel } from "../../src/data/stats/statLines"
import { getAttunement } from "../../src/engine/attunements"
import { applyArmorSet, applyBowSet, effectiveRates } from "../../src/engine/panel"
import { withDerivedStats } from "../../src/engine/derivedInputs"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { finalHitOutcomeRates } from "../../src/ui/components/stats-overview-panel/finalHitOutcomeRates"
import { GraduationBuildDialog } from "../../src/ui/features/gear/graduation-build-dialog/GraduationBuildDialog"
import { fmt } from "../../src/ui/utils/statFormatting"

vi.mock("../../src/definitions/graduationBuilds/registry", async (importOriginal) => {
  const testClassId = "bellstrikeUmbra"
  type Registry = typeof import("../../src/definitions/graduationBuilds/registry")
  const actual = await importOriginal<Registry>()
  const { defineGraduationBuild } =
    await import("../../src/definitions/graduationBuilds/graduationBuildDef")
  const { createGraduationGearPiece } = await import("../../src/data/classes/graduationGear")
  const { SET_ID } = await import("../../src/data/sets/ids")
  const rotation = (await import("../../src/data/classes/bellstrike-umbra/rotations/38Bbs")).default

  const gearFor = (idPrefix: string) =>
    (
      [
        ["leftWeapon", ["maxPhys", "maxPhys", "power", "swordBoost", "momentum"], "physPen"],
        ["rightWeapon", ["maxPhys", "maxPhys", "power", "affinity", "momentum"], "physPen"],
        ["disc", ["maxPhys", "maxPhys", "power", "allMartialBoost", "momentum"], "physPen"],
        ["pendant", ["maxPhys", "maxPhys", "power", "allMartialBoost", "momentum"], "physPen"],
        ["helm", ["affinity", "affinity", "power", "maxPhys", "momentum"], "bleedingDamage"],
        ["armor", ["affinity", "affinity", "power", "maxPhys", "momentum"], "bleedingDamage"],
        ["greaves", ["power", "power", "maxPhys", "damageVsBoss", "momentum"], "bleedingDamage"],
        ["bracer", ["power", "power", "maxPhys", "damageVsBoss", "momentum"], "bleedingDamage"],
      ] as const
    ).map(([slot, words, attunement]) =>
      createGraduationGearPiece({ idPrefix, slot, words, attunement }),
    )

  const relayedBowSet = defineGraduationBuild({
    id: "graduation-bellstrikeUmbra-test-relayed-bow-set",
    name: "Test Relayed Bow Set",
    classId: testClassId,
    gear: gearFor("graduation-test-relayed"),
    set: SET_ID.hawkwing,
    bowSet: "crit",
    arsenal: "bellstrike",
    rotationId: rotation.id,
    relayedOverrides: { bowSet: "affinity" },
  })

  const plain = defineGraduationBuild({
    id: "graduation-bellstrikeUmbra-test-plain",
    name: "Test Plain",
    classId: testClassId,
    gear: gearFor("graduation-test-plain"),
    set: SET_ID.hawkwing,
    bowSet: "crit",
    arsenal: "bellstrike",
    rotationId: rotation.id,
  })

  const builds = [relayedBowSet, plain]

  return {
    ...actual,
    allGraduationBuilds: () => [
      ...builds,
      ...actual.allGraduationBuilds().filter((build) => build.classId !== testClassId),
    ],
    graduationBuildsFor: (classId: string) =>
      classId === testClassId ? builds : actual.graduationBuildsFor(classId),
  }
})

// The dialog's word/base-stat literals below are the level-96 ladder values,
// so breakthrough 16 (gear level 96) keeps them meaningful.
const inputs = {
  ...defaultInputs,
  breakthrough: 16,
  graduationBuildId: "graduation-bellstrikeUmbra-test-relayed-bow-set",
}

describe("GraduationBuildDialog", () => {
  it("shows the class benchmark summary and all eight gear pieces", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={inputs}
          theoreticalDps={12345.67}
          relayedTheoreticalDps={11111.11}
          onFollowBuild={() => undefined}
          onCustomBuildsChanged={() => undefined}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole("dialog", { name: "Graduation build" })).toBeInTheDocument()
    expect(screen.getByText("Bellstrike Umbra")).toBeInTheDocument()
    expect(screen.getByText("DPS 12,345.67")).toBeInTheDocument()
    expect(screen.getByText("All enabled")).toBeInTheDocument()
    expect(screen.getAllByRole("article")).toHaveLength(8)
    expect(screen.getByRole("article", { name: "Left Weapon" })).toHaveTextContent(
      statLineLabel("swordBoost"),
    )
    expect(screen.getByRole("article", { name: "Helm" })).toHaveTextContent(
      getAttunement("bleedingDamage")!.label,
    )
  })

  it("relays every word, swaps to the relayed bow set and shows the relayed DPS", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={inputs}
          theoreticalDps={12345.67}
          relayedTheoreticalDps={11111.11}
          onFollowBuild={() => undefined}
          onCustomBuildsChanged={() => undefined}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    const summary = () => within(screen.getByRole("tabpanel")).getByText("Bow Set")
    expect(summary().nextElementSibling).toHaveTextContent("Crit")
    expect(screen.getByRole("article", { name: "Left Weapon" })).toHaveTextContent("77.8")

    fireEvent.click(screen.getByRole("checkbox", { name: /Relayed words/ }))

    expect(screen.getByText("DPS 11,111.11")).toBeInTheDocument()
    expect(summary().nextElementSibling).toHaveTextContent("Affinity")

    const relayedWeapon = screen.getByRole("article", { name: "Left Weapon" })
    expect(relayedWeapon).toHaveTextContent("73.13")
    expect(relayedWeapon).toHaveTextContent("46.44")
    expect(relayedWeapon).not.toHaveTextContent("77.8")
  })

  it("carries the relayed toggle into the panel stats", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={inputs}
          theoreticalDps={12345.67}
          relayedTheoreticalDps={11111.11}
          onFollowBuild={() => undefined}
          onCustomBuildsChanged={() => undefined}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByRole("tab", { name: "Panel Stats" }))
    const maxRollPhys = screen.getByText(statLineLabel("maxPhys")).parentElement?.textContent

    fireEvent.click(screen.getByRole("checkbox", { name: /Relayed words/ }))
    const relayedPhys = screen.getByText(statLineLabel("maxPhys")).parentElement?.textContent

    const relayed = applyBowSet(
      applyArmorSet(withDerivedStats(graduationInputs(inputs, "relayed")!)),
    )
    expect(relayedPhys).toContain(fmt(relayed.phys.max, false))
    expect(relayedPhys).not.toBe(maxRollPhys)
  })

  it("switches to the stats tab and reports the graduation build's panel stats", () => {
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={inputs}
          theoreticalDps={12345.67}
          relayedTheoreticalDps={11111.11}
          onFollowBuild={() => undefined}
          onCustomBuildsChanged={() => undefined}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    fireEvent.click(screen.getByRole("tab", { name: "Panel Stats" }))

    expect(screen.queryAllByRole("article")).toHaveLength(0)

    const benchmark = applyBowSet(applyArmorSet(withDerivedStats(graduationInputs(inputs)!)))
    const effective = effectiveRates(benchmark)
    const finalRates = finalHitOutcomeRates({
      precision: effective.precision,
      critRate: effective.critRate,
      directCritRate: benchmark.directCritRate,
      affinityRate: effective.affinityRate,
      directAffinityRate: benchmark.directAffinityRate,
    })

    expect(screen.getByText("Final Crit").parentElement).toHaveTextContent(
      fmt(finalRates.critRate, true),
    )
    expect(screen.getByText(statLineLabel("maxPhys")).parentElement).toHaveTextContent(
      fmt(benchmark.phys.max, false),
    )
  })

  it("focuses Close and dismisses from the keyboard", () => {
    const onClose = vi.fn()
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={{ ...defaultInputs, classId: "stonesplitStrength" }}
          theoreticalDps={null}
          relayedTheoreticalDps={null}
          onFollowBuild={() => undefined}
          onCustomBuildsChanged={() => undefined}
          onClose={onClose}
        />
      </I18nProvider>,
    )

    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(onClose).toHaveBeenCalledOnce()
  })

  it("cannot be dismissed while the profile follows no build", () => {
    const onFollowBuild = vi.fn()
    const builds = classDefinition(inputs.classId)!.graduationBuilds
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={{ ...inputs, graduationBuildId: null }}
          theoreticalDps={null}
          relayedTheoreticalDps={null}
          onFollowBuild={onFollowBuild}
          onCustomBuildsChanged={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.queryByRole("button", { name: "Close" })).toBeNull()
    expect(
      screen.getByText("Choose the build your graduation rate is measured against to continue."),
    ).toBeInTheDocument()
    fireEvent.keyDown(document, { key: "Escape" })
    expect(screen.getByRole("dialog", { name: "Graduation build" })).toBeInTheDocument()

    const radio = screen
      .getAllByRole("radio")
      .find((option) => (option as HTMLInputElement).value === builds[0].id)!
    fireEvent.click(radio)

    expect(onFollowBuild).toHaveBeenCalledWith(builds[0].id)
  })

  it("names the only build of a single-build class and offers no build choice", () => {
    const singleBuildInputs = { ...inputs, classId: "stonesplitStrength" }
    const [onlyBuild] = classDefinition(singleBuildInputs.classId)!.graduationBuilds
    render(
      <I18nProvider>
        <GraduationBuildDialog
          inputs={singleBuildInputs}
          theoreticalDps={12345.67}
          relayedTheoreticalDps={11111.11}
          onFollowBuild={() => undefined}
          onCustomBuildsChanged={() => undefined}
          onClose={() => undefined}
        />
      </I18nProvider>,
    )

    expect(screen.getByText(onlyBuild.name)).toBeInTheDocument()
    expect(screen.queryAllByRole("radio")).toHaveLength(0)
  })
})
