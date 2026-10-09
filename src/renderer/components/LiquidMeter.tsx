export function LiquidMeter({ remaining, period }: { remaining: number; period: number }) {
  const t = Math.max(0, Math.min(1, remaining / period))
  const urgent = remaining <= 5
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-2 h-9 overflow-hidden rounded-2xl">
      <svg viewBox="0 0 120 40" className="h-full w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id="liq" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={urgent ? '#FFB4E0' : '#7CFFF2'} stopOpacity="0.0" />
            <stop offset="45%" stopColor={urgent ? '#FFB4E0' : '#7CFFF2'} stopOpacity="0.55" />
            <stop offset="100%" stopColor={urgent ? '#C9A8FF' : '#C9A8FF'} stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <g transform={`translate(0 ${((1 - t) * 28).toFixed(2)})`}>
          <path
            fill="url(#liq)"
            d="M0,14 C18,6 40,22 60,14 C80,6 102,20 120,12 L120,40 L0,40 Z"
          >
            <animate
              attributeName="d"
              dur="3.4s"
              repeatCount="indefinite"
              values="
                M0,14 C18,6 40,22 60,14 C80,6 102,20 120,12 L120,40 L0,40 Z;
                M0,12 C22,20 38,6 62,16 C84,24 100,8 120,14 L120,40 L0,40 Z;
                M0,14 C18,6 40,22 60,14 C80,6 102,20 120,12 L120,40 L0,40 Z
              "
            />
          </path>
        </g>
      </svg>
    </div>
  )
}
