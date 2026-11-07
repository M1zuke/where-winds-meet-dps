// v43 -> v44 — target-distance simulation: `reachMeters`, `approach` and
// `displacement` on every built-in skill the source page reaches. Neither
// field has an editable surface in the Skill Editor, so a stored copy is
// healed unconditionally, the same way an earlier hop heals meter fields.
import type { CustomSkillMigration, RawCustomSkillsBlob } from "./types"

const isRecord = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value)

interface DistanceBand {
  minMeters: number
  maxMeters: number
  then: Displacement
}

type Displacement =
  | { kind: "towardTarget"; referenceMeters: number }
  | { kind: "toTarget"; meters: number }
  | { kind: "selfForward"; meters: number }
  | { kind: "byDistance"; bands: readonly DistanceBand[]; otherwise: Displacement }

interface SkillDistancePatch {
  matchId: (id: string) => boolean
  reachMeters?: number
  approach?: "approach" | "stationary"
  displacement?: Displacement
}

const exact = (id: string) => (candidate: string) => candidate === id
// A mystic art's stored copy may still carry its pre-shared-id, class-bound
// id (the class it was opened from, before the shared `mystic` id took
// over) — matched by suffix so either form reaches the same patch.
const mysticSuffix = (suffix: string) => (candidate: string) => candidate.endsWith(suffix)

const PATCHES: SkillDistancePatch[] = [
  {
    matchId: exact("bamboocutDraught-boundvessel"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-castlink"),
    reachMeters: 18,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-deflect-cancel-prepull"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-delay"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-cancel"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-second"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-second-cancel"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-third"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-dragonquench-inebriate-third-cancel"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-ghostly-steps"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-golden-body-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-golden-body-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-heros-blood"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-heros-blood-inebriate"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-light-attack"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-nightwick-grounddrift"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-nightwick-primepick"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-nightwick-primepick-follow-up"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-nightwick-primepick-follow-up-cancel"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-nightwick-tipsylay"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-peakfall"),
    reachMeters: 18,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-peakfall-prepull"),
    reachMeters: 18,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-perfect-dodge-full"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-quick-drink"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-quick-drink-cancel"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-realmplay"),
    reachMeters: 18,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-reveldrift"),
    reachMeters: 18,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-reveldrift-cancel"),
    reachMeters: 18,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bamboocutDraught-skystrike-gauntlets-ex"),
    approach: "stationary",
  },
  {
    matchId: exact("bamboocutDraught-whaledraft"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bellstrikeSplendor-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeSplendor-deflect-cancel-prepull"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeSplendor-delay"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeSplendor-energysurge"),
    reachMeters: 18,
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeSplendor-ghostly-steps"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeSplendor-golden-body-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeSplendor-golden-body-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeSplendor-perfect-dodge"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeSplendor-perfect-dodge-full"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeSplendor-spearq"),
    reachMeters: 5,
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 1.5,
          maxMeters: 4.5,
          then: {
            kind: "toTarget",
            meters: 1.5,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeSplendor-spearq-0-hit-cancel"),
    reachMeters: 5,
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 1.5,
          maxMeters: 4.5,
          then: {
            kind: "toTarget",
            meters: 1.5,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeSplendor-spearq-prepull"),
    reachMeters: 5,
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 1.5,
          maxMeters: 4.5,
          then: {
            kind: "toTarget",
            meters: 1.5,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged"),
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged-2-hit"),
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeSplendor-swordheavycharged-prepull"),
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeSplendor-swordq"),
    reachMeters: 12,
  },
  {
    matchId: exact("bellstrikeSplendor-swordq-2nd"),
    reachMeters: 3,
  },
  {
    matchId: exact("bellstrikeSplendor-swordspecial"),
    reachMeters: 12.8,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("bellstrikeSplendor-swordspecial-2nd"),
    reachMeters: 12.8,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("bellstrikeSplendor-swordspecial-deflect"),
    reachMeters: 12.8,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("bellstrikeUmbra-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeUmbra-deflect-cancel-prepull"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeUmbra-delay"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeUmbra-ghostly-steps"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeUmbra-golden-body-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeUmbra-golden-body-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeUmbra-perfect-dodge"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeUmbra-perfect-dodge-full"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("bellstrikeUmbra-spearheavy"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bellstrikeUmbra-spearheavy-1-hit"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bellstrikeUmbra-spearheavy-1-hit-prepull"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bellstrikeUmbra-spearheavy-stage-1"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bellstrikeUmbra-spearq"),
    reachMeters: 3,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bellstrikeUmbra-spearq-5-hit-cancel"),
    reachMeters: 3,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("bellstrikeUmbra-spearspecial"),
    reachMeters: 3,
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 1.5,
          maxMeters: 4.5,
          then: {
            kind: "toTarget",
            meters: 1.5,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeUmbra-spearspecial-1-hit-cancel"),
    reachMeters: 3,
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 1.5,
          maxMeters: 4.5,
          then: {
            kind: "toTarget",
            meters: 1.5,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-1-hit"),
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-2-hit"),
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-3-hit"),
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-4-hit"),
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeUmbra-sword-charge-stage-1-5-hit"),
    displacement: {
      kind: "byDistance",
      bands: [
        {
          minMeters: 0,
          maxMeters: 8.999,
          then: {
            kind: "toTarget",
            meters: 1,
          },
        },
        {
          minMeters: 9,
          maxMeters: 100,
          then: {
            kind: "selfForward",
            meters: 8,
          },
        },
      ],
      otherwise: {
        kind: "towardTarget",
        referenceMeters: 0,
      },
    },
  },
  {
    matchId: exact("bellstrikeUmbra-swordq"),
    reachMeters: 4,
  },
  {
    matchId: exact("bellstrikeUmbra-swordq-follow-up-1-hit-cancel"),
    reachMeters: 4,
  },
  {
    matchId: exact("bellstrikeUmbra-swordq-follow-up-2-hit-cancel"),
    reachMeters: 4,
  },
  {
    matchId: exact("bellstrikeUmbra-swordqfollowup"),
    reachMeters: 4,
  },
  {
    matchId: mysticSuffix("-dragon-fire-smolder-1-hit"),
    reachMeters: 8,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-dragon-fire-smolder-2-hits"),
    reachMeters: 8,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-dragon-head"),
    reachMeters: 8,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-dragon-head-plus"),
    reachMeters: 8,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-drunkenpoet-prepull"),
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-fire-breath-1-hit"),
    reachMeters: 8,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-fire-breath-1-hit-prepull"),
    reachMeters: 8,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-fire-breath-2-hit"),
    reachMeters: 8,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-flute-of-the-tides-cancel"),
    reachMeters: 40,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-flute-of-the-tides-full"),
    reachMeters: 40,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-flute-of-the-tides-prepull"),
    reachMeters: 40,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-poet-final-hit-cancel"),
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-poet1"),
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-poet2"),
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-poet3"),
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-poet4"),
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-soaring"),
    reachMeters: 15,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-soaring-1-hit"),
    reachMeters: 15,
    approach: "stationary",
  },
  {
    matchId: mysticSuffix("-toad-cancel"),
    reachMeters: 8,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-deflect-cancel-prepull"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-delay"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-fanheavypursuit-3-hit"),
    reachMeters: 9,
    displacement: {
      kind: "toTarget",
      meters: 1.5,
    },
  },
  {
    matchId: exact("silkbindJade-fanheavypursuit-5-hit"),
    reachMeters: 9,
    displacement: {
      kind: "toTarget",
      meters: 1.5,
    },
  },
  {
    matchId: exact("silkbindJade-fanlightcharged"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-fanq"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("silkbindJade-fanq-prepull"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("silkbindJade-fanqcancel"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("silkbindJade-fanspecial"),
    reachMeters: 9,
    displacement: {
      kind: "toTarget",
      meters: 1.5,
    },
  },
  {
    matchId: exact("silkbindJade-ghostly-steps"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-golden-body-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-golden-body-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-healer-buff"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-healer-extension"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-perfect-dodge"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-perfect-dodge-full"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("silkbindJade-umb-heavylight"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umbdronelaunch"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umbdronelaunch-12hit"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umbdronelaunch-16hit"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umbdronelaunch-20hit"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umbdronelaunch-23hit"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umbdronelaunch-26hit"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umblightcharge"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umbq"),
    reachMeters: 20,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("silkbindJade-umbq-prepull"),
    reachMeters: 20,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-blockperception"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("stonesplitStrength-deflect"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-deflect-cancel-prepull"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-delay"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-ghostly-steps"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-golden-body-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-golden-body-deflect-cancel"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-perfect-dodge"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-perfect-dodge-full"),
    reachMeters: 100,
    approach: "stationary",
  },
  {
    matchId: exact("stonesplitStrength-phalanxcharged-s3"),
    reachMeters: 4.5,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-phalanxcharged-s3-innerpassion"),
    reachMeters: 4.5,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-phalanxspecial"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-phalanxspecial-prepull"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingcharged"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingcharged-forgetfulness"),
    reachMeters: 4,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingdual"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingdual-prepull"),
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingq-stab"),
    reachMeters: 4.5,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingslide"),
    reachMeters: 8,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingslide-prepull"),
    reachMeters: 8,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingslide-prepull-hit"),
    reachMeters: 8,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingspecial"),
    reachMeters: 6,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1.75,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingvc"),
    reachMeters: 4.5,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
  {
    matchId: exact("stonesplitStrength-snowpartingvc-prepull"),
    reachMeters: 4.5,
    displacement: {
      kind: "towardTarget",
      referenceMeters: 1,
    },
  },
]

export function healSkill(skill: unknown): unknown {
  if (!isRecord(skill) || typeof skill.id !== "string") return skill
  const patch = PATCHES.find((candidate) => candidate.matchId(skill.id as string))
  if (!patch) return skill

  const next: Record<string, unknown> = { ...skill }
  if (patch.reachMeters !== undefined && next.reachMeters === undefined)
    next.reachMeters = patch.reachMeters
  if (patch.approach !== undefined && next.approach === undefined) next.approach = patch.approach
  if (patch.displacement !== undefined && next.displacement === undefined)
    next.displacement = patch.displacement

  return next
}

export const V44__targetDistanceReachAndDisplacement: CustomSkillMigration = {
  to: 44,
  name: "V44__targetDistanceReachAndDisplacement",
  migrate(blob: RawCustomSkillsBlob): RawCustomSkillsBlob {
    const skills = Array.isArray(blob.skills) ? blob.skills.map(healSkill) : blob.skills
    return { ...blob, v: 44, skills }
  },
}
