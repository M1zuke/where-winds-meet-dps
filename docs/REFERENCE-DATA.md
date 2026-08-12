# REFERENCE-DATA.md — dev-only reference material outside `src/`

Rules for the reference material the app does not ship.

## The one rule that binds all of it

**Nothing under `reference/` or `excels/` may be imported from `src/` or `tests/`.**
Most of it contains Chinese verbatim, and CLAUDE.md § "Language" requires the
English-only grep guard to return nothing. Copy values in by hand, or via their
English labels — never read these at runtime, and never in a test.

## What is there, and what it is for

| location              | what it is                                                                  | use it for                                     |
| --------------------- | --------------------------------------------------------------------------- | ---------------------------------------------- |
| `reference/locale/`   | official Chinese→English string pairs extracted from the game client        | naming a new domain term                       |
| `reference/formula/`  | the external damage-formula reference                                       | the calculation rules (CALCULATION.md)         |
| `reference/workbook/` | curated coefficient tables and a full cell dump from the community workbook | provenance for a coefficient baked into `src/` |
| `reference/classes/`  | the unimplemented classes' imported data                                    | building one of them out (CLASSES.md)          |
| `excels/`             | the workbook itself                                                         | re-deriving an extraction                      |

- **Naming a domain term**: look the Chinese up in the pair list and copy the
  official English. **Never hand-invent a term the game already names**
  (CLASSES.md § "Naming a new domain term").
- **Citing a coefficient's provenance**: cite the curated table, not the raw dump.
  The dump exists to trace where a value came from without opening the workbook.
- **A legacy subfolder is provenance only.** Anything kept there had no importer
  when it was moved out of `src/`, and re-importing it is not the intended use.

## Adding to it

- Reference data is **read by humans, not by code**. If something under here needs
  to reach the app, convert the values into a `src/data/` module — do not add an
  import.
- A generated extraction states its own generator. If the generator no longer
  exists, regenerating means writing it again — say so in the extraction rather
  than assuming the script is still there.
