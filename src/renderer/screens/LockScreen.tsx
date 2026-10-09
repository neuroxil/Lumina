import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Glass } from '../components/Glass'
import { Logo } from '../components/Logo'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '←', '0', 'OK']

export function LockScreen({
  hasPin,
  pinLength,
  osUnlockAvailable,
  onUnlock
}: {
  hasPin: boolean
  pinLength: number
  osUnlockAvailable: boolean
  onUnlock: (pin?: string) => Promise<void>
}) {
  const needed = hasPin ? Math.min(12, Math.max(4, pinLength || 4)) : 4
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(next = pin) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await onUnlock(hasPin ? next : undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unlock failed')
      setPin('')
    } finally {
      setBusy(false)
    }
  }

  function press(key: string) {
    if (key === '←') return setPin((p) => p.slice(0, -1))
    if (key === 'OK') return void submit()
    const next = (pin + key).slice(0, 12)
    setPin(next)
    if (hasPin && next.length === needed) void submit(next)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Backspace') {
        e.preventDefault()
        press('←')
      } else if (e.key === 'Enter') {
        e.preventDefault()
        press('OK')
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault()
        press(e.key)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pin, busy, hasPin, needed])

  return (
    <div className="flex h-full flex-col items-center px-6 pb-8 pt-6">
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-sm">
        <Glass className="p-6 text-center">
          <Logo size={72} className="mx-auto mb-4" />
          <h1 className="text-3xl font-semibold tracking-tight">Lumina</h1>
          <p className="mt-1 text-[13px] text-[var(--glass-dim)]">
            {hasPin
              ? 'Enter the PIN you created when you first opened Lumina.'
              : 'Unlock this vault with your Windows account.'}
          </p>
          {hasPin && (
            <div className="mt-5 flex justify-center gap-2">
              {Array.from({ length: needed }).map((_, i) => (
                <span
                  key={i}
                  className={`h-2.5 w-2.5 rounded-full ${i < pin.length ? 'bg-white' : 'bg-white/20'}`}
                />
              ))}
            </div>
          )}
          {error && <p className="mt-3 text-[12px] text-rose">{error}</p>}
        </Glass>

        {hasPin ? (
          <div className="mt-5 grid grid-cols-3 gap-2">
            {KEYS.map((k) => (
              <button
                key={k}
                disabled={busy}
                onClick={() => press(k)}
                className="glass h-14 rounded-2xl text-[18px] hover:bg-white/10"
              >
                {k}
              </button>
            ))}
          </div>
        ) : (
          <button
            disabled={busy || !osUnlockAvailable}
            onClick={() => submit()}
            className="glass-btn mt-5 w-full py-3 text-[14px] font-medium"
          >
            Unlock
          </button>
        )}
      </motion.div>
    </div>
  )
}
