import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import ChatPane from '../workspace/ChatPane'
import ChangesMap from '../artifacts/ChangesMap'

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

  // TR-TOR — Toronto devices (BGP policy changes)
  { id: 19, device: 'TR-TOR-CR-01', deviceType: 'core-router', category: 'Configuration', type: 'BGP Policy', timestamp: '2026-04-07 11:23', description: 'BGP route-policy updated; local-preference lowered from 200 → 150 on peer 172.16.4.2', before: `route-policy TOR-UPSTREAM-IN\n set local-preference 200\n set community 65010:100\n pass\nend-policy`, after: `route-policy TOR-UPSTREAM-IN\n set local-preference 150\n set community 65010:100\n pass\nend-policy`, changedLines: { before: [2], after: [2] } },
  { id: 20, device: 'TR-TOR-CR-02', deviceType: 'core-router', category: 'Configuration', type: 'BGP Policy', timestamp: '2026-04-07 14:05', description: 'BGP neighbor policy modified; inbound route filter updated for AS65001', before: `neighbor 172.16.5.1\n remote-as 65001\n route-policy PERMIT-ALL in\n route-policy TOR-OUT out`, after: `neighbor 172.16.5.1\n remote-as 65001\n route-policy TOR-FILTER-IN in\n route-policy TOR-OUT out`, changedLines: { before: [3], after: [3] } },
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

// ── AI Query Engine ──────────────────────────────────────────────────────────

const QUERY_PATTERNS = [
  {
    match: q => q.includes('toronto') && q.includes('bgp'),
    filter: c => c.device.startsWith('TR-TOR') && (c.type.toLowerCase().includes('bgp') || c.description.toLowerCase().includes('bgp')),
    label: 'BGP policy changes in Toronto', tag: 'BGP',
    reasoning: 'Filtered for BGP policy changes on Toronto devices.',
  },
  {
    match: q => q.includes('bgp'),
    filter: c => c.type.toLowerCase().includes('bgp') || c.description.toLowerCase().includes('bgp'),
    label: 'BGP changes', tag: 'BGP',
    reasoning: 'Searched Configuration and Route Table categories for changes with type or description matching "BGP".',
  },
  {
    match: q => q.includes('ospf'),
    filter: c => c.type.toLowerCase().includes('ospf') || c.description.toLowerCase().includes('ospf'),
    label: 'OSPF changes', tag: 'OSPF',
    reasoning: 'Searched Configuration and Route Table categories for changes matching "OSPF".',
  },
  {
    match: q => q.includes('qos'),
    filter: c => c.type.toLowerCase().includes('qos') || c.description.toLowerCase().includes('qos'),
    label: 'QoS changes', tag: 'QoS',
    reasoning: 'Searched Configuration category for changes matching "QoS policy".',
  },
  {
    match: q => q.includes('acl') || q.includes('access list') || q.includes('access-list'),
    filter: c => c.type.toLowerCase().includes('acl') || c.description.toLowerCase().includes('acl'),
    label: 'ACL changes', tag: 'ACL',
    reasoning: 'Searched Configuration category for changes with type or description matching "ACL".',
  },
  {
    match: q => q.includes('vlan'),
    filter: c => c.type.toLowerCase().includes('vlan') || c.description.toLowerCase().includes('vlan'),
    label: 'VLAN changes', tag: 'VLAN',
    reasoning: 'Searched Configuration and MAC Table categories for changes matching "VLAN".',
  },
  {
    match: q => q.includes('ntp'),
    filter: c => c.type.toLowerCase().includes('ntp') || c.description.toLowerCase().includes('ntp'),
    label: 'NTP changes', tag: 'NTP',
    reasoning: 'Searched Configuration category for changes matching "NTP".',
  },
  {
    match: q => q.includes('static route') || q.includes('static-route'),
    filter: c => c.type.toLowerCase().includes('static route'),
    label: 'Static route changes', tag: 'Static Route',
    reasoning: 'Searched Configuration and Route Table categories for changes with type "Static Route".',
  },
  {
    match: q => q.includes('stp') || q.includes('spanning tree'),
    filter: c => c.category === 'STP Table',
    label: 'STP topology changes', tag: 'STP',
    reasoning: 'Filtered by Change Category = "STP Table".',
  },
  {
    match: q => q.includes('mac table') || q.includes('mac address') || (q.includes('mac') && !q.includes('mac entry')),
    filter: c => c.category === 'MAC Table',
    label: 'MAC table changes', tag: 'MAC',
    reasoning: 'Filtered by Change Category = "MAC Table".',
  },
  {
    match: q => q.includes('arp'),
    filter: c => c.category === 'ARP Table',
    label: 'ARP table changes', tag: 'ARP',
    reasoning: 'Filtered by Change Category = "ARP Table".',
  },
  {
    match: q => q.includes('ndp') || q.includes('ipv6'),
    filter: c => c.category === 'NDP Table',
    label: 'NDP/IPv6 changes', tag: 'NDP',
    reasoning: 'Filtered by Change Category = "NDP Table".',
  },
  {
    match: q => q.includes('route table') || q.includes('routing table'),
    filter: c => c.category === 'Route Table',
    label: 'Route table changes', tag: null,
    reasoning: 'Filtered by Change Category = "Route Table".',
  },
  {
    match: q => q.includes('config'),
    filter: c => c.category === 'Configuration',
    label: 'Configuration changes', tag: null,
    reasoning: 'Filtered by Change Category = "Configuration".',
  },
  {
    match: q => q.includes('edge router') || q.includes('er-bos'),
    filter: c => c.deviceType === 'edge-router',
    label: 'Edge router changes', tag: null,
    reasoning: 'Filtered by Device Type = "Edge Router".',
  },
  {
    match: q => q.includes('core router') || q.includes('cr-bos'),
    filter: c => c.deviceType === 'core-router',
    label: 'Core router changes', tag: null,
    reasoning: 'Filtered by Device Type = "Core Router".',
  },
  {
    match: q => q.includes('distribution switch') || q.includes('dist switch') || q.includes('ds-bos'),
    filter: c => c.deviceType === 'dist-switch',
    label: 'Distribution switch changes', tag: null,
    reasoning: 'Filtered by Device Type = "Distribution Switch".',
  },
  {
    match: q => q.includes('access switch') || q.includes('as-bos'),
    filter: c => c.deviceType === 'access-switch',
    label: 'Access switch changes', tag: null,
    reasoning: 'Filtered by Device Type = "Access Switch".',
  },
]

const TIME_RANGE_LABELS = { '1h': 'the last hour', '24h': 'the last 24 hours', '7d': 'the last 7 days', '30d': 'the last 30 days' }

function queryChanges(queryText, timeRange = '24h') {
  const q = queryText.toLowerCase()
  let pattern = QUERY_PATTERNS.find(p => p.match(q))

  let matched, label, tag, reasoning

  if (pattern) {
    matched = ALL_CHANGES.filter(pattern.filter)
    label = pattern.label
    tag = pattern.tag
    reasoning = pattern.reasoning
  } else {
    // Full-text fallback
    matched = ALL_CHANGES.filter(c =>
      c.device.toLowerCase().includes(q) ||
      c.type.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    )
    label = queryText
    tag = null
    reasoning = `Full-text search across all fields for "${queryText}".`
  }

  if (matched.length === 0) {
    return {
      answer: `No changes found for "${queryText}". Try searching by protocol (BGP, OSPF, VLAN), change category, or device name.`,
      matches: [],
      namedIds: [],
      reasoning,
      label,
      tag: null,
      filterPayload: null,
    }
  }

  const namedIds = matched.slice(0, 3).map(c => c.id)
  return {
    answer: `**${matched.length} ${label}** detected in ${TIME_RANGE_LABELS[timeRange] || 'the selected time range'}.`,
    matches: matched.slice(0, 5).map(c => ({
      id: c.id,
      device: c.device,
      detail: c.description.length > 65 ? c.description.slice(0, 63) + '…' : c.description,
      timestamp: c.timestamp,
    })),
    namedIds,
    reasoning,
    label,
    tag,
    filterPayload: {
      matchedIds: matched.map(c => c.id),
      namedIds,
      label,
      tag,
    },
  }
}

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

// ── AI Side Pane ─────────────────────────────────────────────────────────────

function AIFloatingButton({ onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div style={{ position: 'absolute', bottom: 20, left: 12, zIndex: 50 }}>
      <button
        onClick={onClick}
        style={{
          width: 42, height: 42, borderRadius: '50%', border: '1px solid #e0e0e0',
          background: hovered ? '#f5f5f5' : '#fff',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: hovered ? '0 6px 16px rgba(0,0,0,0.14)' : '0 2px 8px rgba(0,0,0,0.08)',
          color: '#111',
          transform: hovered ? 'scale(1.15)' : 'scale(1)',
          transition: 'background 0.15s, box-shadow 0.15s, transform 0.15s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <OrbitIcon size={26} />
      </button>
      {hovered && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 'calc(100% + 8px)',
          transform: 'translateX(-50%)',
          background: 'rgba(30,30,30,0.88)', color: '#fff',
          fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap',
          padding: '4px 9px', borderRadius: 6,
          pointerEvents: 'none',
        }}>
          Open AI
        </div>
      )}
    </div>
  )
}

function OrbitIcon({ size = 22 }) {
  const cx = 22, cy = 22, r = 14
  const nodes = [270, 330, 30, 90, 150, 210].map(deg => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  })
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} stroke="#999" strokeWidth="1" strokeDasharray="2.5 3"/>
      {nodes.map((n, i) => (
        <line key={`s${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y} stroke="#aaa" strokeWidth="1.1" strokeLinecap="round"/>
      ))}
      {nodes.map((n, i) => (
        <circle key={`n${i}`} cx={n.x} cy={n.y} r="2.6" fill="#fff" stroke="#777" strokeWidth="1.3"/>
      ))}
      <circle cx={cx} cy={cy} r="5" fill="#fff" stroke="#444" strokeWidth="1.6"/>
      <circle cx={cx} cy={cy} r="2" fill="#555"/>
    </svg>
  )
}

function AISidePane({ onClose, width, timeRange, onDeviceClick, onOpenArtifact }) {
  const [messages,         setMessages]         = useState([])
  const [isStreaming,      setIsStreaming]       = useState(false)
  const [sessionKey,       setSessionKey]        = useState(0)
  const [sessions,         setSessions]          = useState([])
  const [nameOverride,     setNameOverride]      = useState(null)
  const msgCounter = useRef(0)
  const sessionIdCounter = useRef(0)

  const saveCurrentSession = useCallback((msgs, name) => {
    if (msgs.length === 0) return
    setSessions(prev => [{ id: ++sessionIdCounter.current, name: name || 'AI Session', messages: msgs }, ...prev])
  }, [])

  const handleNewSession = useCallback((currentMsgs, currentName) => {
    saveCurrentSession(currentMsgs, currentName)
    setMessages([])
    setIsStreaming(false)
    setNameOverride(null)
    msgCounter.current = 0
    setSessionKey(k => k + 1)
  }, [saveCurrentSession])

  const handleSwitchSession = useCallback((id) => {
    const target = sessions.find(s => s.id === id)
    if (!target) return
    setSessions(prev => prev.filter(s => s.id !== id))
    setMessages(target.messages)
    setNameOverride(target.name)
    setIsStreaming(false)
    msgCounter.current = target.messages.length
    setSessionKey(k => k + 1)
  }, [sessions])

  const handleArchive = useCallback(() => {
    setMessages([])
    setIsStreaming(false)
    setNameOverride(null)
    msgCounter.current = 0
    setSessionKey(k => k + 1)
  }, [])

  const handleRename = useCallback((name) => {
    setNameOverride(name)
  }, [])

  const handleSend = useCallback((text) => {
    if (!text.trim()) return
    const userId = ++msgCounter.current
    setMessages(prev => [...prev, { id: userId, role: 'user', content: text }])
    setIsStreaming(true)
    setTimeout(() => {
      const assistantId = ++msgCounter.current
      const q = text.toLowerCase()
      const isMapQuery = q.includes('map') || q.includes('show') && (q.includes('device') || q.includes('network') || q.includes('these'))

      if (isMapQuery) {
        const timeLabel = TIME_RANGE_LABELS[timeRange] || 'the selected time range'
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: `Here are the devices with recent changes plotted across the Boston network for ${timeLabel}.`,
          artifactRef: { type: 'changesMap', label: 'Changed Devices' },
        }])
      } else {
        const result = queryChanges(text, timeRange)
        setMessages(prev => [...prev, {
          id: assistantId,
          role: 'assistant',
          content: null,
          structured: {
            answer: result.answer,
            matches: result.matches,
          },
        }])
      }
      setIsStreaming(false)
    }, 700)
  }, [timeRange])

  return (
    <div style={{
      width, flexShrink: 0, display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
    }}>
      <ChatPane
        key={sessionKey}
        messages={messages}
        isStreaming={isStreaming}
        onSend={handleSend}
        onClose={onClose}
        onNew={() => handleNewSession(messages, nameOverride)}
        onRenameSession={handleRename}
        onArchive={handleArchive}
        sessions={sessions}
        onSwitchSession={handleSwitchSession}
        nameOverride={nameOverride}
        currentSessionName="New AI Session"
        commandSet="changeAnalysis"
        canAddToCanvas={false}
        onDeviceClick={onDeviceClick}
        onOpenArtifact={onOpenArtifact}
      />
    </div>
  )
}

// ── AI Filter Banner ──────────────────────────────────────────────────────────

function SparkleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M6 1L6.9 4.5H10.5L7.6 6.6L8.5 10.1L6 8L3.5 10.1L4.4 6.6L1.5 4.5H5.1L6 1Z" fill="#3b82f6" stroke="#3b82f6" strokeWidth="0.5" strokeLinejoin="round"/>
    </svg>
  )
}

function AiFilterBanner({ aiFilter, onClear, onSaveAsFilter }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 24px',
      background: '#eff6ff',
      borderBottom: '1px solid #dbeafe',
      flexShrink: 0,
    }}>
      <SparkleIcon />
      <span style={{ fontSize: 12, color: '#1d4ed8', fontWeight: 500 }}>
        AI filter active:
      </span>
      <span style={{ fontSize: 12, color: '#1e40af' }}>"{aiFilter.label}"</span>
      <span style={{ fontSize: 12, color: '#6b9fd4' }}>·</span>
      <span style={{ fontSize: 12, color: '#3b82f6' }}>{aiFilter.matchedIds.length} result{aiFilter.matchedIds.length !== 1 ? 's' : ''}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
        <button
          onClick={onSaveAsFilter}
          style={{ fontSize: 11.5, color: '#3b82f6', background: 'none', border: '1px solid #bfdbfe', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontWeight: 500 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#dbeafe' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          Save as filter
        </button>
        <button
          onClick={onClear}
          style={{ fontSize: 11.5, color: '#6b7280', background: 'none', border: '1px solid #e0e0e0', borderRadius: 5, padding: '3px 9px', cursor: 'pointer', fontWeight: 500 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
        >
          ✕ Clear
        </button>
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
  const [aiOpen,        setAiOpen]        = useState(false)
  const [aiPaneW,       setAiPaneW]       = useState(340)
  const [mapTabOpen,    setMapTabOpen]    = useState(false)
  const [activeTab,     setActiveTab]     = useState('table')
  const containerRef    = useRef(null)
  const searchRef       = useRef(null)
  const isResizing      = useRef(false)   // vertical (diff)
  const startData       = useRef({})
  const isPaneResizing  = useRef(false)   // horizontal (AI pane)
  const paneStartData   = useRef({})

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

  // Horizontal resize (AI pane)
  useEffect(() => {
    function onMouseMove(e) {
      if (!isPaneResizing.current) return
      const { startX, startW } = paneStartData.current
      const dx = e.clientX - startX
      setAiPaneW(Math.max(240, Math.min(560, startW + dx)))
    }
    function onMouseUp() {
      if (isPaneResizing.current) {
        isPaneResizing.current = false
        document.body.style.userSelect = ''
        document.body.style.cursor = ''
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [])

  function startPaneResize(e) {
    isPaneResizing.current = true
    paneStartData.current = { startX: e.clientX, startW: aiPaneW }
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
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

  function handleOpenArtifact(artifactRef) {
    if (artifactRef.type === 'changesMap') {
      setMapTabOpen(true)
      setActiveTab('map')
    }
  }

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative', overflow: 'hidden' }}>

      {/* ── AI Side Pane + vertical sash ── */}
      {aiOpen && <>
        <AISidePane
          onClose={() => setAiOpen(false)}
          width={aiPaneW}
          timeRange={timeRange}
          onDeviceClick={name => { setSearch(name); setTimeout(() => searchRef.current?.focus(), 0) }}
          onOpenArtifact={handleOpenArtifact}
        />
        <div
          onMouseDown={startPaneResize}
          style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: 'transparent', position: 'relative', zIndex: 10 }}
          onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 1, width: 1, background: '#e8e8e8' }} />
        </div>
      </>}

      {/* ── Floating AI button — only when pane is closed ── */}
      {!aiOpen && <AIFloatingButton onClick={() => setAiOpen(true)} />}

    <div data-resizable="true" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', overflow: 'hidden' }}>

      {/* ── Tab bar (map tab open) or Page header ── */}
      {mapTabOpen ? (
        <div style={{ height: 44, background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', paddingLeft: 8, flexShrink: 0, gap: 2 }}>
          <div
            onClick={() => setActiveTab('table')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 14px', height: 32, borderRadius: 6, cursor: 'pointer',
              background: activeTab === 'table' ? '#f5f5f5' : 'transparent',
              fontSize: 12.5, fontWeight: activeTab === 'table' ? 600 : 400, color: activeTab === 'table' ? '#111' : '#666',
              userSelect: 'none',
            }}
          >
            Change Analysis
          </div>
          <div
            onClick={() => setActiveTab('map')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0 10px 0 14px', height: 32, borderRadius: 6, cursor: 'pointer',
              background: activeTab === 'map' ? '#f5f5f5' : 'transparent',
              fontSize: 12.5, fontWeight: activeTab === 'map' ? 600 : 400, color: activeTab === 'map' ? '#111' : '#666',
              userSelect: 'none',
            }}
          >
            Changed Devices
            <button
              onClick={e => { e.stopPropagation(); setMapTabOpen(false); setActiveTab('table') }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', padding: '2px 2px', borderRadius: 4, marginLeft: 2, lineHeight: 1 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.color = '#555' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>
      ) : (
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #eeeeee', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ fontSize: 15, fontWeight: 650, color: '#111', letterSpacing: '-0.01em' }}>
              Change Analysis
            </div>
            <div style={{ width: 1, height: 14, background: '#ccc', flexShrink: 0 }} />
            <div style={{ fontSize: 11.5, color: '#444' }}>
              {new Set(filtered.map(c => c.device)).size} changed devices · {filtered.length} change events
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', minWidth: 0 }}>
            <Dropdown label="Last 24 hours" value={timeLabel} options={TIME_RANGES} onChange={setTimeRange} />
            <Dropdown label="All device types" multi={true} selected={deviceTypes} options={Object.entries(DEVICE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} onChange={setDeviceTypes} />
            <Dropdown label="All change categories" multi={true} selected={categories} options={CATEGORY_OPTIONS} onChange={setCategories} />
            <div style={{ flex: 1 }} />
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #ddd', borderRadius: 6, padding: '5px 10px', background: '#fff', width: 200, minWidth: 120, flexShrink: 1, transition: 'border-color 0.15s, box-shadow 0.15s' }}
              onFocusCapture={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)' }}
              onBlurCapture={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = 'none' }}
            >
              <SearchIcon />
              <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ border: 'none', outline: 'none', fontSize: 11.5, color: '#333', background: 'transparent', flex: 1, minWidth: 0 }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 0 }}><CloseIcon /></button>}
            </div>
          </div>
        </div>
      )}

      {/* ── Map tab content ── */}
      {mapTabOpen && activeTab === 'map' && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <ChangesMap filter={timeRange} />
        </div>
      )}

      {/* ── Table tab content ── */}
      {(!mapTabOpen || activeTab === 'table') && (<>

        {/* Filter bar in tab mode */}
        {mapTabOpen && (
        <div style={{ padding: '10px 24px', borderBottom: '1px solid #eeeeee', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Dropdown label="Last 24 hours" value={timeLabel} options={TIME_RANGES} onChange={setTimeRange} />
          <Dropdown label="All device types" multi={true} selected={deviceTypes} options={Object.entries(DEVICE_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} onChange={setDeviceTypes} />
          <Dropdown label="All change categories" multi={true} selected={categories} options={CATEGORY_OPTIONS} onChange={setCategories} />
          <div style={{ flex: 1 }} />
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #ddd', borderRadius: 6, padding: '5px 10px', background: '#fff', width: 200, minWidth: 120, flexShrink: 1, transition: 'border-color 0.15s, box-shadow 0.15s' }}
            onFocusCapture={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.15)' }}
            onBlurCapture={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.boxShadow = 'none' }}
          >
            <SearchIcon />
            <input ref={searchRef} value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…" style={{ border: 'none', outline: 'none', fontSize: 11.5, color: '#333', background: 'transparent', flex: 1, minWidth: 0 }} />
            {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 0 }}><CloseIcon /></button>}
          </div>
        </div>
        )}

        {/* ── Table ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }} ref={containerRef}>
          {/* Column headers */}
          <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '6px 24px', borderBottom: '1px solid #eeeeee', background: '#fafafa', flexShrink: 0 }}>
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
      </>)}

    </div>
    </div>
  )
}
