export function camelCaseSegment(text: string): string {
  const words = text.match(/[A-Za-z0-9]+/g) ?? []
  return words
    .map((word, index) =>
      index === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("")
}

export function classKey(classId: string): string {
  return `content.class.${classId}`
}

export function skillKey(skill: { id: string }): string {
  return `content.skill.${skill.id}`
}

export function skillBreakdownKey(skill: { id: string }): string {
  return `content.skill.${skill.id}.breakdown`
}

export function hitVariantKey(skill: { id: string }, variant: { id: string }): string {
  return `content.skill.${skill.id}.variant.${variant.id}`
}

export function buffKey(buffId: string): string {
  return `content.buff.${buffId}`
}

export function debuffKey(debuffId: string): string {
  return `content.debuff.${debuffId}`
}

export function debuffBreakdownKey(debuffId: string): string {
  return `content.debuff.${debuffId}.breakdown`
}

export function debuffEchoKey(debuffId: string): string {
  return `content.debuff.${debuffId}.echo`
}

export function rotationKey(rotationId: string): string {
  return `content.rotation.${rotationId}`
}

export function innerWayKey(innerWayId: string): string {
  return `content.innerWay.${innerWayId}`
}

export function innerWayTierKey(stacks: string): string {
  return `content.innerWay.tier.${stacks.replace(/^tier\s+/, "")}`
}

export function martialArtKey(martialArtId: string): string {
  return `content.martialArt.${martialArtId}`
}

export function weaponKey(weaponType: string): string {
  return `content.weapon.${weaponType}`
}

export function setKey(setId: string): string {
  return `content.set.${setId}`
}

export function attunementKey(attunementId: string, classId?: string | null): string {
  return classId
    ? `content.attunement.${attunementId}.${classId}`
    : `content.attunement.${attunementId}`
}

export function attunementHintKey(attunementId: string): string {
  return `content.attunement.${attunementId}.hint`
}

export function statLineKey(statLineId: string): string {
  return `content.statLine.${statLineId}`
}

export function oddityRegionKey(region: string): string {
  return `content.oddityRegion.${camelCaseSegment(region)}`
}

export function skillTypeKey(skillType: string): string {
  return `content.skillType.${skillType}`
}

export function attributeAttackKey(attributeAttack: string): string {
  return `content.attributeAttack.${attributeAttack}`
}

export function rarityKey(rarity: string): string {
  return `content.rarity.${rarity}`
}

const DEFAULT_TALENT_ID = /^default-(.+)-(\d+)$/

export function talentKey(talent: { id: string }): string {
  const defaulted = DEFAULT_TALENT_ID.exec(talent.id)
  return defaulted
    ? `content.talent.${defaulted[1]}.${defaulted[2]}`
    : `content.talent.${talent.id}`
}
