import { useEffect, useRef } from 'react'
import type { ChatMessage as ChatMessageType } from '../../types/api'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface Props {
  messages: ChatMessageType[]
  loading: boolean
  onSend: (message: string) => void
}

export default function ChatPanel({ messages, loading, onSend }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 min-h-64 max-h-96 overflow-y-auto p-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">
            Ask anything about the contracts. You can also request clause recommendations.
          </p>
        )}
        {messages.map((msg, i) => (
          <ChatMessage key={i} message={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 text-sm text-gray-400">
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <ChatInput onSend={onSend} disabled={loading} />
    </div>
  )
}
