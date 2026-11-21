import manifest from './manifest.json'

export type PronunciationCueId =
  | 'sh_model'
  | 'sh_airflow'
  | 'listen_first'
  | 'mic_tap_ready'
  | 'mic_listening'
  | 'read_invite'

type TrayAsset = (typeof manifest.assets)[number] & { role: 'tray' }

function trayById(id: PronunciationCueId): TrayAsset {
  const asset = manifest.assets.find((item) => item.id === id && item.role === 'tray')
  if (!asset) throw new Error(`Missing pronunciation tray asset ${id}`)
  return asset as TrayAsset
}

export function pronunciationArtUrl(id: PronunciationCueId): string {
  const base = import.meta.env?.BASE_URL ?? '/'
  const path = trayById(id).path
  return `${base}${path.replace(/^\//, '')}`
}

export function pronunciationArt(id: PronunciationCueId): {
  src: string
  alt: string
  loading: 'eager' | 'lazy'
  width: number
  height: number
} {
  const asset = trayById(id)
  const loading = 'loading' in asset && asset.loading === 'lazy' ? 'lazy' : 'eager'
  return {
    src: pronunciationArtUrl(id),
    alt: asset.alt,
    loading,
    width: asset.width,
    height: asset.height,
  }
}

export function trayAssetIds(): PronunciationCueId[] {
  return manifest.assets
    .filter((item) => item.role === 'tray')
    .map((item) => item.id as PronunciationCueId)
}

export function trayBundleBytes(): number {
  return manifest.assets.filter((item) => item.role === 'tray').reduce((sum, item) => sum + item.bytes, 0)
}