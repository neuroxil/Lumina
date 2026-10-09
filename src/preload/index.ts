import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  CodeSnapshot,
  NewEntryInput,
  UpdateEntryInput,
  VaultEntryPublic,
  VaultStatus
} from '../shared/types'

export interface LuminaApi {
  status: () => Promise<VaultStatus>
  create: (pin?: string) => Promise<VaultStatus & { entries: VaultEntryPublic[]; codes: CodeSnapshot[] }>
  unlock: (pin?: string) => Promise<VaultStatus & { entries: VaultEntryPublic[]; codes: CodeSnapshot[] }>
  lock: () => Promise<VaultStatus>
  setPin: (pin: string) => Promise<VaultStatus>
  removePin: () => Promise<VaultStatus>
  entries: () => Promise<VaultEntryPublic[]>
  codes: () => Promise<CodeSnapshot[]>
  add: (input: NewEntryInput) => Promise<{ entry: VaultEntryPublic; codes: CodeSnapshot[] }>
  update: (patch: UpdateEntryInput) => Promise<{ entry: VaultEntryPublic; codes: CodeSnapshot[] }>
  remove: (id: string) => Promise<{ entries: VaultEntryPublic[]; codes: CodeSnapshot[] }>
  reorder: (ids: string[]) => Promise<VaultEntryPublic[]>
  hotpNext: (id: string) => Promise<CodeSnapshot[]>
  settings: (patch?: Partial<AppSettings>) => Promise<AppSettings>
  otpauth: (id: string) => Promise<string>
  importText: (raw: string) => Promise<{ added: number; total: number; entries: VaultEntryPublic[]; codes: CodeSnapshot[] }>
  importFile: () => Promise<{ added: number; total?: number; cancelled?: boolean; entries?: VaultEntryPublic[]; codes?: CodeSnapshot[] }>
  qrImage: (bytes: Uint8Array) => Promise<unknown>
  qrScreen: () => Promise<unknown>
  exportJson: (password?: string) => Promise<{ cancelled?: boolean; path?: string }>
  exportUri: () => Promise<{ cancelled?: boolean; path?: string }>
  backupNow: () => Promise<string>
  copy: (text: string, id?: string) => Promise<boolean>
  minimize: () => Promise<void>
  close: () => Promise<void>
  maximize: () => Promise<void>
  onLocked: (cb: () => void) => () => void
}

const api: LuminaApi = {
  status: () => ipcRenderer.invoke('vault:status'),
  create: (pin) => ipcRenderer.invoke('vault:create', pin),
  unlock: (pin) => ipcRenderer.invoke('vault:unlock', pin),
  lock: () => ipcRenderer.invoke('vault:lock'),
  setPin: (pin) => ipcRenderer.invoke('vault:setPin', pin),
  removePin: ( ) => ipcRenderer.invoke('vault:removePin'),
  entries: () => ipcRenderer.invoke('vault:entries'),
  codes: () => ipcRenderer.invoke('vault:codes'),
  add: (input) => ipcRenderer.invoke('vault:add', input),
  update: (patch) => ipcRenderer.invoke('vault:update', patch),
  remove: (id) => ipcRenderer.invoke('vault:remove', id),
  reorder: (ids) => ipcRenderer.invoke('vault:reorder', ids),
  hotpNext: (id) => ipcRenderer.invoke('vault:hotpNext', id),
  settings: (patch) => ipcRenderer.invoke('vault:settings', patch),
  otpauth: (id) => ipcRenderer.invoke('vault:otpauth', id),
  importText: (raw) => ipcRenderer.invoke('import:text', raw),
  importFile: () => ipcRenderer.invoke('import:file'),
  qrImage: (bytes) => ipcRenderer.invoke('qr:image', bytes),
  qrScreen: () => ipcRenderer.invoke('qr:screen'),
  exportJson: (password) => ipcRenderer.invoke('export:json', password),
  exportUri: () => ipcRenderer.invoke('export:uri'),
  backupNow: () => ipcRenderer.invoke('backup:now'),
  copy: (text, id) => ipcRenderer.invoke('clipboard:copy', text, id),
  minimize: () => ipcRenderer.invoke('window:minimize'),
  close: () => ipcRenderer.invoke('window:close'),
  maximize: () => ipcRenderer.invoke('window:maximize'),
  onLocked: (cb) => {
    const handler = () => cb()
    ipcRenderer.on('vault:locked', handler)
    return () => ipcRenderer.removeListener('vault:locked', handler)
  }
}

contextBridge.exposeInMainWorld('lumina', api)
