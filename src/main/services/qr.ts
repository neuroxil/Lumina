import { BrowserWindow, desktopCapturer, screen } from 'electron'
import jsQR from 'jsqr'

function bgraToRgba(bgra: Buffer, width: number, height: number): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const o = i * 4
    rgba[o] = bgra[o + 2]
    rgba[o + 1] = bgra[o + 1]
    rgba[o + 2] = bgra[o]
    rgba[o + 3] = bgra[o + 3]
  }
  return rgba
}

export function decodeQrFromBitmap(bitmap: Buffer, width: number, height: number): string | null {
  if (width < 16 || height < 16) return null
  const rgba = bgraToRgba(bitmap, width, height)
  const result = jsQR(rgba, width, height, { inversionAttempts: 'attemptBoth' })
  return result?.data ?? null
}

export function decodeQrFromPng(png: Buffer): string | null {
  const { nativeImage } = require('electron') as typeof import('electron')
  const image = nativeImage.createFromBuffer(png)
  const size = image.getSize()
  const bitmap = image.toBitmap()
  return decodeQrFromBitmap(bitmap, size.width, size.height)
}

export async function scanDisplays(hide?: BrowserWindow | null): Promise<string | null> {
  const bounds = hide?.getBounds()
  const wasVisible = hide?.isVisible()
  if (hide && wasVisible) hide.hide()
  await new Promise((r) => setTimeout(r, 220))

  try {
    const displays = screen.getAllDisplays()
    const width = Math.max(...displays.map((d) => Math.round(d.size.width * d.scaleFactor)))
    const height = Math.max(...displays.map((d) => Math.round(d.size.height * d.scaleFactor)))
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    })
    for (const source of sources) {
      const image = source.thumbnail
      const size = image.getSize()
      const hit = decodeQrFromBitmap(image.toBitmap(), size.width, size.height)
      if (hit) return hit
    }
    return null
  } finally {
    if (hide && wasVisible) {
      hide.show()
      if (bounds) hide.setBounds(bounds)
    }
  }
}
