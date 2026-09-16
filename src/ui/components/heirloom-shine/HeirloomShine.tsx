import { useEffect, useId, useRef } from "react"
import type { GearRarity } from "../../../engine/types"
import styles from "./HeirloomShine.module.scss"

interface Vein {
  startHeight: number
  endHeight: number
  bend: number
  amplitude: number
  wavelength: number
  phase: number
  strokeWidth: number
  opacity: number
  seconds: number
}

const VIEW_WIDTH = 300
const VIEW_HEIGHT = 220
const SAMPLE_STEP = 10
const OVERHANG = 20
const WAVE_FRAMES = 16
const LAMP_SECONDS = 56

const VEINS: readonly Vein[] = [
  {
    startHeight: 40,
    endHeight: 120,
    bend: -25,
    amplitude: 16,
    wavelength: 260,
    phase: 0,
    strokeWidth: 1.1,
    opacity: 0.9,
    seconds: 10,
  },
  {
    startHeight: 150,
    endHeight: 100,
    bend: 20,
    amplitude: 14,
    wavelength: 220,
    phase: 2,
    strokeWidth: 1,
    opacity: 0.75,
    seconds: 12,
  },
  {
    startHeight: 200,
    endHeight: 185,
    bend: -12,
    amplitude: 12,
    wavelength: 300,
    phase: 4,
    strokeWidth: 0.7,
    opacity: 0.5,
    seconds: 13,
  },
  {
    startHeight: 15,
    endHeight: 60,
    bend: 10,
    amplitude: 10,
    wavelength: 190,
    phase: 1,
    strokeWidth: 0.6,
    opacity: 0.55,
    seconds: 9,
  },
  {
    startHeight: 95,
    endHeight: 170,
    bend: 30,
    amplitude: 20,
    wavelength: 340,
    phase: 3,
    strokeWidth: 0.8,
    opacity: 0.6,
    seconds: 15,
  },
]

const LAMP_X = "30;255;90;255;30"
const LAMP_Y = "44;99;202;99;44"
const LAMP_SPLINES = ".45 0 .55 1;.45 0 .55 1;.45 0 .55 1;.45 0 .55 1"

function veinPath(vein: Vein, phase: number): string {
  const points: [number, number][] = []
  const span = VIEW_WIDTH + OVERHANG * 2
  for (let x = -OVERHANG; x <= VIEW_WIDTH + OVERHANG; x += SAMPLE_STEP) {
    const along = (x + OVERHANG) / span
    const base =
      vein.startHeight +
      (vein.endHeight - vein.startHeight) * along +
      vein.bend * Math.sin(Math.PI * along)
    const wave = vein.amplitude * Math.sin((x / vein.wavelength) * 2 * Math.PI - phase + vein.phase)
    points.push([x, base + wave])
  }
  const round = (value: number) => value.toFixed(1)
  let path = `M${round(points[0][0])} ${round(points[0][1])}`
  for (let index = 0; index < points.length - 1; index++) {
    const before = points[Math.max(index - 1, 0)]
    const from = points[index]
    const to = points[index + 1]
    const after = points[Math.min(index + 2, points.length - 1)]
    const firstControl = [from[0] + (to[0] - before[0]) / 6, from[1] + (to[1] - before[1]) / 6]
    const secondControl = [to[0] - (after[0] - from[0]) / 6, to[1] - (after[1] - from[1]) / 6]
    path += ` C${round(firstControl[0])} ${round(firstControl[1])} ${round(secondControl[0])} ${round(secondControl[1])} ${round(to[0])} ${round(to[1])}`
  }
  return path
}

function wavePhases(vein: Vein): string {
  const frames: string[] = []
  for (let frame = 0; frame <= WAVE_FRAMES; frame++) {
    frames.push(veinPath(vein, (frame / WAVE_FRAMES) * 2 * Math.PI))
  }
  return frames.join(";")
}

const VEIN_WAVES = VEINS.map((vein) => ({ vein, values: wavePhases(vein) }))

function LampMotion() {
  return (
    <>
      <animate
        attributeName="cx"
        values={LAMP_X}
        dur={`${LAMP_SECONDS}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keyTimes="0;.25;.5;.75;1"
        keySplines={LAMP_SPLINES}
      />
      <animate
        attributeName="cy"
        values={LAMP_Y}
        dur={`${LAMP_SECONDS}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keyTimes="0;.25;.5;.75;1"
        keySplines={LAMP_SPLINES}
      />
    </>
  )
}

// The lamp and the veins share one gradient centre, so the veins are revealed
// exactly where the light sits — no second animated layer, and no CSS mask.
export function HeirloomShine({ rarity }: { rarity: GearRarity }) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const gradientId = useId()
  const glowId = `${gradientId}-glow`
  const veinsId = `${gradientId}-veins`

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      svg.pauseAnimations()
      svg.setCurrentTime(LAMP_SECONDS / 4)
      return
    }
    if (typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) svg.unpauseAnimations()
      else svg.pauseAnimations()
    })
    observer.observe(svg)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={`${styles.shine} ${rarity === "epic" ? styles.epic : styles.legendary}`}>
      <svg
        ref={svgRef}
        className={styles.canvas}
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id={glowId} gradientUnits="userSpaceOnUse" cx="30" cy="44" r="240">
            <stop offset="0" className={styles.glowNear} />
            <stop offset=".48" className={styles.glowMid} />
            <stop offset="1" className={styles.glowFar} />
            <LampMotion />
          </radialGradient>
          <radialGradient id={veinsId} gradientUnits="userSpaceOnUse" cx="30" cy="44" r="240">
            <stop offset="0" className={styles.veinNear} />
            <stop offset=".45" className={styles.veinMid} />
            <stop offset="1" className={styles.veinFar} />
            <LampMotion />
          </radialGradient>
        </defs>
        <rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill={`url(#${glowId})`} />
        <g stroke={`url(#${veinsId})`} className={styles.veins}>
          {VEIN_WAVES.map(({ vein, values }, index) => (
            <path
              key={index}
              d={values.slice(0, values.indexOf(";"))}
              strokeWidth={vein.strokeWidth}
              opacity={vein.opacity}
            >
              <animate
                attributeName="d"
                values={values}
                dur={`${vein.seconds}s`}
                repeatCount="indefinite"
                calcMode="linear"
              />
            </path>
          ))}
        </g>
      </svg>
      <span className={styles.skin} />
    </div>
  )
}
