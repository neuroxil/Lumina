import type { CodeSnapshot, VaultEntryPublic } from '@shared/types'
import { Glass } from './Glass'
import { CodeDigits } from './CodeDigits'
import { ServiceMark } from './ServiceMark'
import { cn } from '../lib/cn'

export function AccountCard({
  entry,
  code,
  hidden,
  animate,
  digitStyle,
  compact,
  onCopy,
  onEdit,
  onHotp
}: {
  entry: VaultEntryPublic
  code?: CodeSnapshot
  hidden: boolean
  animate: boolean
  digitStyle: 'capsules' | 'plain'
  compact?: boolean
  featured?: boolean
  onCopy: () => void
  onEdit: () => void
  onHotp?: () => void
}) {
  const remaining = code?.remaining ?? entry.period
  return (
    <Glass
      className={cn(
        'group relative cursor-pointer overflow-hidden p-4 transition-transform duration-300',
        compact ? 'p-3.5' : 'p-4',
        'hover:-translate-y-0.5'
      )}
      onClick={onCopy}
    >
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <ServiceMark issuer={entry.issuer} name={entry.name} fallbackColor={entry.color} />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-medium">{entry.issuer || entry.name || 'Account'}</div>
            <div className="truncate text-[12px] text-[var(--glass-dim)]">
              {entry.name}
              {entry.type !== 'totp' ? ` · ${entry.type.toUpperCase()}` : ''}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span
            className="rounded-full px-2 py-0.5 text-[11px] tabular-nums text-[var(--glass-dim)]"
          >
            {entry.type === 'hotp' ? 'HOTP' : `${remaining}s`}
          </span>
          <button
            className="no-drag rounded-lg px-2 py-1 text-[13px] text-[var(--glass-dim)] opacity-0 hover:bg-white/10 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
          >
            Edit
          </button>
        </div>
      </div>

      <div className="relative z-10 mt-4">
        <CodeDigits
          code={code?.current ?? '------'}
          hidden={hidden}
          style={digitStyle}
          animate={animate}
        />
        <div className="mt-2 flex items-center justify-between text-[12px] text-[var(--glass-dim)]">
          <span>Next {hidden ? '••••••' : code?.next ?? '------'}</span>
          {entry.type === 'hotp' && (
            <button
              className="no-drag rounded-full bg-white/10 px-2 py-0.5 text-[11px]"
              onClick={(e) => {
                e.stopPropagation()
                onHotp?.()
              }}
            >
              Advance
            </button>
          )}
        </div>
      </div>
      <div className="relative z-10 mt-4 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full bg-white/35"
          style={{ width: `${Math.max(0, Math.min(100, (remaining / (entry.period || 30)) * 100))}%` }}
        />
      </div>
    </Glass>
  )
}
