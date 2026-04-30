import type { ChatMessage as ChatMessageType } from '../../types/api'

interface Props { message: ChatMessageType }

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-lg px-4 py-3 text-sm ${
        isUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'
      }`}>
        <p className="whitespace-pre-line">{message.content}</p>
      </div>
    </div>
  )
}
