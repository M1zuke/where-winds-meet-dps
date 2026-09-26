import type { BuffParams } from "./buffEngine"

// The one place `Inputs.buffParams`' `<param>Tier` wire-key convention is
// written — every reader goes through `paramOnOf`/`paramTierOf` instead of
// rebuilding the key itself. A leaf module with no other imports, so a data
// file that only needs a build param's tier can read it without importing
// `params.ts`'s own transitive imports (the inner-way registry, in
// particular — a real cycle for a file the registry itself pulls in).
function tierKey(param: string): string {
  return param + "Tier"
}

export function paramOnOf(params: BuffParams, param: string): boolean {
  return !!params[param]
}

export function paramTierOf(params: BuffParams, param: string): number {
  const tier = params[tierKey(param)]
  return typeof tier === "number" ? tier : 0
}
