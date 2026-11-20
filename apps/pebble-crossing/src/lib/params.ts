export interface PlaytestParams {
  maxMinutes: number
  micOff: boolean
}

export function readPlaytestParams(): PlaytestParams {
  const params = new URLSearchParams(window.location.search)
  const maxRaw = params.get('maxMinutes')
  const maxMinutes = maxRaw ? Math.max(1, Number.parseInt(maxRaw, 10) || 10) : 10
  const micOff =
    params.get('mic') === 'off' ||
    sessionStorage.getItem('pebble-crossing-mic-off') === '1'
  return { maxMinutes, micOff }
}

export function setMicCheckOff(off: boolean) {
  if (off) sessionStorage.setItem('pebble-crossing-mic-off', '1')
  else sessionStorage.removeItem('pebble-crossing-mic-off')
}