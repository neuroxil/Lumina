import { BrowserWindow, clipboard, dialog, ipcMain, powerMonitor } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { generateCurrentAndNext, remainingSeconds } from '../shared/otp'
import { parseImportPayload, uniqueEntries } from '../shared/importers'
import { parseLooseSecretOrUri, parseOtpauth, toOtpauth } from '../shared/otpauth'
import { encryptWithPin } from './services/crypto'
import { decodeQrFromPng, scanDisplays } from './services/qr'
import {
  addEntry,
  addMany,
  backupNow,
  createVault,
  exportPlain,
  getEntry,
  incrementHotp,
  isUnlocked,
  lockVault,
  publicEntries,
  removeEntry,
  removePin,
  reorder,
  setPin,
  settings,
  status,
  touch,
  unlockVault,
  updateEntry,
  updateSettings
} from './services/vault'
import { getMainWindow, setAlwaysOnTop } from './window'
import type { AppSettings, NewEntryInput } from '../shared/types'

let clipboardTimer: NodeJS.Timeout | null = null

function requireUnlocked(): void {
  if (!isUnlocked()) throw new Error('Vault is locked')
}

function snapshots() {
  if (!isUnlocked()) return []
  const now = Date.now()
  return publicEntries().map((pub) => {
    const entry = getEntry(pub.id)
    const { current, next } = generateCurrentAndNext({
      type: entry.type,
      secret: entry.secret,
      algorithm: entry.algorithm,
      digits: entry.digits,
      period: entry.period,
      counter: entry.counter,
      now
    })
    return {
      id: pub.id,
      current,
      next,
      remaining: remainingSeconds(entry.period || 30, now),
      period: entry.period || 30
    }
  })
}

export function registerIpc(): void {
  ipcMain.handle('vault:status', () => status())
  ipcMain.handle('vault:create', async (_e, pin?: string) => {
    await createVault(pin)
    return { ...(await status()), entries: publicEntries(), codes: snapshots() }
  })
  ipcMain.handle('vault:unlock', async (_e, pin?: string) => {
    await unlockVault(pin)
    const s = await status()
    setAlwaysOnTop(s.settings.alwaysOnTop)
    return { ...s, entries: publicEntries(), codes: snapshots() }
  })
  ipcMain.handle('vault:lock', async () => {
    lockVault()
    getMainWindow()?.webContents.send('vault:locked')
    return status()
  })
  ipcMain.handle('vault:setPin', async (_e, pin: string) => {
    await setPin(pin)
    return status()
  })
  ipcMain.handle('vault:removePin', async () => {
    await removePin()
    return status()
  })
  ipcMain.handle('vault:entries', () => {
    if (!isUnlocked()) return []
    return publicEntries()
  })
  ipcMain.handle('vault:codes', () => snapshots())
  ipcMain.handle('vault:add', async (_e, input: NewEntryInput) => {
    const entry = await addEntry(input)
    return { entry, codes: snapshots() }
  })
  ipcMain.handle('vault:update', async (_e, patch) => {
    const entry = await updateEntry(patch)
    return { entry, codes: snapshots() }
  })
  ipcMain.handle('vault:remove', async (_e, id: string) => {
    await removeEntry(id)
    return { codes: snapshots(), entries: publicEntries() }
  })
  ipcMain.handle('vault:reorder', async (_e, ids: string[]) => {
    await reorder(ids)
    return publicEntries()
  })
  ipcMain.handle('vault:hotpNext', async (_e, id: string) => {
    await incrementHotp(id)
    return snapshots()
  })
  ipcMain.handle('vault:settings', async (_e, patch?: Partial<AppSettings>) => {
    requireUnlocked()
    const next = patch ? await updateSettings(patch) : settings()
    if (patch?.alwaysOnTop !== undefined) setAlwaysOnTop(next.alwaysOnTop)
    return next
  })
  ipcMain.handle('vault:otpauth', (_e, id: string) => {
    requireUnlocked()
    return toOtpauth(getEntry(id))
  })

  ipcMain.handle('import:text', async (_e, raw: string) => {
    requireUnlocked()
    const entries = uniqueEntries(parseImportPayload(raw))
    const added = await addMany(entries)
    return { added, total: entries.length, entries: publicEntries(), codes: snapshots() }
  })
  ipcMain.handle('import:file', async () => {
    const win = getMainWindow()
    const picked = await dialog.showOpenDialog(win!, {
      title: 'Import codes',
      filters: [
        { name: 'Authenticator backups', extensions: ['json', 'txt', 'uri'] },
        { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] },
        { name: 'All files', extensions: ['*'] }
      ],
      properties: ['openFile']
    })
    if (picked.canceled || !picked.filePaths[0]) return { added: 0, cancelled: true }
    const path = picked.filePaths[0]
    const lower = path.toLowerCase()
    if (/\.(png|jpe?g|webp)$/.test(lower)) {
      const buf = await readFile(path)
      const data = decodeQrFromPng(buf)
      if (!data) throw new Error('No QR code found in that image')
      return importQrData(data)
    }
    const text = await readFile(path, 'utf8')
    const entries = uniqueEntries(parseImportPayload(text))
    const added = await addMany(entries)
    return { added, total: entries.length, entries: publicEntries(), codes: snapshots() }
  })
  ipcMain.handle('qr:image', async (_e, bytes: Uint8Array) => {
    const data = decodeQrFromPng(Buffer.from(bytes))
    if (!data) throw new Error('No QR code found')
    return parseQrPayload(data)
  })
  ipcMain.handle('qr:screen', async () => {
    const data = await scanDisplays(getMainWindow())
    if (!data) throw new Error('No QR code found on screen')
    return parseQrPayload(data)
  })

  ipcMain.handle('export:json', async (_e, password?: string) => {
    requireUnlocked()
    const body = exportPlain()
    const payload = {
      app: 'lumina',
      version: 1,
      exportedAt: new Date().toISOString(),
      entries: body.entries
    }
    const win = getMainWindow()
    const picked = await dialog.showSaveDialog(win!, {
      title: 'Export codes',
      defaultPath: password ? 'lumina-encrypted.json' : 'lumina-export.json',
      filters: [{ name: 'JSON', extensions: ['json'] }]
    })
    if (picked.canceled || !picked.filePath) return { cancelled: true }
    if (password) {
      const blob = encryptWithPin(Buffer.from(JSON.stringify(payload), 'utf8'), password)
      await writeFile(picked.filePath, JSON.stringify({ encrypted: true, ...blob }, null, 2))
    } else {
      await writeFile(picked.filePath, JSON.stringify(payload, null, 2))
    }
    return { path: picked.filePath }
  })
  ipcMain.handle('export:uri', async () => {
    requireUnlocked()
    const body = exportPlain()
    const text = body.entries.map((e) => toOtpauth(e)).join('\n')
    const win = getMainWindow()
    const picked = await dialog.showSaveDialog(win!, {
      title: 'Export otpauth URIs',
      defaultPath: 'lumina-otpauth.txt',
      filters: [{ name: 'Text', extensions: ['txt'] }]
    })
    if (picked.canceled || !picked.filePath) return { cancelled: true }
    await writeFile(picked.filePath, text)
    return { path: picked.filePath }
  })
  ipcMain.handle('backup:now', () => backupNow())

  ipcMain.handle('clipboard:copy', async (_e, text: string, id?: string) => {
    clipboard.writeText(text)
    if (id) await touch(id)
    const secs = isUnlocked() ? settings().clearClipboardSeconds : 0
    if (clipboardTimer) clearTimeout(clipboardTimer)
    if (secs > 0) {
      clipboardTimer = setTimeout(() => {
        if (clipboard.readText() === text) clipboard.clear()
      }, secs * 1000)
    }
    return true
  })

  ipcMain.handle('window:minimize', () => getMainWindow()?.minimize())
  ipcMain.handle('window:close', () => getMainWindow()?.close())
  ipcMain.handle('window:maximize', () => {
    const win = getMainWindow()
    if (!win) return
    if (win.isMaximized()) win.unmaximize()
    else win.maximize()
  })

  powerMonitor.on('lock-screen', () => {
    if (!isUnlocked()) return
    lockVault()
    getMainWindow()?.webContents.send('vault:locked')
  })
}

function parseQrPayload(data: string) {
  if (data.startsWith('otpauth-migration://')) {
    const entries = uniqueEntries(parseImportPayload(data))
    return { kind: 'migration' as const, entries, raw: data }
  }
  if (data.startsWith('otpauth://')) {
    return { kind: 'otpauth' as const, entry: parseOtpauth(data), raw: data }
  }
  try {
    return { kind: 'otpauth' as const, entry: parseLooseSecretOrUri(data), raw: data }
  } catch {
    throw new Error('QR did not contain a 2FA secret')
  }
}

async function importQrData(data: string) {
  const parsed = parseQrPayload(data)
  if (parsed.kind === 'migration') {
    const added = await addMany(parsed.entries)
    return { added, total: parsed.entries.length, entries: publicEntries(), codes: snapshots() }
  }
  const entry = await addEntry(parsed.entry as NewEntryInput)
  return { added: 1, total: 1, entry, entries: publicEntries(), codes: snapshots() }
}

export function watchIdleLock(): void {
  setInterval(() => {
    if (!isUnlocked()) return
    const mins = settings().autoLockMinutes
    if (!mins) return
    const idle = powerMonitor.getSystemIdleTime()
    if (idle >= mins * 60) {
      lockVault()
      getMainWindow()?.webContents.send('vault:locked')
    }
  }, 5000)
}

export function watchMinimizeLock(win: BrowserWindow): void {
  win.on('minimize', () => {
    if (!isUnlocked()) return
    if (!settings().lockOnMinimize) return
    lockVault()
    win.webContents.send('vault:locked')
  })
}
