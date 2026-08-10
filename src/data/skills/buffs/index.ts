import type { BuffDef } from "../../../engine/buffs/buffDef"
import comboFile from "./combo.json"
import comboUmbLightBonusFile from "./comboUmbLightBonus.json"
import windWallFile from "./windWall.json"
import windWallPursuitFile from "./windWallPursuit.json"
import pursuitChargedBoostFile from "./pursuitChargedBoost.json"
import lingeringBoneFile from "./lingeringBone.json"
import starReacherNormalFile from "./starReacherNormal.json"
import starReacherBelow30File from "./starReacherBelow30.json"
import starReacherExhaustedFile from "./starReacherExhausted.json"
import revelryScriptFile from "./revelryScript.json"
import fluteBoostFile from "./fluteBoost.json"
import springThunderFile from "./springThunder.json"
import throatPiercedFile from "./throatPierced.json"
import throatPiercedDeflectFile from "./throatPiercedDeflect.json"
import concentrationFile from "./concentration.json"
import potentRiverFlowFile from "./potentRiverFlow.json"
import wineGuFile from "./wineGu.json"
import crosswindSpiritFile from "./crosswindSpirit.json"
import mountainsMightFile from "./mountainsMight.json"
import drumbeatFile from "./drumbeat.json"
import breakthroughFile from "./breakthrough.json"
import vulnerabilityFile from "./vulnerability.json"
import vulnerabilityWeaponFile from "./vulnerabilityWeapon.json"
import shatteredRidgeDeflectFile from "./shatteredRidgeDeflect.json"
import innerPassionFile from "./innerPassion.json"
import ironGuardsFile from "./ironGuards.json"
import frostCladSnowbreakFile from "./frostCladSnowbreak.json"
import frostCladSnowbreakIPConsumeFile from "./frostCladSnowbreakIPConsume.json"
import burningHeartIPConsumeFile from "./burningHeartIPConsume.json"
import frostCladSnowbreakT6File from "./frostCladSnowbreakT6.json"
import frostCladSnowbreakT6ExhaustedFile from "./frostCladSnowbreakT6Exhausted.json"
import forgetfulnessFile from "./forgetfulness.json"
import mountainSplitterFile from "./mountainSplitter.json"
import chargeEnhancementFile from "./chargeEnhancement.json"
import throatPiercedAnxiT6File from "./throatPiercedAnxiT6.json"
import heartFocusFile from "./heartFocus.json"
import empoweredUmbQCritFile from "./empoweredUmbQCrit.json"
import starsAlign4pcFile from "./starsAlign4pc.json"
import tangMelodyFile from "./tangMelody.json"
import towlineSweepT6SpecialFile from "./towlineSweepT6Special.json"
import vulnerabilityTeammateFile from "./vulnerabilityTeammate.json"
import jadewareFile from "./jadeware.json"
import mirageFile from "./mirage.json"
import mirageBonusFile from "./mirageBonus.json"
import rainwhisperShieldFile from "./rainwhisperShield.json"
import resistanceResolveFile from "./resistanceResolve.json"
import surgingWavesFile from "./surgingWaves.json"
import dragonHeadLowHpFile from "./dragonHeadLowHp.json"
import healerBuffFile from "./healerBuff.json"
import soulShakenFile from "./soulShaken.json"
import bellstrikeUmbraBleedPenFile from "./bellstrikeUmbraBleedPen.json"
import bellstrikeUmbraBleedingDamageFile from "./bellstrikeUmbraBleedingDamage.json"
import stonesplitStrengthSkillCritDamageFile from "./stonesplitStrengthSkillCritDamage.json"

interface BuffVariant {
  specs?: string[]
  def: BuffDef
}
interface BuffFile {
  id: string
  scope: "spec" | "global" | "group" | "mechanic"
  variants: BuffVariant[]
}

// A buff id can carry several spec-scoped bodies (e.g. throatPierced differs
// per class), so each file holds an ordered list of variants rather than a
// single def; spec/global/group/mechanic files just have one variant.
// JSON imports widen `scope` to `string`, hence the single cast per helper
// (mirrors the `as unknown as Skill[]` cast in src/data/skills/<class>/index.ts).
function defForSpec(rawFile: unknown, spec: string): BuffDef {
  const file = rawFile as BuffFile
  const variant = file.variants.find((v) => v.specs?.includes(spec))
  if (!variant) throw new Error(`No variant for spec "${spec}" in buff file "${file.id}"`)
  return variant.def
}

function soleDef(rawFile: unknown): BuffDef {
  return (rawFile as BuffFile).variants[0].def
}

function allDefs(rawFile: unknown): BuffDef[] {
  return (rawFile as BuffFile).variants.map((v) => v.def)
}

export const SITE_BUFF_DEFS_BY_SPEC: Record<string, BuffDef[]> = {
  silkbind_jade: [
    defForSpec(comboFile, "silkbind_jade"),
    defForSpec(comboUmbLightBonusFile, "silkbind_jade"),
    defForSpec(windWallFile, "silkbind_jade"),
    defForSpec(windWallPursuitFile, "silkbind_jade"),
    defForSpec(pursuitChargedBoostFile, "silkbind_jade"),
    defForSpec(lingeringBoneFile, "silkbind_jade"),
    defForSpec(starReacherNormalFile, "silkbind_jade"),
    defForSpec(starReacherBelow30File, "silkbind_jade"),
    defForSpec(starReacherExhaustedFile, "silkbind_jade"),
    defForSpec(revelryScriptFile, "silkbind_jade"),
    defForSpec(fluteBoostFile, "silkbind_jade"),
    defForSpec(springThunderFile, "silkbind_jade"),
    defForSpec(throatPiercedFile, "silkbind_jade"),
    defForSpec(throatPiercedDeflectFile, "silkbind_jade"),
  ],
  bellstrike_umbra: [
    defForSpec(concentrationFile, "bellstrike_umbra"),
    defForSpec(potentRiverFlowFile, "bellstrike_umbra"),
    defForSpec(wineGuFile, "bellstrike_umbra"),
    defForSpec(crosswindSpiritFile, "bellstrike_umbra"),
    defForSpec(revelryScriptFile, "bellstrike_umbra"),
  ],
  bellstrike_splendor: [
    defForSpec(mountainsMightFile, "bellstrike_splendor"),
    defForSpec(concentrationFile, "bellstrike_splendor"),
    defForSpec(revelryScriptFile, "bellstrike_splendor"),
    defForSpec(fluteBoostFile, "bellstrike_splendor"),
  ],
  stonesplit_might: [
    defForSpec(drumbeatFile, "stonesplit_might"),
    defForSpec(breakthroughFile, "stonesplit_might"),
    defForSpec(vulnerabilityFile, "stonesplit_might"),
    defForSpec(vulnerabilityWeaponFile, "stonesplit_might"),
    defForSpec(throatPiercedFile, "stonesplit_might"),
    defForSpec(throatPiercedDeflectFile, "stonesplit_might"),
    defForSpec(shatteredRidgeDeflectFile, "stonesplit_might"),
    defForSpec(revelryScriptFile, "stonesplit_might"),
  ],
  stonesplit_strength: [
    defForSpec(innerPassionFile, "stonesplit_strength"),
    defForSpec(ironGuardsFile, "stonesplit_strength"),
    defForSpec(frostCladSnowbreakFile, "stonesplit_strength"),
    defForSpec(frostCladSnowbreakIPConsumeFile, "stonesplit_strength"),
    defForSpec(burningHeartIPConsumeFile, "stonesplit_strength"),
    defForSpec(frostCladSnowbreakT6File, "stonesplit_strength"),
    defForSpec(frostCladSnowbreakT6ExhaustedFile, "stonesplit_strength"),
    defForSpec(forgetfulnessFile, "stonesplit_strength"),
    defForSpec(mountainSplitterFile, "stonesplit_strength"),
    defForSpec(chargeEnhancementFile, "stonesplit_strength"),
    defForSpec(throatPiercedFile, "stonesplit_strength"),
    defForSpec(throatPiercedAnxiT6File, "stonesplit_strength"),
    defForSpec(throatPiercedDeflectFile, "stonesplit_strength"),
    defForSpec(shatteredRidgeDeflectFile, "stonesplit_strength"),
    defForSpec(revelryScriptFile, "stonesplit_strength"),
  ],
  silkbind_deluge: [defForSpec(heartFocusFile, "silkbind_deluge")],
  silkbind_deluge_dps: [],
  bamboocut_dust: [
    defForSpec(empoweredUmbQCritFile, "bamboocut_dust"),
    defForSpec(revelryScriptFile, "bamboocut_dust"),
    defForSpec(fluteBoostFile, "bamboocut_dust"),
    defForSpec(starsAlign4pcFile, "bamboocut_dust"),
    defForSpec(tangMelodyFile, "bamboocut_dust"),
    defForSpec(towlineSweepT6SpecialFile, "bamboocut_dust"),
  ],
}

export const GLOBAL_BUFF_DEFS: BuffDef[] = [
  soleDef(vulnerabilityTeammateFile),
  soleDef(jadewareFile),
  soleDef(mirageFile),
  soleDef(mirageBonusFile),
  soleDef(rainwhisperShieldFile),
  soleDef(resistanceResolveFile),
  soleDef(surgingWavesFile),
  soleDef(dragonHeadLowHpFile),
]

export const GROUP_BUFF_DEFS: BuffDef[] = [soleDef(healerBuffFile)]

export const MECHANIC_BUFF_DEFS: BuffDef[] = [
  ...allDefs(soulShakenFile),
  soleDef(bellstrikeUmbraBleedPenFile),
  soleDef(bellstrikeUmbraBleedingDamageFile),
  soleDef(stonesplitStrengthSkillCritDamageFile),
]
