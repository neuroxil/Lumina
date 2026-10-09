const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

export function normalizeSecret(input: string): string {
  return input.replace(/[\s-]/g, '').replace(/=+$/g, '').toUpperCase()
}

export function isLikelyBase32(input: string): boolean {
  const n = normalizeSecret(input)
  return n.length >= 8 && /^[A-Z2-7]+$/.test(n)
}

export function encodeBase32(bytes: Uint8Array, pad = false): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) {
    output += ALPHABET[(value << (5 - bits)) & 31]
  }
  if (pad) {
    while (output.length % 8 !== 0) output += '='
  }
  return output
}

export function decodeBase32(input: string): Uint8Array {
  const normalized = normalizeSecret(input)
  if (!normalized) throw new Error('Secret is empty')
  if (!/^[A-Z2-7]+$/.test(normalized)) {
    throw new Error('Secret is not valid base32')
  }

  let bits = 0
  let value = 0
  const out: number[] = []
  for (const ch of normalized) {
    const idx = ALPHABET.indexOf(ch)
    if (idx === -1) throw new Error('Secret is not valid base32')
    value = (value << 5) | idx
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return Uint8Array.from(out)
}
