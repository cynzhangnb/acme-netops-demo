import { useState } from 'react'
import { networkChanges, deviceTypeBreakdown, siteSummary, lastDiscovery, metricsData, aiSessionHistory } from '../../data/metricsData'
import InputArea from '../workspace/InputArea'

/* ── Change-type icon ─────────────────────────────────────────────────── */
function ChangeIcon({ type, color = '#94a3b8' }) {
  const p = {
    width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth: '1.75', strokeLinecap: 'round', strokeLinejoin: 'round',
    style: { flexShrink: 0, display: 'block' },
  }
  // Config file change — document with lines
  if (type === 'config') return (
    <svg {...p}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="8" y1="13" x2="16" y2="13"/>
      <line x1="8" y1="17" x2="13" y2="17"/>
    </svg>
  )
  // Route Table — folded map (navigation/routing metaphor)
  if (type === 'route-table') return (
    <svg {...p}>
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
      <line x1="9" y1="3" x2="9" y2="18"/>
      <line x1="15" y1="6" x2="15" y2="21"/>
    </svg>
  )
  // ARP Table — link/chain (maps IP ↔ MAC)
  if (type === 'arp-table') return (
    <svg {...p}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
    </svg>
  )
  // MAC Table — chip/hardware address
  if (type === 'mac-table') return (
    <svg {...p}>
      <rect x="7" y="7" width="10" height="10" rx="1"/>
      <line x1="9" y1="3" x2="9" y2="7"/><line x1="12" y1="3" x2="12" y2="7"/><line x1="15" y1="3" x2="15" y2="7"/>
      <line x1="9" y1="17" x2="9" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/><line x1="15" y1="17" x2="15" y2="21"/>
      <line x1="3" y1="9" x2="7" y2="9"/><line x1="3" y1="12" x2="7" y2="12"/><line x1="3" y1="15" x2="7" y2="15"/>
      <line x1="17" y1="9" x2="21" y2="9"/><line x1="17" y1="12" x2="21" y2="12"/><line x1="17" y1="15" x2="21" y2="15"/>
    </svg>
  )
  // STP Table — spanning tree (hierarchy)
  if (type === 'stp-table') return (
    <svg {...p}>
      <circle cx="12" cy="4" r="2"/><circle cx="5" cy="20" r="2"/><circle cx="19" cy="20" r="2"/>
      <line x1="12" y1="6" x2="12" y2="13"/>
      <line x1="12" y1="13" x2="5" y2="18"/>
      <line x1="12" y1="13" x2="19" y2="18"/>
    </svg>
  )
  // NDP Table — neighbor nodes
  if (type === 'ndp-table') return (
    <svg {...p}>
      <circle cx="12" cy="12" r="3"/>
      <circle cx="4"  cy="6"  r="2"/><line x1="6"  y1="7"  x2="10" y2="10"/>
      <circle cx="20" cy="6"  r="2"/><line x1="18" y1="7"  x2="14" y2="10"/>
      <circle cx="4"  cy="18" r="2"/><line x1="6"  y1="17" x2="10" y2="14"/>
      <circle cx="20" cy="18" r="2"/><line x1="18" y1="17" x2="14" y2="14"/>
    </svg>
  )
  // Generic table fallback — grid icon
  return (
    <svg {...p}>
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9"  x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="3"  x2="9"  y2="21"/>
    </svg>
  )
}

function discoveryAgo() {
  const diff = Date.now() - new Date(lastDiscovery.timestamp).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 31) return `${days} Days ago`
  const months = Math.floor(days / 30)
  return `${months} ${months === 1 ? 'Month' : 'Months'} ago`
}
function fmtDate(iso) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

/* ── Shared primitives ───────────────────────────────────────────────────── */
function Card({ children, style }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e4e4e4', borderRadius: 8,
      overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style,
    }}>
      {children}
    </div>
  )
}

function CardHeader({ title, action, children }) {
  return (
    <div style={{
      padding: '8px 14px', borderBottom: '1px solid #f0f0f0',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
    }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a' }}>{title}</span>
      {action && <span style={{ fontSize: 11, color: '#666' }}>{action}</span>}
      {children}
    </div>
  )
}

/* Unified list row — used in every card */
function ListRow({ label, value, valueSub, valueColor, sub, last, onClick, chevron }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '7px 14px',
        borderBottom: last ? 'none' : '1px solid #f5f5f5',
        cursor: onClick ? 'pointer' : 'default',
        transition: onClick ? 'background 0.1s' : undefined,
      }}
      onMouseEnter={onClick ? e => e.currentTarget.style.background = '#f8f8f8' : undefined}
      onMouseLeave={onClick ? e => e.currentTarget.style.background = 'transparent' : undefined}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#333', fontWeight: 400 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: valueColor || '#111', whiteSpace: 'nowrap' }}>{value}</span>
          {chevron && (
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          )}
        </div>
        {valueSub && <div style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>{valueSub}</div>}
      </div>
    </div>
  )
}

/* ── Device type icon ────────────────────────────────────────────────────── */
function DeviceTypeIcon({ kind, color = '#888', size = 16 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: '1.75', strokeLinecap: 'round', strokeLinejoin: 'round' }
  if (kind === 'router')   return <svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
  if (kind === 'firewall') return <svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
  if (kind === 'lb')       return <svg {...p}><polyline points="16 3 21 8 16 13"/><line x1="21" y1="8" x2="9" y2="8"/><polyline points="8 21 3 16 8 11"/><line x1="3" y1="16" x2="15" y2="16"/></svg>
  if (kind === 'server')   return <svg {...p}><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>
  return <svg {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
}

function Sil({ w = '72%', h = 9, style }) {
  return <div style={{ width: w, height: h, background: '#eaeaea', borderRadius: 3, flexShrink: 0, ...style }} />
}

function SparkleIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2563eb"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z"/>
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
export default function HomePage({ onStartAI }) {

  const [selectedChangeType, setSelectedChangeType] = useState(null)
  const [homeInput, setHomeInput] = useState('')
  const [inputFocused, setInputFocused] = useState(false)
  const totalSites = siteSummary.reduce((n, r) => n + r.sites.length, 0)

  /* ── AI Workspace Card (row 1, full width) ───────────────────────────── */
  const NETWORK_TEMPLATE = `Help me explore my network.\nScope: [e.g. a site, a specific device]\nFocus on:\n- routing design and path selection\n- network segmentation\n- policies and access control\n- logical connectivity between devices`
  const ENTRY_SHORTCUTS = [
    { label: 'Explore Network',  onActivate: () => setHomeInput(NETWORK_TEMPLATE) },
    { label: 'Create Map',       onActivate: () => onStartAI('') },
    { label: 'Troubleshoot',     onActivate: () => onStartAI('') },
    { label: 'Change Analysis',  onActivate: () => onStartAI('') },
    { label: 'Find Devices',     onActivate: () => onStartAI('') },
    { label: 'Trace Route',      onActivate: () => onStartAI('') },
  ]
  const AIWorkspaceCard = (
    <Card>
      {/* Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* Graphic + text + input + shortcuts */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', padding: '30px 24px 26px', gap: 18, overflow: 'hidden' }}>

          {/* Icon inline with title */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4f86e8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
                </svg>
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#111', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                Ask anything about your network
              </div>
            </div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.5, paddingLeft: 44 }}>
              Explore network, run analysis, or dig into issues.
            </div>
          </div>

          {/* Input + shortcuts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              style={{ borderRadius: 10, boxShadow: inputFocused ? '0 4px 20px rgba(55,138,221,0.14), 0 1px 4px rgba(0,0,0,0.06)' : 'none', transition: 'box-shadow 0.15s' }}
            >
              <InputArea
                onSend={(text) => { setHomeInput(''); onStartAI(text) }}
                isStreaming={false}
                placeholder="Explore your network, analyze BGP, troubleshoot an issue…"
                initialValue={homeInput}
                onValueChange={setHomeInput}
                maxExpandHeight={80}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
              {ENTRY_SHORTCUTS.map(({ label, onActivate }) => (
                <button
                  key={label}
                  onClick={onActivate}
                  style={{ padding: '6px 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 11, color: '#555', cursor: 'pointer', background: '#fff', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', transition: 'border-color 0.1s, background 0.1s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.borderColor = '#c8c8c8' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0' }}
                >{label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, background: '#f0f0f0', flexShrink: 0 }} />

        {/* Recent sessions */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px 8px', fontSize: 10, fontWeight: 600, color: '#666', letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0 }}>
            Recent Sessions
          </div>
          <div style={{ flex: 1, overflow: 'auto' }}>
            {aiSessionHistory.map((s, i) => (
              <div
                key={s.id}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 16px', borderBottom: i < aiSessionHistory.length - 1 ? '1px solid #f8f8f8' : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f8f8f8'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 2 }}>{s.artifacts} artifact{s.artifacts !== 1 ? 's' : ''}</div>
                </div>
                <div style={{ fontSize: 10, color: '#ccc', flexShrink: 0, whiteSpace: 'nowrap', marginTop: 1 }}>{s.ago}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </Card>
  )

  /* ── Device Summary Card (row 2, col 1) ─────────────────────────────── */
  const DEVICE_COLORS = [
    { stroke: '#3b82f6', bg: '#eff6ff' },
    { stroke: '#6366f1', bg: '#eef2ff' },
    { stroke: '#0ea5e9', bg: '#e0f2fe' },
    { stroke: '#8b5cf6', bg: '#f5f3ff' },
    { stroke: '#14b8a6', bg: '#f0fdfa' },
    { stroke: '#64748b', bg: '#f1f5f9' },
  ]
  const totalDevices = deviceTypeBreakdown.reduce((n, d) => n + d.count, 0)
  const DeviceSummaryCard = (
    <Card>
      <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Device Summary</div>
        <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#111', lineHeight: 1 }}>{totalDevices.toLocaleString()}</span>
          <span style={{ fontSize: 12, color: '#888', marginLeft: 7 }}>devices total</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {deviceTypeBreakdown.map((d, i) => {
            const { stroke, bg } = DEVICE_COLORS[i] || DEVICE_COLORS[0]
            return (
              <div key={d.type} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#f7f8fa' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <DeviceTypeIcon kind={d.icon} color={stroke} size={16} />
                </div>
                <span style={{ flex: 1, fontSize: 13, color: '#222', fontWeight: 400 }}>{d.type}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{d.count.toLocaleString()}</span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )

  /* ── Site Summary Card (row 2, col 2) ────────────────────────────────── */
  const allSites = siteSummary.flatMap(g => g.sites)
  const SITE_COLORS = [
    { stroke: '#3b82f6', bg: '#eff6ff' },
    { stroke: '#6366f1', bg: '#eef2ff' },
    { stroke: '#0ea5e9', bg: '#e0f2fe' },
    { stroke: '#8b5cf6', bg: '#f5f3ff' },
    { stroke: '#14b8a6', bg: '#f0fdfa' },
    { stroke: '#64748b', bg: '#f1f5f9' },
  ]
  const SiteSummaryCard = (
    <Card>
      <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Site Summary</div>
        <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
          <span style={{ fontSize: 28, fontWeight: 700, color: '#111', lineHeight: 1 }}>{allSites.length}</span>
          <span style={{ fontSize: 12, color: '#888', marginLeft: 7 }}>sites total</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {allSites.map((site, i) => {
            const { stroke, bg } = SITE_COLORS[i % SITE_COLORS.length]
            return (
              <div key={site.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#f7f8fa' }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                </div>
                <span style={{ flex: 1, fontSize: 13, color: '#222', fontWeight: 400 }}>{site.name}</span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{site.devices.toLocaleString()}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>devices</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )

  /* ── Card 4 · Recent Network Changes ────────────────────────────────── */
  const CHANGE_TYPE_META = [
    { type: 'config',      label: 'Config Changes', stroke: '#3b82f6', bg: '#eff6ff' },
    { type: 'route-table', label: 'Route Table',    stroke: '#6366f1', bg: '#eef2ff' },
    { type: 'arp-table',   label: 'ARP Table',      stroke: '#0ea5e9', bg: '#e0f2fe' },
    { type: 'mac-table',   label: 'MAC Table',      stroke: '#8b5cf6', bg: '#f5f3ff' },
    { type: 'stp-table',   label: 'STP Table',      stroke: '#14b8a6', bg: '#f0fdfa' },
    { type: 'ndp-table',   label: 'NDP Table',      stroke: '#64748b', bg: '#f1f5f9' },
  ]
  const changeCounts = networkChanges.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc }, {})
  const changeSummary = CHANGE_TYPE_META.filter(m => changeCounts[m.type]).map(m => ({ ...m, count: changeCounts[m.type] }))
  const drilldownMeta = CHANGE_TYPE_META.find(m => m.type === selectedChangeType)
  const drilldownItems = selectedChangeType ? networkChanges.filter(c => c.type === selectedChangeType) : []

  const ChangesCard = (
    <Card>
      {selectedChangeType === null ? (
        /* ── Summary view ── */
        <div style={{ padding: '16px 16px 12px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Recent Network Changes</div>
          <div style={{ marginBottom: 14, paddingBottom: 12, borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: '#111', lineHeight: 1 }}>{networkChanges.length}</span>
            <span style={{ fontSize: 12, color: '#888', marginLeft: 7 }}>changes · last 24h</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {changeSummary.map(({ type, label, stroke, bg, count }) => (
              <div
                key={type}
                onClick={() => setSelectedChangeType(type)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 8, background: '#f7f8fa', cursor: 'pointer', transition: 'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eff0f3'}
                onMouseLeave={e => e.currentTarget.style.background = '#f7f8fa'}
              >
                <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ChangeIcon type={type} color={stroke} />
                </div>
                <span style={{ flex: 1, fontSize: 13, color: '#222', fontWeight: 400 }}>{label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#111' }}>{count}</span>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c0c0c0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ── Drilldown view ── */
        <>
          {/* Drilldown header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 40, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                onClick={() => setSelectedChangeType(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', padding: '2px 0', cursor: 'pointer', fontSize: 11, color: '#888', fontWeight: 500 }}
                onMouseEnter={e => e.currentTarget.style.color = '#333'}
                onMouseLeave={e => e.currentTarget.style.color = '#888'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                Back
              </button>
              <span style={{ fontSize: 11, color: '#ddd' }}>|</span>
              {drilldownMeta && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, background: drilldownMeta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ChangeIcon type={selectedChangeType} color={drilldownMeta.stroke} />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{drilldownMeta.label}</span>
                </div>
              )}
            </div>
            <span style={{ fontSize: 11, color: '#999' }}>{drilldownItems.length} changes</span>
          </div>

          {/* Drilldown list */}
          <div style={{ flex: 1, overflow: 'auto' }}>
            {drilldownItems.map((c, i) => (
              <div
                key={c.id}
                style={{ padding: '9px 16px', borderBottom: i < drilldownItems.length - 1 ? '1px solid #f5f5f5' : 'none' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#222' }}>{c.device}</span>
                  <span style={{ fontSize: 11, color: '#aaa', flexShrink: 0, marginLeft: 8 }}>{c.time}</span>
                </div>
                <div style={{ fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  )

  /* ── Layout ──────────────────────────────────────────────────────────── */
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div style={{ flex: 1, overflow: 'auto', background: '#f5f5f5', padding: '20px 24px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ padding: '4px 0 8px' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#111', letterSpacing: '-0.025em', lineHeight: 1 }}>
            ACME Corp Network
          </div>
          <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
            {greeting} · {metricsData.totalDevices} devices across {totalSites} sites
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'stretch' }}>
          {/* Row 1 — unified AI workspace + sessions */}
          <div style={{ gridColumn: 'span 3' }}>{AIWorkspaceCard}</div>

          {/* Row 2 — Device summary + site summary + changes */}
          {DeviceSummaryCard}
          {SiteSummaryCard}
          {ChangesCard}
        </div>
      </div>
    </div>
  )
}
