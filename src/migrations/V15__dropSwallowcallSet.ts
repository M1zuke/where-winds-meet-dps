// v14 → v15 — Swallowcall is a modelled armor set again, so this hop now
// clears nothing; it stays registered, at its own version, purely so a v14
// profile still has a v15 to step through on its way to the latest.
import type { Migration, RawProfilesBlob } from "./types"

export const V15__dropSwallowcallSet: Migration = {
  to: 15,
  name: "V15__dropSwallowcallSet",
  migrate(blob: RawProfilesBlob): RawProfilesBlob {
    return { ...blob, v: 15 }
  },
}
