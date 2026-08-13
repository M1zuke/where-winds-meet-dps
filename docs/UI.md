# UI.md — the UI layer and keeping it responsive

Rules for `src/ui/**`, the app shell, and the DPS worker. An engine pass is a full
60 fps timeline simulation, so heavy work stays off the main thread.

## The rules

1. **At most ONE synchronous engine pass per input change** — the baseline pass
   that feeds the DPS header. Anything that runs the engine more than once per
   change (ranking sweeps, per-piece deltas, tile variants, retunement and
   word-max analyses) goes through the shared worker client: add a request kind
   and a compute function there, and drive it from a hook shaped like the
   existing ones — a monotonic request id, subscribe on mount and unsubscribe on
   unmount, and an empty result **derived at the hook's return** from a
   module-level constant, never written back by a `setState` inside an effect.
   **Never** run the engine in a render-path memo outside that one baseline pass.
2. **Exactly one hook owns each request kind.** The client routes by kind alone,
   so a second subscriber to a kind receives the first one's results and their
   request-id counters collide.
3. **Never construct a worker in a hook.** The client owns a bounded, lazily
   grown pool and keeps it for the life of the document. A hook that spawns its
   own pays a full module instantiation per mount — for a route-mounted tab, per
   visit.
4. **Post through the client, never around it.** It debounces per kind with the
   shared constant, keeps only the newest request, discards superseded responses,
   and drops a queued request once a kind has no listeners left. Each post
   structured-clones the full inputs, gear inventory included, on the main thread
   — a zero-delay timeout is not a debounce.
5. **Mount worker hooks where the results are consumed**, not in the app shell, so
   a tab that does not show the data does not pay for the sweep.
6. **While a recompute is in flight, show last-known values** with a subtle
   opacity dim. Never unmount or flash the UI. Take the flag from the client,
   which counts a kind pending from the moment a request is owed rather than when
   the debounce fires — so a sustained drag dims throughout — and never mirror it
   into hook state.
7. **Never serialize large state per render.** Memoize on the value that actually
   changed.

Follow the nearest existing worker hook rather than inventing a new shape.

## Component layout

- Every component lives in its own kebab-case folder beside the file it belongs
  to, with its stylesheet next to it.
- A panel used by exactly one tab lives in that tab's feature folder. Promote it
  to the shared component, hook or util folders **only when a second feature needs
  it**. Cross-feature imports are allowed but stay rare.
- **No barrel `index.ts` files and no path aliases** — import the file directly.

## Styling

- A component carrying its own CSS gets a same-named `*.module.scss` beside it.
- **The module import binding is always `styles`** — never a single letter, even
  though that is the common idiom elsewhere. An identifier says what it holds, and
  that outranks conventions from outside this repo (CLAUDE.md § "Names"). If a
  component already uses `styles` for something else, rename **that** binding.
- Class names inside a module are **camelCase** and drop the component-name
  prefix — the import already scopes them. Modifier classes used by a single
  component are local too.
- **Stylesheets are code**: no comments a reader could recover from the selector
  and its declarations. Most modules have none.
- Cross-cutting primitives are a **closed, documented list** in the global
  stylesheet, plus marker-only sign modifiers with no rules of their own, which a
  module targets compound with a local class. **Adding anything to that list means
  updating the list.**
- Palette tokens and the element baseline live in the global base stylesheet.
  Breakpoints go through the shared mixin, never a hardcoded media query.
  Repeated form-control declarations go through the shared field mixins.
- Bare element selectors inside a module are not hashed and keep working through
  ancestor scoping. That is what lets a class-less shared input stay styled by
  whichever module renders it — **never add a class to it**.

## Related rules

- Gear-word deltas apply to **white** stats — read CLAUDE.md § "White vs Yellow
  rates" before touching anything rate-shaped.
- A buff the user can edit must be visible in the Skill Editor (BUFFS.md).
- Worker compute functions get direct-call parity tests (TESTING.md § "Worker
  tests").
