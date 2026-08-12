import { writeFileSync } from "node:fs"

// A regenerated fixture is committed, so it has to satisfy `format:check` the
// same as any other file. Writing it through Prettier keeps that automatic
// rather than a step the next regeneration has to remember.
export async function writeFixture(path: string, value: unknown): Promise<void> {
  const { format, resolveConfig } = await import("prettier")
  const options = await resolveConfig(path)
  writeFileSync(path, await format(JSON.stringify(value, null, 2), { ...options, filepath: path }))
}
