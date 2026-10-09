import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../lib/cn'

function chunks(code: string): string[][] {
  if (code.length === 5) return [code.split('')]
  if (code.length === 8) return [code.slice(0, 4).split(''), code.slice(4).split('')]
  if (code.length === 7) return [code.slice(0, 3).split(''), code.slice(3).split('')]
  return [code.slice(0, Math.ceil(code.length / 2)).split(''), code.slice(Math.ceil(code.length / 2)).split('')]
}

export function CodeDigits({
  code,
  hidden,
  style = 'capsules',
  animate = true,
  large = false
}: {
  code: string
  hidden?: boolean
  style?: 'capsules' | 'plain'
  animate?: boolean
  large?: boolean
}) {
  const groups = chunks(hidden ? '•'.repeat(code.length) : code)
  return (
    <div
      className={cn(
        'flex items-center justify-center font-mono',
        large ? 'text-[34px]' : 'text-[26px]',
        style === 'capsules' && 'digit-glass px-4 py-2.5'
      )}
    >
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center">
          {gi > 0 && <span className="mx-2.5 h-5 w-px bg-white/18" />}
          {group.map((ch, i) => (
            <span
              key={`${gi}-${i}`}
              className="inline-flex w-[1.15em] items-center justify-center font-semibold tracking-wide"
            >
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={hidden ? 'h' : ch}
                  initial={animate ? { y: 8, filter: 'blur(6px)', opacity: 0 } : false}
                  animate={{ y: 0, filter: 'blur(0px)', opacity: 1 }}
                  exit={{ y: -8, filter: 'blur(6px)', opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="inline-block tabular-nums"
                >
                  {ch}
                </motion.span>
              </AnimatePresence>
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}
