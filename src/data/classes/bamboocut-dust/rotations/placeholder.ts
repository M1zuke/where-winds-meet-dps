import { defineRotation } from "../../../../definitions/rotations/rotationDef"

export default defineRotation({
  id: "builtin-bamboocutDust-placeholder",
  name: "Placeholder",
  classId: "bamboocutDust",
  steps: [
    { skillId: "bamboocutDust-scarlet-spin" },
    { skillId: "bamboocutDust-perfect-catch-after-first" },
    { skillId: "bamboocutDust-perfect-catch-after-second" },
    { skillId: "bamboocutDust-perfect-catch-after-third" },
    { skillId: "bamboocutDust-dreamwrought-bubbles" },
    { skillId: "bamboocutDust-cyclone-waltz" },
  ],
  permanentBuffIds: [],
  openingStacks: {},
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
  description:
    "Stand-in rotation while the class is being built: one full Scarlet Spin chain, then the umbrella's charged and special skills.",
})
