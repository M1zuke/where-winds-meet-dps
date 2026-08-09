# Dragon Head / Dragon Head - Plus

Special-logic notes for the universal single-target burst mystic art. Both
versions ship as built-ins in every class folder; the skill JSONs are the
source of truth for all numbers — this file carries only what they can't.

## Sources

- Official names and the Plus's mechanics text (fixed→crit trade, Surging
  Waves): `reference/locale/zhToEnOfficial.json`.
- Base version deals fixed damage — cannot trigger crit, affinity, or
  abrasion: CN mystic-arts guide corroboration (gc.com.cn, checked 2026-08).
- Cast timing (246-frame cast, hit on the final frame): user-verified
  2026-08-06.

## How the mechanics map

- Base uses `guaranteedNormal` (fixed damage), Plus uses `guaranteedPrecision`
  (never abrades) — both generic `Skill` flags, documented in TIMELINE.md § 2.
- Surging Waves is a global buff def (`buffs/surgingWaves.json`). The buff
  engine applies it at cast start, so the granting cast's own hit — landing at
  the end of the channel — is boosted; that is what matches the in-game
  "increases the damage of the **current** Dragon Head".
- The Plus's doubled damage vs a target with depleted Qi is the
  `prop:hasQiBreakDoubleDamage` tag, gated on the qi-break window (the sim's
  only "no Qi" state) and on the Qi Break Window toggle. It multiplies
  `art.correction`, not `allDamageBoost` — the official wording is a doubling,
  and the boost lane is additive, so a +1.0 effect there would land well under
  ×2. Sibling qi-phase tags: `prop:hasLowQiDmgBoost`, `prop:hasQiBreakPhysPen`.
- The HP-lost damage bonus is the "Max Low-HP Bonus (Dragon Head)" toggle
  (`CombatSettings.dragonHeadLowHpMaxBonus` → the `dragonHeadLowHpMaxBonus`
  param → `buffs/dragonHeadLowHp.json`). **It applies the 45 % cap only** —
  see "Open questions" for why there is no HP-percentage input. Its `affects`
  names the Plus in full, so the prefix match excludes the base version;
  Surging Waves deliberately does the opposite with the bare "Dragon Head".
- Ally-contributed stacks are the "40 Stacks (Dragon Head)" teammate toggle
  (`CombatSettings.dragonHeadFullStacks` → the `allySurgingWaves` buff param).
  It raises stacks-per-cast to the 40 cap via `tierConditionalStacks`, so every
  cast lands at full stacks (+50 %) rather than climbing 8 at a time.
