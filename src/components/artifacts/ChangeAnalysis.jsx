import { useState, useRef, useEffect } from 'react'

const CHANGES = [
  {
    id: 1,
    device: 'CR-BOS-01',
    type: 'NTP',
    description: 'NTP server list updated; added 10.20.1.2 as secondary peer',
    timestamp: '2026-03-31 09:14 UTC',
    before: `ntp server 10.20.1.1 prefer`,
    after: `ntp server 10.20.1.1 prefer
ntp server 10.20.1.2`,
    changedLines: { before: [], after: [2] },
  },
  {
    id: 2,
    device: 'AS-BOS-01',
    type: 'VLAN',
    description: 'Interface Ethernet0/4 moved from VLAN 210 to VLAN 220',
    timestamp: '2026-04-01 14:22 UTC',
    before: `interface Ethernet0/4
 description Voice endpoint segment
 switchport access vlan 210
 auto qos voip cisco-phone
 spanning-tree portfast`,
    after: `interface Ethernet0/4
 description Voice endpoint segment
 switchport access vlan 220
 auto qos voip cisco-phone
 spanning-tree portfast`,
    changedLines: { before: [3], after: [3] },
  },
  {
    id: 3,
    device: 'DS-BOS-03',
    type: 'Logging',
    description: 'Logging buffer size increased from 64000 to 128000',
    timestamp: '2026-04-03 11:05 UTC',
    before: `logging buffered 64000 warnings
snmp-server location Boston DC / Distribution Row C`,
    after: `logging buffered 128000 warnings
snmp-server location Boston DC / Distribution Row C`,
    changedLines: { before: [1], after: [1] },
  },
  {
    id: 5,
    device: 'CR-BOS-02',
    type: 'BGP Policy',
    description: 'BGP route-policy updated; voice traffic local-preference lowered from 150 → 100',
    timestamp: '2026-04-05 23:47 UTC',
    before: `router bgp 65001
 address-family ipv4 unicast
  neighbor 10.0.0.1 route-policy VOICE-IN in
  neighbor 10.0.0.1 route-policy DEFAULT-OUT out
  neighbor 10.0.0.2 route-policy VOICE-IN in
  neighbor 10.0.0.2 route-policy DEFAULT-OUT out
 !
!
route-policy VOICE-IN
 set local-preference 150
 set community 65001:100
 pass
end-policy`,
    after: `router bgp 65001
 address-family ipv4 unicast
  neighbor 10.0.0.1 route-policy VOICE-IN-V2 in
  neighbor 10.0.0.1 route-policy DEFAULT-OUT out
  neighbor 10.0.0.2 route-policy VOICE-IN-V2 in
  neighbor 10.0.0.2 route-policy DEFAULT-OUT out
 !
!
route-policy VOICE-IN-V2
 set local-preference 100
 set community 65001:200
 pass
end-policy`,
    changedLines: { before: [3, 5, 9, 10], after: [3, 5, 9, 10] },
  },
  {
    id: 6,
    device: 'CR-BOS-02',
    type: 'Static Route',
    description: 'Static route for 10.8.3.0/24 next-hop changed to 10.0.2.1',
    timestamp: '2026-04-05 23:52 UTC',
    before: `ip route 10.8.3.0/24 10.0.1.1
ip route 10.8.3.0/24 10.0.1.2 backup`,
    after: `ip route 10.8.3.0/24 10.0.2.1
ip route 10.8.3.0/24 10.0.2.2 backup`,
    changedLines: { before: [1, 2], after: [1, 2] },
  },
  {
    id: 7,
    device: 'DS-BOS-01',
    type: 'ACL',
    description: 'ACL MGMT-ACCESS modified; new permit entry added for 10.20.5.0/24',
    timestamp: '2026-04-06 01:14 UTC',
    before: `ip access-list extended MGMT-ACCESS
 10 permit ip 10.20.1.0 0.0.0.255 any
 20 permit ip 10.20.2.0 0.0.0.255 any
 30 deny   ip any any log`,
    after: `ip access-list extended MGMT-ACCESS
 10 permit ip 10.20.1.0 0.0.0.255 any
 20 permit ip 10.20.2.0 0.0.0.255 any
 25 permit ip 10.20.5.0 0.0.0.255 any
 30 deny   ip any any log`,
    changedLines: { before: [4], after: [4, 5] },
  },
  {
    id: 8,
    device: 'DS-BOS-03',
    type: 'OSPF',
    description: 'OSPF hello interval changed from 10s → 5s on Ethernet0/1',
    timestamp: '2026-04-06 03:28 UTC',
    before: `interface Ethernet0/1
 description To CR-BOS-02
 ip address 10.1.3.1 255.255.255.252
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf network point-to-point`,
    after: `interface Ethernet0/1
 description To CR-BOS-02
 ip address 10.1.3.1 255.255.255.252
 ip ospf hello-interval 5
 ip ospf dead-interval 20
 ip ospf network point-to-point`,
    changedLines: { before: [4, 5], after: [4, 5] },
  },
  {
    id: 9,
    device: 'ER-BOS-07',
    type: 'QoS Policy',
    description: 'QoS policy WAN-QOS updated; voice class CIR reduced from 4096000 to 2048000',
    timestamp: '2026-04-06 08:41 UTC',
    before: `policy-map WAN-QOS
 class VOICE
  police rate 4096000 bps
   conform-action transmit
   exceed-action drop
 class class-default
  fair-queue`,
    after: `policy-map WAN-QOS
 class VOICE
  police rate 2048000 bps
   conform-action transmit
   exceed-action drop
 class class-default
  fair-queue`,
    changedLines: { before: [3], after: [3] },
  },
]

function DiffPanel({ change }) {
  const beforeLines = change.before.split('\n')
  const afterLines = change.after.split('\n')
  const maxLen = Math.max(beforeLines.length, afterLines.length)

  const isChanged = (lineIdx, side) => {
    const set = side === 'before' ? change.changedLines.before : change.changedLines.after
    return set.includes(lineIdx + 1)
  }

  const added = change.changedLines.after.length
  const removed = change.changedLines.before.length
  const unchanged = beforeLines.length - removed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fffdf9' }}>
      {/* Diff header */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1efea', display: 'flex', alignItems: 'center', gap: 16, background: '#fcfbf9', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{change.device} — {change.type}</span>
        <span style={{ fontSize: 11, color: '#888' }}>{change.timestamp}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#666' }}>Unchanged <strong style={{ color: '#333' }}>{unchanged}</strong></span>
          <span style={{ fontSize: 11, color: '#1a7a3f' }}>Added <strong>{added}</strong></span>
          <span style={{ fontSize: 11, color: '#c0392b' }}>Removed <strong>{removed}</strong></span>
        </div>
      </div>

      {/* Side-by-side diff */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#fffdf9' }}>
        {/* Before */}
        <div style={{ flex: 1, borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fffdf9' }}>
          <div style={{ padding: '6px 12px', background: '#fdf2f2', borderBottom: '1px solid #f0e0e0', fontSize: 11, fontWeight: 600, color: '#c0392b', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span>Before</span>
            <span style={{ color: '#888', fontWeight: 400 }}>2026-03-22</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, background: '#fffdf9' }}>
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
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fffdf9' }}>
          <div style={{ padding: '6px 12px', background: '#f0fdf4', borderBottom: '1px solid #d0f0de', fontSize: 11, fontWeight: 600, color: '#1a7a3f', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span>After</span>
            <span style={{ color: '#888', fontWeight: 400 }}>2026-03-29</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, background: '#fffdf9' }}>
            {Array.from({ length: maxLen }, (_, i) => {
              const text = (change.after.split('\n'))[i] ?? ''
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

const COLS = '130px 100px 1fr 160px'

function SkeletonRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '7px 20px', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ height: 10, width: '70%', borderRadius: 4, background: '#ececec', animation: 'skeleton-pulse 1.4s ease-in-out infinite' }} />
      <div style={{ height: 9, width: '60%', borderRadius: 4, background: '#f0f0f0', animation: 'skeleton-pulse 1.4s ease-in-out infinite 0.08s' }} />
      <div style={{ height: 9, width: '85%', borderRadius: 4, background: '#ececec', animation: 'skeleton-pulse 1.4s ease-in-out infinite 0.05s', marginRight: 24 }} />
      <div style={{ height: 9, width: '70%', borderRadius: 4, background: '#ececec', animation: 'skeleton-pulse 1.4s ease-in-out infinite 0.15s' }} />
    </div>
  )
}

function SortIcon({ active, dir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: active ? 1 : 0.3 }}>
      <path d="M5 1.5L5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      {dir === 'asc' || !active
        ? <path d="M2.5 4L5 1.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        : <path d="M2.5 6L5 8.5L7.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      }
    </svg>
  )
}

const TIME_OPTIONS = [
  { value: 'last-24h', label: 'Last 24 hours' },
  { value: 'last-7d', label: 'Last 7 days' },
  { value: 'last-30d', label: 'Last 30 days' },
]

const CHANGE_TYPES = ['All', 'NTP', 'VLAN', 'Logging', 'BGP Policy', 'Static Route', 'ACL', 'OSPF', 'QoS Policy']

export default function ChangeAnalysis({ filter }) {
  const [selected, setSelected] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [diffH, setDiffH] = useState(null)
  const [sortKey, setSortKey] = useState('timestamp')
  const [sortDir, setSortDir] = useState('asc')
  const [query, setQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState(filter ?? 'last-24h')
  const [changeTypeFilter, setChangeTypeFilter] = useState('all')

  const filteredChanges = (() => {
    let result = CHANGES
    if (timeFilter === 'last-24h') result = result.filter(c => c.timestamp >= '2026-04-05')
    else if (timeFilter === 'last-7d') result = result.filter(c => c.timestamp >= '2026-03-31')
    if (changeTypeFilter !== 'all') result = result.filter(c => c.type === changeTypeFilter)
    return result
  })()

  const isResizing = useRef(false)
  const startData = useRef({})
  const containerRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1400)
    return () => clearTimeout(t)
  }, [])

  // Set default diffH to 70% of container height after mount
  useEffect(() => {
    if (containerRef.current && diffH === null) {
      setDiffH(Math.round(containerRef.current.offsetHeight * 0.70))
    }
  }, [diffH])

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const q = query.trim().toLowerCase()
  const queriedChanges = q
    ? filteredChanges.filter(c =>
        c.device.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.timestamp.toLowerCase().includes(q)
      )
    : filteredChanges

  const sortedChanges = [...queriedChanges].sort((a, b) => {
    const va = a[sortKey] ?? '', vb = b[sortKey] ?? ''
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })

  function startResize(e) {
    isResizing.current = true
    startData.current = { startY: e.clientY, startH: diffH }
    e.preventDefault()
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!isResizing.current) return
      const { startY, startH } = startData.current
      const dy = startY - e.clientY
      const containerH = containerRef.current?.offsetHeight || 600
      const newH = Math.max(120, Math.min(containerH - 100, startH + dy))
      setDiffH(newH)
    }
    function onMouseUp() { isResizing.current = false }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* Table — fills remaining space */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {/* Filter bar */}
        <div style={{ padding: '9px 16px 9px 20px', borderBottom: '1px solid #e8e8e8', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Event count — left anchor */}
          <div style={{ fontSize: 12, color: '#444', fontWeight: 500, flexShrink: 0 }}>
            {queriedChanges.length} event{queriedChanges.length !== 1 ? 's' : ''}
          </div>
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          {/* Time dropdown */}
          <select
            value={timeFilter}
            onChange={e => { setTimeFilter(e.target.value); setSelected(null) }}
            style={{ height: 28, padding: '0 24px 0 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, color: '#222', background: '#fafafa', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Change Type dropdown */}
          <select
            value={changeTypeFilter}
            onChange={e => { setChangeTypeFilter(e.target.value); setSelected(null) }}
            style={{ height: 28, padding: '0 24px 0 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, color: '#222', background: '#fafafa', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            {CHANGE_TYPES.map(t => <option key={t} value={t === 'All' ? 'all' : t}>{t === 'All' ? 'All Change Types' : t}</option>)}
          </select>
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 8, pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null) }}
              style={{
                paddingLeft: 28, paddingRight: 10, height: 28,
                border: '1px solid #e0e0e0', borderRadius: 6,
                fontSize: 12, color: '#222', background: '#fafafa',
                outline: 'none', width: 180,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.background = '#fff' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#fafafa' }}
            />
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '6px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', flexShrink: 0 }}>
          {[
            { key: 'device', label: 'DEVICE' },
            { key: 'type', label: 'CHANGE TYPE' },
            { key: 'description', label: 'DESCRIPTION' },
            { key: 'timestamp', label: 'TIMESTAMP' },
          ].map(col => (
            <div
              key={col.key}
              onClick={() => handleSort(col.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none', paddingRight: col.key === 'description' ? 24 : 0 }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 500, color: sortKey === col.key ? '#333' : '#888' }}>{col.label}</span>
              <SortIcon active={sortKey === col.key} dir={sortDir} />
            </div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <>
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
              <SkeletonRow /><SkeletonRow />
            </>
          ) : sortedChanges.map(change => {
            const isActive = selected?.id === change.id
            return (
              <div
                key={change.id}
                onClick={() => setSelected(isActive ? null : change)}
                style={{
                  display: 'grid', gridTemplateColumns: COLS, alignItems: 'center',
                  padding: '7px 20px',
                  borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.1s',
                  background: isActive ? '#f0f5ff' : 'transparent',
                  borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontSize: 12, fontWeight: 400, color: '#111', paddingRight: 12 }}>{change.device}</div>
                <div style={{ fontSize: 12, color: '#555', paddingRight: 12 }}>{change.type}</div>
                <div style={{ fontSize: 12, color: '#333', paddingRight: 24 }}>{change.description}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{change.timestamp}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Drag handle + diff pane — only shown when a row is selected and dimensions are ready */}
      {selected && diffH !== null && (
        <>
          {/* Horizontal resize handle */}
          <div
            onMouseDown={startResize}
            style={{ height: 4, flexShrink: 0, cursor: 'row-resize', background: 'transparent', position: 'relative', zIndex: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ position: 'absolute', left: 0, right: 0, top: 1, height: 1, background: '#e4e4e4' }} />
          </div>

          {/* Diff pane */}
          <div style={{ height: diffH, flexShrink: 0, borderTop: '1px solid #e8e8e8', overflow: 'hidden' }}>
            <DiffPanel change={selected} />
          </div>
        </>
      )}
    </div>
  )
}
