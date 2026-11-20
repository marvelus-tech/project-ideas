import type { ScarfColor } from '../content/level6'
import { basePlate, layersForWorld, spriteStyle, type PipPose } from '../assets/world/worldAssets'
import type { WorldState } from '../session/types'

export function CreekLayerStack({ world, pose, scarf, crossed }: { world: WorldState; pose: PipPose; scarf: ScarfColor | null; crossed: boolean }) {
  const base = basePlate()
  const layers = layersForWorld(world, pose, scarf, crossed)
  return (
    <>
      <img
        className="creek-base"
        data-world={base.worldFlag}
        src={base.src}
        alt=""
        width={base.width}
        height={base.height}
        fetchPriority="high"
        decoding="async"
      />
      <div className="creek-current" aria-hidden="true" />
      {layers.map((layer) => layer.kind === 'overlay' ? (
        <img
          key={layer.worldFlag}
          className="creek-overlay"
          data-world={layer.worldFlag}
          src={layer.src}
          alt=""
          width={layer.width}
          height={layer.height}
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div key={layer.worldFlag} className="creek-sprite" data-world={layer.worldFlag} style={spriteStyle(layer)} aria-hidden="true" />
      ))}
    </>
  )
}
