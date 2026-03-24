import { useState } from 'react'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'
import { unusedPorts } from '../../data/deviceData'

const STATUS_BADGE = {
  up: 'bg-green-50 text-green-700 border-green-200',
  down: 'bg-red-50 text-red-700 border-red-200',
  degraded: 'bg-amber-50 text-amber-700 border-amber-200',
}

export default function DeviceTable() {
  const [filter, setFilter] = useState('')
  const [sortKey, setSortKey] = useState('device')
  const [sortDir, setSortDir] = useState('asc')

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const filtered = unusedPorts
    .filter(p => Object.values(p).some(v => String(v).toLowerCase().includes(filter.toLowerCase())))
    .sort((a, b) => {
      const va = a[sortKey] || '', vb = b[sortKey] || ''
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })

  function SortIcon({ col }) {
    if (sortKey !== col) return <ChevronUp size={11} className="opacity-20" />
    return sortDir === 'asc' ? <ChevronUp size={11} className="text-brand-600" /> : <ChevronDown size={11} className="text-brand-600" />
  }

  const cols = [
    { key: 'device', label: 'Device' },
    { key: 'port', label: 'Port' },
    { key: 'speed', label: 'Speed' },
    { key: 'vlan', label: 'VLAN' },
    { key: 'lastActive', label: 'Last Active' },
    { key: 'description', label: 'Description' },
  ]

  return (
    <div className="flex flex-col h-full bg-surface-base">
      <div className="px-4 py-3 border-b border-surface-border flex items-center gap-3">
        <div className="flex-1 relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <input
            value={filter}
            onChange={e => setFilter(e.target.value)}
            placeholder="Filter ports…"
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-overlay border border-surface-border rounded-lg outline-none focus:border-brand-300 transition-colors"
          />
        </div>
        <span className="text-[11px] text-ink-tertiary">{filtered.length} / {unusedPorts.length} ports</span>
      </div>

      <div className="flex-1 overflow-auto scrollbar-thin">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface-raised border-b border-surface-border">
            <tr>
              {cols.map(col => (
                <th
                  key={col.key}
                  onClick={() => toggleSort(col.key)}
                  className="text-left px-3 py-2 text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider cursor-pointer hover:text-ink-primary transition-colors select-none"
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.map(port => (
              <tr key={port.id} className="hover:bg-surface-raised transition-colors">
                <td className="px-3 py-2 font-medium text-ink-primary">{port.device}</td>
                <td className="px-3 py-2 font-mono text-[11px] text-ink-secondary">{port.port}</td>
                <td className="px-3 py-2 text-ink-secondary">{port.speed}</td>
                <td className="px-3 py-2 text-ink-secondary">{port.vlan}</td>
                <td className="px-3 py-2 text-ink-tertiary">{port.lastActive}</td>
                <td className="px-3 py-2 text-ink-tertiary truncate max-w-[120px]">{port.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
