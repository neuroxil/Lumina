export type OtpType = 'totp' | 'hotp' | 'steam'
export type OtpAlgo = 'SHA1' | 'SHA256' | 'SHA512'
export type ThemeMode = 'system' | 'dark' | 'light'
export type DigitStyle = 'capsules' | 'plain'

export interface VaultEntry {
  id: string
  type: OtpType
  issuer: string
  name: string
  secret: string
  algorithm: OtpAlgo
  digits: 5 | 6 | 7 | 8
  period: number
  counter: number
  color?: string
  note?: string
  createdAt: number
  updatedAt: number
  lastUsedAt?: number
}

export interface VaultEntryPublic {
  id: string
  type: OtpType
  issuer: string
  name: string
  algorithm: OtpAlgo
  digits: number
  period: number
  color: string
  note?: string
  createdAt: number
  updatedAt: number
}

export interface CodeSnapshot {
  id: string
  current: string
  next: string
  remaining: number
  period: number
}

export interface AppSettings {
  hideCodes: boolean
  animateCodes: boolean
  digitStyle: DigitStyle
  theme: ThemeMode
  alwaysOnTop: boolean
  autoLockMinutes: number
  lockOnMinimize: boolean
  clearClipboardSeconds: number
  compactCards: boolean
}

export interface VaultStatus {
  exists: boolean
  locked: boolean
  hasPin: boolean
  pinLength: number
  osUnlockAvailable: boolean
  entryCount: number
  settings: AppSettings
}

export interface NewEntryInput {
  type: OtpType
  issuer: string
  name: string
  secret: string
  algorithm?: OtpAlgo
  digits?: number
  period?: number
  counter?: number
  color?: string
  note?: string
}

export interface UpdateEntryInput {
  id: string
  issuer?: string
  name?: string
  color?: string
  note?: string
  algorithm?: OtpAlgo
  digits?: number
  period?: number
}

export const DEFAULT_SETTINGS: AppSettings = {
  hideCodes: false,
  animateCodes: true,
  digitStyle: 'capsules',
  theme: 'dark',
  alwaysOnTop: false,
  autoLockMinutes: 5,
  lockOnMinimize: false,
  clearClipboardSeconds: 30,
  compactCards: false
}
