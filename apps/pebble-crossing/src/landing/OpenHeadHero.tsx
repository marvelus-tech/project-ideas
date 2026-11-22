import { useEffect, useRef, useState } from 'react'

import { LANDING_FLOATERS } from './landingTokens'
import './OpenHeadHero.css'

const base = import.meta.env.BASE_URL

type Offset = { x: number; y: number; rotate: number }

export function OpenHeadHero() {
  const stageRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef({ x: -9999, y: -9999, active: false })
  const [offsets, setOffsets] = useState<Offset[]>(() => LANDING_FLOATERS.map(() => ({ x: 0, y: 0, rotate: 0 })))
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
        const driftY = Math.cos(t * token.driftHz * Math.PI * 2 + token.phase * 1.35) * token.driftAmp * 0.75
        let x = driftX
        let y = driftY
        const wobble =
          Math.sin(t * token.driftHz * Math.PI * 4 + token.phase) * token.tilt * 0.35 +
          Math.sin(t * 0.4 + token.phase) * 0.6

        if (pointer.active) {
          const dx = restX + driftX - pointer.x
          const dy = restY + driftY - pointer.y
          const dist = Math.hypot(dx, dy)
          const radius = 130 + token.depth * 95
          if (dist < radius && dist > 0.001) {
            const push = (1 - dist / radius) ** 1.2 * (34 + token.depth * 26)
            x += (dx / dist) * push
            y += (dy / dist) * push
          }
          const parallaxX = (pointer.x / rect.width - 0.5) * token.depth * 22
          const parallaxY = (pointer.y / rect.height - 0.5) * token.depth * 14
          x += parallaxX
          y += parallaxY
        }

        return { x, y, rotate: wobble }
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
        <source srcSet={`${base}landing/open_head_bust.webp`} type="image/webp" />
        <img src={`${base}landing/open_head_bust.png`} alt="" width={520} height={520} decoding="async" fetchPriority="high" />
      </picture>
      {LANDING_FLOATERS.map((token, index) => {
        const offset = offsets[index] ?? { x: 0, y: 0, rotate: 0 }
        return (
          <img
            key={token.id}
            className="open-head-hero__chip"
            src={`${base}landing/floaters/${token.id}.webp`}
            alt=""
            width={token.width}
            height={token.height}
            style={{
              left: `calc(${token.restX * 100}% - ${token.width / 2}px)`,
              top: `calc(${token.restY * 100}% - ${token.height / 2}px)`,
              width: token.width,
              height: token.height,
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${token.restRotate + offset.rotate}deg)`,
              zIndex: 10 + Math.round(token.depth * 20),
            }}
            draggable={false}
          />
        )
      })}
    </div>
  )
}