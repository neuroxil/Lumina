import { useState } from 'react'
import { motion } from 'framer-motion'
import { Glass } from '../components/Glass'
import { Field } from '../components/Field'
import { Logo } from '../components/Logo'

export function Welcome({ onCreate }: { onCreate: (pin: string) => Promise<void> }) {
  const [pin, setPin] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function start() {
    setError('')
    if (pin.length < 4) return setError('Use at least 4 digits')
    if (pin !== confirm) return setError('PINs do not match')
    setBusy(true)
    try {
      await onCreate(pin)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create vault')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-full flex-col px-6 pb-8 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto mt-4 flex w-full max-w-md flex-1 flex-col"
      >
        <Glass className="overflow-hidden p-6 text-center">
          <Logo size={72} className="mx-auto mb-4" />
          <p className="text-[12px] uppercase tracking-[0.28em] text-[var(--glass-dim)]">Windows authenticator</p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">Codes in liquid glass.</h1>
          <p className="mt-3 text-[14px] leading-relaxed text-[var(--glass-dim)]">
            Create a PIN now. Lumina will ask for this same PIN every time you unlock.
          </p>
        </Glass>

        <Glass className="mt-4 p-5">
          <label className="text-[12px] uppercase tracking-[0.18em] text-[var(--glass-dim)]">PIN</label>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Field
              placeholder="PIN"
              inputMode="numeric"
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 12))}
            />
            <Field
              placeholder="Confirm"
              inputMode="numeric"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value.replace(/\D/g, '').slice(0, 12))}
            />
          </div>
          {error && <p className="mt-2 text-[12px] text-rose">{error}</p>}
          <button
            disabled={busy}
            onClick={start}
            className="glass-btn mt-4 w-full py-3 text-[14px] font-medium"
          >
            Create vault
          </button>
        </Glass>
      </motion.div>
    </div>
  )
}
