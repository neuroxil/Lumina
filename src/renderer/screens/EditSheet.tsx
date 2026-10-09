import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Glass } from '../components/Glass'
import { Field, GlassButton } from '../components/Field'
import { ServiceMark } from '../components/ServiceMark'
import type { VaultEntryPublic } from '@shared/types'

export function EditSheet({
  entry,
  onClose,
  onSave,
  onDelete,
  toast
}: {
  entry: VaultEntryPublic | null
  onClose: () => void
  onSave: (id: string, patch: { issuer: string; name: string; note?: string }) => Promise<void>
  onDelete: (id: string) => Promise<void>
  toast: (msg: string) => void
}) {
  const [issuer, setIssuer] = useState('')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!entry) return
    setIssuer(entry.issuer)
    setName(entry.name)
    setNote(entry.note ?? '')
  }, [entry])

  return (
    <AnimatePresence>
      {entry && (
        <motion.div className="absolute inset-0 z-40 flex items-end bg-[#07090d]/70 p-3 backdrop-blur-md">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="w-full"
          >
            <Glass strong className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit</h2>
                <button className="text-[var(--glass-dim)]" onClick={onClose}>
                  Close
                </button>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ServiceMark issuer={issuer} name={name} fallbackColor={entry.color} size={48} />
                  <Field className="flex-1" value={issuer} onChange={(e) => setIssuer(e.target.value)} placeholder="Issuer" />
                </div>
                <Field value={name} onChange={(e) => setName(e.target.value)} placeholder="Account" />
                <Field as="textarea" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note" />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  className="flex-1 rounded-2xl bg-gradient-to-r from-aqua/80 to-lilac/80 py-3 text-[14px] font-medium text-ink-900"
                  onClick={() => onSave(entry.id, { issuer, name, note })}
                >
                  Save
                </button>
                <GlassButton
                  className="w-auto px-4"
                  onClick={async () => {
                    const uri = await window.lumina.otpauth(entry.id)
                    await window.lumina.copy(uri)
                    toast('otpauth URI copied')
                  }}
                >
                  Copy URI
                </GlassButton>
              </div>
              <button
                className="mt-3 w-full text-[12px] text-rose"
                onClick={() => onDelete(entry.id)}
              >
                Delete this account
              </button>
            </Glass>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
