/** Key, place, and compose the illustrated Pip and Kit PNG masters. */

import sharp from 'sharp'

export const PIP_MASTER = { width: 400, height: 460, ground: 440, maxW: 370, maxH: 420 }

/** Fractions of each pose's opaque box. x/y is the scarf's top-left. w is its width. */
export const SCARF_ANCHOR = {
  idle: { x: 0.48, y: 0.4, w: 0.34 },
  listen: { x: 0.46, y: 0.4, w: 0.32 },
  reach: { x: 0.42, y: 0.38, w: 0.3 },
  sit: { x: 0.46, y: 0.4, w: 0.34 },
}

function distance(r, g, b, br, bg, bb) {
  const dr = r - br
  const dg = g - bg
  const db = b - bb
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

/** Drop a flat magenta backdrop and choke the fringe so the WebP stays clean. */
export async function keyMagenta(input) {
  const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width, height } = info
  const corners = [[4, 4], [width - 5, 4], [4, height - 5], [width - 5, height - 5]]
  let br = 0
  let bg = 0
  let bb = 0
  for (const [x, y] of corners) {
    const index = (y * width + x) * 4
    br += data[index]
    bg += data[index + 1]
    bb += data[index + 2]
  }
  br /= 4
  bg /= 4
  bb /= 4
  const out = Buffer.from(data)
  for (let index = 0; index < out.length; index += 4) {
    const d = distance(out[index], out[index + 1], out[index + 2], br, bg, bb)
    const pink = out[index] > 170 && out[index + 2] > 90 && out[index + 1] < 110
    let alpha = 255
    if (pink || d < 42) alpha = 0
    else if (d < 82) alpha = Math.round(((d - 42) / 40) * 255)
    if (alpha === 0) {
      out[index] = 0
      out[index + 1] = 0
      out[index + 2] = 0
    } else if (out[index + 1] < 110 && out[index + 2] > out[index + 1] + 25) {
      out[index + 2] = Math.max(0, out[index + 2] - 36)
    }
    out[index + 3] = alpha
  }
  const choked = Buffer.from(out)
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * 4 + 3
      if (out[index] === 0) continue
      let clear = 0
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (out[((y + dy) * width + x + dx) * 4 + 3] === 0) clear += 1
      }
      if (clear >= 3) choked[index] = 0
    }
  }
  return sharp(choked, { raw: { width, height, channels: 4 } }).png().toBuffer()
}

export async function trimPng(png) {
  return sharp(png).trim({ threshold: 10 }).png().toBuffer()
}

export function sharedScale(metas, master = PIP_MASTER) {
  let scale = 8
  for (const meta of metas) {
    scale = Math.min(scale, master.maxW / meta.width, master.maxH / meta.height)
  }
  return scale
}

export async function placeOnGround(trimmed, scale, master = PIP_MASTER) {
  const meta = await sharp(trimmed).metadata()
  const width = Math.max(1, Math.round(meta.width * scale))
  const height = Math.max(1, Math.round(meta.height * scale))
  const left = Math.max(0, Math.min(master.width - width, Math.round((master.width - width) / 2)))
  const top = Math.max(0, Math.min(master.height - height, master.ground - height))
  const resized = await sharp(trimmed).resize(width, height).png().toBuffer()
  const cell = await sharp({
    create: { width: master.width, height: master.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite([{ input: resized, left, top }]).png().toBuffer()
  return { cell, box: { minX: left, minY: top, w: width, h: height } }
}

export async function compositeScarf(cell, scarfPng, pose, box) {
  const anchor = SCARF_ANCHOR[pose] ?? SCARF_ANCHOR.idle
  const width = Math.max(24, Math.round(box.w * anchor.w))
  const height = Math.max(12, Math.round(width * 0.36))
  const left = Math.max(0, Math.min(PIP_MASTER.width - width, Math.round(box.minX + box.w * anchor.x)))
  const top = Math.max(0, Math.min(PIP_MASTER.height - height, Math.round(box.minY + box.h * anchor.y)))
  const scarf = await sharp(scarfPng).resize(width, height, { fit: 'fill' }).png().toBuffer()
  return sharp(cell).composite([{ input: scarf, left, top }]).png().toBuffer()
}

/** Keep the largest changed regions so a shop window or boat becomes a transparent plate. */
export async function diffOverlay(basePath, variantPath, width, height, minComponent = 800) {
  const base = await sharp(basePath).resize(width, height, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
  const variant = await sharp(variantPath).resize(width, height, { fit: 'fill' }).ensureAlpha().raw().toBuffer()
  const count = width * height
  const mask = new Uint8Array(count)
  for (let index = 0; index < count; index += 1) {
    const offset = index * 4
    const dr = base[offset] - variant[offset]
    const dg = base[offset + 1] - variant[offset + 1]
    const db = base[offset + 2] - variant[offset + 2]
    if (dr * dr + dg * dg + db * db > 34 * 34) mask[index] = 1
  }
  const seen = new Uint8Array(count)
  const keep = new Uint8Array(count)
  const qx = new Int32Array(count)
  const qy = new Int32Array(count)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const start = y * width + x
      if (!mask[start] || seen[start]) continue
      let head = 0
      let tail = 0
      qx[tail] = x
      qy[tail] = y
      tail += 1
      seen[start] = 1
      const pixels = []
      while (head < tail) {
        const cx = qx[head]
        const cy = qy[head]
        head += 1
        pixels.push(cy * width + cx)
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx
          const ny = cy + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const next = ny * width + nx
          if (!mask[next] || seen[next]) continue
          seen[next] = 1
          qx[tail] = nx
          qy[tail] = ny
          tail += 1
        }
      }
      if (pixels.length >= minComponent) {
        for (const pixel of pixels) keep[pixel] = 1
      }
    }
  }
  const out = Buffer.alloc(count * 4)
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0
  let opaque = 0
  for (let index = 0; index < count; index += 1) {
    if (!keep[index]) continue
    const offset = index * 4
    out[offset] = variant[offset]
    out[offset + 1] = variant[offset + 1]
    out[offset + 2] = variant[offset + 2]
    out[offset + 3] = 255
    opaque += 1
    const x = index % width
    const y = Math.floor(index / width)
    if (x < minX) minX = x
    if (y < minY) minY = y
    if (x > maxX) maxX = x
    if (y > maxY) maxY = y
  }
  const png = await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer()
  return { png, opaque, box: opaque ? { minX, minY, maxX, maxY } : null }
}
