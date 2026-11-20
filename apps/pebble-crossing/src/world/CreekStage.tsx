import type { ScarfColor } from '../content/level6'
import type { PlankRecord, PostRecord, WorldState } from '../session/types'
import type { PipPose } from '../assets/world/worldAssets'
import { BridgeLayer } from './BridgeLayer'
import { CreekLayerStack } from './CreekLayerStack'
import './CreekStage.css'

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
  return (
    <figure className="creek" aria-label={caption}>
      <div className="creek-stage">
        <CreekLayerStack world={world} pose={pose} scarf={scarf} crossed={crossed} />
        <BridgeLayer planks={planks} posts={posts} sign={sign} />
      </div>
    </figure>
  )
}
