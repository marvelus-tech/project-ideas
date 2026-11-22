import { MOUTH_LINE } from '../content/level6'
import { pronunciationArt, type PronunciationCueId } from '../assets/world/pronunciationAssets'

export function PronunciationTrayArt({
  cue,
  caption,
  className = '',
}: {
  cue: PronunciationCueId
  caption?: string
  className?: string
}) {
  const art = pronunciationArt(cue)
  return (
    <span className={`pronunciation-tray ${className}`.trim()} data-cue={cue}>
      <img
        className="pronunciation-tray-art"
        src={art.src}
        alt={art.alt}
        width={art.width}
        height={art.height}
        loading={art.loading}
        decoding="async"
      />
      {caption ? <p className="pronunciation-tray-caption">{caption}</p> : null}
    </span>
  )
}

export function MouthTrayArt({ mouthStep }: { mouthStep: number }) {
  const cue: PronunciationCueId = mouthStep >= 1 ? 'sh_airflow' : 'sh_model'
  return <PronunciationTrayArt cue={cue} caption={MOUTH_LINE} />
}