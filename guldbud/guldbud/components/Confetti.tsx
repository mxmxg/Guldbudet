'use client'
import { useEffect, useRef } from 'react'

// Lightweight canvas confetti burst. Increment `fire` to trigger a burst.
// Respects prefers-reduced-motion (renders nothing then).
export default function Confetti({ fire }: { fire: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const prev = useRef(0)

  useEffect(() => {
    if (fire === prev.current) return
    prev.current = fire
    if (fire === 0) return
    if (typeof window === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const W = (canvas.width = window.innerWidth * dpr)
    const H = (canvas.height = window.innerHeight * dpr)
    canvas.style.width = window.innerWidth + 'px'
    canvas.style.height = window.innerHeight + 'px'

    const colors = ['#D4AF37', '#B8860B', '#f5e6c8', '#e8c766', '#a8791a']
    const N = 130
    const parts = Array.from({ length: N }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.3,
      y: H * 0.32,
      vx: (Math.random() - 0.5) * 14 * dpr,
      vy: (Math.random() * -12 - 4) * dpr,
      s: (Math.random() * 6 + 4) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[(Math.random() * colors.length) | 0],
      life: 1,
    }))

    let raf = 0
    const g = 0.42 * dpr
    const start = performance.now()
    const tick = (t: number) => {
      const elapsed = t - start
      ctx.clearRect(0, 0, W, H)
      let alive = false
      for (const p of parts) {
        p.vy += g
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.rot += p.vr
        if (elapsed > 1600) p.life -= 0.04
        if (p.life > 0 && p.y < H + 40) {
          alive = true
          ctx.save()
          ctx.globalAlpha = Math.max(0, p.life)
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rot)
          ctx.fillStyle = p.color
          ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.5)
          ctx.restore()
        }
      }
      if (alive) raf = requestAnimationFrame(tick)
      else ctx.clearRect(0, 0, W, H)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [fire])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 100 }}
    />
  )
}
