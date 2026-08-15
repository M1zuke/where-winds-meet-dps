import { createRequire } from "node:module"
import { writeFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const require = createRequire(import.meta.url)
const XLSX = require("xlsx")

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..")
const officialPairs = require(join(repoRoot, "reference/locale/zhToEnOfficial.json"))

const SOURCE_XLSX = "excels/Bellstrike Splendor lvl110 speed-rotation calculator v1.3.xlsx"
const WORKBOOK_OUT = "reference/workbook/bellstrikeSplendorWorkbook.wb1.3-lvl110.json"
const COEFFICIENTS_OUT = "reference/workbook/bellstrikeSplendorSkillCoefficients.wb1.3-lvl110.json"

const SIBLING_EXTRACTIONS = [
  "reference/workbook/stonesplitStrengthWorkbook.wb1.15-lvl110.json",
  "reference/workbook/umbraWorkbook.wb1.5-lvl110.json",
]

const SHEET_NAMES_EN = {
  期望: "Expected Damage (rotation)",
  RD: "RD (raid-DPS variant of the rotation)",
  武学奇术: "Martial & Mystic Arts (skill table)",
  增益: "Buffs",
  更新日志: "Changelog",
}

const NEW_TERMS = {
  第一道剑气: ["1st Sword Energy", "composed"],
  第二道剑气: ["2nd Sword Energy", "composed"],
  第三道剑气: ["3rd Sword Energy", "composed"],
  "第一道剑气(气竭)": ["1st Sword Energy (Exhausted)", "composed"],
  "第二道剑气(气竭)": ["2nd Sword Energy (Exhausted)", "composed"],
  "第三道剑气(气竭)": ["3rd Sword Energy (Exhausted)", "composed"],
  三剑气: ["Three Sword Energy (total)", "composed"],
  飞剑: ["Flying Sword", "composed"],
  飞剑卸: ["Flying Sword (Deflect)", "composed"],
  飞剑气涌: ["Flying Sword (Energy Surge)", "composed"],
  剑R: ["Sword R", "composed"],
  剑气强化: ["Sword Energy Enhancement", "composed"],
  剑气增伤1层: ["Sword Slash Damage Boost (1 stack)", "composed"],
  剑气增伤2层: ["Sword Slash Damage Boost (2 stacks)", "composed"],
  剑气增伤3层: ["Sword Slash Damage Boost (3 stacks)", "composed"],
  "威猛2%": ["Battle Anthem (2%)", "composed"],
  "威猛5%": ["Battle Anthem (5%)", "composed"],
  "威猛10%": ["Battle Anthem (10%)", "composed"],
  额外20耐: ["Extra 20 Endurance", "composed"],
  "低于60%耐力": ["Below 60% Endurance", "composed"],
  笛: ["Flute", "composed"],
  远程笛: ["Ranged Flute", "composed"],
  外抗: ["Physical Resistance", "composed"],
  属抗: ["Attribute Resistance", "composed"],
  副本天赋: ["Dungeon Talent", "composed"],
  团队增益: ["Team Buffs", "composed"],
  全武增: ["All Martial DMG Boost", "composed"],
  剑增: ["Sword DMG Boost", "composed"],
  枪增: ["Spear DMG Boost", "composed"],
  单体奇术增: ["Single-Target Mystic Art DMG Boost", "composed"],
  群体奇术增: ["Group Mystic Art DMG Boost", "composed"],
  首领增: ["Boss DMG Boost", "composed"],
  固伤加成: ["Fixed DMG Bonus", "composed"],
  食物加成: ["Food Bonus", "composed"],
  蓄力技定音: ["Charged Skill Attunement", "composed"],
  实际属性: ["Actual Attributes", "composed"],
  战斗时间: ["Combat Time", "composed"],
  毕业率: ["Graduation Rate", "composed"],
  秋瞑帖: ["秋瞑帖", "untranslated"],
}

function siblingVocabulary() {
  const vocabulary = new Map()
  const remember = (zh, en) => {
    if (!zh || !en || zh === en) return
    if (!vocabulary.has(zh)) vocabulary.set(zh, en)
  }
  for (const path of SIBLING_EXTRACTIONS) {
    const doc = require(join(repoRoot, path))
    for (const sheet of Object.values(doc.sheets)) {
      for (const column of sheet.columns ?? []) remember(column.zh, column.en)
      for (const row of sheet.rows ?? []) {
        remember(row.nameZh, row.nameEn)
        for (const value of Object.values(row.fields ?? {})) {
          if (value && typeof value === "object" && value.zh) remember(value.zh, value.en)
        }
      }
      for (const entry of sheet.rotation ?? []) {
        remember(entry.skillZh, entry.skillEn)
        const zh = entry.buffsZh ?? []
        const en = entry.buffsEn ?? []
        zh.forEach((label, index) => remember(label, en[index]))
      }
    }
  }
  return vocabulary
}

const inherited = siblingVocabulary()

function translate(zh) {
  if (zh === null || zh === undefined || zh === "") return { en: null, enSource: "n/a" }
  const text = String(zh)
  const introduced = NEW_TERMS[text]
  if (introduced) return { en: introduced[0], enSource: introduced[1] }
  const shared = inherited.get(text)
  if (shared) return { en: shared, enSource: "inherited" }
  const official = officialPairs[text]
  if (official)
    return { en: Array.isArray(official) ? official[0] : official, enSource: "official" }
  if (!/[一-鿿]/.test(text)) return { en: text, enSource: "n/a" }
  return { en: text, enSource: "untranslated" }
}

const workbook = XLSX.readFile(join(repoRoot, SOURCE_XLSX), { cellFormula: true, cellNF: true })

function sheetCells(sheet) {
  const cells = {}
  for (const [address, cell] of Object.entries(sheet)) {
    if (address.startsWith("!")) continue
    const entry = { v: cell.v, t: cell.t }
    if (cell.f) entry.f = cell.f
    cells[address] = entry
  }
  return cells
}

function columnHeaders(sheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"])
  const headers = []
  for (let col = range.s.c; col <= range.e.c; col++) {
    const letter = XLSX.utils.encode_col(col)
    const cell = sheet[`${letter}1`]
    if (col === range.s.c && !cell) {
      headers.push({ col: letter, zh: null, en: "(row label)", enSource: "n/a" })
      continue
    }
    if (!cell) continue
    const zh = String(cell.v)
    headers.push({ col: letter, zh, ...translate(zh) })
  }
  return headers
}

function cellValue(sheet, letter, row) {
  const cell = sheet[`${letter}${row}`]
  return cell ? cell.v : undefined
}

function labelledRows(sheet, headers) {
  const range = XLSX.utils.decode_range(sheet["!ref"])
  const rows = []
  for (let row = 2; row <= range.e.r + 1; row++) {
    const name = cellValue(sheet, "A", row)
    if (name === undefined || name === "") continue
    const fields = {}
    for (const header of headers) {
      if (header.col === "A") continue
      const value = cellValue(sheet, header.col, row)
      if (value === undefined || value === "") continue
      fields[header.en] =
        typeof value === "string" && /[一-鿿]/.test(value)
          ? { zh: value, en: translate(value).en }
          : value
    }
    rows.push({ row, nameZh: String(name), ...nameFields(translate(String(name))), fields })
  }
  return rows
}

function nameFields({ en, enSource }) {
  return { nameEn: en, nameEnSource: enSource }
}

const BUFF_COLUMNS = [
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "AA",
  "AB",
  "AC",
  "AD",
  "AE",
  "AF",
  "AG",
]

function rotationRows(sheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"])
  const entries = []
  for (let row = 2; row <= range.e.r + 1; row++) {
    const skill = cellValue(sheet, "R", row)
    if (skill === undefined || skill === "" || skill === "N/a") continue
    const buffsZh = BUFF_COLUMNS.map((letter) => cellValue(sheet, letter, row)).filter(
      (value) => value !== undefined && value !== "" && value !== "N/a",
    )
    entries.push({
      row,
      skillZh: String(skill),
      skillEn: translate(String(skill)).en,
      count: cellValue(sheet, "Q", row) ?? null,
      expectedDamage: cellValue(sheet, "L", row) ?? null,
      buffsZh: buffsZh.map(String),
      buffsEn: buffsZh.map((label) => translate(String(label)).en),
    })
  }
  return entries
}

function changelogRows(sheet) {
  const range = XLSX.utils.decode_range(sheet["!ref"])
  const entries = []
  for (let row = 2; row <= range.e.r + 1; row++) {
    const description = cellValue(sheet, "C", row)
    if (description === undefined || description === "") continue
    entries.push({
      row,
      version: cellValue(sheet, "A", row) ?? null,
      entryNo: cellValue(sheet, "B", row) ?? null,
      descriptionZh: String(description),
    })
  }
  return entries
}

const sheets = {}
let cellCount = 0
for (const name of workbook.SheetNames) {
  const sheet = workbook.Sheets[name]
  const headers = columnHeaders(sheet)
  const cells = sheetCells(sheet)
  cellCount += Object.keys(cells).length
  const view = {
    nameZh: name,
    nameEn: SHEET_NAMES_EN[name] ?? name,
    ref: sheet["!ref"],
    columns: headers,
    cells,
  }
  if (name === "期望" || name === "RD") view.rotation = rotationRows(sheet)
  else if (name === "更新日志") view.changelog = changelogRows(sheet)
  else view.rows = labelledRows(sheet, headers)
  sheets[name] = view
}

const fullExtraction = {
  _meta: {
    description:
      "Complete extraction of the Bellstrike Splendor lvl-110 speed-rotation workbook: every non-empty cell of all sheets (cached value + formula + type), plus translated structured views.",
    site: "https://h9dh.cn/",
    file: "鸣金虹110阶竞速轴属性毕业率进阶计算器1.3.xlsx",
    localCopy: SOURCE_XLSX,
    classZh: "鸣金虹",
    classEn: "Bellstrike Splendor",
    classId: "bellstrikeSplendor",
    spec: "bellstrike_splendor",
    workbookVersion: "1.3",
    level: "110阶 (lvl-110 speed rotation)",
    author: "BiliBili@片雲 / Violet",
    sheetCount: workbook.SheetNames.length,
    cellCount,
    generatedBy: "scripts/extractBellstrikeSplendorWorkbook.mjs",
    devOnly:
      "Contains Chinese verbatim — must never be imported from src/ or tests/ (CLAUDE.md: the app is English-only). The curated app-facing subset is bellstrikeSplendorSkillCoefficients.wb1.3-lvl110.json.",
  },
  _translation: {
    method:
      "enSource='official' means the exact key exists in reference/locale/zhToEnOfficial.json (official ZH<->EN pairs from the game client); 'inherited' means the label was already rendered by the Stonesplit Strength or Bellstrike Umbra extraction and that rendering is reused so a shared label cannot diverge; 'composed' means it was built from official component terms plus spreadsheet shorthand; 'untranslated' means the Chinese is kept because the client DB has no key for it.",
    changelogNote:
      "更新日志 descriptions are free prose with no official keys and are kept in Chinese verbatim, untranslated by design.",
  },
  sheets,
}

writeFileSync(join(repoRoot, WORKBOOK_OUT), JSON.stringify(fullExtraction, null, 1) + "\n")

const skillSheet = sheets["武学奇术"]
const coefficients = {
  _source: {
    site: "https://h9dh.cn/",
    file: "鸣金虹110阶竞速轴属性毕业率进阶计算器1.3.xlsx",
    url: "https://h9dh.cn/excel/%E9%B8%A3%E9%87%91%E8%99%B9110%E9%98%B6%E7%AB%9E%E9%80%9F%E8%BD%B4%E5%B1%9E%E6%80%A7%E6%AF%95%E4%B8%9A%E7%8E%87%E8%BF%9B%E9%98%B6%E8%AE%A1%E7%AE%97%E5%99%A81.3.xlsx",
    sheet: "武学奇术 (Martial & Mystic Arts)",
    classZh: "鸣金虹",
    classEn: "Bellstrike Splendor",
    classId: "bellstrikeSplendor",
    spec: "bellstrike_splendor",
    workbookVersion: "1.3",
    level: "110阶 (lvl-110 speed rotation)",
    note: "Coefficients/flat values are verbatim cached cell values at full stored precision; formulas are retained in the complete workbook extraction.",
  },
  _translation: {
    method: fullExtraction._translation.method,
    columns: skillSheet.columns,
  },
  skills: skillSheet.rows.map(({ row, nameZh, nameEn, nameEnSource, fields }) => ({
    row,
    nameZh,
    nameEn,
    nameEnSource,
    fields,
  })),
  _comparison: {
    ourSource: null,
    rule: "Bellstrike Splendor is not a registered ClassDef, so there is no implemented skill set to compare against and no ourSkill block is emitted. Populate one when the class is registered.",
    matched: 0,
    totalDamageRows: skillSheet.rows.length,
  },
}

writeFileSync(join(repoRoot, COEFFICIENTS_OUT), JSON.stringify(coefficients, null, 2) + "\n")

const untranslated = new Set()
for (const sheet of Object.values(sheets)) {
  for (const column of sheet.columns)
    if (column.enSource === "untranslated") untranslated.add(column.zh)
  for (const row of sheet.rows ?? [])
    if (row.nameEnSource === "untranslated") untranslated.add(row.nameZh)
}
console.log(`sheets ${workbook.SheetNames.length}, cells ${cellCount}`)
console.log(`wrote ${WORKBOOK_OUT}`)
console.log(`wrote ${COEFFICIENTS_OUT}`)
console.log(`untranslated labels: ${untranslated.size ? [...untranslated].join(", ") : "none"}`)
