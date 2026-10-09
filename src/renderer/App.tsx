import { useEffect, useMemo, useState } from 'react'
import type { AppSettings, CodeSnapshot, NewEntryInput, VaultEntryPublic, VaultStatus } from '@shared/types'
import { DEFAULT_SETTINGS } from '@shared/types'
import { Field } from './components/Field'
import { Ambient } from './components/Ambient'
import { TitleBar } from './components/TitleBar'
import { AccountCard } from './components/AccountCard'
import { Toast } from './components/Toast'
import { Welcome } from './screens/Welcome'
import { LockScreen } from './screens/LockScreen'
import { AddSheet } from './screens/AddSheet'
import { SettingsSheet } from './screens/SettingsSheet'
import { EditSheet } from './screens/EditSheet'

type Gate = 'boot' | 'welcome' | 'lock' | 'app'

export function App() {
  const [gate, setGate] = useState<Gate>('boot')
  const [status, setStatus] = useState<VaultStatus | null>(null)
  const [entries, setEntries] = useState<VaultEntryPublic[]>([])
  const [codes, setCodes] = useState<CodeSnapshot[]>([])
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [query, setQuery] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editing, setEditing] = useState<VaultEntryPublic | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function flash(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(null), 1800)
  }

  function applyTheme(theme: AppSettings['theme']) {
    const dark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }

  async function hydrate(
    payload: Partial<VaultStatus> & { entries?: VaultEntryPublic[]; codes?: CodeSnapshot[] }
  ) {
    const nextStatus = { ...(status as VaultStatus), ...payload } as VaultStatus
    setStatus(nextStatus)
    if (payload.entries) setEntries(payload.entries)
    if (payload.codes) setCodes(payload.codes)
    if (payload.settings) {
      setSettings(payload.settings)
      applyTheme(payload.settings.theme)
    }
    setGate('app')
  }

  useEffect(() => {
    void (async () => {
      const s = await window.lumina.status()
      setStatus(s)
      applyTheme(s.settings.theme)
      setGate(s.exists ? 'lock' : 'welcome')
    })()
    return window.lumina.onLocked(() => {
      void window.lumina.status().then((s) => setStatus(s))
      setGate('lock')
      setEntries([])
      setCodes([])
      setAddOpen(false)
      setSettingsOpen(false)
      setEditing(null)
    })
  }, [])

  useEffect(() => {
    if (gate !== 'app') return
    const id = window.setInterval(async () => {
      try {
        setCodes(await window.lumina.codes())
      } catch {
        /* locked */
      }
    }, 500)
    return () => window.clearInterval(id)
  }, [gate])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault()
        setAddOpen(true)
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        void window.lumina.lock()
      }
      if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        document.getElementById('search')?.focus()
      }
      if (e.key === 'Escape') {
        setAddOpen(false)
        setSettingsOpen(false)
        setEditing(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(
      (e) => e.issuer.toLowerCase().includes(q) || e.name.toLowerCase().includes(q)
    )
  }, [entries, query])

  const codeMap = useMemo(() => new Map(codes.map((c) => [c.id, c])), [codes])

  return (
    <div className="relative h-full overflow-hidden">
      <Ambient />
      <div className="relative z-10 flex h-full flex-col">
        <TitleBar logo={gate === 'lock' || gate === 'welcome'} />
        {gate === 'welcome' && status && (
          <Welcome
            onCreate={async (pin) => {
              const res = await window.lumina.create(pin)
              await hydrate(res)
            }}
          />
        )}
        {gate === 'lock' && status && (
          <LockScreen
            hasPin={status.hasPin}
            pinLength={status.pinLength}
            osUnlockAvailable={status.osUnlockAvailable}
            onUnlock={async (pin) => {
              const res = await window.lumina.unlock(pin)
              await hydrate(res)
            }}
          />
        )}
        {gate === 'app' && (
          <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
            <div className="mb-3 flex items-center gap-2">
              <Field
                id="search"
                className="flex-1"
                placeholder="Find an account"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                className="glass flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
                onClick={() => setSettingsOpen(true)}
                aria-label="Settings"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                  <path
                    d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className="scroll-thin min-h-0 flex-1 space-y-3 overflow-auto pr-1 pb-16">
              {filtered.length === 0 && (
                <div className="glass rounded-[28px] p-8 text-center">
                  <p className="text-lg font-medium">Nothing in the glass yet</p>
                  <p className="mt-1 text-[13px] text-[var(--glass-dim)]">
                    Scan a QR from your screen, drop a backup, or type a secret.
                  </p>
                  <button
                    className="mt-4 rounded-2xl bg-gradient-to-r from-aqua/80 to-lilac/80 px-4 py-2 text-[13px] font-medium text-ink-900"
                    onClick={() => setAddOpen(true)}
                  >
                    Add a code
                  </button>
                </div>
              )}
              {filtered.map((entry, i) => (
                <AccountCard
                  key={entry.id}
                  entry={entry}
                  code={codeMap.get(entry.id)}
                  hidden={settings.hideCodes}
                  animate={settings.animateCodes}
                  digitStyle={settings.digitStyle}
                  compact={settings.compactCards}
                  onCopy={async () => {
                    const snap = codeMap.get(entry.id)
                    if (!snap) return
                    await window.lumina.copy(snap.current, entry.id)
                    flash('Code copied')
                  }}
                  onEdit={() => setEditing(entry)}
                  onHotp={async () => setCodes(await window.lumina.hotpNext(entry.id))}
                />
              ))}
            </div>

            <button
              onClick={() => setAddOpen(true)}
              className="absolute bottom-6 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-aqua to-lilac text-2xl text-ink-900 shadow-glow"
              aria-label="Add"
            >
              +
            </button>
          </div>
        )}
      </div>

      <AddSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        toast={flash}
        onSave={async (input: NewEntryInput) => {
          const secret = input.secret.trim()
          if (secret.includes('\n') || secret.startsWith('otpauth-migration://')) {
            const res = await window.lumina.importText(secret)
            setEntries(res.entries)
            setCodes(res.codes)
            flash(`Imported ${res.added}`)
            return
          }
          const res = await window.lumina.add(input)
          setEntries(await window.lumina.entries())
          setCodes(res.codes)
          flash('Saved')
        }}
      />
      {status && (
        <SettingsSheet
          open={settingsOpen}
          status={status}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onLock={() => {
            void window.lumina.lock()
          }}
          toast={flash}
          onSettings={async (patch) => {
            const next = await window.lumina.settings(patch)
            setSettings(next)
            applyTheme(next.theme)
            setStatus((s) => (s ? { ...s, settings: next } : s))
          }}
        />
      )}
      <EditSheet
        entry={editing}
        onClose={() => setEditing(null)}
        toast={flash}
        onSave={async (id, patch) => {
          await window.lumina.update({ id, ...patch })
          setEntries(await window.lumina.entries())
          setEditing(null)
          flash('Updated')
        }}
        onDelete={async (id) => {
          const res = await window.lumina.remove(id)
          setEntries(res.entries)
          setCodes(res.codes)
          setEditing(null)
          flash('Deleted')
        }}
      />
      <Toast message={toast} />
    </div>
  )
}
