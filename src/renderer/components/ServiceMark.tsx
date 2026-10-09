import { issuerInitials } from '@shared/issuers'
import { markContrast, resolveLogo } from '../lib/logos'
import { cn } from '../lib/cn'

export function ServiceMark({
  issuer,
  name,
  fallbackColor,
  size = 44,
  className
}: {
  issuer: string
  name?: string
  fallbackColor: string
  size?: number
  className?: string
}) {
  const logo = resolveLogo(issuer, name)
  const initials = issuerInitials(issuer, name)
  const contrast = logo ? markContrast(logo.hex) : null
  const iconSize = Math.round(size * 0.52)

  return (
    <div
      className={cn('flex shrink-0 items-center justify-center rounded-2xl', className)}
      style={{
        width: size,
        height: size,
        background: contrast
          ? contrast.bg
          : `linear-gradient(160deg, ${fallbackColor}55, ${fallbackColor}14)`,
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.28)'
      }}
      title={logo?.title}
    >
      {logo ? (
        <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" aria-hidden>
          <path d={logo.path} fill={contrast?.fg} />
        </svg>
      ) : (
        <span className="text-[13px] font-semibold tracking-wide">{initials}</span>
      )}
    </div>
  )
}
