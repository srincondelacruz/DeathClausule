import { useEffect, useRef, useState } from 'react'

export default function InteractiveBackground() {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 50, y: 30 })

  useEffect(() => {
    const node = ref.current
    if (!node) return

    let raf = 0
    const onMove = (e: MouseEvent) => {
      const rect = node.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => setPos({ x, y }))
    }

    window.addEventListener('mousemove', onMove)
    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* Mouse-following spotlight */}
      <div
        className="absolute inset-0 transition-[background] duration-200 ease-out"
        style={{
          background: `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, rgba(99, 102, 241, 0.18), transparent 45%)`,
        }}
      />
      <div
        className="absolute inset-0 transition-[background] duration-300 ease-out"
        style={{
          background: `radial-gradient(900px circle at ${100 - pos.x}% ${100 - pos.y}%, rgba(244, 63, 94, 0.12), transparent 50%)`,
        }}
      />

      {/* Cursor follower dot */}
      <div
        className="absolute w-2 h-2 rounded-full bg-gray-900/40 dark:bg-white/40 blur-[2px] transition-[left,top] duration-300 ease-out"
        style={{ left: `calc(${pos.x}% - 4px)`, top: `calc(${pos.y}% - 4px)` }}
      />

      {/* Soft conic backdrop, also shifted by cursor */}
      <div
        className="absolute inset-0 opacity-40 transition-[transform] duration-500 ease-out"
        style={{
          transform: `translate(${(pos.x - 50) * 0.08}px, ${(pos.y - 50) * 0.08}px)`,
          background: `conic-gradient(from 90deg at 50% 50%, rgba(255,255,255,0) 0deg, rgba(99,102,241,0.06) 90deg, rgba(244,63,94,0.06) 180deg, rgba(245,158,11,0.06) 270deg, rgba(255,255,255,0) 360deg)`,
        }}
      />
    </div>
  )
}
