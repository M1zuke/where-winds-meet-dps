// One place that answers "what is this class made of".
//
// Everything a class owns was previously reachable only by knowing which of ten
// registries to open — schools.json, specMeta, CLASS_SPEC, the skill map, the
// debuff library, the built-in buffs, two rotation files, the attunement list
// and the retunement pools. Adding a class meant finding all ten.
//
// This does not move the underlying data files; it makes the lookup one call,
// and gives `CLASS_IDS` a single definition so nothing has to hardcode the list
// of eight.
import type { Skill } from "../../engine/skill"
import type { Buff } from "../../engine/buff"
import type { Debuff } from "../../engine/debuff"
import type { Rotation } from "../../engine/rotation"
import type { AttributeKey } from "../../engine/types"
import type { AttunementOption } from "../../engine/attunements"
import { attunementsForClass } from "../../engine/attunements"
import { specForClass } from "../../engine/buffs/data"
import { BUILTIN_SKILLS_BY_CLASS } from "../skills"
import debuffsLibrary from "../skills/debuffsLibrary.json"
import defaultRotationsData from "../rotations/defaultRotations.json"
import handRotationsData from "../rotations/handRotations.json"
import { builtinBuffsForClass } from "../../engine/builtinBuffs"
// Side-effect load: each class registers its gate buffs, behaviours and
// mechanics before the first definition is assembled.
import "./index"
import { poolForClass, type RetunementPool } from "./retunementPools"
import schools from "./schools.json"

interface SchoolRow {
  id: string
  primaryAttribute: AttributeKey
  permanentBuffs: string[]
  classMindGroup: string
  allowedMindMethods: string[]
}

interface RotationPool {
  rotations: Rotation[]
  defaultRotationId?: string
}

const SCHOOLS = schools as unknown as SchoolRow[]
const DEBUFFS = debuffsLibrary as unknown as Record<string, Debuff[]>
const DEFAULT_ROTATIONS = defaultRotationsData as unknown as Record<string, RotationPool>
const HAND_ROTATIONS = handRotationsData as unknown as Record<string, RotationPool>

export const CLASS_IDS: readonly string[] = SCHOOLS.map((school) => school.id)

export interface ClassDefinition {
  id: string
  spec: string | undefined
  primaryAttribute: AttributeKey
  // The class's own inner way, plus the ones it may slot alongside it.
  innerWays: readonly string[]
  // Visible dingYin attunement tags, from `schools.json permanentBuffs`.
  dingYinTags: readonly string[]
  skills: readonly Skill[]
  debuffs: readonly Debuff[]
  buffs: readonly Buff[]
  rotations: readonly Rotation[]
  defaultRotationId: string | null
  attunements: readonly AttunementOption[]
  retunementPool: RetunementPool | null
}

const cache = new Map<string, ClassDefinition | null>()

export function classDefinition(classId: string): ClassDefinition | null {
  const cached = cache.get(classId)
  if (cached !== undefined) return cached

  const school = SCHOOLS.find((candidate) => candidate.id === classId)
  if (!school) {
    cache.set(classId, null)
    return null
  }

  const definition: ClassDefinition = {
    id: classId,
    spec: specForClass(classId),
    primaryAttribute: school.primaryAttribute,
    innerWays: [
      ...new Set([school.classMindGroup ?? "", ...school.allowedMindMethods].filter(Boolean)),
    ],
    dingYinTags: school.permanentBuffs.filter((tag) => tag && tag !== "N/A"),
    skills: BUILTIN_SKILLS_BY_CLASS[classId] ?? [],
    debuffs: DEBUFFS[classId] ?? [],
    buffs: builtinBuffsForClass(classId),
    rotations: [
      ...(DEFAULT_ROTATIONS[classId]?.rotations ?? []),
      ...(HAND_ROTATIONS[classId]?.rotations ?? []),
    ],
    defaultRotationId:
      HAND_ROTATIONS[classId]?.defaultRotationId ??
      DEFAULT_ROTATIONS[classId]?.defaultRotationId ??
      null,
    attunements: attunementsForClass(classId),
    retunementPool: poolForClass(classId),
  }
  cache.set(classId, definition)
  return definition
}
