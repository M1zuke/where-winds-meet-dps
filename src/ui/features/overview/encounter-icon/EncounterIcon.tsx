export type EncounterIconName =
  | "sliders"
  | "food"
  | "divinecraft"
  | "scripts"
  | "teammate"
  | "extras"
  | "lock"
  | "spinner"
  | "target"

const ICON_PATHS: Record<EncounterIconName, string[]> = {
  sliders: ["M4 6h10", "M18 6h2", "M4 12h2", "M10 12h10", "M4 18h12", "M20 18h0"],
  food: ["M4 11h16a8 8 0 0 1-16 0z", "M8 7c0-1.5 1-1.5 1-3", "M13 7c0-1.5 1-1.5 1-3"],
  divinecraft: ["M9 3h6", "M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3"],
  scripts: [
    "M7 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    "M9 9h7",
    "M9 13h7",
  ],
  teammate: [
    "M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M3 19a6 6 0 0 1 12 0",
    "M16 5a3 3 0 0 1 0 6",
    "M18 14a6 6 0 0 1 3 5",
  ],
  extras: ["M12 3l2.2 5.3L20 9l-4.3 3.8L17 18.5 12 15.6 7 18.5l1.3-5.7L4 9l5.8-.7z"],
  lock: ["M7 11h10v9H7z", "M9 11V8a3 3 0 0 1 6 0v3"],
  target: [
    "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
    "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "M12 12h0",
  ],
  spinner: ["M12 3a9 9 0 1 0 9 9"],
}

export function EncounterIcon({
  name,
  className,
}: {
  name: EncounterIconName
  className?: string
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      width="1em"
      height="1em"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name].map((path) => (
        <path key={path} d={path} />
      ))}
    </svg>
  )
}
