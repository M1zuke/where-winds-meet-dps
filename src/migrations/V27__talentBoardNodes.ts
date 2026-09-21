// v26 → v27 — talent points were stored as `disabledTalentPoints`, a map from a
// tier name ("95.1", "95.2", "100.1", "100.2") to the 1-based indices of the
// collapsed entries switched off inside it. The board stores the ids of the
// nodes themselves, so each stored index becomes the node ids of the grid
// position it stood for - all of its ranks - and the chain closes over them.
import type { Migration, RawProfilesBlob } from "./types"
import { closeDisabledTalentNodes } from "../definitions/baseStats"

const LEGACY_NODE_IDS: Readonly<Record<string, readonly (readonly number[])[]>> = {
  "95.1": [
    [101071],
    [101051],
    [101061],
    [101111],
    [101101],
    [101181],
    [101171],
    [101191],
    [101241],
    [101231],
    [101381],
    [101361],
    [101371],
    [101441, 101452, 101463, 101474],
    [101401, 101412, 101423, 101434],
    [101501],
    [101481],
    [102501],
    [102511],
    [102521],
    [102611],
    [102601],
    [102531],
    [102541],
    [102551],
    [102561],
    [102681, 102692],
    [102701, 102712],
    [102571],
    [103011],
    [103021],
    [103031],
    [103041],
    [103131, 103142],
    [103151, 103162],
    [101321, 101332, 101343, 101354],
    [102641, 102652],
    [102741, 102752],
    [101281, 101292, 101303, 101314],
    [102621, 102632],
    [102721, 102732],
  ],
  "95.2": [
    [103051],
    [103061],
    [103071],
    [103081],
    [103201],
    [103191],
    [103231, 103242],
    [103211, 103222],
  ],
  "100.1": [
    [104011],
    [104021],
    [104031],
    [104041],
    [104071],
    [104061],
    [104101, 104111],
    [104081, 104091],
  ],
  "100.2": [
    [104121],
    [104131],
    [104141],
    [104151],
    [104181],
    [104171],
    [104211, 104221],
    [104191, 104201],
  ],
}

function isRec(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value)
}

export function talentNodesFromLegacyPoints(stored: unknown): number[] {
  if (!isRec(stored)) return []
  const disabled: number[] = []
  for (const [tier, indices] of Object.entries(stored)) {
    const tierNodes = LEGACY_NODE_IDS[tier]
    if (!tierNodes || !Array.isArray(indices)) continue
    for (const index of indices) {
      if (typeof index !== "number") continue
      disabled.push(...(tierNodes[index - 1] ?? []))
    }
  }
  return closeDisabledTalentNodes(disabled)
}

function migrateInputs(inputs: Record<string, unknown>): Record<string, unknown> {
  if (!("disabledTalentPoints" in inputs)) return inputs
  const { disabledTalentPoints, ...rest } = inputs
  return { ...rest, disabledTalentNodes: talentNodesFromLegacyPoints(disabledTalentPoints) }
}

export const V27__talentBoardNodes: Migration = {
  to: 27,
  name: "V27__talentBoardNodes",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    const profiles = Array.isArray(blob.profiles)
      ? blob.profiles.map((profile) =>
          isRec(profile) && isRec(profile.inputs)
            ? { ...profile, inputs: migrateInputs(profile.inputs) }
            : profile,
        )
      : blob.profiles
    return { ...blob, v: 27, profiles }
  },
}
