import type { ScarfColor } from '../../content/level6'
import type { WorldState } from '../../session/types'
import manifest from './manifest.json'

export type PipPose = 'idle' | 'listen' | 'reach' | 'sit'

const PIP_POSES: PipPose[] = ['idle', 'listen', 'reach', 'sit']
const SCARVES: ScarfColor[] = ['red', 'leaf', 'stone']
const KIT_POSES = ['arrived', 'sitting', 'aboard'] as const

type Asset = (typeof manifest.assets)[number]

function byId(id: string): Asset {
  const asset = manifest.assets.find((item) => item.id === id)
  if (!asset) throw new Error(`Missing world asset ${id}`)
  return asset
}

export function worldAssetUrl(path: string): string {
  const base = import.meta.env?.BASE_URL ?? '/'
  return `${base}${path.replace(/^\//, '')}`
}

export interface SpriteFrame {
  col: number
  row: number
  cols: number
  rows: number
}

export interface StageBox {
  left: string
  top: string
  width: string
  height: string
}

export interface WorldLayer {
  id: string
  worldFlag: string
  src: string
  kind: 'overlay' | 'sprite'
  width: number
  height: number
  frame?: SpriteFrame
  box?: StageBox
}

function percentBox(x: number, y: number, width: number, height: number): StageBox {
  return {
    left: `${(x / manifest.frame.width) * 100}%`,
    top: `${(y / manifest.frame.height) * 100}%`,
    width: `${(width / manifest.frame.width) * 100}%`,
    height: `${(height / manifest.frame.height) * 100}%`,
  }
}

function overlay(id: string, worldFlag: string): WorldLayer {
  const asset = byId(id)
  return { id, worldFlag, src: worldAssetUrl(asset.path), kind: 'overlay', width: asset.width, height: asset.height }
}

function spriteFrame(asset: Asset, col: number, row: number): SpriteFrame {
  const cols = 'columns' in asset && typeof asset.columns === 'number' ? asset.columns : 1
  const rows = 'rows' in asset && typeof asset.rows === 'number' ? asset.rows : 1
  return { col, row, cols, rows }
}

function pipLayer(pose: PipPose, scarf: ScarfColor | null, crossed: boolean): WorldLayer {
  const worn = scarf ?? 'red'
  const asset = byId('pip_poses')
  const box = crossed
    ? percentBox(690, 248, 128, 158)
    : pose === 'reach'
      ? percentBox(188, 292, 150, 168)
      : percentBox(64, 292, 136, 158)
  return {
    id: 'pip_poses',
    worldFlag: `pip:${pose}:${worn}`,
    src: worldAssetUrl(asset.path),
    kind: 'sprite',
    width: asset.width,
    height: asset.height,
    frame: spriteFrame(asset, PIP_POSES.indexOf(pose), SCARVES.indexOf(worn)),
    box,
  }
}

function kitLayer(kit: Exclude<WorldState['kit'], 'hidden'>): WorldLayer {
  const asset = byId('kit_poses')
  const aboard = kit === 'aboard'
  return {
    id: 'kit_poses',
    worldFlag: `kit:${kit}`,
    src: worldAssetUrl(asset.path),
    kind: 'sprite',
    width: asset.width,
    height: asset.height,
    frame: spriteFrame(asset, KIT_POSES.indexOf(kit), 0),
    box: aboard ? percentBox(452, 292, 86, 108) : percentBox(12, kit === 'sitting' ? 318 : 286, 112, kit === 'sitting' ? 140 : 160),
  }
}

/** Active alpha layers for this world. The order is back to front, and each worldFlag is the data-world value. */
export function layersForWorld(world: WorldState, pose: PipPose, scarf: ScarfColor | null, crossed = false): WorldLayer[] {
  const layers: WorldLayer[] = []
  if (world.map === 'open') layers.push(overlay('map_unfurled', 'map:open'))
  if (world.shop === 'open') layers.push(overlay('shop_open', 'shop:open'))
  if (world.shell === 'lifted') layers.push(overlay('shell_lifted', 'shell:lifted'))
  if (world.ship === 'docked') layers.push(overlay('ship_docked', 'ship:docked'))
  if (world.rope === 'shore') layers.push(overlay('rope_shore', 'rope:shore'))
  if (world.rope === 'tight') layers.push(overlay('rope_tight', 'rope:tight'))
  if (world.fish === 'helped') layers.push(overlay('fish_helped', 'fish:helped'))
  if (world.kit !== 'hidden') layers.push(kitLayer(world.kit))
  layers.push(pipLayer(pose, scarf, crossed))
  return layers
}

export function scarfPreviewStyle(scarf: ScarfColor): Record<string, string> {
  return frameStyle(pipLayer('idle', scarf, false))
}

export function overlayFlags(world: WorldState, pose: PipPose = 'idle', scarf: ScarfColor | null = null): string[] {
  return layersForWorld(world, pose, scarf).map((layer) => layer.worldFlag)
}

export function basePlate() {
  const asset = byId('creek_base_morning')
  return { src: worldAssetUrl(asset.path), width: asset.width, height: asset.height, worldFlag: asset.worldFlag }
}

export function frameStyle(layer: WorldLayer): Record<string, string> {
  const frame = layer.frame
  if (!frame) return {}
  const x = frame.cols <= 1 ? 0 : (frame.col / (frame.cols - 1)) * 100
  const y = frame.rows <= 1 ? 0 : (frame.row / (frame.rows - 1)) * 100
  return {
    backgroundImage: `url("${layer.src}")`,
    backgroundSize: `${frame.cols * 100}% ${frame.rows * 100}%`,
    backgroundPosition: `${x}% ${y}%`,
    backgroundRepeat: 'no-repeat',
  }
}

export function spriteStyle(layer: WorldLayer): Record<string, string> {
  const box = layer.box
  if (!box) return frameStyle(layer)
  return {
    ...frameStyle(layer),
    left: box.left,
    top: box.top,
    width: box.width,
    height: box.height,
  }
}
