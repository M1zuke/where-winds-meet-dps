import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { classDefinition } from "../../src/definitions/classes/registry"
import { newCustomGraduationBuildId } from "../../src/engine/customGraduationBuild"
import type { CustomGraduationBuild } from "../../src/engine/customGraduationBuild"
import { GEAR_SLOTS } from "../../src/engine/types"
import { I18nProvider } from "../../src/i18n/I18nProvider"
import { CustomGraduationBuildEditor } from "../../src/ui/features/gear/custom-graduation-build-editor/CustomGraduationBuildEditor"

const CLASS = "bellstrikeUmbra"

function buildWithUnknownWord(): CustomGraduationBuild {
  const shipped = classDefinition(CLASS)!.graduationBuilds[0]
  const now = new Date().toISOString()
  return {
    id: newCustomGraduationBuildId(),
    name: "Mine",
    classId: CLASS,
    slots: GEAR_SLOTS.map((slot, index) => {
      const piece = shipped.gear.find((gear) => gear.slot === slot)!
      const words = piece.words.map((word) => word.word) as string[]
      if (index === 0) words[0] = "retiredWord"
      return {
        slot,
        words: words as unknown as CustomGraduationBuild["slots"][number]["words"],
        attunement: piece.attunement,
      }
    }),
    set: shipped.set,
    bowSet: shipped.bowSet,
    arsenal: shipped.arsenal,
    rotationId: shipped.rotationId,
    createdAt: now,
    updatedAt: now,
  }
}

describe("the custom graduation build editor with a stored word it no longer knows", () => {
  it("shows the stored word in its line instead of dropping it", () => {
    render(
      <I18nProvider>
        <CustomGraduationBuildEditor
          classId={CLASS}
          level={96}
          saved={buildWithUnknownWord()}
          copyFrom={[]}
          onChanged={() => {}}
          onFollow={() => {}}
        />
      </I18nProvider>,
    )
    expect(screen.getByDisplayValue("retiredWord")).toBeInTheDocument()
  })
})
