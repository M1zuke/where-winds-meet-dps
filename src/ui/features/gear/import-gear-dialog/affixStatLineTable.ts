/**
 * Affix id → the stat line it is, as a `targetKey`: `word:<name>` matching a
 * `getWordSpecs` entry, or `attunement:<id>` matching an `AttunementOption`.
 *
 * This table is the only authority on what a stat line means. The payload also
 * reports `value / maxRoll` per affix, which pins the roll's ceiling, but a
 * ceiling narrows the field without deciding it — 44.2 is Max Bellstrike and Max
 * Bamboocut alike — so a derived ceiling only *offers* candidates in the import
 * dialog. An id absent here imports nothing until it is mapped, either by an entry
 * below or by the user picking it in the dialog (remembered per id from then on,
 * and exportable as JSON to be pasted back into this file).
 *
 * The same stat carries a different id per equip slot — Affinity is 9743005,
 * 9793120, 9794120 and 9794014 — so a stat needs one entry per slot it rolls on,
 * and this table is expected to stay incomplete until every slot has been seen.
 *
 * Tunements are 7-digit `97xxxxx` ids, attunements 6-digit `280xxx`. Values are in
 * this app's units: percent tunements arrive as fractions, attunements as percent
 * and are scaled in `importedGearPieces.ts`.
 *
 * Confirmed against live captures, 2026-08-11.
 */
export const AFFIX_ID_TO_STAT_LINE: Readonly<Record<string, string>> = {
  "280101": "attunement:bleedingDamage",
  "280103": "attunement:bleedingDamage",
  "280701": "attunement:physPen",
  "9712002": "word:Max Phys",
  "9713004": "word:Max Void Attack",
  "9732002": "word:Max Phys",
  "9733002": "word:Max Phys",
  "9743005": "word:Affinity",
  "9752007": "word:Power",
  "9793005": "word:Momentum",
  "9793008": "word:Max Phys",
  "9793011": "word:Max Void Attack",
  "9793015": "word:Sword Martial Boost",
  "9793102": "word:Power",
  "9793108": "word:Max Phys",
  "9793111": "word:Max Bellstrike",
  "9793117": "word:Max Bamboocut",
  "9793119": "word:Crit",
  "9793120": "word:Affinity",
  "9793121": "word:All Martial Boost",
  "9794002": "word:Power",
  "9794005": "word:Momentum",
  "9794008": "word:Max Phys",
  "9794014": "word:Affinity",
  "9794102": "word:Power",
  "9794105": "word:Momentum",
  "9794108": "word:Max Phys",
  "9794119": "word:Crit",
  "9794120": "word:Affinity",
  "9794121": "word:All Martial Boost",
  "9794124": "word:Damage VS Boss %",
}
