import { useRef, useState } from 'react'
import type { DragEvent } from 'react'

interface Props {
  onSubmit: (files: File[]) => void
  disabled: boolean
}

export default function UploadPanel({ onSubmit, disabled }: Props) {
  const [files, setFiles] = useState<File[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault()
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
    <div className="flex flex-col gap-4">
      <div
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed rounded-lg p-10 text-center cursor-pointer"
      >
        <p>Drag & drop PDFs here or click to select</p>
        <p className="text-sm text-gray-500">Max 5 files · 20MB each</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf"
          className="hidden"
          onChange={handleChange}
        />
      </div>

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((file, i) => (
            <li key={i} className="flex justify-between items-center px-3 py-2 rounded border">
              <span className="text-sm truncate">{file.name}</span>
              <button onClick={() => removeFile(i)} className="text-xs text-red-500 ml-2">
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => files.length > 0 && onSubmit(files)}
        disabled={disabled || files.length === 0}
        className="px-4 py-2 rounded font-medium disabled:opacity-50"
      >
        Analyze Contradictions
      </button>
    </div>
  )
}
