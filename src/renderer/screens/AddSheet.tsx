import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Glass } from '../components/Glass'
import { Field, GlassButton } from '../components/Field'
import { ServiceMark } from '../components/ServiceMark'
import type { NewEntryInput, OtpAlgo, OtpType } from '@shared/types'

const empty: NewEntryInput = {
  type: 'totp',
  issuer: '',
  name: '',
  secret: '',
  algorithm: 'SHA1',
  digits: 6,
  period: 30,
  counter: 0
}

export function AddSheet({
  open,
  onClose,
  onSave,
  toast
}: {
  open: boolean
  onClose: () => void
  onSave: (input: NewEntryInput) => Promise<void>
  toast: (msg: string) => void
}) {
  const [form, setForm] = useState<NewEntryInput>(empty)
  const [advanced, setAdvanced] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function set<K extends keyof NewEntryInput>(key: K, value: NewEntryInput[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function save() {
    setError('')
    setBusy(true)
    try {
      await onSave(form)
      setForm(empty)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  async function scanScreen() {
    setBusy(true)
    setError('')
    try {
      const result = (await window.lumina.qrScreen()) as {
        kind: string
        entry?: NewEntryInput
        raw?: string
      }
      if (result.kind === 'otpauth' && result.entry) {
        setForm({ ...empty, ...result.entry })
        toast('QR captured from screen')
      } else if (result.kind === 'migration' && result.raw) {
        const imported = await window.lumina.importText(result.raw)
        toast(`Imported ${imported.added} accounts`)
        onClose()
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed')
    } finally {
      setBusy(false)
    }
  }

  async function fromFile() {
    try {
      const result = await window.lumina.importFile()
      if (result.cancelled) return
      toast(`Imported ${result.added} accounts`)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Import failed')
    }
  }

  async function onDrop(files: FileList | null) {
    const file = files?.[0]
    if (!file) return
    if (file.type.startsWith('image/')) {
      const buf = new Uint8Array(await file.arrayBuffer())
      try {
        const result = (await window.lumina.qrImage(buf)) as { entry?: NewEntryInput }
        if (result.entry) setForm({ ...empty, ...result.entry })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No QR in image')
      }
    } else {
      const text = await file.text()
      const imported = await window.lumina.importText(text)
      toast(`Imported ${imported.added} accounts`)
      onClose()
    }
  }

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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add a code</h2>
                <button className="text-[var(--glass-dim)]" onClick={onClose}>
                  Close
                </button>
              </div>

              <div className="mb-4 grid grid-cols-2 gap-2">
                <GlassButton className="w-full" onClick={scanScreen}>
                  Scan from screen
                </GlassButton>
                <GlassButton className="w-full" onClick={fromFile}>
                  Import file / QR
                </GlassButton>
              </div>

              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  void onDrop(e.dataTransfer.files)
                }}
                className="glass-field mb-4 px-3 py-4 text-center text-[12px] text-[var(--glass-dim)]"
              >
                Drop a QR image or backup file here
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ServiceMark issuer={form.issuer} name={form.name} fallbackColor="#7CFFF2" size={48} />
                  <Field
                    className="flex-1"
                    placeholder="Issuer (GitHub, Discord, Google…)"
                    value={form.issuer}
                    onChange={(e) => set('issuer', e.target.value)}
                  />
                </div>
                <Field placeholder="Account" value={form.name} onChange={(e) => set('name', e.target.value)} />
                <Field
                  placeholder="Secret key or otpauth:// URI"
                  value={form.secret}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoComplete="off"
                  onChange={(e) => set('secret', e.target.value)}
                />
              </div>

              <button className="mt-3 text-[12px] text-[var(--glass-dim)]" onClick={() => setAdvanced((v) => !v)}>
                {advanced ? 'Hide advanced' : 'Advanced options'}
              </button>
              {advanced && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field as="select" value={form.type} onChange={(e) => set('type', e.target.value as OtpType)}>
                    <option value="totp">TOTP</option>
                    <option value="hotp">HOTP</option>
                    <option value="steam">Steam</option>
                  </Field>
                  <Field as="select" value={form.algorithm} onChange={(e) => set('algorithm', e.target.value as OtpAlgo)}>
                    <option>SHA1</option>
                    <option>SHA256</option>
                    <option>SHA512</option>
                  </Field>
                  <Field as="select" value={form.digits} onChange={(e) => set('digits', Number(e.target.value))}>
                    <option value={6}>6 digits</option>
                    <option value={7}>7 digits</option>
                    <option value={8}>8 digits</option>
                    <option value={5}>5 (Steam)</option>
                  </Field>
                  <Field
                    type="number"
                    min={10}
                    max={120}
                    value={form.period}
                    onChange={(e) => set('period', Number(e.target.value))}
                  />
                </div>
              )}

              {error && <p className="mt-2 text-[12px] text-rose">{error}</p>}
              <button
                disabled={busy}
                onClick={save}
                className="mt-4 w-full rounded-2xl bg-gradient-to-r from-aqua/80 to-lilac/80 py-3 text-[14px] font-medium text-ink-900"
              >
                Save code
              </button>
            </Glass>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
