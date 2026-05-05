interface Props {
  size?: number
  className?: string
}

export default function Logo({ size = 28, className = '' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      xmlns="http://www.w3.org/2000/svg"
      className={`text-gray-900 dark:text-white ${className}`}
      aria-label="DeathClausule logo"
    >
      {/* Two clause lines */}
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      {/* Contradiction slash */}
      <line x1="17.5" y1="5" x2="6.5" y2="19" />
    </svg>
  )
}

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-semibold tracking-tight ${className}`}>
      <span className="text-gray-900 dark:text-neutral-100">Death</span>
      <span className="wordmark-shimmer">Clausule</span>
    </span>
  )
}
