import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "A graduation percentage in the metrics row, showing how close your build is to a benchmark build.",
          authors: ["KelvinJin", "M1zuke"],
        },
        {
          text: "The graduation popup shows the benchmark build's gear, and its panel stats on a second tab.",
          authors: ["M1zuke"],
        },
        {
          text: "A toggle switches the graduation build between max rolls and relayed caps.",
          authors: ["M1zuke"],
        },
        {
          text: "This changelog, behind the version next to the title, crediting the people who shipped each change.",
          authors: ["M1zuke"],
        },
        {
          text: "The gear import brings the inner ways your capture carries, in the order it reports them.",
          authors: ["M1zuke"],
        },
        {
          text: "The gear import names the inner ways it cannot model and warns that the calculation will differ.",
          authors: ["M1zuke"],
        },
        {
          text: "The gear import marks a stat line that belongs to another class instead of calling it unknown.",
          authors: ["M1zuke"],
        },
        {
          text: "The Spear Special's Defense Down debuff, reducing target physical defense by 5% while River Flow is up.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Stonesplit Strength is validated — its output is checked against a measured build.",
          authors: ["M1zuke"],
        },
        {
          text: "The inner-way list keeps the five modelled ways; the 23 unimplemented entries are gone.",
          authors: ["M1zuke"],
        },
        {
          text: "The default build starts with no inner ways slotted, because the ones it filled were removed.",
          authors: ["M1zuke"],
        },
        {
          text: "Analyses share one pool of background workers, so opening a tab no longer spins up its own.",
          authors: ["M1zuke"],
        },
        {
          text: "The app downloads a far smaller attribute table on first load.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "The selected breakthrough now drives your own attributes, not just the target's defense and resistance.",
          authors: ["M1zuke"],
        },
        { text: "Concentration is applied once instead of twice.", authors: ["M1zuke"] },
        {
          text: "A cast's buff chips no longer include what the next cast applies.",
          authors: ["M1zuke"],
        },
        {
          text: "Every defined class is selectable, not only the validated ones.",
          authors: ["M1zuke"],
        },
        {
          text: "Switching class keeps your inner ways where you put them, with no slot reserved for the signature.",
          authors: ["M1zuke"],
        },
        {
          text: "An imported attunement reads its own units, so an 8.9% penetration roll no longer arrives as 890%.",
          authors: ["M1zuke"],
        },
        {
          text: "A low attunement roll from an older piece is no longer raised to the minimum this app models.",
          authors: ["M1zuke"],
        },
        {
          text: "Opening a dialog no longer quarters the frame rate; the backdrop darkens instead of blurring.",
          authors: ["M1zuke"],
        },
        {
          text: "Escape now closes only the dialog on top, instead of the one behind it as well.",
          authors: ["M1zuke"],
        },
        {
          text: "A key a combobox already handled no longer closes the dialog as well.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
