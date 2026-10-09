import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Glass } from '../components/Glass'
import { Field, GlassButton } from '../components/Field'
import type { AppSettings, DigitStyle, ThemeMode, VaultStatus } from '@shared/types'

function Row({
  label,
  hint,
  children
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <div className="text-[14px]">{label}</div>
        {hint && <div className="text-[11px] text-[var(--glass-dim)]">{hint}</div>}
      </div>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative h-6 w-11 rounded-full transition ${value ? 'bg-aqua/70' : 'bg-white/15'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition ${value ? 'left-5' : 'left-0.5'}`}
      />
    </button>
  )
}

export function SettingsSheet({
  open,
  status,
  settings,
  onClose,
  onSettings,
  onLock,
  toast
}: {
  open: boolean
  status: VaultStatus
  settings: AppSettings
  onClose: () => void
  onSettings: (patch: Partial<AppSettings>) => Promise<void>
  onLock: () => void
  toast: (msg: string) => void
}) {
  const [pin, setPin] = useState('')
  const [exportPass, setExportPass] = useState('')

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="absolute inset-0 z-40 flex items-end bg-[#07090d]/70 p-3 backdrop-blur-md">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full"
          >
            <Glass strong className="max-h-[86vh] overflow-auto p-5 scroll-thin">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Atmosphere</h2>
                <button className="text-[var(--glass-dim)]" onClick={onClose}>
                  Close
                </button>
              </div>

              <Row label="Hide codes" hint="Click still copies">
                <Toggle value={settings.hideCodes} onChange={(v) => onSettings({ hideCodes: v })} />
              </Row>
              <Row label="Animate digits">
                <Toggle value={settings.animateCodes} onChange={(v) => onSettings({ animateCodes: v })} />
              </Row>
              <Row label="Always on top">
                <Toggle value={settings.alwaysOnTop} onChange={(v) => onSettings({ alwaysOnTop: v })} />
              </Row>
              <Row label="Lock when minimized">
                <Toggle value={settings.lockOnMinimize} onChange={(v) => onSettings({ lockOnMinimize: v })} />
              </Row>
              <Row label="Compact cards">
                <Toggle value={settings.compactCards} onChange={(v) => onSettings({ compactCards: v })} />
              </Row>
              <Row label="Theme">
                <Field
                  as="select"
                  className="w-36"
                  value={settings.theme}
                  onChange={(e) => onSettings({ theme: e.target.value as ThemeMode })}
                >
                  <option value="dark">Dark glass</option>
                  <option value="light">Light glass</option>
                  <option value="system">System</option>
                </Field>
              </Row>
              <Row label="Digit style">
                <Field
                  as="select"
                  className="w-36"
                  value={settings.digitStyle}
                  onChange={(e) => onSettings({ digitStyle: e.target.value as DigitStyle })}
                >
                  <option value="capsules">Capsules</option>
                  <option value="plain">Plain</option>
                </Field>
              </Row>
              <Row label="Auto-lock" hint="Minutes of idle">
                <Field
                  className="w-20"
                  type="number"
                  min={0}
                  max={60}
                  value={settings.autoLockMinutes}
                  onChange={(e) => onSettings({ autoLockMinutes: Number(e.target.value) })}
                />
              </Row>
              <Row label="Clear clipboard" hint="Seconds, 0 to keep">
                <Field
                  className="w-20"
                  type="number"
                  min={0}
                  max={120}
                  value={settings.clearClipboardSeconds}
                  onChange={(e) => onSettings({ clearClipboardSeconds: Number(e.target.value) })}
                />
              </Row>

              <div className="mt-4 text-[12px] uppercase tracking-[0.18em] text-[var(--glass-dim)]">Vault</div>
              <div className="mt-2 flex gap-2">
                <Field
                  className="flex-1"
                  placeholder={status.hasPin ? 'New PIN' : 'Set PIN'}
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
                />
                <GlassButton
                  className="w-auto px-4"
                  onClick={async () => {
                    await window.lumina.setPin(pin)
                    setPin('')
                    toast('PIN saved')
                  }}
                >
                  Save
                </GlassButton>
              </div>
              {status.hasPin && (
                <button
                  className="mt-2 text-[12px] text-[var(--glass-dim)]"
                  onClick={async () => {
                    await window.lumina.removePin()
                    toast('PIN removed')
                  }}
                >
                  Remove PIN (Windows encryption only)
                </button>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <GlassButton
                  className="w-full"
                  onClick={async () => {
                    const r = await window.lumina.exportJson(exportPass || undefined)
                    if (!r.cancelled) toast('Exported')
                  }}
                >
                  Export JSON
                </GlassButton>
                <GlassButton
                  className="w-full"
                  onClick={async () => {
                    const r = await window.lumina.exportUri()
                    if (!r.cancelled) toast('Exported URIs')
                  }}
                >
                  Export URIs
                </GlassButton>
                <GlassButton
                  className="w-full"
                  onClick={async () => {
                    await window.lumina.backupNow()
                    toast('Backup saved')
                  }}
                >
                  Local backup
                </GlassButton>
                <GlassButton className="w-full" onClick={onLock}>
                  Lock now
                </GlassButton>
              </div>
              <Field
                className="mt-2"
                placeholder="Optional export password"
                type="password"
                value={exportPass}
                onChange={(e) => setExportPass(e.target.value)}
              />
              <p className="mt-4 text-[11px] leading-relaxed text-[var(--glass-dim)]">
                Secrets never leave this device unless you export them. Encrypted vault lives in your
                Windows user data folder, wrapped with a PIN and/or DPAPI.
              </p>
            </Glass>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
