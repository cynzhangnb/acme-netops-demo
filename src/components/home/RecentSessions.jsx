import { MessageSquare, ArrowRight, Clock } from 'lucide-react'

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

export default function RecentSessions({ sessions, onOpenSession }) {
  if (sessions.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-ink-primary">Recent Sessions</h3>
        <button className="text-xs text-brand-600 hover:text-brand-700 transition-colors">View all</button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {sessions.slice(0, 3).map(session => (
          <button
            key={session.id}
            onClick={() => onOpenSession(session.id)}
            className="group text-left bg-surface-base border border-surface-border rounded-xl p-4 shadow-card hover:shadow-panel hover:border-brand-200 transition-all duration-200"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
                <MessageSquare size={15} className="text-brand-600" />
              </div>
              <ArrowRight size={13} className="text-ink-tertiary group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
            </div>
            <p className="text-sm font-medium text-ink-primary leading-snug mb-1">{session.name}</p>
            <p className="text-[11px] text-ink-secondary line-clamp-2 mb-3">{session.preview}</p>
            <div className="flex items-center gap-2 text-[10px] text-ink-tertiary">
              <Clock size={10} />
              <span>{timeAgo(session.lastActivity)}</span>
              <span className="ml-auto">{session.messageCount} msgs</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
