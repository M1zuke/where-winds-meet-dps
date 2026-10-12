import { defineSkill, hit } from "../../../definitions/skills/skillDef"
import { castSkill } from "../../../definitions/skills/triggers"
import { enduranceMeter } from "../../resources/enduranceMeter"
import { BUFF } from "../buffs/ids"
import { ATTACK, CAST, PROP, WEAPON } from "../ids"
import { SKILL } from "./ids"
import { UMBRELLA_LIGHT_CHAIN_RECEIVES } from "./receives"

// In-game values as of 2026-10-12: the held light plays Spring Away. Its
// projectiles read the first-level damage row — a physical coefficient only,
// no attribute term. The lift frame and the projectile frames are not
// measurable: provisional frames, spaced so all twelve land inside the 2 s hover.
const BULLET_HIT = {
  physMultiplier: 0.2858484,
  attributeMultiplier: 0,
  physFixed: 3.84,
  attributeFixed: 0,
}

const BULLET_COUNT = 12
const LIFT_FRAME = 29
const HOVER_START_FRAME = 44
const FIRST_BULLET_FRAME = 50
const BULLET_SPACING_FRAMES = 10
const HOVER_SECONDS = 2

export const springAway = defineSkill({
  id: SKILL.springAway,
  classId: "bamboocutDust",
  name: "Spring Away",
  tags: [WEAPON.umbrella, PROP.isCharged, ATTACK.light],
  skillType: "sustain",
  weaponOrAttribute: "Umbrella",
  attributeAttack: "Bamboocut",
  castTag: CAST.dustSpringAway,
  receives: [
    BUFF.battleAnthemChargedDamage,
    BUFF.battleAnthemEnduranceBoost,
    BUFF.nonPlayerBaseDamage25,
    ...UMBRELLA_LIGHT_CHAIN_RECEIVES,
  ],
  meterDrains: [
    {
      meterId: enduranceMeter.id,
      perSecond: 10,
      fromFrame: HOVER_START_FRAME,
      stopAfterSec: HOVER_SECONDS,
    },
  ],
  castFrames: 200,
  triggerable: false,
  hits: [
    hit(0, {
      frame: LIFT_FRAME,
      physMultiplier: 0,
      attributeMultiplier: 0,
      physFixed: 0,
      attributeFixed: 0,
      triggers: [castSkill({ target: SKILL.springAwayLift })],
    }),
    ...Array.from({ length: BULLET_COUNT }, (_, index) =>
      hit(index + 1, {
        frame: FIRST_BULLET_FRAME + index * BULLET_SPACING_FRAMES,
        ...BULLET_HIT,
      }),
    ),
  ],
  createdAt: "2026-10-12T00:00:00.000Z",
  updatedAt: "2026-10-12T00:00:00.000Z",
})
