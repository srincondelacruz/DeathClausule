import ReactMarkdown from 'react-markdown'
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
        {isUser ? (
          <p className="whitespace-pre-line">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none
            prose-p:my-1 prose-p:leading-relaxed
            prose-strong:font-semibold
            prose-ul:my-1 prose-ul:pl-4
            prose-ol:my-1 prose-ol:pl-4
            prose-li:my-0.5
            prose-headings:font-semibold prose-headings:my-2
            text-gray-900 dark:text-neutral-100
            prose-strong:text-gray-900 dark:prose-strong:text-neutral-100
            prose-p:text-gray-900 dark:prose-p:text-neutral-100
            prose-li:text-gray-900 dark:prose-li:text-neutral-100">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
