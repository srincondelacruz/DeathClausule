import type { ChatMessage as ChatMessageType } from '../../types/api'

interface Props { message: ChatMessageType }

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-xl bg-gray-900 dark:bg-white flex items-center justify-center flex-shrink-0 mt-0.5 mr-3 shadow-sm">
          <span className="text-white dark:text-gray-900 text-[10px] font-semibold tracking-tight">DC</span>
        </div>
      )}
      <div className={`max-w-[78%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
        isUser
          ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-br-md shadow-sm'
          : 'bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 text-gray-900 dark:text-neutral-100 rounded-bl-md'
      }`}>
        <p className="whitespace-pre-line">{message.content}</p>
      </div>
    </div>
  )
}
