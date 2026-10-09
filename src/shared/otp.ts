import { createHmac } from 'crypto'
import { decodeBase32 } from './base32'
import type { OtpAlgo, OtpType } from './types'

const STEAM_ALPHABET = '23456789BCDFGHJKMNPQRTVWXY'

export function algoToNode(algo: OtpAlgo): 'sha1' | 'sha256' | 'sha512' {
  if (algo === 'SHA256') return 'sha256'
  if (algo === 'SHA512') return 'sha512'
  return 'sha1'
}

function counterBytes(counter: number): Buffer {
  const buf = Buffer.alloc(8)
  buf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  buf.writeUInt32BE(counter >>> 0, 4)
  return buf
}

export function hotpTruncated(secret: Uint8Array, counter: number, algo: OtpAlgo): number {
  const hmac = createHmac(algoToNode(algo), Buffer.from(secret))
    .update(counterBytes(counter))
    .digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  return (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  )
}

export function hotpCode(
  secret: Uint8Array,
  counter: number,
  digits: number,
  algo: OtpAlgo
): string {
  const bin = hotpTruncated(secret, counter, algo)
  const mod = 10 ** digits
  return String(bin % mod).padStart(digits, '0')
}

export function steamCode(secret: Uint8Array, counter: number): string {
  let n = hotpTruncated(secret, counter, 'SHA1')
  let out = ''
  for (let i = 0; i < 5; i++) {
    out += STEAM_ALPHABET[n % STEAM_ALPHABET.length]
    n = Math.floor(n / STEAM_ALPHABET.length)
  }
  return out
}

export function totpCounter(period: number, now = Date.now()): number {
  return Math.floor(now / 1000 / period)
}

export function remainingSeconds(period: number, now = Date.now()): number {
  const elapsed = Math.floor(now / 1000) % period
  return period - elapsed
}

export interface GenerateInput {
  type: OtpType
  secret: string
  algorithm?: OtpAlgo
  digits?: number
  period?: number
  counter?: number
  now?: number
}

export function generateCode(input: GenerateInput): string {
  const secret = decodeBase32(input.secret)
  const algo = input.algorithm ?? 'SHA1'
  if (input.type === 'steam') {
    const counter = totpCounter(input.period ?? 30, input.now)
    return steamCode(secret, counter)
  }
  if (input.type === 'hotp') {
    return hotpCode(secret, input.counter ?? 0, input.digits ?? 6, algo)
  }
  const period = input.period ?? 30
  const digits = input.digits ?? 6
  return hotpCode(secret, totpCounter(period, input.now), digits, algo)
}

export function generateCurrentAndNext(input: GenerateInput): { current: string; next: string } {
  const now = input.now ?? Date.now()
  if (input.type === 'hotp') {
    const current = generateCode({ ...input, now })
    const next = generateCode({ ...input, counter: (input.counter ?? 0) + 1, now })
    return { current, next }
  }
  const period = input.period ?? 30
  const current = generateCode({ ...input, now })
  const next = generateCode({ ...input, now: now + period * 1000 })
  return { current, next }
}
