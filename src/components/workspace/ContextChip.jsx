import { X } from 'lucide-react'

export default function ContextChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-brand-50 border border-brand-100 rounded-full text-[11px] text-brand-700 font-medium animate-fade-in">
      {label}
      <button
        onClick={onRemove}
        className="ml-0.5 text-brand-400 hover:text-brand-700 transition-colors"
      >
        <X size={10} />
      </button>
    </span>
  )
}
