import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { SNOWPARTING_BLADE_RECEIVES } from "./receives"
import { ANXI_SOLDIER_BLADE_MOMENTUM_GAIN } from "./buffs/anxiSoldierBladeMomentumGain"

const SOLDIER_HIT = {
  frame: 0,
  physMultiplier: 0.35,
  attributeMultiplier: 0.525,
  physFixed: 0,
  attributeFixed: 0,
  triggers: [ANXI_SOLDIER_BLADE_MOMENTUM_GAIN],
}

function hengSoldier(id: string, name: string, attunement: string, extraTags: string[] = []) {
  return defineSkill({
    id,
    classId: "stonesplitStrength",
    name,
    tags: [WEAPON.hengBlade, PROP.cleftpeakBoost, ROLE.anxiSoldier, attunement, ...extraTags],
    skillType: "weapon",
    weaponOrAttribute: "Hengdao",
    attributeAttack: "Stonesplit",
    castTag: CAST.anxiSoldierHeng,
    receives: [BUFF.mountainSplitter, BUFF.cleftpeakDeflect, ...SNOWPARTING_BLADE_RECEIVES],
    triggersBuffs: [BUFF.throatPierced],
    castFrames: 0,
    triggerable: true,
    hits: [0, 1, 2, 3].map((index) => hit(index, SOLDIER_HIT)),
    createdAt: "2026-07-19T00:00:00.000Z",
    updatedAt: "2026-07-19T00:00:00.000Z",
  })
}

// In-game values as of 2026-09-24: this soldier carries Snowbreak Spring's
// own stack-family tag too, unlike the Stab-triggered copy below.
export const anxisoldierheng = hengSoldier(
  SKILL.anxisoldierheng,
  "AnxiSoldierHeng",
  ATTUNE.snowpartingVariedCombo,
  [ROLE.snowpartingVC],
)

export const anxisoldierhengStab = hengSoldier(
  SKILL.anxisoldierhengStab,
  "AnxiSoldierHeng (Stab)",
  ATTUNE.snowpartingQ,
)
