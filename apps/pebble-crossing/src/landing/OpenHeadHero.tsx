import { useEffect, useRef, useState } from 'react'

import { LANDING_FLOATERS } from './landingTokens'
import './OpenHeadHero.css'

const base = import.meta.env.BASE_URL

type Offset = { x: number; y: number }

export function OpenHeadHero() {
  const stageRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: -9999, y: -9999, active: false })
  const [offsets, setOffsets] = useState<Offset[]>(() => LANDING_FLOATERS.map(() => ({ x: 0, y: 0 })))
  const rafRef = useRef(0)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect()
      pointerRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        active: true,
      }
    }

    const onLeave = () => {
      pointerRef.current.active = false
    }

    stage.addEventListener('pointermove', onMove)
    stage.addEventListener('pointerleave', onLeave)

    const start = performance.now()
    const loop = (now: number) => {
      const rect = stage.getBoundingClientRect()
      const t = (now - start) / 1000
      const pointer = pointerRef.current

      const next = LANDING_FLOATERS.map((token) => {
        const restX = token.restX * rect.width
        const restY = token.restY * rect.height
        const driftX = Math.sin(t * token.driftHz * Math.PI * 2 + token.phase) * token.driftAmp
        const driftY = Math.cos(t * token.driftHz * Math.PI * 2 + token.phase * 1.3) * token.driftAmp * 0.7
        let x = driftX
        let y = driftY

        if (pointer.active) {
          const dx = restX + driftX - pointer.x
          const dy = restY + driftY - pointer.y
          const dist = Math.hypot(dx, dy)
          const radius = 140 + token.depth * 80
          if (dist < radius && dist > 0.001) {
            const push = (1 - dist / radius) * (28 + token.depth * 22)
            x += (dx / dist) * push
            y += (dy / dist) * push
          }
          const parallaxX = (pointer.x / rect.width - 0.5) * token.depth * 18
          const parallaxY = (pointer.y / rect.height - 0.5) * token.depth * 12
          x += parallaxX
          y += parallaxY
        }

        return { x, y }
      })

      setOffsets(next)
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    return () => {
      stage.removeEventListener('pointermove', onMove)
      stage.removeEventListener('pointerleave', onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="open-head-hero" ref={stageRef} aria-hidden="true">
      <picture className="open-head-hero__bust">
        <source srcSet={`${base}landing/open-head-bust.webp`} type="image/webp" />
        <img src={`${base}landing/open-head-bust.png`} alt="" width={450} height={600} decoding="async" />
      </picture>
      <div className="open-head-hero__void" />
      {LANDING_FLOATERS.map((token, index) => {
        const offset = offsets[index] ?? { x: 0, y: 0 }
        return (
          <img
            key={token.id}
            className="open-head-hero__chip"
            src={`${base}landing/floaters/${token.id}.webp`}
            alt=""
            width={token.size}
            height={token.size}
            style={{
              left: `calc(${token.restX * 100}% - ${token.size / 2}px)`,
              top: `calc(${token.restY * 100}% - ${token.size / 2}px)`,
              width: token.size,
              height: token.size,
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
              zIndex: Math.round(token.depth * 20),
            }}
            draggable={false}
          />
        )
      })}
    </div>
  )
}