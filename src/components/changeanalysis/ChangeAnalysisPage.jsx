import { useState, useMemo, useRef, useEffect } from 'react'

// ── Data ────────────────────────────────────────────────────────────────────

const ALL_CHANGES = [
  // ER-BOS-07 — edge-router
  { id: 1,  device: 'ER-BOS-07', deviceType: 'edge-router',        category: 'Configuration',  type: 'QoS Policy',    timestamp: '2026-04-06 08:41', description: 'QoS policy WAN-QOS updated; voice class CIR reduced from 4096000 to 2048000', before: `policy-map WAN-QOS\n class VOICE\n  police rate 4096000 bps\n   conform-action transmit\n   exceed-action drop\n class class-default\n  fair-queue`, after: `policy-map WAN-QOS\n class VOICE\n  police rate 2048000 bps\n   conform-action transmit\n   exceed-action drop\n class class-default\n  fair-queue`, changedLines: { before: [3], after: [3] } },
  { id: 2,  device: 'ER-BOS-07', deviceType: 'edge-router',        category: 'Route Table',    type: 'BGP Route',     timestamp: '2026-04-05 14:12', description: 'BGP route 203.0.113.0/24 withdrawn from routing table', before: `B    203.0.113.0/24 [20/0] via 198.51.100.1, 2d03h`, after: `(route removed)`, changedLines: { before: [1], after: [1] } },
  { id: 3,  device: 'ER-BOS-07', deviceType: 'edge-router',        category: 'ARP Table',      type: 'ARP Entry',     timestamp: '2026-04-06 07:55', description: 'ARP entry for 198.51.100.1 aged out and refreshed with new MAC', before: `198.51.100.1  aa:bb:cc:11:22:33  Gi0/0  Dynamic`, after: `198.51.100.1  aa:bb:cc:44:55:66  Gi0/0  Dynamic`, changedLines: { before: [1], after: [1] } },

  // CR-BOS-01 — core-router
  { id: 4,  device: 'CR-BOS-01', deviceType: 'core-router',        category: 'Configuration',  type: 'NTP',           timestamp: '2026-03-31 09:14', description: 'NTP server list updated; added 10.20.1.2 as secondary peer', before: `ntp server 10.20.1.1 prefer`, after: `ntp server 10.20.1.1 prefer\nntp server 10.20.1.2`, changedLines: { before: [], after: [2] } },
  { id: 5,  device: 'CR-BOS-01', deviceType: 'core-router',        category: 'Route Table',    type: 'OSPF Route',    timestamp: '2026-04-06 02:30', description: 'OSPF route 10.4.0.0/16 metric changed from 20 to 30 due to link cost update', before: `O    10.4.0.0/16 [110/20] via 10.1.0.2, Gi0/1`, after: `O    10.4.0.0/16 [110/30] via 10.1.0.2, Gi0/1`, changedLines: { before: [1], after: [1] } },
  { id: 6,  device: 'CR-BOS-01', deviceType: 'core-router',        category: 'ARP Table',      type: 'ARP Entry',     timestamp: '2026-04-06 01:05', description: 'New ARP entry learned for 10.1.0.5 on Gi0/2', before: `(no entry)`, after: `10.1.0.5  de:ad:be:ef:00:01  Gi0/2  Dynamic`, changedLines: { before: [], after: [1] } },

  // CR-BOS-02 — core-router
  { id: 7,  device: 'CR-BOS-02', deviceType: 'core-router',        category: 'Configuration',  type: 'BGP Policy',    timestamp: '2026-04-05 23:47', description: 'BGP route-policy updated; voice traffic local-preference lowered from 150 → 100', before: `route-policy VOICE-IN\n set local-preference 150\n set community 65001:100\n pass\nend-policy`, after: `route-policy VOICE-IN-V2\n set local-preference 100\n set community 65001:200\n pass\nend-policy`, changedLines: { before: [1, 2], after: [1, 2] } },
  { id: 8,  device: 'CR-BOS-02', deviceType: 'core-router',        category: 'Configuration',  type: 'Static Route',  timestamp: '2026-04-05 23:52', description: 'Static route for 10.8.3.0/24 next-hop changed to 10.0.2.1', before: `ip route 10.8.3.0/24 10.0.1.1\nip route 10.8.3.0/24 10.0.1.2 backup`, after: `ip route 10.8.3.0/24 10.0.2.1\nip route 10.8.3.0/24 10.0.2.2 backup`, changedLines: { before: [1, 2], after: [1, 2] } },
  { id: 9,  device: 'CR-BOS-02', deviceType: 'core-router',        category: 'Route Table',    type: 'Static Route',  timestamp: '2026-04-06 00:01', description: 'Static route 10.8.3.0/24 installed via new next-hop 10.0.2.1', before: `S    10.8.3.0/24 [1/0] via 10.0.1.1`, after: `S    10.8.3.0/24 [1/0] via 10.0.2.1`, changedLines: { before: [1], after: [1] } },

  // DS-BOS-01 — dist-switch
  { id: 10, device: 'DS-BOS-01', deviceType: 'dist-switch',        category: 'Configuration',  type: 'ACL',           timestamp: '2026-04-06 01:14', description: 'ACL MGMT-ACCESS modified; new permit entry added for 10.20.5.0/24', before: `ip access-list extended MGMT-ACCESS\n 10 permit ip 10.20.1.0 0.0.0.255 any\n 20 permit ip 10.20.2.0 0.0.0.255 any\n 30 deny   ip any any log`, after: `ip access-list extended MGMT-ACCESS\n 10 permit ip 10.20.1.0 0.0.0.255 any\n 20 permit ip 10.20.2.0 0.0.0.255 any\n 25 permit ip 10.20.5.0 0.0.0.255 any\n 30 deny   ip any any log`, changedLines: { before: [4], after: [4, 5] } },
  { id: 11, device: 'DS-BOS-01', deviceType: 'dist-switch',        category: 'MAC Table',      type: 'MAC Entry',     timestamp: '2026-04-06 04:22', description: '14 MAC entries aged out on VLAN 10 during scheduled maintenance window', before: `VLAN 10: 14 active entries`, after: `VLAN 10: 0 active entries (flushed)`, changedLines: { before: [1], after: [1] } },
  { id: 12, device: 'DS-BOS-01', deviceType: 'dist-switch',        category: 'STP Table',      type: 'STP Topology',  timestamp: '2026-04-06 03:50', description: 'STP topology change detected on VLAN 10; port Gi1/0/5 transitioned to Forwarding', before: `Gi1/0/5  VLAN10  Blocking   128.5  P2p`, after: `Gi1/0/5  VLAN10  Forwarding 128.5  P2p`, changedLines: { before: [1], after: [1] } },

  // DS-BOS-03 — dist-switch
  { id: 13, device: 'DS-BOS-03', deviceType: 'dist-switch',        category: 'Configuration',  type: 'Logging',       timestamp: '2026-04-03 11:05', description: 'Logging buffer size increased from 64000 to 128000', before: `logging buffered 64000 warnings`, after: `logging buffered 128000 warnings`, changedLines: { before: [1], after: [1] } },
  { id: 14, device: 'DS-BOS-03', deviceType: 'dist-switch',        category: 'Configuration',  type: 'OSPF',          timestamp: '2026-04-06 03:28', description: 'OSPF hello interval changed from 10s → 5s on Ethernet0/1', before: `interface Ethernet0/1\n ip ospf hello-interval 10\n ip ospf dead-interval 40`, after: `interface Ethernet0/1\n ip ospf hello-interval 5\n ip ospf dead-interval 20`, changedLines: { before: [2, 3], after: [2, 3] } },
  { id: 15, device: 'DS-BOS-03', deviceType: 'dist-switch',        category: 'NDP Table',      type: 'NDP Entry',     timestamp: '2026-04-06 06:10', description: 'IPv6 NDP entry for fe80::1 refreshed on Gi1/0/1', before: `fe80::1  aa:bb:cc:dd:ee:ff  Gi1/0/1  STALE`, after: `fe80::1  aa:bb:cc:dd:ee:ff  Gi1/0/1  REACHABLE`, changedLines: { before: [1], after: [1] } },

  // AS-BOS-01 — access-switch
  { id: 16, device: 'AS-BOS-01', deviceType: 'access-switch',      category: 'Configuration',  type: 'VLAN',          timestamp: '2026-04-01 14:22', description: 'Interface Ethernet0/4 moved from VLAN 210 to VLAN 220', before: `interface Ethernet0/4\n switchport access vlan 210`, after: `interface Ethernet0/4\n switchport access vlan 220`, changedLines: { before: [2], after: [2] } },
  { id: 17, device: 'AS-BOS-01', deviceType: 'access-switch',      category: 'MAC Table',      type: 'MAC Entry',     timestamp: '2026-04-06 05:44', description: 'New MAC address 00:11:22:33:44:55 learned on port Gi0/3 (VLAN 220)', before: `(no entry for 00:11:22:33:44:55)`, after: `00:11:22:33:44:55  VLAN220  Gi0/3  Dynamic`, changedLines: { before: [], after: [1] } },
  { id: 18, device: 'AS-BOS-01', deviceType: 'access-switch',      category: 'STP Table',      type: 'STP Port',      timestamp: '2026-04-06 05:50', description: 'STP port Gi0/3 moved to Forwarding state after MAC learning on VLAN 220', before: `Gi0/3  VLAN220  Learning   128.3  P2p`, after: `Gi0/3  VLAN220  Forwarding 128.3  P2p`, changedLines: { before: [1], after: [1] } },
]

const DEVICE_TYPE_LABELS = {
  'edge-router':   'Edge Router',
  'core-router':   'Core Router',
  'dist-switch':   'Distribution Switch',
  'access-switch': 'Access Switch',
}

const CATEGORY_OPTIONS = [
  'Configuration',
  'Route Table',
  'MAC Table',
  'ARP Table',
  'NDP Table',
  'STP Table',
]

const TIME_RANGES = [
  { label: 'Last 1 hour',    value: '1h'  },
  { label: 'Last 24 hours',  value: '24h' },
  { label: 'Last 7 days',    value: '7d'  },
  { label: 'Last 30 days',   value: '30d' },
]

function tsToMs(ts) {
  return new Date(ts.replace(' ', 'T') + ':00Z').getTime()
}
const NOW_MS = new Date('2026-04-06T09:00:00Z').getTime()

function filterByTime(changes, range) {
  const cutoffs = { '1h': 60*60*1000, '24h': 24*60*60*1000, '7d': 7*24*60*60*1000, '30d': 30*24*60*60*1000 }
  const cutoff = NOW_MS - cutoffs[range]
  return changes.filter(c => tsToMs(c.timestamp) >= cutoff)
}

// ── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <circle cx="5.5" cy="5.5" r="3.8" stroke="#aaa" strokeWidth="1.3"/>
      <line x1="8.5" y1="8.5" x2="11.5" y2="11.5" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function SortIcon({ active, dir }) {
  return (
    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: active ? 1 : 0.3 }}>
      <path d="M5 1.5L5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      {dir === 'asc' || !active
        ? <path d="M2.5 4L5 1.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        : <path d="M2.5 6L5 8.5L7.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      }
    </svg>
  )
}
function CloseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

// ── Dropdown ─────────────────────────────────────────────────────────────────

function Checkbox({ checked }) {
  return (
    <div style={{
      width: 13, height: 13, borderRadius: 3, border: '1.5px solid',
      borderColor: checked ? '#3b82f6' : '#ccc',
      background: checked ? '#3b82f6' : '#fff',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      {checked && (
        <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
          <path d="M1 3L3 5L7 1" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </div>
  )
}

function DropdownItem({ label, checked, onMouseDown, bold }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        padding: '6px 10px', borderRadius: 5, cursor: 'pointer',
        fontSize: 12, color: '#333', background: 'transparent',
        display: 'flex', alignItems: 'center', gap: 8,
        fontWeight: bold ? 500 : 400,
      }}
      onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <Checkbox checked={checked} />
      {label}
    </div>
  )
}

function Dropdown({ label, value, options, onChange, multi = false, selected = [] }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const allVals = options.map(o => typeof o === 'string' ? o : o.value)

  useEffect(() => {
    function onOutside(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  const displayLabel = multi
    ? selected.length === 0 ? label : selected.length === 1
      ? (typeof options.find(o => (typeof o === 'string' ? o : o.value) === selected[0]) === 'string'
          ? selected[0]
          : options.find(o => o.value === selected[0])?.label ?? selected[0])
      : `${selected.length} selected`
    : value || label

  const allChecked = selected.length === 0

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '5px 10px', border: '1px solid #ddd',
          borderRadius: 6, background: '#fff',
          fontSize: 11.5, color: '#444',
          cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: 400,
        }}
      >
        {displayLabel}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 50,
          background: '#fff', border: '1px solid #e4e4e4', borderRadius: 8,
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)', minWidth: 180, padding: 4,
        }}>
          {multi ? (
            <>
              {/* "All" special item */}
              <DropdownItem
                label={label}
                checked={allChecked}
                bold
                onMouseDown={e => { e.preventDefault(); onChange([]) }}
              />
              {/* Divider */}
              <div style={{ height: 1, background: '#eeeeee', margin: '4px 6px' }} />
              {/* Individual options */}
              {options.map(opt => {
                const optVal = typeof opt === 'string' ? opt : opt.value
                const optLabel = typeof opt === 'string' ? opt : opt.label
                const isSelected = selected.includes(optVal)
                return (
                  <DropdownItem
                    key={optVal}
                    label={optLabel}
                    checked={isSelected}
                    onMouseDown={e => {
                      e.preventDefault()
                      onChange(isSelected ? selected.filter(s => s !== optVal) : [...selected, optVal])
                    }}
                  />
                )
              })}
            </>
          ) : (
            options.map(opt => {
              const optVal = typeof opt === 'string' ? opt : opt.value
              const optLabel = typeof opt === 'string' ? opt : opt.label
              const isSelected = value === optVal
              return (
                <div
                  key={optVal}
                  onMouseDown={e => { e.preventDefault(); onChange(optVal); setOpen(false) }}
                  style={{
                    padding: '6px 10px', borderRadius: 5, cursor: 'pointer',
                    fontSize: 12, color: '#333', background: 'transparent',
                    display: 'flex', alignItems: 'center', gap: 8,
                    fontWeight: isSelected ? 500 : 400,
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {optLabel}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

// ── Diff Panel ───────────────────────────────────────────────────────────────

function DiffPanel({ change, onClose }) {
  const beforeLines = change.before.split('\n')
  const afterLines  = change.after.split('\n')
  const maxLen = Math.max(beforeLines.length, afterLines.length)
  const isChanged = (i, side) => (side === 'before' ? change.changedLines.before : change.changedLines.after).includes(i + 1)
  const added    = change.changedLines.after.length
  const removed  = change.changedLines.before.length
  const unchanged = beforeLines.length - removed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fffdf9' }}>
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1efea', display: 'flex', alignItems: 'center', gap: 14, background: '#fcfbf9', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{change.device} — {change.type}</span>
        <span style={{ fontSize: 11, color: '#888' }}>{change.timestamp}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#666' }}>Unchanged <strong style={{ color: '#333' }}>{unchanged}</strong></span>
          <span style={{ fontSize: 11, color: '#1a7a3f' }}>Added <strong>{added}</strong></span>
          <span style={{ fontSize: 11, color: '#c0392b' }}>Removed <strong>{removed}</strong></span>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 4, padding: 0, marginLeft: 4 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#ececec'; e.currentTarget.style.color = '#555' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa' }}
          >
            <CloseIcon />
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Before */}
        <div style={{ flex: 1, borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '5px 12px', background: '#fdf2f2', borderBottom: '1px solid #f0e0e0', fontSize: 11, fontWeight: 600, color: '#c0392b', flexShrink: 0 }}>Before</div>
          <div style={{ flex: 1, overflow: 'auto', fontFamily: 'Menlo, monospace', fontSize: 11, lineHeight: 1.7 }}>
            {Array.from({ length: maxLen }, (_, i) => {
              const text = beforeLines[i] ?? ''
              const changed = isChanged(i, 'before')
              return (
                <div key={i} style={{ display: 'flex', background: changed ? '#fde8e8' : 'transparent' }}>
                  <span style={{ width: 28, paddingLeft: 8, color: '#ccc', flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>
                  <span style={{ padding: '0 10px', color: changed ? '#c0392b' : '#333', whiteSpace: 'pre' }}>{changed && text ? '- ' : '  '}{text}</span>
                </div>
              )
            })}
          </div>
        </div>
        {/* After */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '5px 12px', background: '#f0fdf4', borderBottom: '1px solid #d0f0de', fontSize: 11, fontWeight: 600, color: '#1a7a3f', flexShrink: 0 }}>After</div>
          <div style={{ flex: 1, overflow: 'auto', fontFamily: 'Menlo, monospace', fontSize: 11, lineHeight: 1.7 }}>
            {Array.from({ length: maxLen }, (_, i) => {
              const text = afterLines[i] ?? ''
              const changed = isChanged(i, 'after')
              return (
                <div key={i} style={{ display: 'flex', background: changed ? '#e6f9ee' : 'transparent' }}>
                  <span style={{ width: 28, paddingLeft: 8, color: '#ccc', flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>
                  <span style={{ padding: '0 10px', color: changed ? '#1a7a3f' : '#333', whiteSpace: 'pre' }}>{changed && text ? '+ ' : '  '}{text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────

// Columns: Device Name | Device Type | Change Category | Timestamp
const COLS = 'repeat(4, 1fr)'

export default function ChangeAnalysisPage() {
  const [timeRange,     setTimeRange]     = useState('24h')
  const [deviceTypes,   setDeviceTypes]   = useState([])
  const [categories,    setCategories]    = useState([])
  const [search,        setSearch]        = useState('')
  const [sortKey,       setSortKey]       = useState('timestamp')
  const [sortDir,       setSortDir]       = useState('desc')
  const [selected,      setSelected]      = useState(null)
  const [diffH,         setDiffH]         = useState(null)
  const containerRef  = useRef(null)
  const isResizing    = useRef(false)
  const startData     = useRef({})

  // Set default diffH
  useEffect(() => {
    if (containerRef.current && diffH === null) {
      setDiffH(Math.round(containerRef.current.offsetHeight * 0.42))
    }
  }, [diffH])

  // Resize drag
  useEffect(() => {
    function onMouseMove(e) {
      if (!isResizing.current) return
      const { startY, startH } = startData.current
      const dy = startY - e.clientY
      const totalH = containerRef.current?.closest('[data-resizable]')?.offsetHeight
        || (containerRef.current?.offsetHeight + (startData.current.diffH || 0)) || 600
      setDiffH(Math.max(120, Math.min(totalH - 120, startH + dy)))
    }
    function onMouseUp() {
      if (isResizing.current) {
        isResizing.current = false
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [])

  function startResize(e) {
    isResizing.current = true
    startData.current = { startY: e.clientY, startH: diffH }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'row-resize'
    e.preventDefault()
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir(key === 'timestamp' ? 'desc' : 'asc') }
  }

  // Filter + search
  const filtered = useMemo(() => {
    let result = filterByTime(ALL_CHANGES, timeRange)
    if (deviceTypes.length > 0) result = result.filter(c => deviceTypes.includes(c.deviceType))
    if (categories.length  > 0) result = result.filter(c => categories.includes(c.category))
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(c =>
        c.device.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      )
    }
    return result
  }, [timeRange, deviceTypes, categories, search])

  // Sort (flat list, chronological by default)
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? '', vb = b[sortKey] ?? ''
      return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
    })
  }, [filtered, sortKey, sortDir])

  const timeLabel = TIME_RANGES.find(t => t.value === timeRange)?.label || ''

  return (
    <div data-resizable="true" style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #eeeeee', flexShrink: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 650, color: '#111', marginBottom: 12, letterSpacing: '-0.01em' }}>
          Change Analysis
        </div>

        {/* Filter bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Summary — left */}
          <div style={{ fontSize: 11.5, color: '#111', whiteSpace: 'nowrap' }}>
            Total Changed Devices: <strong>119</strong> out of 2243 Devices
          </div>

          <div style={{ flex: 1 }} />

          {/* Time range */}
          <Dropdown
            label="Last 24 hours"
            value={timeLabel}
            options={TIME_RANGES}
            onChange={setTimeRange}
          />

          {/* Device type */}
          <Dropdown
            label="All device types"
            multi={true}
            selected={deviceTypes}
            options={Object.entries(DEVICE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
            onChange={setDeviceTypes}
          />

          {/* Category */}
          <Dropdown
            label="All change categories"
            multi={true}
            selected={categories}
            options={CATEGORY_OPTIONS}
            onChange={setCategories}
          />

          {/* Search — far right */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            border: '1px solid #ddd', borderRadius: 6, padding: '5px 10px',
            background: '#fff', width: 200,
          }}>
            <SearchIcon />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                border: 'none', outline: 'none', fontSize: 11.5, color: '#333',
                background: 'transparent', flex: 1, minWidth: 0,
              }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 0 }}>
                <CloseIcon />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }} ref={containerRef}>
        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: COLS,
          padding: '6px 24px', borderBottom: '1px solid #eeeeee',
          background: '#fafafa', flexShrink: 0,
        }}>
          {[
            { key: 'device',     label: 'DEVICE NAME'     },
            { key: 'deviceType', label: 'DEVICE TYPE'     },
            { key: 'category',   label: 'CHANGE CATEGORY' },
            { key: 'timestamp',  label: 'TIMESTAMP'       },
          ].map(col => (
            <div
              key={col.key}
              onClick={() => handleSort(col.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none' }}
            >
              <span style={{ fontSize: 11, fontWeight: 600, color: sortKey === col.key ? '#111' : '#555', letterSpacing: '0.04em' }}>{col.label}</span>
              <SortIcon active={sortKey === col.key} dir={sortDir} />
            </div>
          ))}
        </div>

        {/* Flat chronological rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {sorted.length === 0 ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: '#bbb', fontSize: 13 }}>
              No change events match the current filters
            </div>
          ) : sorted.map(change => {
            const isActive = selected?.id === change.id
            return (
              <div
                key={change.id}
                onClick={() => setSelected(isActive ? null : change)}
                style={{
                  display: 'grid', gridTemplateColumns: COLS,
                  alignItems: 'center', padding: '8px 24px',
                  borderBottom: '1px solid #f4f4f4', cursor: 'pointer',
                  background: isActive ? '#eff6ff' : 'transparent',
                  boxShadow: isActive ? 'inset 3px 0 0 #3b82f6' : 'none',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontSize: 12, fontWeight: 500, color: '#111' }}>{change.device}</div>
                <div style={{ fontSize: 12, color: '#111' }}>{DEVICE_TYPE_LABELS[change.deviceType]}</div>
                <div style={{ fontSize: 12, color: '#111' }}>{change.category}</div>
                <div style={{ fontSize: 12, color: '#111' }}>{change.timestamp}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Diff pane ── */}
      {selected && diffH !== null && (
        <>
          <div
            onMouseDown={startResize}
            style={{ height: 4, flexShrink: 0, cursor: 'row-resize', background: 'transparent', position: 'relative', zIndex: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ position: 'absolute', left: 0, right: 0, top: 1, height: 1, background: '#e4e4e4' }} />
          </div>
          <div style={{ height: diffH, flexShrink: 0, overflow: 'hidden' }}>
            <DiffPanel change={selected} onClose={() => setSelected(null)} />
          </div>
        </>
      )}
    </div>
  )
}
