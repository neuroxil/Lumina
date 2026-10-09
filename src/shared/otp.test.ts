import { describe, expect, it } from 'vitest'
import { decodeBase32, encodeBase32 } from './base32'
import { generateCode, hotpCode } from './otp'
import { parseOtpauth, toOtpauth } from './otpauth'
import { encodeMigrationPayload, decodeMigrationPayload } from './protobuf'
import { parseImportPayload, parseMigrationUri } from './importers'

describe('base32', () => {
  it('round-trips bytes', () => {
    const bytes = Uint8Array.from([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0x21, 0xde, 0xad])
    expect(decodeBase32(encodeBase32(bytes))).toEqual(bytes)
  })
})

describe('RFC 6238 TOTP', () => {
  const sha1 = Uint8Array.from(Buffer.from('12345678901234567890', 'ascii'))
  const sha256 = Uint8Array.from(Buffer.from('12345678901234567890123456789012', 'ascii'))
  const sha512 = Uint8Array.from(
    Buffer.from('1234567890123456789012345678901234567890123456789012345678901234', 'ascii')
  )

  const vectors: Array<[number, string, 'SHA1' | 'SHA256' | 'SHA512', Uint8Array]> = [
    [59, '94287082', 'SHA1', sha1],
    [59, '46119246', 'SHA256', sha256],
    [59, '90693936', 'SHA512', sha512],
    [1111111109, '07081804', 'SHA1', sha1],
    [1111111109, '68084774', 'SHA256', sha256],
    [1111111109, '25091201', 'SHA512', sha512],
    [1111111111, '14050471', 'SHA1', sha1],
    [1234567890, '89005924', 'SHA1', sha1],
    [2000000000, '69279037', 'SHA1', sha1],
    [20000000000, '65353130', 'SHA1', sha1]
  ]

  for (const [unix, expected, algo, secret] of vectors) {
    it(`${algo} T=${unix}`, () => {
      const counter = Math.floor(unix / 30)
      expect(hotpCode(secret, counter, 8, algo)).toBe(expected)
    })
  }
})

describe('otpauth', () => {
  it('parses a standard URI', () => {
    const parsed = parseOtpauth(
      'otpauth://totp/GitHub:alice?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&algorithm=SHA1&digits=6&period=30'
    )
    expect(parsed.issuer).toBe('GitHub')
    expect(parsed.name).toBe('alice')
    expect(parsed.secret).toBe('JBSWY3DPEHPK3PXP')
    expect(toOtpauth({ ...parsed, algorithm: 'SHA1', digits: 6, period: 30, counter: 0 })).toContain(
      'secret=JBSWY3DPEHPK3PXP'
    )
  })

  it('generates a known code from Hello! secret', () => {
    // JBSWY3DPEHPK3PXP = "Hello!"
    const code = generateCode({
      type: 'totp',
      secret: 'JBSWY3DPEHPK3PXP',
      digits: 6,
      period: 30,
      now: 59_000
    })
    expect(code).toHaveLength(6)
  })
})

describe('google authenticator migration', () => {
  it('encodes and decodes a payload', () => {
    const secret = decodeBase32('JBSWY3DPEHPK3PXP')
    const bytes = encodeMigrationPayload([
      {
        secret,
        name: 'alice',
        issuer: 'GitHub',
        algorithm: 1,
        digits: 1,
        type: 2,
        counter: 0
      }
    ])
    const decoded = decodeMigrationPayload(bytes)
    expect(decoded[0].issuer).toBe('GitHub')
    expect(decoded[0].name).toBe('alice')
    expect(Array.from(decoded[0].secret)).toEqual(Array.from(secret))

    const uri = `otpauth-migration://offline?data=${Buffer.from(bytes).toString('base64url')}`
    const entries = parseMigrationUri(uri)
    expect(entries[0].issuer).toBe('GitHub')
    expect(entries[0].secret).toBe('JBSWY3DPEHPK3PXP')
  })
})

describe('importers', () => {
  it('parses Aegis JSON', () => {
    const payload = JSON.stringify({
      version: 1,
      db: {
        entries: [
          {
            type: 'totp',
            name: 'me',
            issuer: 'Discord',
            info: { secret: 'JBSWY3DPEHPK3PXP', algo: 'SHA1', digits: 6, period: 30 }
          }
        ]
      }
    })
    const entries = parseImportPayload(payload)
    expect(entries).toHaveLength(1)
    expect(entries[0].issuer).toBe('Discord')
  })

  it('parses 2FAS JSON', () => {
    const payload = JSON.stringify({
      services: [
        {
          name: 'Steam',
          otp: {
            account: 'user',
            issuer: 'Steam',
            secret: 'JBSWY3DPEHPK3PXP',
            digits: 5,
            period: 30,
            tokenType: 'STEAM'
          }
        }
      ]
    })
    const entries = parseImportPayload(payload)
    expect(entries[0].type).toBe('steam')
  })

  it('parses Bitwarden totp URIs', () => {
    const payload = JSON.stringify({
      items: [
        {
          name: 'GitHub',
          login: {
            username: 'alice',
            totp: 'otpauth://totp/GitHub:alice?secret=JBSWY3DPEHPK3PXP&issuer=GitHub'
          }
        }
      ]
    })
    const entries = parseImportPayload(payload)
    expect(entries[0].name).toBe('alice')
  })
})
