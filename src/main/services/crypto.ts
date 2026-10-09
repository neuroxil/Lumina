import { createCipheriv, createDecipheriv, randomBytes, scryptSync, timingSafeEqual } from 'crypto'
import { safeStorage } from 'electron'

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 32

export interface EncryptedBlob {
  version: 1
  kdf: 'scrypt' | 'dpapi'
  salt: string
  n: number
  r: number
  p: number
  iv: string
  tag: string
  ciphertext: string
}

function derivePinKey(pin: string, salt: Buffer): Buffer {
  return scryptSync(pin, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P })
}

export function encryptWithKey(plain: Buffer, key: Buffer): { iv: Buffer; tag: Buffer; ciphertext: Buffer } {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()])
  return { iv, tag: cipher.getAuthTag(), ciphertext }
}

export function decryptWithKey(blob: { iv: Buffer; tag: Buffer; ciphertext: Buffer }, key: Buffer): Buffer {
  const decipher = createDecipheriv('aes-256-gcm', key, blob.iv)
  decipher.setAuthTag(blob.tag)
  return Buffer.concat([decipher.update(blob.ciphertext), decipher.final()])
}

export function encryptWithPin(plain: Buffer, pin: string): EncryptedBlob {
  const salt = randomBytes(16)
  const key = derivePinKey(pin, salt)
  const { iv, tag, ciphertext } = encryptWithKey(plain, key)
  return {
    version: 1,
    kdf: 'scrypt',
    salt: salt.toString('base64'),
    n: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: ciphertext.toString('base64')
  }
}

export function decryptWithPin(blob: EncryptedBlob, pin: string): Buffer {
  const salt = Buffer.from(blob.salt, 'base64')
  const key = derivePinKey(pin, salt)
  return decryptWithKey(
    {
      iv: Buffer.from(blob.iv, 'base64'),
      tag: Buffer.from(blob.tag, 'base64'),
      ciphertext: Buffer.from(blob.ciphertext, 'base64')
    },
    key
  )
}

export function osEncryptionAvailable(): boolean {
  try {
    return safeStorage.isEncryptionAvailable()
  } catch {
    return false
  }
}

export function encryptWithOs(plain: Buffer): EncryptedBlob {
  if (!osEncryptionAvailable()) {
    throw new Error('Windows DPAPI encryption is not available. Set a PIN to protect the vault.')
  }
  const wrapped = safeStorage.encryptString(plain.toString('base64'))
  return {
    version: 1,
    kdf: 'dpapi',
    salt: '',
    n: 0,
    r: 0,
    p: 0,
    iv: '',
    tag: '',
    ciphertext: wrapped.toString('base64')
  }
}

export function decryptWithOs(blob: EncryptedBlob): Buffer {
  const wrapped = Buffer.from(blob.ciphertext, 'base64')
  const b64 = safeStorage.decryptString(wrapped)
  return Buffer.from(b64, 'base64')
}

export function pinsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}
