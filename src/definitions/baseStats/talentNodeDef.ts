import type { TalentPointEffects } from "./talentPointDef"

export type TalentGateKind = "martialMastery" | "maxHp" | "worldLevel" | "characterLevel"

export interface TalentGate {
  kind: TalentGateKind
  value: number
}

export interface TalentNodeDef {
  id: number
  column: number
  lane: number
  requires?: number
  name: string
  description: string
  gate?: TalentGate
  icon: string
  effects?: TalentPointEffects
}

export function defineTalentNode<const T extends TalentNodeDef>(node: T): T {
  return node
}
