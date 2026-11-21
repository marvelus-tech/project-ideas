import type { ScarfColor } from '../content/level6'
import type { PlankRecord, PostRecord, WorldState } from '../session/types'
import { layersForWorld, spriteStyle, type PipPose, type WorldLayer } from '../assets/world/worldAssets'
import { BridgeLayer } from './BridgeLayer'
import { CreekLayerStack } from './CreekLayerStack'
import './CreekStage.css'

function LayerView({ layer }: { layer: WorldLayer }) {
  if (layer.kind === 'overlay') {
    return (
      <img
        className="creek-overlay"
        data-world={layer.worldFlag}
        src={layer.src}
        alt=""
        width={layer.width}
        height={layer.height}
        loading="lazy"
        decoding="async"
      />
    )
  }
  return <div className="creek-sprite" data-world={layer.worldFlag} style={spriteStyle(layer)} aria-hidden="true" />
}

interface CreekStageProps {
  scarf: ScarfColor | null
  world: WorldState
  planks: PlankRecord[]
  posts: PostRecord[]
  sign: 'none' | 'practice' | 'bolted'
  pose: PipPose
  crossed: boolean
  caption: string
}

export function CreekStage(props: CreekStageProps) {
  const { world, planks, posts, sign, scarf, pose, crossed, caption } = props
  const layers = layersForWorld(world, pose, scarf, crossed)
  // The beam sits on the piers. The boat is in the near water, so it paints in front of the beam. Pip and Kit stay in front of both.
  const boat = layers.filter((layer) => layer.id === 'ship_docked')
  const sprites = layers.filter((layer) => layer.kind === 'sprite')
  const scenery = layers.filter((layer) => layer.kind === 'overlay' && layer.id !== 'ship_docked')
  return (
    <figure className="creek" aria-label={caption}>
      <div className="creek-stage">
        <CreekLayerStack layers={scenery} />
        <BridgeLayer planks={planks} posts={posts} sign={sign} />
        {boat.map((layer) => <LayerView key={layer.worldFlag} layer={layer} />)}
        {sprites.map((layer) => <LayerView key={layer.worldFlag} layer={layer} />)}
      </div>
    </figure>
  )
}
