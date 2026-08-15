import { useEffect, useRef } from "react"
import styles from "./GraduationFire.module.scss"

const RISE_MAX = 20
const BUOYANCY = 16
const WIND_MAX = 12
const WIND_ACCEL = 0
const SWAY = 4
const MAX_PARTICLES = 800
const SPAWN_BASE = 5
const SPAWN_PER_INTENSITY = 250
const TRAIL_FADE = 20
const MAX_DT = 0.05

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  age: number
  life: number
  size: number
  phase: number
  swayFreq: number
}

const makeSprite = (red: number, green: number, blue: number) => {
  const sprite = document.createElement("canvas")
  sprite.width = 32
  sprite.height = 32
  const spriteCtx = sprite.getContext("2d")
  if (spriteCtx) {
    const gradient = spriteCtx.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0, `rgba(${red}, ${green}, ${blue}, 1)`)
    gradient.addColorStop(0.4, `rgba(${red}, ${green}, ${blue}, 0.5)`)
    gradient.addColorStop(1, `rgba(${red}, ${green}, ${blue}, 0)`)
    spriteCtx.fillStyle = gradient
    spriteCtx.fillRect(0, 0, 32, 32)
  }
  return sprite
}

export function GraduationFire({ rate }: { rate: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const rateRef = useRef(rate)

  useEffect(() => {
    rateRef.current = rate
  }, [rate])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    if (
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return
    }

    const sprites = [makeSprite(255, 190, 80), makeSprite(235, 110, 30), makeSprite(120, 30, 8)]
    const particles: Particle[] = []
    let width = 0
    let height = 0
    let box = { left: 0, top: 0, right: 0, bottom: 0 }
    let spawnCarry = 0
    let last = 0
    let frame = 0

    const resize = () => {
      const button = canvas.parentElement
      if (!button) return
      const canvasRect = canvas.getBoundingClientRect()
      if (canvasRect.width === 0) return
      const buttonRect = button.getBoundingClientRect()
      width = Math.round(canvasRect.width)
      height = Math.round(canvasRect.height)
      canvas.width = width
      canvas.height = height
      box = {
        left: buttonRect.left - canvasRect.left,
        top: buttonRect.top - canvasRect.top,
        right: buttonRect.right - canvasRect.left,
        bottom: buttonRect.bottom - canvasRect.top,
      }
    }

    const spawnOne = (intensity: number) => {
      const edgeWidth = box.right - box.left
      const edgeHeight = box.bottom - box.top
      const pick = Math.random() * (edgeWidth * 2 + edgeHeight * 2)
      const sizeScale = 0.8 + 0.5 * intensity
      if (pick < edgeWidth + edgeHeight * 2) {
        let x = box.left
        let y = box.top
        if (pick < edgeWidth) {
          x = box.left + pick
        } else if (pick < edgeWidth + edgeHeight) {
          y = box.top + (pick - edgeWidth)
        } else {
          x = box.right
          y = box.top + (pick - edgeWidth - edgeHeight)
        }
        particles.push({
          x,
          y,
          vx: 0,
          vy: -(2 + 3 * Math.random()),
          age: 0,
          life: 1.2 + Math.random(),
          size: (1.2 + Math.random() * 1.6) * sizeScale,
          phase: Math.random() * Math.PI * 2,
          swayFreq: 3 + Math.random() * 3,
        })
      } else {
        particles.push({
          x: box.left + Math.random() * edgeWidth,
          y: box.bottom,
          vx: 0,
          vy: -(1 + 2 * Math.random()),
          age: 0,
          life: 0.8 + 0.6 * Math.random(),
          size: (0.8 + Math.random()) * sizeScale,
          phase: Math.random() * Math.PI * 2,
          swayFreq: 3 + Math.random() * 3,
        })
      }
    }

    const update = (dt: number) => {
      for (let i = particles.length - 1; i >= 0; i--) {
        const particle = particles[i]
        particle.age += dt
        if (particle.age >= particle.life) {
          particles[i] = particles[particles.length - 1]
          particles.pop()
          continue
        }
        particle.vy = Math.max(particle.vy - BUOYANCY * dt, -RISE_MAX)
        particle.vx = Math.min(particle.vx + WIND_ACCEL * dt, WIND_MAX)
        particle.x +=
          (particle.vx + Math.sin(particle.age * particle.swayFreq + particle.phase) * SWAY) * dt
        particle.y += particle.vy * dt
      }
    }

    const render = (dt: number) => {
      ctx.globalCompositeOperation = "destination-out"
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0.25, Math.min(0.9, dt * TRAIL_FADE))})`
      ctx.fillRect(0, 0, width, height)
      ctx.globalCompositeOperation = "lighter"
      for (const particle of particles) {
        const ageFraction = particle.age / particle.life
        const sprite = sprites[ageFraction < 0.3 ? 0 : ageFraction < 0.65 ? 1 : 2]
        const drawSize = particle.size * 2 * (1.3 - 0.5 * ageFraction)
        ctx.globalAlpha = (1 - ageFraction) * 0.55
        ctx.drawImage(
          sprite,
          particle.x - drawSize / 2,
          particle.y - drawSize / 2,
          drawSize,
          drawSize,
        )
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
    }

    const loop = (now: number) => {
      frame = requestAnimationFrame(loop)
      if (!last) {
        last = now
        return
      }
      const dt = Math.min((now - last) / 1000, MAX_DT)
      last = now
      const intensity = Math.min(1, Math.max(0, (rateRef.current - 0.94) / 0.06))
      spawnCarry += (SPAWN_BASE + SPAWN_PER_INTENSITY * intensity) * dt
      while (spawnCarry >= 1) {
        spawnCarry -= 1
        if (particles.length < MAX_PARTICLES) spawnOne(intensity)
      }
      update(dt)
      render(dt)
    }

    resize()
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : undefined
    if (canvas.parentElement) observer?.observe(canvas.parentElement)
    frame = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(frame)
      observer?.disconnect()
    }
  }, [])

  return <canvas ref={canvasRef} className={styles.fire} aria-hidden="true" />
}
