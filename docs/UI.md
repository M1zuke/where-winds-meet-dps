# UI.md — the UI layer and keeping it responsive

Rules for `src/ui/**`, the app shell, and the DPS worker. An engine pass is a full
60 fps timeline simulation, so heavy work stays off the main thread.

## The rules

1. **At most ONE synchronous engine pass per input change** — the baseline pass
   that feeds the DPS header. Anything that runs the engine more than once per
   change (ranking sweeps, per-piece deltas, tile variants, retunement and
   word-max analyses) goes through the shared worker client: add a request kind
   and a compute function there, and drive it from a hook shaped like the
   existing ones — subscribe on mount and unsubscribe on unmount, and an empty
   result **derived at the hook's return** from a module-level constant, never
   written back by a `setState` inside an effect. A hook's initial value is its
   kind's retained response, read in the `useState` initializer and projected by
   the same function its listener uses — never replayed into state from an
   effect. **Never** run the engine in a render-path memo outside that one
   baseline pass.
2. **The client assigns request ids; a hook never numbers its own requests.**
   Superseded responses are recognised by id against document-lifetime state, so
   a counter that restarts — as any per-mount counter does on a route revisit —
   makes the client discard live responses as stale.
3. **Exactly one hook owns each request kind.** The client routes by kind alone,
   so a second subscriber to a kind receives the first one's results and their
   posts coalesce into one request.
4. **Never construct a worker in a hook.** The client owns a bounded, lazily
   grown pool and keeps it for the life of the document. A hook that spawns its
   own pays a full module instantiation per mount — for a route-mounted tab, per
   visit. **A request goes to the freest worker at the moment it is sent** — an
   idle one where there is one, a new one while the pool may still grow, the
   least loaded otherwise. Nothing is pinned to a kind: pinning puts a cheap
   sweep behind an expensive one while another worker sits idle.
5. **Post through the client, never around it.** It debounces per kind with the
   shared table, keeps only the newest request, discards superseded responses,
   and once a kind has no listeners left drops its queued request and **aborts**
   the ones already in flight, so the next mount is never handed the previous
   one's result and no worker keeps computing for a tab that is gone. Each post
   structured-clones the full inputs, gear inventory included, on the main thread
   — a zero-delay timeout is not a debounce, so a kind that must fire at once
   takes a zero entry in that table and posts synchronously.
6. **The client answers from memory where the request settles it.** Each cacheable
   kind keeps a bounded set of responses keyed by a signature of the request, and
   each kind retains its last response for the next mount. Both live only in the
   client and only for the life of the document — **never** persisted. A kind is
   cacheable only if its response is a pure function of its request: one carrying
   a seed, a clock or a cancellable partial result is not. A cached answer keeps
   the request-id and delivery path of a computed one, and never raises pending.
   **No signature is ever computed twice.** A request whose signature is already
   being computed waits on that run rather than starting a second, and answers
   under the waiting request's id. A run abandoned under rule 5 still fills the
   cache **and becomes the retained response** when it lands, so the mount that
   re-posts it opens on that answer instead of on an empty panel — abandoning
   drops the _delivery_, never the work. Retention tracks its own newest-answer
   mark, so a superseded or out-of-order response can never overwrite a newer
   one with an older one.
7. **Mount worker hooks where the results are consumed**, not in the app shell, so
   a tab that does not show the data does not pay for the sweep. The exception is
   a kind that only ever posts on an explicit user action and must outlive the tab
   that started it: the shell owns that hook and passes its state down, which is
   what keeps the run off the unsubscribe abort in rule 5.
8. **While a recompute is in flight, show last-known values** with a subtle
   opacity dim. Never unmount or flash the UI. Take the flag from the client,
   which counts a kind pending from the moment a request is owed rather than when
   the debounce fires — so a sustained drag dims throughout — and never mirror it
   into hook state. The dim says _this panel_ is stale; the shell also reports the
   set of pending kinds in one place, so a sweep is never silent.
9. **Split a sweep whose fast answer the user is looking at.** A kind that
   recomputes a whole collection to fill one small always-visible readout gets a
   second kind scoped to that readout, computed by the same function over the
   narrower id set so the two can never disagree, and a parity test that says so.
   A sweep also only ever covers what some mounted view asks for — widening it to
   data behind a toggle that is off is work nobody is waiting on.
   **A sweep whose items are independent fans out across the pool.** The client
   splits it into at most one shard per worker, sends each as its own request,
   and delivers a single merged response under the original request's id — so
   pending, ordering, retention and the cache all still see one request. Shard on
   the axis the compute function shares state along, so a shard is never slower
   per item than the whole sweep was, and a parity test states that the split
   answers what the whole answered.
10. **While a shell-owned run is in flight, no control may change engine inputs.**
   Disable the whole route panel through one `fieldset`, disable the shell
   controls that write inputs, and have every shell writer refuse the write —
   the disabled markup is the affordance, the refusal is the invariant. Release
   both the moment the run stops, however it stopped.
11. **Never serialize large state per render.** Memoize on the value that actually
    changed.
12. **A kind that reports progress reports it on its own message kind**, routed
    ahead of the response channel and never through it — that channel retires a
    request id on first delivery, so progress sent down it swallows both the later
    progress and the real result. Progress never clears the pending flag, and
    progress for anything but the newest request id is dropped. A kind that can
    run long must also be interruptible between chunks, and yield between them so
    its cancel message can be read at all.

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
- Changelog data lives in `src/changelog/` — the format in `types.ts`, the
  ordered version list in `registry.ts`, one module per release under
  `entries/`.
- The version shown in the header comes from `package.json`; nothing else
  declares it.
- A version bump ships an entry naming that version at the top of the
  registry, whose body module is loaded only when that version is selected.
