export type WizardStep = "class" | "pingFps" | "graduation" | "import" | "name"

export function wizardSteps(graduationBuildCount: number, manual: boolean): WizardStep[] {
  const steps: WizardStep[] = ["class", "pingFps", "import"]
  if (manual) steps.push("name")
  if (graduationBuildCount > 1) steps.push("graduation")
  return steps
}
