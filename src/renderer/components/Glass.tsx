import type { HTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export function Glass({
  className,
  strong,
  sheen,
  ...props
}: HTMLAttributes<HTMLDivElement> & { strong?: boolean; sheen?: boolean }) {
  return (
    <div
      className={cn('glass rounded-[28px]', strong && 'glass-strong', sheen && 'sheen', className)}
      {...props}
    />
  )
}
