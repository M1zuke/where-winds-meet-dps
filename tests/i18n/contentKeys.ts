import { CLASS_DEFS, classDefinition } from "../../src/definitions/classes/registry"
import { INNER_WAYS } from "../../src/definitions/innerWays/registry"
import { MARTIAL_ARTS } from "../../src/definitions/martialArts/registry"
import { SET_DEFS } from "../../src/definitions/sets/registry"
import { ATTUNEMENT_OPTIONS } from "../../src/engine/attunements"
import { STAT_LINES } from "../../src/data/stats/statLines"
import { DEFAULT_ODDITIES, getDefaultTalentsForClass } from "../../src/definitions/baseStats"
import { GEAR_RARITIES } from "../../src/engine/types"
import {
  attributeAttackKey,
  attunementHintKey,
  attunementKey,
  buffKey,
  classKey,
  debuffBreakdownKey,
  debuffEchoKey,
  debuffKey,
  hitVariantKey,
  innerWayKey,
  innerWayTierKey,
  martialArtKey,
  oddityRegionKey,
  rarityKey,
  rotationKey,
  setKey,
  skillBreakdownKey,
  skillKey,
  skillTypeKey,
  statLineKey,
  talentKey,
  weaponKey,
} from "../../src/i18n/contentKeys"

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function collectContentKeys(): Record<string, string> {
  const catalogue: Record<string, string> = {}
  const add = (key: string, english: string | undefined): void => {
    if (english && english.trim()) catalogue[key] = english
  }

  for (const line of STAT_LINES) add(statLineKey(line.id), line.label)
  for (const option of ATTUNEMENT_OPTIONS) {
    add(attunementKey(option.id), option.label)
    add(attunementHintKey(option.id), option.hint)
    for (const [classId, label] of Object.entries(option.labelByClass ?? {}))
      add(attunementKey(option.id, classId), label)
  }
  for (const set of SET_DEFS) add(setKey(set.id), set.name)
  for (const art of MARTIAL_ARTS) {
    add(martialArtKey(art.id), art.name)
    add(weaponKey(art.weaponType), art.weaponType)
  }
  for (const innerWay of INNER_WAYS) {
    add(innerWayKey(innerWay.id), innerWay.name)
    for (const tier of innerWay.selectableTiers)
      add(innerWayTierKey(`tier ${tier}`), `tier ${tier}`)
  }
  for (const region of Object.keys(DEFAULT_ODDITIES)) add(oddityRegionKey(region), region)
  for (const rarity of GEAR_RARITIES) add(rarityKey(rarity), capitalize(rarity))

  for (const declared of CLASS_DEFS()) {
    const definition = classDefinition(declared.id)
    if (!definition) continue
    add(classKey(definition.id), definition.displayName)
    for (const talent of getDefaultTalentsForClass(definition.id))
      add(talentKey(talent), talent.name)
    for (const rotation of definition.rotations) add(rotationKey(rotation.id), rotation.name)
    for (const debuff of definition.debuffs) {
      add(debuffKey(debuff.id), debuff.name)
      add(debuffBreakdownKey(debuff.id), debuff.breakdownName)
      add(debuffEchoKey(debuff.id), debuff.echo?.breakdownName)
    }
    for (const buff of definition.buffs) add(buffKey(buff.id), buff.name)
    for (const module of definition.buffModules) add(buffKey(module.id), module.name)
    for (const skill of definition.skills) {
      add(skillKey(skill), skill.name)
      add(skillBreakdownKey(skill), skill.breakdownName)
      add(skillTypeKey(skill.skillType), skill.skillType)
      add(attributeAttackKey(skill.attributeAttack), skill.attributeAttack)
      for (const hit of skill.hits)
        for (const variant of hit.variants ?? []) add(hitVariantKey(skill, variant), variant.label)
    }
  }

  return catalogue
}
