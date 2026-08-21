import { CLASS_DEFS, classDefinition } from "../../src/definitions/classes/registry"
import { INNER_WAYS } from "../../src/definitions/innerWays/registry"
import { MARTIAL_ARTS } from "../../src/definitions/martialArts/registry"
import { SET_DEFS } from "../../src/definitions/sets/registry"
import { ATTUNEMENT_OPTIONS } from "../../src/engine/attunements"
import { STAT_LINES } from "../../src/data/stats/statLines"
import { DEFAULT_ODDITIES, getDefaultTalentsForClass } from "../../src/definitions/baseStats"

export function collectContentKeys(): string[] {
  const keys = new Set<string>()
  const add = (value: string | undefined): void => {
    if (value && value.trim()) keys.add(value)
  }

  for (const line of STAT_LINES) add(line.label)
  for (const option of ATTUNEMENT_OPTIONS) {
    add(option.label)
    add(option.hint)
    for (const label of Object.values(option.labelByClass ?? {})) add(label)
  }
  for (const set of SET_DEFS) add(set.name)
  for (const art of MARTIAL_ARTS) {
    add(art.name)
    add(art.weaponType)
  }
  for (const innerWay of INNER_WAYS) {
    add(innerWay.name)
    for (const tier of innerWay.selectableTiers) add(`tier ${tier}`)
  }
  for (const region of Object.keys(DEFAULT_ODDITIES)) add(region)

  for (const declared of CLASS_DEFS()) {
    const definition = classDefinition(declared.id)
    if (!definition) continue
    add(definition.displayName)
    for (const talent of getDefaultTalentsForClass(definition.id)) add(talent.name)
    for (const piece of definition.graduationBuild.gear) add(piece.rarity)
    for (const rotation of definition.rotations) add(rotation.name)
    for (const debuff of definition.debuffs) add(debuff.name)
    for (const buff of definition.buffs) add(buff.name)
    for (const module of definition.buffModules) add(module.name)
    for (const skill of definition.skills) {
      add(skill.name)
      add(skill.skillType)
      add(skill.attributeAttack)
      add(skill.breakdownName)
      for (const hit of skill.hits) for (const variant of hit.variants ?? []) add(variant.label)
    }
  }

  return [...keys]
}
