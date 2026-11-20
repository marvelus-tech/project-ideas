export function isParentEntry(href: string): boolean {
  const url = new URL(href, 'https://pebble-crossing.local')
  if (url.searchParams.get('parent') === '1') return true
  if (url.pathname.endsWith('/parent') || url.pathname.endsWith('/parent/')) return true
  const hash = url.hash.replace(/^#/, '')
  return hash === 'parent' || hash.startsWith('parent&') || hash.startsWith('parent?')
}

export function parentHref(currentHref: string): string {
  const url = new URL(currentHref, 'https://pebble-crossing.local')
  url.searchParams.set('parent', '1')
  url.hash = 'parent'
  return `${url.pathname}${url.search}${url.hash}`
}