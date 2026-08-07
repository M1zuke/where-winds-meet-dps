# Bitter Season Tick

The per-tick coefficient (`physMultiplier: 0.15`) is an **unverified
placeholder** — no workbook row or reference-site def exists for this inner
way. It was chosen to sit between the bleed tick's per-stack base and
Smolder's per-tick coefficient. Editable in the Skill Editor; changing it
changes the poison DoT's damage directly, since `timeline.ts` reads this
skill's `hits[0]` in preference to the sibling debuff's own `dot` shape.

`attributeMultiplier` follows the data-set's `1.5×` pairing convention but is
inert here: every DoT tick uses `physMultiplier`, never `attributeMultiplier`,
on the matching-attribute path (`elevatedAttributeMultiplier: false`). Flat
damage is `0` for the same reason — DoT rows lose flat damage.

Five hits (one per tick of the 5 s poison window) rather than a single
representative hit, matching the Bleed Tick convention. `weaponOrAttribute` is
empty: an inner-way proc is not a martial art, so it takes no weapon boost, no
All-Martial, and no mystic-type boost.

The ticks are not driven by an `applyDot` trigger — there is no skill whose
hit could carry one, since the poison is a probabilistic proc off *any*
damaging hit. Instead `timeline.ts` opens the sibling debuff's window over
`buffs/bitterSeason.ts`'s deterministic guaranteed-proc envelope
(`bitterSeasonEnvelopeWindows` — every hit refreshes it, exactly as if it had
procced) and weights each tick's damage by the modelled poison uptime from the
seeded schedule, which is provably 0 outside that envelope.

The window (and therefore these ticks) can be extended by a Sword Horizon
Zenith detonation, because the extension events fed to the schedule are the
Zenith detonation markers, which only exist on a Sword Horizon build — the
same shared cap rule Smolder's own Zenith extension uses
(`ZENITH_MAX_EXTENDED_DURATION_FRAMES`, `builtinBuffs.ts`).
