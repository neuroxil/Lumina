import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes
} from 'react'
import { cn } from '../lib/cn'

type FieldProps = {
  className?: string
} & (
  | ({ as?: 'input' } & InputHTMLAttributes<HTMLInputElement>)
  | ({ as: 'textarea' } & TextareaHTMLAttributes<HTMLTextAreaElement>)
  | ({ as: 'select' } & SelectHTMLAttributes<HTMLSelectElement>)
)

export function Field({ className, as = 'input', ...props }: FieldProps) {
  const wrap = cn('glass-field', className)
  if (as === 'textarea') {
    return (
      <label className={wrap}>
        <textarea className="field" {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      </label>
    )
  }
  if (as === 'select') {
    return (
      <label className={wrap}>
        <select className="field" {...(props as SelectHTMLAttributes<HTMLSelectElement>)} />
      </label>
    )
  }
  return (
    <label className={wrap}>
      <input className="field" {...(props as InputHTMLAttributes<HTMLInputElement>)} />
    </label>
  )
}

export function GlassButton({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('glass-btn', className)} {...props} />
}
