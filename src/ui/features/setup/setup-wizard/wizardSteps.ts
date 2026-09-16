export type WizardStep = "class" | "graduation" | "import" | "name"

export function wizardSteps(graduationBuildCount: number, manual: boolean): WizardStep[] {
  const steps: WizardStep[] = ["class"]
  if (graduationBuildCount > 1) steps.push("graduation")
  steps.push("import")
  if (manual) steps.push("name")
  return steps
}
