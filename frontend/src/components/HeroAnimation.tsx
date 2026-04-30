export default function HeroAnimation() {
  const orbits = [
    { r: 60, dur: '14s', label: 'Clause' },
    { r: 110, dur: '22s', label: 'Embedding' },
    { r: 160, dur: '32s', label: 'Conflict' },
  ]

  return (
    <div className="relative w-full max-w-md h-64 mx-auto select-none" aria-hidden>
      {/* Center node */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
        <div className="relative w-14 h-14 rounded-2xl bg-gray-900 dark:bg-white flex items-center justify-center shadow-lg">
          <span className="text-white dark:text-gray-900 text-[10px] font-semibold tracking-widest">PDF</span>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 pulse-dot" />
        </div>
      </div>

      {/* Orbits */}
      {orbits.map((o, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 rounded-full border border-dashed border-gray-200 dark:border-neutral-800"
          style={{
            width: o.r * 2,
            height: o.r * 2,
            marginLeft: -o.r,
            marginTop: -o.r,
          }}
        >
          <div
            className="relative w-full h-full"
            style={{
              animation: `orbit ${o.dur} linear infinite`,
              animationDelay: `${-i * 2}s`,
            }}
          >
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: `orbit-counter ${o.dur} linear infinite`, animationDelay: `${-i * 2}s` }}
            >
              <div className="flex items-center gap-2 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-sm rounded-full px-3 py-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    i === 0 ? 'bg-gray-900 dark:bg-white' : i === 1 ? 'bg-indigo-500' : 'bg-rose-500'
                  }`}
                />
                <span className="text-[10px] font-medium text-gray-700 dark:text-neutral-300 tracking-tight">{o.label}</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Connection scan line */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, rgba(99,102,241,0.18) 30deg, transparent 60deg)',
            animation: 'spin 6s linear infinite',
            mask: 'radial-gradient(circle, transparent 55%, black 56%, black 95%, transparent 96%)',
            WebkitMask: 'radial-gradient(circle, transparent 55%, black 56%, black 95%, transparent 96%)',
          }}
        />
      </div>
    </div>
  )
}
