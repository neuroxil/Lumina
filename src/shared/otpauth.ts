import { encodeBase32, isLikelyBase32, normalizeSecret } from './base32'
import type { NewEntryInput, OtpAlgo, OtpType, VaultEntry } from './types'

function asAlgo(value: string | null): OtpAlgo {
  const v = (value ?? 'SHA1').toUpperCase().replace('SHA-', 'SHA')
  if (v === 'SHA256' || v === 'SHA512' || v === 'SHA1') return v
  return 'SHA1'
}

function asType(value: string): OtpType {
  const v = value.toLowerCase()
  if (v === 'hotp') return 'hotp'
  if (v === 'steam') return 'steam'
  return 'totp'
}

export function parseOtpauth(uri: string): NewEntryInput {
  const trimmed = uri.trim()
  if (!trimmed.toLowerCase().startsWith('otpauth://')) {
    throw new Error('Not an otpauth URI')
  }
  const parsed = new URL(trimmed)
  const type = asType(parsed.hostname)
  const label = decodeURIComponent(parsed.pathname.replace(/^\//, ''))
  const [labelIssuer, labelName] = label.includes(':')
    ? [label.slice(0, label.indexOf(':')), label.slice(label.indexOf(':') + 1)]
    : ['', label]

  const params = parsed.searchParams
  const secret = params.get('secret')
  if (!secret || !isLikelyBase32(secret)) {
    throw new Error('URI is missing a valid secret')
  }

  const issuer = (params.get('issuer') || labelIssuer || '').trim()
  const name = (labelName || label || '').trim()
  const digits = Number(params.get('digits') || (type === 'steam' ? 5 : 6))
  const period = Number(params.get('period') || 30)
  const counter = Number(params.get('counter') || 0)
  const algorithm = type === 'steam' ? 'SHA1' : asAlgo(params.get('algorithm'))

  return {
    type: issuer.toLowerCase() === 'steam' ? 'steam' : type,
    issuer,
    name,
    secret: normalizeSecret(secret),
    algorithm,
    digits: [5, 6, 7, 8].includes(digits) ? (digits as 5 | 6 | 7 | 8) : 6,
    period: period > 0 ? period : 30,
    counter: Number.isFinite(counter) ? counter : 0
  }
}

export function toOtpauth(entry: Pick<VaultEntry, 'type' | 'issuer' | 'name' | 'secret' | 'algorithm' | 'digits' | 'period' | 'counter'>): string {
  const type = entry.type === 'steam' ? 'totp' : entry.type
  const label = entry.issuer
    ? `${encodeURIComponent(entry.issuer)}:${encodeURIComponent(entry.name || entry.issuer)}`
    : encodeURIComponent(entry.name || 'Account')
  const params = new URLSearchParams()
  params.set('secret', normalizeSecret(entry.secret))
  if (entry.issuer) params.set('issuer', entry.issuer)
  params.set('algorithm', entry.algorithm)
  params.set('digits', String(entry.type === 'steam' ? 5 : entry.digits))
  if (type === 'hotp') params.set('counter', String(entry.counter ?? 0))
  else params.set('period', String(entry.period ?? 30))
  return `otpauth://${type}/${label}?${params.toString()}`
}

export function parseLooseSecretOrUri(raw: string): Partial<NewEntryInput> & { secret: string } {
  const value = raw.trim()
  if (value.toLowerCase().startsWith('otpauth://')) return parseOtpauth(value)
  if (value.toLowerCase().startsWith('otpauth-migration://')) {
    throw new Error('Google Authenticator migration URIs should be imported as a file or QR')
  }
  if (!isLikelyBase32(value)) throw new Error('Enter a base32 secret or an otpauth:// URI')
  return { secret: normalizeSecret(value), type: 'totp' }
}

export function secretFromBytes(bytes: Uint8Array): string {
  return encodeBase32(bytes, false)
}
