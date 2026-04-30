import { useState } from 'react'
import type { KeyboardEvent } from 'react'

interface Props {
  onSend: (message: string) => void
  disabled: boolean
}

export default function ChatInput({ onSend, disabled }: Props) {
  const [value, setValue] = useState('')

  function handleSend() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSend(trimmed)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex gap-3 items-end bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-3xl p-3 focus-within:border-gray-900 dark:focus-within:border-white focus-within:shadow-md transition-all shadow-sm">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        placeholder="Ask about the contracts…"
        className="flex-1 resize-none text-sm outline-none bg-transparent text-gray-900 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 disabled:opacity-50 px-3 py-2 leading-relaxed"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="group w-10 h-10 rounded-2xl bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-gray-900 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-900 dark:disabled:hover:bg-white hover:shadow-md flex items-center justify-center flex-shrink-0"
        aria-label="Send"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  )
}
