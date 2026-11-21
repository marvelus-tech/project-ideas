import { basePlate, type WorldLayer } from '../assets/world/worldAssets'

export function CreekLayerStack({ layers }: { layers: WorldLayer[] }) {
  const base = basePlate()
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
      {layers.map((layer) => (
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
      ))}
    </>
  )
}
