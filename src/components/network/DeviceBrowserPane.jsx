import { useState } from 'react'

/* ── Icons ───────────────────────────────────────────────────────────────── */
const IC = { viewBox: '0 0 24 24', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' }

function ChevronDownIcon()  { return <svg width="11" height="11" {...IC} stroke="#999" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg> }
function ChevronRightIcon() { return <svg width="11" height="11" {...IC} stroke="#999" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg> }
function SearchIcon()       { return <svg width="13" height="13" {...IC} stroke="#bbb" strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg> }
function ChevronSmall()     { return <svg width="10" height="10" {...IC} stroke="#aaa" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg> }
function CloseIcon()        { return <svg width="13" height="13" {...IC} stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> }

function FolderIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.85 }}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  )
}

function DeviceIcon({ kind, color }) {
  const p = { width: 13, height: 13, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '1.7', strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (kind === 'router')   return <svg {...p}><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z"/></svg>
  if (kind === 'switch')   return <svg {...p}><path d="M5 12h14"/><path d="M5 8h14"/><path d="M5 16h14"/><circle cx="19" cy="8"  r="1.5" fill={color}/><circle cx="5"  cy="12" r="1.5" fill={color}/><circle cx="19" cy="16" r="1.5" fill={color}/></svg>
  if (kind === 'firewall') return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  if (kind === 'lb')       return <svg {...p}><polyline points="16 3 21 8 16 13"/><line x1="21" y1="8" x2="9" y2="8"/><polyline points="8 21 3 16 8 11"/><line x1="3" y1="16" x2="15" y2="16"/></svg>
  if (kind === 'server')   return <svg {...p}><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
  return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}

/* ── Data ─────────────────────────────────────────────────────────────────── */
const DEVICE_GROUPS = [
  {
    label: 'Router', kind: 'router', color: '#10b981', defaultOpen: true,
    devices: ['Core-Router-01', 'Edge-Router-02', 'Branch-Router-03'],
  },
  {
    label: 'L3 Switch', kind: 'switch', color: '#0ea5e9', defaultOpen: true,
    devices: ['CoreSwitch-01', 'CoreSwitch-02', 'DistSwitch-01'],
  },
  {
    label: 'LAN Switch', kind: 'switch', color: '#3b82f6', defaultOpen: true,
    devices: ['AccessSwitch-Floor1', 'AccessSwitch-Floor2', 'AccessSwitch-Floor3'],
  },
  {
    label: 'Firewall', kind: 'firewall', color: '#f59e0b', defaultOpen: true,
    devices: ['Firewall-Main', 'Firewall-DMZ'],
  },
  {
    label: 'Load Balancer', kind: 'lb', color: '#8b5cf6', defaultOpen: false,
    devices: ['LB-Primary', 'LB-Secondary'],
  },
  {
    label: 'End System', kind: 'server', color: '#6366f1', defaultOpen: false,
    devices: ['WebServer-01', 'AppServer-01', 'DBServer-01'],
  },
  {
    label: 'Unclassified Device', kind: null, color: '#94a3b8', defaultOpen: false,
    devices: ['Unknown-01', 'Unknown-02'],
  },
]

/* ── Component ───────────────────────────────────────────────────────────── */
export default function DeviceBrowserPane({ onClose }) {
  const [openGroups, setOpenGroups] = useState(
    () => Object.fromEntries(DEVICE_GROUPS.map(g => [g.label, g.defaultOpen]))
  )
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('devices')

  const toggle = (label) => setOpenGroups(p => ({ ...p, [label]: !p[label] }))

  const filtered = search.trim()
    ? DEVICE_GROUPS.map(g => ({ ...g, devices: g.devices.filter(d => d.toLowerCase().includes(search.toLowerCase())) })).filter(g => g.devices.length > 0)
    : DEVICE_GROUPS

  return (
    <div style={{
      width: 260, flexShrink: 0,
      borderRight: '1px solid #e8e8e8',
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      {/* Tab header */}
      <div style={{ display: 'flex', borderBottom: '1px solid #ebebeb', flexShrink: 0 }}>
        {['devices', 'nodes'].map(tab => (
          <div
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, height: 40,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: activeTab === tab ? 600 : 400,
              color: activeTab === tab ? '#111' : '#888',
              borderBottom: activeTab === tab ? '2px solid #378ADD' : '2px solid transparent',
              cursor: 'pointer', userSelect: 'none',
              boxSizing: 'border-box',
              transition: 'color 0.1s, border-color 0.1s',
              textTransform: 'capitalize',
            }}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </div>
        ))}
      </div>

      {/* Scope dropdown */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', height: 36,
        borderBottom: '1px solid #f0f0f0',
        fontSize: 12, color: '#333', cursor: 'pointer',
        flexShrink: 0,
      }}>
        <span>Physical Network</span>
        <ChevronSmall />
      </div>

      {/* Search */}
      <div style={{
        margin: '8px 10px',
        display: 'flex', alignItems: 'center', gap: 6,
        border: '1px solid #e8e8e8', borderRadius: 6,
        padding: '5px 9px', background: '#fafafa',
        flexShrink: 0,
      }}>
        <SearchIcon />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search devices..."
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontSize: 12, color: '#333', fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Device tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }} className="scrollbar-thin">
        {filtered.map(group => {
          const isOpen = search.trim() ? true : openGroups[group.label]
          return (
            <div key={group.label}>
              {/* Group row */}
              <div
                onClick={() => toggle(group.label)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', width: 12 }}>
                  {isOpen ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </span>
                <FolderIcon color={group.color} />
                <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: '#222' }}>{group.label}</span>
                <span style={{ fontSize: 11, color: '#aaa' }}>({group.devices.length})</span>
              </div>

              {/* Device rows */}
              {isOpen && group.devices.map(name => (
                <div
                  key={name}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '4px 12px 4px 30px',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <DeviceIcon kind={group.kind} color={group.color} />
                  <span style={{ fontSize: 12, color: '#333' }}>{name}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
