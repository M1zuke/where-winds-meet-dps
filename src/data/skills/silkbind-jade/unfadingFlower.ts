// Unfading Flower (verbatim, 2026-08-19 in-game capture, full text from
// pending-tooltips.md, multiplier block from 2026-08-20 paste):
//
//   "Unfading Flower
//    Cooldown: 0.5s. Can be released when Blossoms is at least 50.
//    Quickly throw the umbrella into the air and draw a hidden sword from
//    the handle. You can then switch to another weapon to attack or use
//    the hidden sword's basic skills. During this time, the umbrella will
//    float in the air, continuously following the character and firing
//    projectiles at single targets within 5 meters. When the target is
//    Lingering Bone/Airborne, the umbrella will consume an extra 10/15
//    Blossoms per second to fire enhanced projectiles dealing 100%/200%
//    extra damage, while extending the duration of Lingering Bone/Airborne
//    on non-player targets. Unfading Flower deals an extra 15% HP damage
//    to non-player targets. Consumes 10 Blossoms per second. The umbrella
//    automatically retracts when resources are insufficient. In hidden
//    sword state, releasing the Special Skill again retracts the umbrella
//    early.
//    Inner Way: Blossom Barrage Ninefold Umbrella's move, Spring Sorrow can
//    store up to 3 charges and can be cast 30% faster. Hitting an enemy
//    with this skill increases your Projectile Skill damage against them.
//    Hitting a target that satisfies the condition with Light Attack
//    Charged Skill deals increased damage and increases the max number of
//    targets hit. Hitting enemies consecutively reduces the skill's
//    cooldown and grants Blossoms."
//
//   Special Skill
//   Ballistic Damage Per Second
//     Physical Coefficient     102.17% (Max Level)
//     Physical Bonus             282 (Max Level)
//     Attribute Attack         153.25% (Max Level)
//     Coefficient Attr Atk Bonus 154 (Max Level)
//
// Per-second multipliers used as the default hit (the drone stream is
// modeled as a single high-magnitude hit per second of activation — the
// per-second block represents the SUM of all projectiles in a second).
//
// NOTE: This file was created on 2026-08-20 — earlier work had the 171.75%
// block tentatively assigned to Unfading Flower, but a fresh in-game
// capture on the same day pairs the 171.75% block with Spring Away
// (Charged Skill) and the 102.17% block with this skill (Special Skill).
// The prior "user confirmed 171.75% block belongs to Unfading Flower"
// memory note was about Spring Sorrow vs Unfading Flower, not Spring Away
// vs Unfading Flower; the latest paste resolves the Spring Away side.
//
// TODO(blossom-resource): "Can be released when Blossoms is at least 50.
// Consumes 10 Blossoms per second. ... automatically retracts when
// resources are insufficient" — no Blossom resource today
// (see engine-extension sweep in pending-tooltips.md). Without a Blossom
// ledger, the per-second DPS contribution is still computed correctly
// (the multiplier block is unconditional on paper), but the activation
// gate (≥50) and deactivation gate (depletion) cannot be modelled. The
// calculator assumes the drone stays up indefinitely.
//
// TODO(hidden-sword-state): "draw a hidden sword from the handle. You can
// then switch to another weapon to attack" — the player's damage during
// Unfading Flower comes from a different weapon (Fan / Sword / etc.) +
// the drone's per-second stream. The calculator treats this skill as the
// drone stream only; the hidden-sword basic attacks are out of scope
// until a dual-weapon rotation model exists.
//
// TODO(extra-15-hp-damage): "Unfading Flower deals an extra 15% HP damage
// to non-player targets" — same gap as Forsaken Fame +45% and Spring Away
// +25%. No non-player-bonus engine surface today. Captured for the next
// engine extension pass.
//
// TODO(lb-airborne-enhanced-projectiles): "When the target is Lingering
// Bone/Airborne, the umbrella will consume an extra 10/15 Blossoms per
// second to fire enhanced projectiles dealing 100%/200% extra damage" —
// +100%/+200% damage gated on `target.lingeringBoneFromYou` /
// `target.isAirborne`. No `TargetView.lingeringBoneFromYou` or
// `TargetView.isAirborne` fields today. Captured as a hit-level HitVariant
// for the next engine pass.
//
// TODO(lb-airborne-duration-extension): "extending the duration of
// Lingering Bone/Airborne on non-player targets" — buff-side modification,
// not a damage effect. Out of scope.
//
// TODO(5-meter-targeting): "firing projectiles at single targets within 5
// meters" — single-target stream. The calculator's training-dummy proxy
// fits; no AoE modeling needed.
//
// TODO(cancel-by-respecial): "In hidden sword state, releasing the Special
// Skill again retracts the umbrella early" — state machine interaction
// with this same skill id. Out of scope for the calculator.
import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { ATTACK, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"

export const unfadingFlower = defineSkill({
  id: SKILL.unfadingFlower,
  classId: "silkbindJade",
  name: "Unfading Flower",
  abilityTag: "Unfading Flower",
  tags: [PROP.isBallistic, WEAPON.umbrella, ATTACK.heavy],
  skillType: "weapon",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Silkbind",
  castTag: CAST.unfadingFlower,
  castFrames: 60,
  triggerable: true,
  hits: [
    hit(0, {
      frame: 0,
      physMultiplier: 1.0217,
      attributeMultiplier: 1.5325,
      physFixed: 282,
      attributeFixed: 154,
      triggers: [],
    }),
  ],
  createdAt: "2026-08-19T00:00:00.000Z",
  updatedAt: "2026-08-19T00:00:00.000Z",
})
