import { useRef, useState } from 'react'
import type { DragEvent } from 'react'

interface Props {
  onSubmit: (files: File[]) => void
  disabled: boolean
}

export default function UploadPanel({ onSubmit, disabled }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.pdf'))
    setFiles(prev => [...prev, ...dropped].slice(0, 5))
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...selected].slice(0, 5))
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        className={`relative group border border-dashed rounded-3xl p-16 text-center cursor-pointer transition-all duration-300 bg-white/70 dark:bg-neutral-900/60 backdrop-blur ${
          dragging
            ? 'border-gray-900 dark:border-white bg-gray-50 dark:bg-neutral-800/60 scale-[1.01]'
            : 'border-gray-200 dark:border-neutral-800 hover:border-gray-400 dark:hover:border-neutral-600 hover:bg-white dark:hover:bg-neutral-900'
        }`}
      >
        <div className="flex flex-col items-center gap-5">
          <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-b from-gray-50 to-white dark:from-neutral-800 dark:to-neutral-900 border border-gray-100 dark:border-neutral-800 flex items-center justify-center transition-transform duration-300 ${dragging ? 'scale-110' : 'group-hover:scale-105'}`}>
            <svg className="w-6 h-6 text-gray-700 dark:text-neutral-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16" />
            </svg>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-base font-semibold text-gray-900 dark:text-neutral-100 tracking-tight">
              {dragging ? 'Release to upload' : 'Drop your PDFs here'}
            </p>
            <p className="text-sm text-gray-400 dark:text-neutral-500 font-normal">
              or <span className="text-gray-900 dark:text-neutral-100 font-medium underline decoration-gray-300 dark:decoration-neutral-700 underline-offset-2">browse files</span> · up to 5 · 20 MB each
            </p>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, i) => (
            <li
              key={i}
              className="flex justify-between items-center px-5 py-4 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all animate-slide-up"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-800 border border-gray-100 dark:border-neutral-700 flex items-center justify-center flex-shrink-0">
                  <span className="text-gray-700 dark:text-neutral-300 text-[10px] font-semibold tracking-wider">PDF</span>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm text-gray-900 dark:text-neutral-100 truncate font-medium tracking-tight">{file.name}</span>
                  <span className="text-xs text-gray-400 dark:text-neutral-500">{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeFile(i) }}
                className="text-gray-300 dark:text-neutral-600 hover:text-gray-900 dark:hover:text-neutral-100 ml-3 transition-colors w-7 h-7 rounded-full hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center justify-center"
                aria-label="Remove file"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Submit */}
      <button
        onClick={() => files.length > 0 && onSubmit(files)}
        disabled={disabled || files.length === 0}
        className="group w-full py-4 rounded-2xl bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-neutral-200 text-white dark:text-gray-900 font-medium text-sm tracking-tight transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-gray-900 dark:disabled:hover:bg-white hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2"
      >
        <span>Analyze Contradictions</span>
        {files.length > 0 && <span className="opacity-60 font-normal">· {files.length} file{files.length !== 1 ? 's' : ''}</span>}
        <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
        </svg>
      </button>
    </div>
  )
}
