import type { ChangelogEntryDetails } from "../types"

export const details: ChangelogEntryDetails = {
  sections: [
    {
      label: "Added",
      items: [
        {
          text: "An Enhancement tab sets your own enhancement values per weapon, disc and pendant, up to the in-game maximum.",
          authors: ["M1zuke"],
        },
        {
          text: "Min and Max Formless Attack read as their own rows under Attack & Penetration in the Overview.",
          authors: ["M1zuke"],
        },
        {
          text: "The site has its own icon and shows a title, description and preview image when a link to it is shared.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Changed",
      items: [
        {
          text: "Every inner way carries its breakthrough 17 figures.",
          authors: ["M1zuke"],
        },
        {
          text: "The enhancement table carries its level 100 figures, raising base attack.",
          authors: ["M1zuke"],
        },
        {
          text: "Build assets are cached at the edge, so a repeat visit loads faster.",
          authors: ["M1zuke"],
        },
      ],
    },
    {
      label: "Fixed",
      items: [
        {
          text: "The second level 100 talent page counts, adding twelve attribute points and Formless attack that were being missed.",
          authors: ["M1zuke"],
        },
        {
          text: "Opening a profile in a build that does not know one of its gear words, sets, arsenals or inner ways no longer erases it.",
          authors: ["M1zuke"],
        },
      ],
    },
  ],
}
