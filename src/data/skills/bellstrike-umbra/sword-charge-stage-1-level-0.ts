import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { CAST, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { SWORD_CHARGE_STAGE_1_DISPLACEMENT } from "./sword-charge-stage-1-hits"
import { STRATEGIC_SWORD_RECEIVES } from "./receives"

// A release past the 0.2 s tap window but short of stage 1's own 0.3 s
// threshold plays the charge's own level-0 release — its own tap animation,
// distinct from Sword - Heavy Attack, the different skill the same button
// plays on a release inside that window. No coefficient row or cast length
// for this release is documented anywhere; this stands in on Sword - Heavy
// Attack's own first tap (its numerical row, hit ratio 0.2, cast length 36.5 f
// after its own release, hit at 24.01 f), each shifted +12 f (the 0.2 s tap
// window itself, counted from the press) since this release's own frames run
// from the press, not from a bare release — frame 36 and castFrames 49 are
// that stand-in, rounded, until the real values turn up (in-game values as
// of 2026-09-24, stand-in explicitly noted).
export const swordChargeStage1Level0 = defineSkill({
  id: SKILL.swordChargeStage1Level0,
  classId: "bellstrikeUmbra",
  name: "Sword Charge Stage 1, Level 0 Release",
  breakdownName: "Second Track Slash",
  tags: [WEAPON.sword],
  skillType: "weapon",
  weaponOrAttribute: "Sword",
  attributeAttack: "Bellstrike",
  castTag: CAST.swordChargeStage1Level0,
  receives: STRATEGIC_SWORD_RECEIVES,
  castFrames: 49,
  triggerable: true,
  displacement: SWORD_CHARGE_STAGE_1_DISPLACEMENT,
  hits: [
    hit(0, {
      frame: 36,
      physMultiplier: 0.479274,
      attributeMultiplier: 0.718911,
      physFixed: 132.6,
      attributeFixed: 72.2,
    }),
  ],
  createdAt: "2026-09-28T00:00:00.000Z",
  updatedAt: "2026-09-28T00:00:00.000Z",
})
