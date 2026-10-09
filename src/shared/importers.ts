import { decodeBase32, isLikelyBase32, normalizeSecret } from './base32'
import { parseOtpauth, secretFromBytes } from './otpauth'
import { decodeMigrationPayload } from './protobuf'
import type { NewEntryInput, OtpAlgo, OtpType } from './types'

function algoOf(value: unknown): OtpAlgo {
  const v = String(value ?? 'SHA1').toUpperCase().replace('SHA-', 'SHA')
  if (v === 'SHA256' || v === 'SHA512') return v
  return 'SHA1'
}

function typeOf(value: unknown): OtpType {
  const v = String(value ?? 'totp').toLowerCase()
  if (v === 'hotp') return 'hotp'
  if (v === 'steam' || v === 'steamguard') return 'steam'
  return 'totp'
}

function digitsOf(value: unknown, fallback = 6): 5 | 6 | 7 | 8 {
  const n = Number(value ?? fallback)
  if (n === 5 || n === 6 || n === 7 || n === 8) return n
  return fallback as 6
}

function splitNameIssuer(name: string, issuer: string): { name: string; issuer: string } {
  if (issuer) return { name: name || issuer, issuer }
  if (name.includes(':')) {
    const i = name.indexOf(':')
    return { issuer: name.slice(0, i).trim(), name: name.slice(i + 1).trim() }
  }
  return { name, issuer: name }
}

export function parseMigrationUri(uri: string): NewEntryInput[] {
  const parsed = new URL(uri.trim())
  if (parsed.protocol !== 'otpauth-migration:') {
    throw new Error('Not a Google Authenticator migration URI')
  }
  const data = parsed.searchParams.get('data')
  if (!data) throw new Error('Migration URI is missing data')
  const b64 = data.replace(/ /g, '+').replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4))
  const bytes = Uint8Array.from(Buffer.from(b64 + pad, 'base64'))
  return decodeMigrationPayload(bytes).map((otp) => {
    const { name, issuer } = splitNameIssuer(otp.name, otp.issuer)
    const algo = otp.algorithm === 2 ? 'SHA256' : otp.algorithm === 3 ? 'SHA512' : 'SHA1'
    const type: OtpType = otp.type === 1 ? 'hotp' : issuer.toLowerCase() === 'steam' ? 'steam' : 'totp'
    const digits = otp.digits === 2 ? 8 : type === 'steam' ? 5 : 6
    return {
      type,
      issuer,
      name,
      secret: secretFromBytes(otp.secret),
      algorithm: algo,
      digits,
      period: 30,
      counter: otp.counter || 0
    }
  })
}

function fromGeneric(entry: Record<string, unknown>): NewEntryInput | null {
  const secretRaw =
    (entry.secret as string) ||
    (entry.info as { secret?: string } | undefined)?.secret ||
    (entry.otp as { secret?: string } | undefined)?.secret
  if (!secretRaw || !isLikelyBase32(String(secretRaw))) return null
  const type = typeOf(entry.type || entry.tokenType || (entry.otp as { tokenType?: string } | undefined)?.tokenType)
  const info = (entry.info ?? entry.otp ?? entry) as Record<string, unknown>
  const { name, issuer } = splitNameIssuer(
    String(entry.name || entry.account || info.account || ''),
    String(entry.issuer || info.issuer || '')
  )
  return {
    type,
    issuer,
    name: name || issuer || 'Account',
    secret: normalizeSecret(String(secretRaw)),
    algorithm: algoOf(info.algo || info.algorithm || entry.algorithm),
    digits: digitsOf(info.digits ?? entry.digits, type === 'steam' ? 5 : 6),
    period: Number(info.period ?? entry.period ?? 30) || 30,
    counter: Number(info.counter ?? entry.counter ?? 0) || 0
  }
}

function parseAegis(json: Record<string, unknown>): NewEntryInput[] {
  const db = json.db as { entries?: Record<string, unknown>[] } | undefined
  const entries = db?.entries ?? (json.entries as Record<string, unknown>[] | undefined) ?? []
  return entries.map(fromGeneric).filter((x): x is NewEntryInput => Boolean(x))
}

function parse2Fas(json: Record<string, unknown>): NewEntryInput[] {
  const services = (json.services as Record<string, unknown>[]) ?? []
  return services.map(fromGeneric).filter((x): x is NewEntryInput => Boolean(x))
}

function parseBitwarden(json: Record<string, unknown>): NewEntryInput[] {
  const items = (json.items as Record<string, unknown>[]) ?? []
  const out: NewEntryInput[] = []
  for (const item of items) {
    const login = item.login as { totp?: string } | undefined
    const totp = login?.totp
    if (!totp) continue
    try {
      if (totp.startsWith('otpauth://')) out.push(parseOtpauth(totp))
      else if (isLikelyBase32(totp)) {
        out.push({
          type: 'totp',
          issuer: String(item.name || ''),
          name: String((login as { username?: string }).username || ''),
          secret: normalizeSecret(totp),
          algorithm: 'SHA1',
          digits: 6,
          period: 30
        })
      }
    } catch {
      /* skip bad item */
    }
  }
  return out
}

function parseLumina(json: Record<string, unknown>): NewEntryInput[] {
  const entries = (json.entries as Record<string, unknown>[]) ?? []
  return entries.map(fromGeneric).filter((x): x is NewEntryInput => Boolean(x))
}

function parseUriList(text: string): NewEntryInput[] {
  const out: NewEntryInput[] = []
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    try {
      if (trimmed.startsWith('otpauth-migration://')) out.push(...parseMigrationUri(trimmed))
      else if (trimmed.startsWith('otpauth://')) out.push(parseOtpauth(trimmed))
    } catch {
      /* skip */
    }
  }
  return out
}

export function parseImportPayload(raw: string): NewEntryInput[] {
  const text = raw.trim()
  if (!text) return []
  if (text.startsWith('otpauth-migration://')) return parseMigrationUri(text.split(/\s+/)[0])
  if (text.startsWith('otpauth://') || text.includes('\notpauth://')) return parseUriList(text)

  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return parseUriList(text)
  }

  if (Array.isArray(json)) {
    return json
      .map((row) => fromGeneric(row as Record<string, unknown>))
      .filter((x): x is NewEntryInput => Boolean(x))
  }
  if (!json || typeof json !== 'object') return []
  const obj = json as Record<string, unknown>
  if (obj.db || obj.version === 1 && Array.isArray((obj.db as { entries?: unknown })?.entries)) {
    return parseAegis(obj)
  }
  if (Array.isArray(obj.services)) return parse2Fas(obj)
  if (Array.isArray(obj.items)) return parseBitwarden(obj)
  if (Array.isArray(obj.entries)) return parseLumina(obj)
  return []
}

export function uniqueEntries(entries: NewEntryInput[]): NewEntryInput[] {
  const seen = new Set<string>()
  const out: NewEntryInput[] = []
  for (const e of entries) {
    const key = `${e.type}:${normalizeSecret(e.secret)}:${e.issuer}:${e.name}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(e)
  }
  return out
}

export function assertSecretsValid(entries: NewEntryInput[]): void {
  for (const e of entries) decodeBase32(e.secret)
}
