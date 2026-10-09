import logo from '../icon.png'
import { cn } from '../lib/cn'

export function Logo({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <img
      src={logo}
      alt="Lumina"
      width={size}
      height={size}
      className={cn('rounded-[22%] object-cover', className)}
      draggable={false}
    />
  )
}
