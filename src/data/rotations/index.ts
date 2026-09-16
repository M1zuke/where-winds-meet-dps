import type { RotationDef } from "../../definitions/rotations/rotationDef"

const ROTATION_MODULES = import.meta.glob<RotationDef>("../classes/*/rotations/*.ts", {
  eager: true,
  import: "default",
})

export const ROTATIONS: readonly RotationDef[] = Object.values(ROTATION_MODULES)
