import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { bostonTraffic24h } from '../../data/trafficData'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface-base border border-surface-border rounded-xl shadow-modal px-3 py-2.5 text-xs">
      <p className="font-medium text-ink-primary mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-ink-secondary capitalize">{p.name}:</span>
          <span className="font-medium text-ink-primary">{p.value} Mbps</span>
        </div>
      ))}
    </div>
  )
}

export default function TrafficChart() {
  // Show every 3rd label to avoid crowding
  const tickFormatter = (val, idx) => idx % 4 === 0 ? val : ''

  return (
    <div className="w-full h-full flex flex-col p-4 bg-surface-base">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold text-ink-primary">Traffic — Boston DC</p>
          <p className="text-[10px] text-ink-tertiary mt-0.5">Last 24 hours · Mbps</p>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-ink-tertiary">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-full bg-brand-500 inline-block" /><span>Inbound</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-1.5 rounded-full bg-emerald-500 inline-block" /><span>Outbound</span></div>
        </div>
      </div>

      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={bostonTraffic24h} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="inbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outbound" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={tickFormatter}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#94a3b8' }}
              tickFormatter={v => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={900} stroke="#ef4444" strokeDasharray="4 3" strokeWidth={1} label={{ value: 'Threshold', fontSize: 9, fill: '#ef4444', position: 'insideTopRight' }} />
            <Area type="monotone" dataKey="inbound" stroke="#3b82f6" strokeWidth={2} fill="url(#inbound)" dot={false} activeDot={{ r: 4, fill: '#3b82f6' }} />
            <Area type="monotone" dataKey="outbound" stroke="#22c55e" strokeWidth={2} fill="url(#outbound)" dot={false} activeDot={{ r: 4, fill: '#22c55e' }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
