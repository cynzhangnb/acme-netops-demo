import { MessageSquare, Trash2, Box } from 'lucide-react'

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const min = Math.floor(diff / 60000)
  const hr = Math.floor(min / 60)
  const day = Math.floor(hr / 24)
  if (day > 0) return `${day}d ago`
  if (hr > 0) return `${hr}h ago`
  if (min > 0) return `${min}m ago`
  return 'just now'
}

export default function SessionItem({ session, isActive, onClick, onDelete }) {
  return (
    <div
      onClick={onClick}
      className={`group relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        isActive
          ? 'bg-brand-100 text-ink-primary'
          : 'hover:bg-surface-overlay text-ink-secondary hover:text-ink-primary'
      }`}
    >
      <MessageSquare size={14} className="mt-0.5 flex-shrink-0 opacity-60" />
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium truncate ${isActive ? 'text-brand-700' : ''}`}>
          {session.name}
        </p>
        <p className="text-[10px] text-ink-tertiary mt-0.5">{timeAgo(session.lastActivity)}</p>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(session.id) }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-ink-tertiary hover:text-status-down transition-opacity"
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}
