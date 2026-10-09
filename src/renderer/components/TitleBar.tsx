import { Logo } from './Logo'

export function TitleBar({ title = 'Lumina', logo = false }: { title?: string; logo?: boolean }) {
  return (
    <div className="drag-region relative z-30 flex h-11 items-center justify-between px-3">
      <div className="flex items-center gap-2 pl-1">
        {logo ? (
          <Logo size={18} className="rounded-md shadow-none" />
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-white/45" />
        )}
        <span className="text-[12px] font-medium tracking-[0.22em] uppercase text-[var(--glass-dim)]">
          {title}
        </span>
      </div>
      <div className="no-drag flex items-center gap-2 pr-1">
        <button
          className="h-3.5 w-3.5 rounded-full bg-white/25 hover:bg-white/50"
          onClick={() => window.lumina.minimize()}
          aria-label="Minimize"
        />
        <button
          className="h-3.5 w-3.5 rounded-full bg-white/25 hover:bg-white/50"
          onClick={() => window.lumina.maximize()}
          aria-label="Maximize"
        />
        <button
          className="h-3.5 w-3.5 rounded-full bg-white/25 hover:bg-white/70"
          onClick={() => window.lumina.close()}
          aria-label="Close"
        />
      </div>
    </div>
  )
}
