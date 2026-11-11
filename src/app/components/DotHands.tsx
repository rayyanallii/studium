import { useEffect, useRef } from 'react'

const REMOTE_SOURCE =
  'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261030_025250_100df7b8-31fd-4614-aa4a-c1b7d5b6b273.png&w=1600&q=85'
const LOCAL_SOURCE = '/hands-source.webp'

function hash(a: number, b: number) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453
  return n - Math.floor(n)
}

function smooth(a: number, b: number, x: number) {
  const v = Math.max(0, Math.min(1, (x - a) / (b - a)))
  return v * v * (3 - 2 * v)
}

function mixAt(t: number, on: number, off: number, dur = 1.6) {
  return smooth(on, on + dur, t) * (1 - smooth(off, off + dur, t))
}

const LOOP = 20
const LEVELS = [0, 0.26, 0.52, 0.78, 1]

export interface DotHandsProps {
  paused: boolean
  dotColor?: string
  bgColor?: string
  className?: string
}

export function DotHands({
  paused,
  dotColor = '#9d7bea',
  bgColor = 'transparent',
  className = 'studium-hands',
}: DotHandsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pauseRef = useRef(paused)
  const colorRef = useRef(dotColor)
  const bgRef = useRef(bgColor)

  useEffect(() => {
    pauseRef.current = paused
  }, [paused])

  useEffect(() => {
    colorRef.current = dotColor
    bgRef.current = bgColor
  }, [dotColor, bgColor])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const fA = document.createElement('canvas')
    const fB = document.createElement('canvas')
    const ctxA = fA.getContext('2d', { willReadFrequently: true })
    const ctxB = fB.getContext('2d', { willReadFrequently: true })
    if (!ctxA || !ctxB) return

    let tiles: HTMLCanvasElement[] = []
    let W = 0
    let H = 0
    let DPR = 1
    let step = 0
    let rowStep = 0
    let cols = 0
    let rows = 0
    let R = 0
    let seeds = new Float32Array(0)

    let disposed = false
    let frameId = 0
    let lastTime = 0
    let simTime = 0

    const render = (timeSec: number) => {
      if (!tiles.length || !W || !H || disposed) return

      const t = ((timeSec % LOOP) + LOOP) % LOOP
      const portrait = H > W
      const handWidth = portrait ? W * 0.70 : W * 0.58
      const handHeight = (handWidth * (0.4 * 1520)) / (0.47 * 2688)
      // Hands positioned comfortably below the buttons so they are clearly visible
      const handCenterY = portrait ? H * 0.68 : H * 0.62

      const a = (2 * Math.PI * t) / LOOP

      const fieldPairs = [
        { ctx: ctxA, left: tiles[0], right: tiles[1] },
        { ctx: ctxB, left: tiles[2], right: tiles[3] },
      ]

      for (let p = 0; p < 2; p++) {
        const { ctx: fCtx, left, right } = fieldPairs[p]
        fCtx.setTransform(1, 0, 0, 1, 0, 0)
        fCtx.fillStyle = '#ffffff'
        fCtx.fillRect(0, 0, cols, rows)

        for (let side = 0; side < 2; side++) {
          const isLeft = side === 0
          const ph = isLeft ? 0 : Math.PI
          const reach = (0.035 * Math.sin(a + ph) + 0.012 * Math.sin(2 * a + 1.3 + ph)) * W
          const scale = 1 + 0.07 * Math.sin(a + 0.9 + ph)
          const rot = (isLeft ? 1 : -1) * 0.045 * Math.sin(a + 2.1 + ph)

          const pivotX = isLeft ? 0 : W
          const tile = isLeft ? left : right
          const x = isLeft ? reach - W * 0.045 : W - handWidth + W * 0.045 - reach
          const y = handCenterY - handHeight / 2

          fCtx.save()
          fCtx.scale(cols / W, rows / H)
          fCtx.translate(pivotX, handCenterY)
          fCtx.rotate(rot)
          fCtx.scale(scale, scale)
          fCtx.translate(-pivotX, -handCenterY)
          fCtx.drawImage(tile, x, y, handWidth, handHeight)
          fCtx.restore()
        }
      }

      let dataA: Uint8ClampedArray
      let dataB: Uint8ClampedArray
      try {
        dataA = ctxA.getImageData(0, 0, cols, rows).data
        dataB = ctxB.getImageData(0, 0, cols, rows).data
      } catch {
        return
      }

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      ctx.clearRect(0, 0, W, H)
      if (bgRef.current && bgRef.current !== 'transparent') {
        ctx.fillStyle = bgRef.current
        ctx.fillRect(0, 0, W, H)
      }
      ctx.fillStyle = colorRef.current
      ctx.beginPath()

      const tick = Math.floor(t * 7)
      const mL = mixAt(t, 6.2, 14.6, 1.6)
      const mR = mixAt(t, 2.4, 10.4, 1.6)

      for (let j = 0; j < rows; j++) {
        const shift = hash(j, tick) > 0.965 ? Math.round((hash(tick, j) - 0.5) * 8) : 0

        for (let i = 0; i < cols; i++) {
          const idx = j * cols + i
          const seed = seeds[idx]
          const m = i < cols / 2 ? mL : mR
          const useB = seed < m

          const sampleCol = Math.max(0, Math.min(cols - 1, i - shift))
          const sampleByte = (j * cols + sampleCol) * 4

          const red = useB ? dataB[sampleByte] : dataA[sampleByte]
          const lum = red / 255

          let intensity = Math.max(0, Math.min(1, (1 - lum - 0.12) / 0.46))
          if (intensity <= 0) continue

          // Glitch dissolve front sparkling/thinning
          if (m > 0.001 && m < 0.999) {
            const diff = Math.abs(seed - m)
            if (diff < 0.12) {
              intensity *= diff / 0.12
              if (hash(i + tick, j) <= 0.4) {
                intensity *= 0.3
              }
            }
          }

          // Shimmer
          intensity *= 0.86 + 0.14 * Math.sin(t * 3.2 + seed * 40)

          // Center fade (fingertips dissolve before meeting)
          const cx = Math.abs((i + 0.5) / cols - 0.5)
          intensity *= smooth(0.015, 0.08, cx)

          // Elevated text breathing zone: clears dots only behind headline and subline
          const clearCenterY = portrait ? 0.35 : 0.37
          const zoneX = cx / (portrait ? 0.38 : 0.28)
          const zoneY = (((j + 0.5) * rowStep) / H - clearCenterY) / 0.16
          const distance = Math.hypot(zoneX, zoneY)
          intensity *= smooth(0.70, 1.20, distance)

          let level = 0
          for (let k = 0; k < LEVELS.length; k++) {
            if (intensity >= LEVELS[k] - 0.13) {
              level = LEVELS[k]
            }
          }

          if (level <= 0) continue

          const dotRadius = level === 0.26 ? R * 0.38 : R * level
          const px = (i + 0.5) * step
          const py = (j + 0.5) * rowStep

          ctx.moveTo(px + dotRadius, py)
          ctx.arc(px, py, dotRadius, 0, Math.PI * 2)
        }
      }

      ctx.fill()
    }

    const resize = () => {
      if (!canvas || disposed) return
      const rect = canvas.getBoundingClientRect()
      W = rect.width || window.innerWidth
      H = rect.height || window.innerHeight
      DPR = Math.min(2, window.devicePixelRatio || 1)

      canvas.width = Math.round(W * DPR)
      canvas.height = Math.round(H * DPR)

      step = Math.max(5, W / 205)
      rowStep = step * 2.05
      cols = Math.ceil(W / step)
      rows = Math.ceil(H / rowStep)
      R = step * 0.46

      fA.width = cols
      fA.height = rows
      fB.width = cols
      fB.height = rows

      seeds = new Float32Array(cols * rows)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          seeds[j * cols + i] = 0.55 * hash(i, j) + 0.45 * hash(j * 3.1, 7.7)
        }
      }

      render(simTime)
    }

    const buildTiles = (imgEl: HTMLImageElement) => {
      const specs = [
        [0, 0.06, 0.47, 0.4],
        [0.53, 0.06, 0.47, 0.4],
        [0, 0.55, 0.47, 0.4],
        [0.53, 0.55, 0.47, 0.4],
      ]
      tiles = specs.map(([sx, sy, sw, sh]) => {
        const tile = document.createElement('canvas')
        tile.width = 420
        tile.height = Math.round((420 * imgEl.height * sh) / (imgEl.width * sw))
        const tCtx = tile.getContext('2d')!
        tCtx.imageSmoothingQuality = 'high'
        tCtx.drawImage(
          imgEl,
          sx * imgEl.width,
          sy * imgEl.height,
          sw * imgEl.width,
          sh * imgEl.height,
          0,
          0,
          tile.width,
          tile.height,
        )
        return tile
      })
      resize()
      render(simTime)
    }

    const loop = (now: number) => {
      if (disposed) return
      if (!lastTime) lastTime = now
      const dt = Math.min((now - lastTime) / 1000, 0.1)
      lastTime = now

      if (!pauseRef.current && !document.hidden) {
        simTime = (simTime + dt) % LOOP
        render(simTime)
      }

      frameId = requestAnimationFrame(loop)
    }

    ;(window as any).__render = (t: number) => {
      simTime = ((t % LOOP) + LOOP) % LOOP
      render(simTime)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(canvas)

    const img = new Image()
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      if (disposed) return
      buildTiles(img)
      frameId = requestAnimationFrame(loop)
    }

    img.onerror = () => {
      if (disposed) return
      const fallback = new Image()
      fallback.onload = () => {
        if (disposed) return
        buildTiles(fallback)
        frameId = requestAnimationFrame(loop)
      }
      fallback.src = LOCAL_SOURCE
    }

    img.src = REMOTE_SOURCE

    return () => {
      disposed = true
      cancelAnimationFrame(frameId)
      observer.disconnect()
      img.onload = null
      img.onerror = null
    }
  }, [])

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
