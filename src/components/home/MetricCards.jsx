import { Server, AlertTriangle, Activity, GitMerge } from 'lucide-react'
import { metricsData } from '../../data/metricsData'

function MetricCard({ icon: Icon, label, value, sub, color, bg }) {
  return (
    <div className="bg-surface-base rounded-xl border border-surface-border shadow-card p-4 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={17} className={color} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-ink-primary leading-none">{value}</p>
        <p className="text-xs text-ink-secondary mt-1">{label}</p>
        {sub && <p className="text-[10px] text-ink-tertiary mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function MetricCards() {
  return (
    <div className="grid grid-cols-4 gap-4">
      <MetricCard
        icon={Server}
        label="Total Devices"
        value={metricsData.totalDevices}
        sub={`${metricsData.devicesDown} down · ${metricsData.devicesDegraded} degraded`}
        color="text-brand-600"
        bg="bg-brand-50"
      />
      <MetricCard
        icon={Activity}
        label="Uptime"
        value={`${metricsData.uptimePercent}%`}
        sub="Last 30 days"
        color="text-status-up"
        bg="bg-green-50"
      />
      <MetricCard
        icon={AlertTriangle}
        label="Open Alerts"
        value={metricsData.openAlerts}
        sub={`${metricsData.criticalAlerts} critical`}
        color="text-status-degraded"
        bg="bg-amber-50"
      />
      <MetricCard
        icon={GitMerge}
        label="Changes (24h)"
        value={metricsData.configChanges24h + metricsData.routeChanges24h}
        sub={`${metricsData.configChanges24h} config · ${metricsData.routeChanges24h} routes`}
        color="text-ink-secondary"
        bg="bg-surface-overlay"
      />
    </div>
  )
}
