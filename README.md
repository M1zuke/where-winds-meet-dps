# Where Winds Meet — DPS Calculator

A DPS calculator and rotation simulator for the game **Where Winds Meet**. Model a full character build — gear, talents, inner ways, sets, attunements — then run a 60 fps timeline simulation of a skill rotation to get per-skill damage, DPS, and gear-ranking analyses.

- Data-driven engine: skills, buffs, debuffs, DoTs and rotations are JSON — no per-skill code branches
- Skill Editor with live damage preview; custom skills, buffs and rotations persist in your browser
- Gear ranking, retunement and word-max analyses, computed off the main thread
- Damage math follows verified community sources (see [Damage Calculation](https://github.com/M1zuke/where-winds-meet-dps/wiki/Damage-Calculation))

> **Status:** only **Bellstrike Umbra** is implemented and validated. The other seven classes ship with unverified imported data — treat their output as provisional. Helping validate a class is one of the most valuable contributions you can make.

## Getting started

Prerequisites: [Node.js](https://nodejs.org/) **≥ 22**, [pnpm](https://pnpm.io/) (Node 22 ships Corepack, so `corepack enable pnpm` picks up the pinned version; a global install with `npm i -g pnpm` also works), and Git.

```bash
git clone https://github.com/M1zuke/where-winds-meet-dps.git
cd where-winds-meet-dps
pnpm install
pnpm run dev
```

Vite prints the local URL (usually `http://localhost:5173`). The app hot-reloads on save, including edits to the data files under `src/data/`.

### Scripts

| command | what it does |
| --- | --- |
| `pnpm run dev` | dev server with hot reload |
| `pnpm test` | run the test suite once (`test:watch` for watch mode) |
| `pnpm run typecheck` | TypeScript type-check |
| `pnpm run lint` | ESLint, zero warnings allowed |
| `pnpm run format` | Prettier (`format:check` for CI's check mode) |
| `pnpm run build` | type-check + production build |

## Contributing

**All contributor documentation lives in the [project wiki](https://github.com/M1zuke/where-winds-meet-dps/wiki)** — start with [Development Setup](https://github.com/M1zuke/where-winds-meet-dps/wiki/Development-Setup) and [Architecture Overview](https://github.com/M1zuke/where-winds-meet-dps/wiki/Architecture-Overview), then the how-to for what you want to add:

- [How to Add a Class](https://github.com/M1zuke/where-winds-meet-dps/wiki/How-to-Add-a-Class)
- [How to Add a Skill](https://github.com/M1zuke/where-winds-meet-dps/wiki/How-to-Add-a-Skill)
- [How to Add a Rotation](https://github.com/M1zuke/where-winds-meet-dps/wiki/How-to-Add-a-Rotation)
- [How to Add a Buff or Debuff](https://github.com/M1zuke/where-winds-meet-dps/wiki/How-to-Add-a-Buff-or-Debuff)

Before opening a PR, read [Project Conventions](https://github.com/M1zuke/where-winds-meet-dps/wiki/Project-Conventions) — the repo has a few strict rules (English-only sources, the white/yellow rate convention, mandatory saved-profile migration checks) that CI and review enforce. CI runs `format:check`, `lint`, a no-Chinese grep guard, `typecheck`, `build`, and `test` on every PR; running those locally first will save you a round-trip.

The `docs/` folder holds the deep engineering docs the wiki summarizes — when the two disagree, `docs/` wins.

## Tech stack

React 19 + TypeScript + Vite · SCSS modules · Vitest · deployed on Cloudflare Pages

## License

[MIT](LICENSE)
