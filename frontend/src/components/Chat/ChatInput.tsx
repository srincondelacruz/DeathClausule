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
    <div className="flex gap-2 items-end border rounded-lg p-2">
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={2}
        placeholder="Ask about the contracts... (Enter to send, Shift+Enter for new line)"
        className="flex-1 resize-none text-sm outline-none bg-transparent"
      />
      <button
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
      >
        Send
      </button>
    </div>
  )
}
