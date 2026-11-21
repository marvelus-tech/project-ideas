import { pronunciationArt } from '../assets/world/pronunciationAssets'

export function MicPlateArt({ listening }: { listening: boolean }) {
  const art = pronunciationArt(listening ? 'mic_listening' : 'mic_tap_ready')
  return (
    <span
      className={listening ? 'mic-plate mic-plate-listening' : 'mic-plate mic-plate-ready'}
      aria-hidden="true"
    >
      <img
        src={art.src}
        alt=""
        width={art.width}
        height={art.height}
        loading="eager"
        decoding="async"
      />
    </span>
  )
}