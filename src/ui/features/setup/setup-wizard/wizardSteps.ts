export type WizardStep = "class" | "graduation" | "import" | "name"

export function wizardSteps(graduationBuildCount: number, manual: boolean): WizardStep[] {
  const steps: WizardStep[] = ["class", "import"]
  if (manual) steps.push("name")
  if (graduationBuildCount > 1) steps.push("graduation")
  return steps
}
