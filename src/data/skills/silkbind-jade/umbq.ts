import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, ATTUNE, CAST, PROP, ROLE, WEAPON } from "../ids"
import { BUFF } from "../buffs/ids"
import { SKILL } from "./ids"
import { VERNAL_UMBRELLA_RECEIVES } from "./receives"

export const umbq = defineSkill({
  id: SKILL.umbq,
  classId: "silkbindJade",
  name: "UmbQ",
  tags: [
    PROP.isMartialSkillQ,
    PROP.hasQiBreakPhysPen,
    WEAPON.umbrella,
    ATTACK.light,
    ATTUNE.umbQ,
    ROLE.umbQ,
  ],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.umbQ,
  receives: [
    BUFF.combo,
    BUFF.windWall,
    BUFF.trajectorySkill,
    BUFF.mistwillowHeavyBuff,
    BUFF.mistwillowBuff,
    ...VERNAL_UMBRELLA_RECEIVES,
  ],
  triggersBuffs: [
    BUFF.jadeware,
    BUFF.combo,
    BUFF.comboUmbLightBonus,
    BUFF.comboSpringAwayBonus,
    BUFF.springThunder,
  ],
  // Cast length to the earliest next input with Blossom Barrage tier 3+
  // (in-game values as of 2026-09-24) — the shorter of the class's two
  // clips, and the one this app's graduation build carries.
  castFrames: 67,
  triggerable: true,
  // In-game values as of 2026-09-28: 20 m approach reach — a companion
  // projectile rides the swing 30 m further (50 m), not modelled separately.
  // A further 1.75 m shrink-only pull once in range.
  reachMeters: 20,
  displacement: { kind: "towardTarget", referenceMeters: 1.75 },
  hits: [
    hit(0, {
      // In-game values as of 2026-09-24: the bullet launch frame on the
      // Blossom Barrage tier 3+ clip.
      frame: 50,
      physMultiplier: 2.3397,
      attributeMultiplier: 3.5095,
      physFixed: 648,
      attributeFixed: 353,
      extraCritDamage: 1,
    }),
  ],
  createdAt: "2026-08-17T00:00:00.000Z",
  updatedAt: "2026-08-17T00:00:00.000Z",
})
