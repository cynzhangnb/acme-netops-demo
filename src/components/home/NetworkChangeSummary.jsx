import { Settings, Route, Hash, AlertTriangle } from 'lucide-react'
import { networkChanges } from '../../data/metricsData'

const TYPE_CONFIG = {
  config: { icon: Settings, label: 'Config', color: 'text-brand-600', bg: 'bg-brand-50' },
  route: { icon: Route, label: 'Route', color: 'text-status-degraded', bg: 'bg-amber-50' },
  mac: { icon: Hash, label: 'MAC', color: 'text-ink-secondary', bg: 'bg-surface-overlay' },
}

const SEVERITY_DOT = {
  info: 'bg-slate-300',
  warning: 'bg-status-degraded',
  critical: 'bg-status-down',
}

export default function NetworkChangeSummary() {
  return (
    <div className="bg-surface-base rounded-xl border border-surface-border shadow-card">
      <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-primary">Recent Network Changes</h3>
        <span className="text-[10px] text-ink-tertiary bg-surface-overlay px-2 py-0.5 rounded-full">Last 24h</span>
      </div>
      <div className="divide-y divide-surface-border max-h-64 overflow-y-auto scrollbar-thin">
        {networkChanges.map(change => {
          const { icon: Icon, label, color, bg } = TYPE_CONFIG[change.type]
          return (
            <div key={change.id} className="flex items-start gap-3 px-4 py-2.5 hover:bg-surface-raised transition-colors">
              <div className={`mt-0.5 w-6 h-6 rounded-md ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon size={12} className={color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-ink-primary truncate">{change.device}</span>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEVERITY_DOT[change.severity]}`} />
                </div>
                <p className="text-[11px] text-ink-secondary mt-0.5 truncate">{change.description}</p>
              </div>
              <span className="text-[10px] text-ink-tertiary flex-shrink-0 mt-0.5">{change.time}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
