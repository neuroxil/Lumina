import { app } from 'electron'
import { randomUUID } from 'crypto'
import { mkdir, readFile, writeFile, copyFile } from 'fs/promises'
import { existsSync } from 'fs'
import { join } from 'path'
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type NewEntryInput,
  type UpdateEntryInput,
  type VaultEntry,
  type VaultEntryPublic
} from '../../shared/types'
import { isLikelyBase32, normalizeSecret } from '../../shared/base32'
import { issuerColor } from '../../shared/issuers'
import {
  decryptWithOs,
  decryptWithPin,
  encryptWithOs,
  encryptWithPin,
  osEncryptionAvailable,
  type EncryptedBlob
} from './crypto'

interface VaultFile {
  blob: EncryptedBlob
  hasPin: boolean
  pinLength?: number
}

interface VaultBody {
  entries: VaultEntry[]
  settings: AppSettings
  order: string[]
}

const EMPTY_BODY: VaultBody = {
  entries: [],
  settings: { ...DEFAULT_SETTINGS },
  order: []
}

let memory: VaultBody | null = null
let unlocked = false
let pinCache: string | null = null

function vaultPath(): string {
  return join(app.getPath('userData'), 'vault.json')
}

function backupPath(): string {
  return join(app.getPath('userData'), 'backups')
}

async function readDisk(): Promise<VaultFile | null> {
  if (!existsSync(vaultPath())) return null
  const raw = await readFile(vaultPath(), 'utf8')
  return JSON.parse(raw) as VaultFile
}

async function writeDisk(file: VaultFile): Promise<void> {
  await mkdir(app.getPath('userData'), { recursive: true })
  const tmp = vaultPath() + '.tmp'
  await writeFile(tmp, JSON.stringify(file), { encoding: 'utf8', mode: 0o600 })
  await writeFile(vaultPath(), JSON.stringify(file), { encoding: 'utf8', mode: 0o600 })
}

function decryptBody(file: VaultFile, pin?: string): VaultBody {
  const plain = file.hasPin
    ? decryptWithPin(file.blob, pin ?? '')
    : decryptWithOs(file.blob)
  return JSON.parse(plain.toString('utf8')) as VaultBody
}

function encryptBody(body: VaultBody, pin: string | null, hasPin: boolean): VaultFile {
  const plain = Buffer.from(JSON.stringify(body), 'utf8')
  const usePin = Boolean(hasPin && pin)
  const blob = usePin ? encryptWithPin(plain, pin!) : encryptWithOs(plain)
  return { blob, hasPin: usePin, pinLength: usePin && pin ? pin.length : 0 }
}

export function isUnlocked(): boolean {
  return unlocked && memory !== null
}

export function lockVault(): void {
  memory = null
  unlocked = false
  pinCache = null
}

export async function status() {
  const file = await readDisk()
  const hasPin = Boolean(file?.hasPin)
  return {
    exists: Boolean(file),
    locked: !unlocked,
    hasPin,
    pinLength: hasPin ? file?.pinLength || 4 : 0,
    osUnlockAvailable: osEncryptionAvailable(),
    entryCount: memory?.entries.length ?? 0,
    settings: memory?.settings ?? { ...DEFAULT_SETTINGS }
  }
}

export async function createVault(pin?: string): Promise<void> {
  const hasPin = Boolean(pin && pin.length >= 4)
  if (!hasPin) {
    throw new Error('Choose a PIN of at least 4 digits to protect the vault.')
  }
  memory = structuredClone(EMPTY_BODY)
  unlocked = true
  pinCache = pin!
  await persist(true)
}

export async function unlockVault(pin?: string): Promise<void> {
  const file = await readDisk()
  if (!file) {
    await createVault(pin)
    return
  }
  if (file.hasPin && (!pin || pin.length < 4)) {
    throw new Error('Enter the PIN you created when you first opened Lumina.')
  }
  try {
    memory = decryptBody(file, pin)
    if (!memory.settings) memory.settings = { ...DEFAULT_SETTINGS }
    if (!memory.order) memory.order = memory.entries.map((e) => e.id)
    unlocked = true
    pinCache = file.hasPin ? pin ?? null : null
  } catch {
    throw new Error('Wrong PIN. Use the PIN you set when you first opened Lumina.')
  }
}

export async function setPin(pin: string): Promise<void> {
  requireOpen()
  if (pin.length < 4 || pin.length > 12 || !/^\d+$/.test(pin)) {
    throw new Error('PIN must be 4–12 digits')
  }
  pinCache = pin
  await persist(true)
}

export async function removePin(): Promise<void> {
  requireOpen()
  if (!osEncryptionAvailable()) {
    throw new Error('Cannot remove PIN without Windows encryption')
  }
  pinCache = null
  await persist(false)
}

export function publicEntries(): VaultEntryPublic[] {
  requireOpen()
  const { entries, order } = memory!
  const map = new Map(entries.map((e) => [e.id, e]))
  const sorted = order.map((id) => map.get(id)).filter(Boolean) as VaultEntry[]
  for (const e of entries) {
    if (!order.includes(e.id)) sorted.push(e)
  }
  return sorted.map(toPublic)
}

export function getEntry(id: string): VaultEntry {
  requireOpen()
  const entry = memory!.entries.find((e) => e.id === id)
  if (!entry) throw new Error('Entry not found')
  return entry
}

export async function addEntry(input: NewEntryInput): Promise<VaultEntryPublic> {
  requireOpen()
  const secret = normalizeSecret(input.secret)
  if (!isLikelyBase32(secret)) throw new Error('Secret is not valid base32')
  const now = Date.now()
  const issuer = input.issuer.trim()
  const name = input.name.trim()
  const entry: VaultEntry = {
    id: randomUUID(),
    type: input.type,
    issuer,
    name,
    secret,
    algorithm: input.algorithm ?? 'SHA1',
    digits: (input.digits as VaultEntry['digits']) ?? (input.type === 'steam' ? 5 : 6),
    period: input.period ?? 30,
    counter: input.counter ?? 0,
    color: input.color || issuerColor(issuer || name),
    note: input.note,
    createdAt: now,
    updatedAt: now
  }
  memory!.entries.push(entry)
  memory!.order.push(entry.id)
  await persist()
  return toPublic(entry)
}

export async function addMany(inputs: NewEntryInput[]): Promise<number> {
  let added = 0
  for (const input of inputs) {
    const secret = normalizeSecret(input.secret)
    const exists = memory!.entries.some(
      (e) => normalizeSecret(e.secret) === secret && e.issuer === input.issuer && e.name === input.name
    )
    if (exists) continue
    await addEntry(input)
    added++
  }
  return added
}

export async function updateEntry(patch: UpdateEntryInput): Promise<VaultEntryPublic> {
  requireOpen()
  const entry = getEntry(patch.id)
  if (patch.issuer !== undefined) entry.issuer = patch.issuer.trim()
  if (patch.name !== undefined) entry.name = patch.name.trim()
  if (patch.color !== undefined) entry.color = patch.color
  if (patch.note !== undefined) entry.note = patch.note
  if (patch.algorithm !== undefined) entry.algorithm = patch.algorithm
  if (patch.digits !== undefined) entry.digits = patch.digits as VaultEntry['digits']
  if (patch.period !== undefined) entry.period = patch.period
  entry.updatedAt = Date.now()
  await persist()
  return toPublic(entry)
}

export async function removeEntry(id: string): Promise<void> {
  requireOpen()
  memory!.entries = memory!.entries.filter((e) => e.id !== id)
  memory!.order = memory!.order.filter((x) => x !== id)
  await persist()
}

export async function reorder(ids: string[]): Promise<void> {
  requireOpen()
  const set = new Set(memory!.entries.map((e) => e.id))
  memory!.order = ids.filter((id) => set.has(id))
  await persist()
}

export async function incrementHotp(id: string): Promise<VaultEntryPublic> {
  const entry = getEntry(id)
  if (entry.type !== 'hotp') throw new Error('Not an HOTP entry')
  entry.counter += 1
  entry.updatedAt = Date.now()
  await persist()
  return toPublic(entry)
}

export async function touch(id: string): Promise<void> {
  const entry = getEntry(id)
  entry.lastUsedAt = Date.now()
  await persist()
}

export async function updateSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  requireOpen()
  memory!.settings = { ...memory!.settings, ...patch }
  await persist()
  return memory!.settings
}

export function settings(): AppSettings {
  requireOpen()
  return memory!.settings
}

export function exportPlain(): VaultBody {
  requireOpen()
  return structuredClone(memory!)
}

export async function backupNow(): Promise<string> {
  requireOpen()
  await mkdir(backupPath(), { recursive: true })
  const dest = join(backupPath(), `lumina-${new Date().toISOString().replace(/[:.]/g, '-')}.json`)
  if (existsSync(vaultPath())) await copyFile(vaultPath(), dest)
  return dest
}

async function persist(hasPin = memoryHasPin()): Promise<void> {
  requireOpen()
  const file = encryptBody(memory!, pinCache, hasPin)
  await writeDisk(file)
}

function memoryHasPin(): boolean {
  return Boolean(pinCache)
}

function requireOpen(): void {
  if (!unlocked || !memory) throw new Error('Vault is locked')
}

function toPublic(entry: VaultEntry): VaultEntryPublic {
  return {
    id: entry.id,
    type: entry.type,
    issuer: entry.issuer,
    name: entry.name,
    algorithm: entry.algorithm,
    digits: entry.digits,
    period: entry.period,
    color: entry.color || issuerColor(entry.issuer || entry.name),
    note: entry.note,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt
  }
}
