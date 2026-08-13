# Adding a changelog entry

The in-app changelog is reachable from the version control next to the title.
Everything it shows lives in this folder:

| path            | holds                                                          |
| --------------- | -------------------------------------------------------------- |
| `types.ts`      | the format — read it for the authoritative field shapes         |
| `registry.ts`   | `CHANGELOG_ENTRIES`, newest first, one lazy loader per version   |
| `entries/v*.ts` | one module per release, holding that release's grouped changes   |

The rule that the header version comes from `package.json`, and nothing else, is
stated in `docs/UI.md`.

## Procedure

1. **Pick the new version.** Patch bump (`x.y.Z`) for fixes only. Minor bump
   (`x.Y.0`) when something new becomes selectable, or a new panel or analysis
   appears.
2. **Set `"version"` in `package.json`** to the chosen version. Nothing else in
   the repo declares the app version — do not add a second place that names it.
3. **Gather the material.** Run:

   ```
   git log --no-merges --reverse --format="%an|%s" <previous release commit>..HEAD
   ```

   Keep only what a player would notice. Drop refactors, tests, docs and chores
   unless they change visible behaviour. Rewrite each kept line as one
   player-facing sentence. Be thorough — a release that shipped a lot should read
   as though it did, so do not compress ten visible changes into three lines.

   Each item is the **end state against the previous release**, not the path the
   commits took to reach it. The reader upgraded from one published version to
   this one, so everything in between is invisible to them. A commit that fixed,
   refined or reverted something introduced earlier in the same range is not its
   own item — it folds into the item for the thing itself, or it disappears; a
   feature and the fix that corrected it before release are one line, describing
   what actually ships. A `Changed` item needs a prior published state to have
   changed from: if the thing it changes is new in this release, it belongs in
   that `Added` line or nowhere. Read the drafted sections against each other
   before writing and strike any two lines a player would experience as one
   change — thoroughness means covering every visible change once, not counting
   one twice because two commits touched it.

   The author column is not optional context: every item names at least one
   GitHub login, so map each sentence back to the commit it came from rather than
   crediting a whole release to one person. When several commits by different
   people add up to one line, list all of them — the entry shows an avatar per
   author.

4. **Create the entry module**, `entries/v<version with dots replaced by
   dashes>.ts` (e.g. version `x.y.z` → `entries/vx-y-z.ts`), exporting `details`.
   Group the sentences into sections in the canonical order — `Added`, then
   `Changed`, then `Fixed` — and omit a section entirely rather than leaving it
   empty.

   ```ts
   import type { ChangelogEntryDetails } from "../types"

   export const details: ChangelogEntryDetails = {
     sections: [
       {
         label: "Added",
         items: [{ text: "What a player can now do.", authors: ["SomeLogin"] }],
       },
       {
         label: "Fixed",
         items: [{ text: "What used to be wrong.", authors: ["SomeLogin", "OtherLogin"] }],
       },
     ],
   }
   ```

5. **Prepend the row** to `CHANGELOG_ENTRIES` in `registry.ts`: version, release
   date, a short headline, and a dynamic `import()` of the new module. Keep the
   import dynamic — that is what keeps each release's changes out of the initial
   bundle, and out of the dialog until that version is selected.

   ```ts
   {
     version: "x.y.z",
     date: "2026-01-01",
     headline: "What the release is about",
     loadDetails: () => import("./entries/vx-y-z").then((module) => module.details),
   }
   ```

6. **Never edit a published entry module** except to correct a factual error, and
   never reorder or delete one. The registry's order is the release history.
7. **Run the gates**: `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
   `tests/data/changelogFormat.test.ts` fails on a version mismatch between
   `package.json`, the registry and the entry files, a missing or orphaned entry
   module, an unattributed item, or a malformed section — that is what it is for.

## Field reference

`types.ts` is authoritative for the shape. The constraints the tests enforce:

| field                        | rule                                                                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `version`                    | `MAJOR.MINOR.PATCH`; unique; the registry's first entry equals `package.json`'s version; strictly descending down the list      |
| `date`                       | `YYYY-MM-DD`; non-increasing from newest to oldest                                                                             |
| `headline`                   | one line, at most 60 characters, no trailing period                                                                            |
| `sections[].label`           | `Added`, `Changed` or `Fixed`; at most one of each; canonical order                                                            |
| `sections[].items[].text`    | 1–25 per section, each one line, at most 120 characters, player-facing, and not restating its own section label                 |
| `sections[].items[].authors` | at least one GitHub login, taken from the commits that shipped that line; every author gets an avatar linking to their profile  |
| entry module filename        | `vx-y-z.ts` for version `x.y.z`; exactly one module per registry entry, no orphans                                             |

Use a placeholder version (`x.y.z` / `vx-y-z`) in any example you add here — do
not invent a real-looking version number.
