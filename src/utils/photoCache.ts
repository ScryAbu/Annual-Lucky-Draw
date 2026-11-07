/**
 * 抽奖卡片照片缓存。
 *
 * 球体每隔几秒换一页（或开始抽奖时换一批人），卡片会重新挂载。没有缓存时每张卡都要
 * 重新解码原图（导入的照片常常是几 MB 的原片），解码完成前只能画纯色底卡，于是整屏
 * 一起闪成「图片底色」。这里把照片解码一次、缩成卡片大小的正方形画布后缓存起来：
 * 卡片挂载时命中缓存即可同步画出照片，换页前再预先解码下一页。
 */
export type PhotoSource = HTMLImageElement | HTMLCanvasElement

const SIZE = 240 // 名片画布 256，照片区域 244，缩到 240 足够清晰
const MAX_ENTRIES = 420 // 至少容纳两页（2 × 180）加中奖者；约 100MB 上限

const cache = new Map<string, PhotoSource>()
const pending = new Map<string, Promise<PhotoSource | null>>()

function remember(src: string, value: PhotoSource) {
  cache.delete(src)
  cache.set(src, value)
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest === undefined) break
    cache.delete(oldest)
  }
}

export function getCachedPhoto(src: string | undefined): PhotoSource | undefined {
  if (!src) return undefined
  const hit = cache.get(src)
  if (hit) remember(src, hit) // LRU：最近使用的移到末尾
  return hit
}

function shrink(image: HTMLImageElement): PhotoSource {
  const w = image.naturalWidth || image.width
  const h = image.naturalHeight || image.height
  if (!w || !h) return image
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx || typeof ctx.drawImage !== 'function') return image
  const scale = Math.max(SIZE / w, SIZE / h)
  const dw = w * scale
  const dh = h * scale
  ctx.drawImage(image, (SIZE - dw) / 2, (SIZE - dh) / 2, dw, dh)
  return canvas
}

export function loadPhoto(src: string): Promise<PhotoSource | null> {
  const hit = getCachedPhoto(src)
  if (hit) return Promise.resolve(hit)
  const inflight = pending.get(src)
  if (inflight) return inflight
  const job = new Promise<PhotoSource | null>(resolve => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => {
      try {
        const out = shrink(image)
        remember(src, out)
        resolve(out)
      } catch {
        resolve(null)
      }
    }
    image.onerror = () => resolve(null)
    image.src = src
  }).finally(() => pending.delete(src))
  pending.set(src, job)
  return job
}

/** 预先解码一批照片（换页前调用）。超时也返回，避免一张坏图卡住换页。 */
export function preloadPhotos(sources: Array<string | undefined>, timeoutMs = 6000): Promise<void> {
  const list = sources.filter((s): s is string => Boolean(s) && !cache.has(s as string))
  if (!list.length) return Promise.resolve()
  const all = Promise.all(list.map(loadPhoto)).then(() => undefined)
  return Promise.race([all, new Promise<void>(resolve => window.setTimeout(resolve, timeoutMs))])
}
