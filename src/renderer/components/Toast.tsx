import { AnimatePresence, motion } from 'framer-motion'
import { Glass } from './Glass'

export function Toast({ message }: { message: string | null }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0 }}
          className="pointer-events-none absolute inset-x-0 bottom-6 z-50 flex justify-center"
        >
          <Glass strong className="px-4 py-2 text-[13px] tracking-wide">
            {message}
          </Glass>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
