import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function ModalOverlay({ title, onClose, children, width = 'max-w-lg' }) {
  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className={`relative w-full ${width} bg-surface-base rounded-2xl shadow-modal border border-surface-border animate-fade-up overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h3 className="text-sm font-semibold text-ink-primary">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink-primary hover:bg-surface-overlay transition-colors"
          >
            <X size={15} />
          </button>
        </div>
        {/* Body */}
        <div className="px-5 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}
