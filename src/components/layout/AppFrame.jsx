import { useState } from 'react'
import Sidebar from './Sidebar'
import DeviceBrowserPane from '../network/DeviceBrowserPane'
import { allDevices } from '../../data/deviceData'

/* ── Network rail ────────────────────────────────────────────────────────── */
const NIC = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.5', strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' }

function NetDevicesIcon() { return <svg {...NIC}><path d="M8.5 7.5 a5 5 0 0 1 7 0"/><path d="M6 5 a8.5 8.5 0 0 1 12 0"/><rect x="5" y="11" width="14" height="7" rx="1.5"/><circle cx="8.5" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg> }
function NetMapsIcon()    { return <svg {...NIC}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg> }
function NetNoteIcon()    { return <svg {...NIC}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> }
function NetRectIcon()    { return <svg {...NIC}><rect x="3" y="5" width="18" height="14" rx="1.5"/></svg> }
function NetCircleIcon()  { return <svg {...NIC}><circle cx="12" cy="12" r="9"/></svg> }
function NetLineIcon()    { return <svg {...NIC}><line x1="4" y1="12" x2="20" y2="12"/></svg> }
function NetArrowIcon()   { return <svg {...NIC}><line x1="5" y1="19" x2="19" y2="5"/><polyline points="10 5 19 5 19 14"/></svg> }

const NET_RAIL = [
  { id: 'devices', tooltip: 'Devices',   Icon: NetDevicesIcon },
  { id: 'maps',    tooltip: 'Maps',      Icon: NetMapsIcon    },
  { id: 'divider' },
  { id: 'note',    tooltip: 'Note',      Icon: NetNoteIcon    },
  { id: 'rect',    tooltip: 'Rectangle', Icon: NetRectIcon    },
  { id: 'circle',  tooltip: 'Circle',    Icon: NetCircleIcon  },
  { id: 'line',    tooltip: 'Line',      Icon: NetLineIcon    },
  { id: 'arrow',   tooltip: 'Arrow',     Icon: NetArrowIcon   },
]

/* ── Fake session data ───────────────────────────────────────────────────── */
const FAKE_SESSIONS = [
  { id: 'current', name: null,              preview: '',                                              ago: 'Now',       artifacts: 0, current: true },
  { id: 's1',      name: 'Boston Network',  preview: 'Explored topology of the Boston data center',  ago: 'Just now',  artifacts: 1  },
  { id: 's2',      name: 'Show recent configuration changes in my network', preview: 'Reviewed 8 configuration changes across 4 Boston devices', ago: '2h ago', artifacts: 1 },
  { id: 's3',      name: 'Core Router Analysis',    preview: 'Analyzed routing tables on Core-Router-01', ago: 'Yesterday', artifacts: 2  },
  { id: 's4',      name: 'Firewall Policy Review',  preview: 'Reviewed DMZ firewall ACL rules',           ago: '2d ago', artifacts: 1 },
  { id: 's5',      name: 'VLAN Segmentation',       preview: 'Mapped VLANs across distribution layer',   ago: '3d ago',  artifacts: 3  },
  { id: 's6',      name: 'Incident · Packet Loss',  preview: 'Traced packet drops on AccessSwitch-F2',   ago: '4d ago',  artifacts: 1  },
  { id: 's7',      name: 'BGP Peer Troubleshoot',   preview: 'Investigated BGP flap on Edge-Router-02',  ago: '5d ago',  artifacts: 2  },
]

/* ── Session History Pane ────────────────────────────────────────────────── */
function SessionHistoryPane({ onClose, currentSessionName, onSelectSession }) {
  return (
    <div style={{
      width: 264,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      border: '1px solid #e8e8e8',
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      maxHeight: 'calc(100vh - 100px)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>Session History</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#555' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        {FAKE_SESSIONS.map((s) => {
          const displayName = s.current ? (currentSessionName || 'New Session') : s.name
          const isNewEmpty = s.current && displayName === 'New Session'
          const isInteractive = s.id === 's1' || s.id === 's2'
          return (
            <div
              key={s.id}
              onClick={() => {
                if (s.current || !isInteractive) return
                onSelectSession?.(s.id)
                onClose()
              }}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #f5f5f5',
                cursor: s.current || !isInteractive ? 'default' : 'pointer',
                background: s.current ? '#f7f9ff' : 'transparent',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!s.current && isInteractive) e.currentTarget.style.background = '#f8f8f8' }}
              onMouseLeave={e => { if (!s.current && isInteractive) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.preview && !isNewEmpty ? 3 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {s.current && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#378ADD', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 12, fontWeight: s.current ? 600 : 500, color: s.current ? '#111' : '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: '#bbb', flexShrink: 0, marginLeft: 8 }}>{s.ago}</span>
              </div>
              {s.preview && !isNewEmpty && (
                <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: s.current ? 12 : 0 }}>
                  {s.preview}
                </div>
              )}
              {s.artifacts > 0 && (
                <div style={{ marginTop: 5, paddingLeft: s.current ? 12 : 0 }}>
                  <span style={{ fontSize: 10, color: '#999', background: '#f0f0f0', borderRadius: 3, padding: '1px 6px' }}>
                    {s.artifacts} artifact{s.artifacts !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Network Browser Pane ────────────────────────────────────────────────── */
const NETWORK_TABS = ['Site', 'Device', 'Map']

const MAP_INSTANCES = [
  { id: 'map-boston-dc',     name: 'Boston DC'          },
  { id: 'map-nyc-office',    name: 'New York Office'     },
  { id: 'map-core-network',  name: 'Core Network'        },
  { id: 'map-wan-topology',  name: 'WAN Topology'        },
  { id: 'map-dmz',           name: 'DMZ Segment'         },
  { id: 'map-campus-west',   name: 'Campus West'         },
]

function MapItemIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#888' }}>
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/>
      <line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  )
}

function PinIcon({ pinned }) {
  return pinned ? (
    /* filled pin = currently pinned */
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a1 1 0 0 1 1 1v1h3a1 1 0 0 1 .707 1.707L14 8.414V13l3 2v1H7v-1l3-2V8.414L7.293 5.707A1 1 0 0 1 8 4h3V3a1 1 0 0 1 1-1zM10 19h4a2 2 0 0 1-4 0z"/>
    </svg>
  ) : (
    /* outline pin = not pinned */
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="17" x2="12" y2="22"/>
      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17z"/>
    </svg>
  )
}

function MapList({ onOpenTab, onMapDragStart, onMapDragEnd }) {
  const [hoveredId, setHoveredId] = useState(null)

  return (
    <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
      {MAP_INSTANCES.map((map, i) => (
        <div
          key={map.id}
          draggable
          onDragStart={(e) => {
            // Must call setData — Firefox won't start the drag without it
            e.dataTransfer.setData('text/plain', map.id)
            e.dataTransfer.effectAllowed = 'copy'
            // Defer setState via rAF: calling setState synchronously inside
            // dragstart triggers a React re-render that cancels the native drag
            requestAnimationFrame(() => onMapDragStart(map))
          }}
          onDragEnd={onMapDragEnd}
          onMouseEnter={() => setHoveredId(map.id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '9px 14px',
            borderBottom: i < MAP_INSTANCES.length - 1 ? '1px solid #f5f5f5' : 'none',
            background: hoveredId === map.id ? '#fafafa' : 'transparent',
            transition: 'background 0.1s',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          <MapItemIcon />
          <span style={{ flex: 1, fontSize: 12, color: '#222', lineHeight: 1.4 }}>{map.name}</span>
          {/* always in DOM so row height stays stable */}
          <button
            onClick={(e) => { e.stopPropagation(); onOpenTab(map.id, map.name) }}
            style={{
              fontSize: 11, color: '#378ADD', background: 'none',
              border: 'none', cursor: 'pointer',
              padding: '2px 7px', borderRadius: 4, lineHeight: 1.5,
              flexShrink: 0,
              visibility: hoveredId === map.id ? 'visible' : 'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e8f2ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Open
          </button>
        </div>
      ))}
    </div>
  )
}

function NetworkBrowserPane({ tab, onTabChange, onPin, onClose, pinned, onOpenTab, onMapDragStart, onMapDragEnd }) {
  return (
    <div style={{
      width: 280, flexShrink: 0,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      height: '100%',
      ...(pinned
        ? { borderRight: '1px solid #e8e8e8' }
        : {
            border: '1px solid #e8e8e8',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
          }
      ),
    }}>
      {/* Header */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>Network</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={onPin}
            title={pinned ? 'Unpin' : 'Pin to sidebar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: pinned ? '#378ADD' : '#aaa',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; if (!pinned) e.currentTarget.style.color = '#555' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; if (!pinned) e.currentTarget.style.color = '#aaa' }}
          >
            <PinIcon pinned={pinned} />
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#aaa',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#555' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', alignItems: 'center', height: 40, padding: '0 10px', gap: 3, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        {NETWORK_TABS.map(t => {
          const active = tab === t.toLowerCase()
          return (
            <button
              key={t}
              onClick={() => onTabChange(t.toLowerCase())}
              style={{
                flex: 1, padding: '5px 0',
                border: 'none', borderRadius: 6,
                fontSize: 12, fontWeight: active ? 600 : 400,
                background: active ? '#ececec' : 'transparent',
                color: active ? '#111' : '#767676',
                cursor: 'pointer',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = '#f5f5f5'; e.currentTarget.style.color = '#333' } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#767676' } }}
            >
              {t}
            </button>
          )
        })}
      </div>

      {/* Content area */}
      {tab === 'map' ? (
        <MapList onOpenTab={onOpenTab} onMapDragStart={onMapDragStart} onMapDragEnd={onMapDragEnd} />
      ) : (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 12, color: '#bbb' }}>{NETWORK_TABS.find(t => t.toLowerCase() === tab)} view</span>
        </div>
      )}
    </div>
  )
}

/* ── Inventory Browser Pane — Reports Tree ───────────────────────────────── */

const REPORT_TREE = [
  {
    id: 'builtin', label: 'Built-in Reports', type: 'folder', defaultOpen: true,
    children: [
      { id: 'device-report',    label: 'Device Report',    type: 'report' },
      { id: 'interface-report', label: 'Interface Report', type: 'report' },
      { id: 'module-report',    label: 'Module Report',    type: 'report' },
      { id: 'site-report',      label: 'Site Report',      type: 'report' },
      { id: 'summary-report',   label: 'Summary Report',   type: 'report' },
    ],
  },
  {
    id: 'customized', label: 'Customized Reports', type: 'folder', defaultOpen: true,
    children: [
      {
        id: 'shared', label: 'Shared Reports', type: 'folder', defaultOpen: true,
        children: [
          { id: 'cisco-eox',    label: 'Cisco EoX Hardware',            type: 'report' },
          { id: 'cisco-sec',    label: 'Cisco Security Vulnerabilities', type: 'report' },
          { id: 'cisco-soft',   label: 'Cisco Software Suggestions',    type: 'report' },
          { id: 'fru-report',   label: 'FRU Report',                    type: 'report' },
          { id: 'infoblox',     label: 'Infoblox Inventory Report',      type: 'report' },
          { id: 'other-if',     label: 'Other_If_Report',               type: 'report' },
          { id: 'router-if',    label: 'Router_If_Report',              type: 'report' },
          { id: 'stackable',    label: 'Stackable Switch Report',        type: 'report' },
          { id: 'switch-if',    label: 'Switch_If_Report',              type: 'report' },
          { id: 'vss-report',   label: 'VSS Report',                    type: 'report' },
          { id: 'eox',          label: 'eox',                           type: 'report' },
          { id: 'geolocation',  label: 'geolocation test',              type: 'report' },
          { id: 'test',         label: 'test',                          type: 'report' },
          { id: 'ui',           label: 'ui',                            type: 'report' },
          { id: 'zile-test',    label: 'zile_test',                     type: 'report' },
        ],
      },
      { id: 'private', label: 'Private Reports', type: 'folder', defaultOpen: false, children: [] },
    ],
  },
]

function ReportTreeNode({ node, depth = 0, onOpen, onDragStart, onDragEnd }) {
  const [open,    setOpen]    = useState(node.defaultOpen ?? true)
  const [hovered, setHovered] = useState(false)
  const isFolder = node.type === 'folder'
  const indent   = 10 + depth * 14

  return (
    <div>
      <div
        draggable={!isFolder}
        onDragStart={!isFolder ? (e) => {
          e.dataTransfer.effectAllowed = 'copy'
          onDragStart?.({ id: node.id, label: node.label })
        } : undefined}
        onDragEnd={!isFolder ? () => onDragEnd?.() : undefined}
        onClick={() => isFolder ? setOpen(o => !o) : null}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          padding: `7px 8px 7px ${indent}px`,
          margin: '0 4px', borderRadius: 4,
          cursor: isFolder ? 'pointer' : 'grab',
          userSelect: 'none',
          background: hovered ? '#f0f0f0' : 'transparent',
          color: '#222',
        }}
      >
        {/* Chevron */}
        <span style={{
          width: 10, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#aaa',
          transform: isFolder && open ? 'rotate(90deg)' : 'rotate(0)',
          transition: 'transform 0.14s',
          visibility: isFolder ? 'visible' : 'hidden',
        }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <polyline points="2.5,1.5 6.5,4.5 2.5,7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>

        {/* Folder / report icon */}
        {isFolder ? (
          open ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e9a825" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              <line x1="2" y1="10" x2="22" y2="10"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          )
        ) : (
          <svg width="14" height="14" viewBox="0 0 32 32" fill="#1a1a1a" style={{ flexShrink: 0 }}>
            <path d="M25.7,9.3l-7-7C18.5,2.1,18.3,2,18,2H8C6.9,2,6,2.9,6,4v24c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V10C26,9.7,25.9,9.5,25.7,9.3z M18,4.4l5.6,5.6H18V4.4z M24,28H8V4h8v6c0,1.1,0.9,2,2,2h6V28z"/>
            <rect x="10" y="22" width="12" height="2"/>
            <rect x="10" y="16" width="12" height="2"/>
          </svg>
        )}

        {/* Label */}
        <span style={{ fontSize: 12, lineHeight: '1.35', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {node.label}
        </span>

        {/* Open button — reports only; always in DOM to prevent jitter */}
        {!isFolder && (
          <button
            onClick={e => { e.stopPropagation(); onOpen?.(node) }}
            style={{
              fontSize: 11, color: '#378ADD', background: 'none',
              border: 'none', cursor: 'pointer',
              padding: '2px 6px', borderRadius: 4, lineHeight: 1.5,
              flexShrink: 0,
              visibility: hovered ? 'visible' : 'hidden',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e8f2ff'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            Open
          </button>
        )}
      </div>

      {/* Children */}
      {isFolder && open && node.children?.length > 0 && node.children.map(child => (
        <ReportTreeNode key={child.id} node={child} depth={depth + 1} onOpen={onOpen} onDragStart={onDragStart} onDragEnd={onDragEnd} />
      ))}
    </div>
  )
}

function InventoryBrowserPane({ onClose, onOpen, onPin, pinned, onDragStart, onDragEnd }) {
  return (
    <div style={{
      width: 272, flexShrink: 0,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      ...(pinned
        ? { borderRight: '1px solid #e8e8e8' }
        : {
            border: '1px solid #e8e8e8',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
          }
      ),
    }}>
      {/* Header */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 10px 0 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>Inventory</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <button
            onClick={onPin}
            title={pinned ? 'Unpin' : 'Pin to sidebar'}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: pinned ? '#378ADD' : '#aaa',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; if (!pinned) e.currentTarget.style.color = '#555' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; if (!pinned) e.currentTarget.style.color = '#aaa' }}
          >
            <PinIcon pinned={pinned} />
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#aaa' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#555' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }} className="scrollbar-thin">
        {REPORT_TREE.map(node => (
          <ReportTreeNode
            key={node.id}
            node={node}
            depth={0}
            onOpen={onOpen}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  )
}

/* ── AppFrame ────────────────────────────────────────────────────────────── */
export default function AppFrame({ children, activeView, onGoHome, onGoAI, onGoNetwork, onGoChangeAnalysis, currentSessionName, activeSessionListId, onOpenSession, networkPanel, onNetworkPanelClick, isTransitioning, onOpenTab, onOpenReportTab, onDragMapStateChange }) {
  const [sidebarExpanded, setSidebarExpanded]   = useState(true)
  const [showHistory, setShowHistory]           = useState(false)
  const [networkPaneOpen, setNetworkPaneOpen]   = useState(false)
  const [networkPinned, setNetworkPinned]       = useState(false)
  const [networkTab, setNetworkTab]             = useState('site')
  const [inventoryPaneOpen, setInventoryPaneOpen] = useState(false)
  const [inventoryPinned,   setInventoryPinned]   = useState(false)
  const [draggingMap,    setDraggingMap]    = useState(null)  // { id, name }
  const [draggingReport, setDraggingReport] = useState(null)  // { id, label }
  const [isDragOver, setIsDragOver]         = useState(false)

  function handleSelectSession(id) {
    onOpenSession?.(id)
    setShowHistory(false)
  }

  function handleNetworkToggle() {
    if (networkPinned) {
      setNetworkPinned(false)
      setNetworkPaneOpen(false)
    } else {
      const opening = !networkPaneOpen
      setNetworkPaneOpen(prev => !prev)
      if (opening) {
        setInventoryPaneOpen(false)
        setShowHistory(false)
      }
    }
  }

  function handleNetworkClose() {
    setNetworkPaneOpen(false)
    setNetworkPinned(false)
  }

  function handleNetworkPin() {
    setNetworkPinned(p => !p)
  }

  const networkActive = networkPaneOpen || networkPinned

  function handleInventoryToggle() {
    if (inventoryPinned) {
      setInventoryPinned(false)
      setInventoryPaneOpen(false)
    } else {
      const opening = !inventoryPaneOpen
      setInventoryPaneOpen(prev => !prev)
      if (opening) {
        setNetworkPaneOpen(false)
        setNetworkPinned(false)
        setShowHistory(false)
      }
    }
  }

  function handleInventoryClose() {
    setInventoryPaneOpen(false)
    setInventoryPinned(false)
  }

  function handleInventoryPin() {
    setInventoryPinned(p => !p)
  }

  const inventoryActive = inventoryPaneOpen || inventoryPinned

  function handleHistoryToggle() {
    const opening = !showHistory
    setShowHistory(prev => !prev)
    if (opening) {
      setNetworkPaneOpen(false)
      setNetworkPinned(false)
      setInventoryPaneOpen(false)
      setInventoryPinned(false)
    }
  }

  function handleMapDragStart(map)       { setDraggingMap(map); onDragMapStateChange?.(true) }
  function handleMapDragEnd()            { setDraggingMap(null); setIsDragOver(false); onDragMapStateChange?.(false) }
  function handleReportDragStart(report) { setDraggingReport(report) }
  function handleReportDragEnd()         { setDraggingReport(null); setIsDragOver(false) }
  function handleDropZoneDrop(e) {
    e.preventDefault()
    if (draggingMap)    { onOpenTab?.(draggingMap.id, draggingMap.name) }
    if (draggingReport?.id === 'device-report') { onOpenReportTab?.(draggingReport.id, draggingReport.label) }
    setDraggingMap(null)
    setDraggingReport(null)
    setIsDragOver(false)
    onDragMapStateChange?.(false)
  }
  const isDragging = draggingMap || draggingReport
  const draggingLabel = draggingMap ? draggingMap.name : draggingReport?.label

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'row',
      background: '#fff',
    }}>
      {/* ── Left sidebar ── */}
      <Sidebar
        expanded={sidebarExpanded}
        onToggle={() => setSidebarExpanded(e => !e)}
        onNew={onGoHome}
        onGoHome={onGoHome}
        onGoNetwork={handleNetworkToggle}
        networkActive={networkActive}
        onGoInventory={handleInventoryToggle}
        inventoryActive={inventoryActive}
        sessions={FAKE_SESSIONS}
        currentSessionName={currentSessionName}
        activeSessionListId={activeSessionListId}
        onSelectSession={handleSelectSession}
        onShowHistory={handleHistoryToggle}
        historyActive={showHistory}
      />

      {/* ── Pinned network pane — part of flex flow ── */}
      {networkPinned && (
        <NetworkBrowserPane
          tab={networkTab}
          onTabChange={setNetworkTab}
          onPin={handleNetworkPin}
          onClose={handleNetworkClose}
          pinned={true}
          onOpenTab={onOpenTab}
          onMapDragStart={handleMapDragStart}
          onMapDragEnd={handleMapDragEnd}
        />
      )}

      {/* ── Pinned inventory pane — part of flex flow ── */}
      {inventoryPinned && (
        <InventoryBrowserPane
          onClose={handleInventoryClose}
          onPin={handleInventoryPin}
          pinned={true}
          onOpen={node => { if (node.id === 'device-report') onOpenReportTab?.(node.id, node.label) }}
          onDragStart={handleReportDragStart}
          onDragEnd={handleReportDragEnd}
        />
      )}

      {/* ── Content area (position:relative so floats are relative to it) ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Floating network pane */}
        {networkPaneOpen && !networkPinned && (
          <>
            {!isDragging && (
              <div
                onClick={() => setNetworkPaneOpen(false)}
                style={{ position: 'absolute', inset: 0, zIndex: 199 }}
              />
            )}
            <div style={{
              position: 'absolute', left: 8, top: 8,
              height: 'calc(100% - 16px)',
              zIndex: 200,
            }}>
              <NetworkBrowserPane
                tab={networkTab}
                onTabChange={setNetworkTab}
                onPin={handleNetworkPin}
                onClose={handleNetworkClose}
                pinned={false}
                onOpenTab={onOpenTab}
                onMapDragStart={handleMapDragStart}
                onMapDragEnd={handleMapDragEnd}
              />
            </div>
          </>
        )}

        {/* Floating inventory pane */}
        {inventoryPaneOpen && !inventoryPinned && (
          <>
            {!isDragging && (
              <div
                onClick={() => setInventoryPaneOpen(false)}
                style={{ position: 'absolute', inset: 0, zIndex: 199 }}
              />
            )}
            <div style={{
              position: 'absolute', left: 8, top: 8,
              height: 'calc(100% - 16px)',
              zIndex: 200,
            }}>
              <InventoryBrowserPane
                onClose={handleInventoryClose}
                onPin={handleInventoryPin}
                pinned={false}
                onOpen={node => { if (node.id === 'device-report') onOpenReportTab?.(node.id, node.label) }}
                onDragStart={handleReportDragStart}
                onDragEnd={handleReportDragEnd}
              />
            </div>
          </>
        )}

        {/* Session history pane (collapsed sidebar mode) */}
        {showHistory && (
          <>
            <div
              onClick={() => setShowHistory(false)}
              style={{ position: 'absolute', inset: 0, zIndex: 199 }}
            />
            <div style={{ position: 'absolute', left: 8, top: 8, zIndex: 200 }}>
              <SessionHistoryPane
                onClose={() => setShowHistory(false)}
                currentSessionName={currentSessionName}
                onSelectSession={handleSelectSession}
              />
            </div>
          </>
        )}

        {/* Drop zone — covers the content area when dragging a map or report */}
        {isDragging && (
          <div
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
            onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true) }}
            onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setIsDragOver(false) }}
            onDrop={handleDropZoneDrop}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 300,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: isDragOver ? 'rgba(55,138,221,0.08)' : 'rgba(55,138,221,0.03)',
              transition: 'background 0.15s',
            }}
          >
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              padding: '28px 44px',
              border: `2px dashed ${isDragOver ? '#378ADD' : 'rgba(55,138,221,0.45)'}`,
              borderRadius: 14,
              background: isDragOver ? 'rgba(255,255,255,0.97)' : 'rgba(255,255,255,0.88)',
              boxShadow: isDragOver ? '0 4px 24px rgba(55,138,221,0.18)' : 'none',
              transform: isDragOver ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.15s ease',
              pointerEvents: 'none',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke={isDragOver ? '#378ADD' : '#aaa'} strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'stroke 0.15s' }}>
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/>
                <line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
              <div style={{ fontSize: 13, fontWeight: 600, color: isDragOver ? '#111' : '#555', transition: 'color 0.15s' }}>
                Drop to open in workspace
              </div>
              <div style={{ fontSize: 12, color: isDragOver ? '#378ADD' : '#888', transition: 'color 0.15s' }}>
                {draggingLabel}
              </div>
            </div>
          </div>
        )}

        {/* Inner row layout for network view (rail + device pane + main) */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'row' }}>
          {activeView === 'network' && (
            <aside style={{
              width: 44, flexShrink: 0, height: '100%',
              background: '#fafafa', borderRight: '1px solid #ebebeb',
              display: 'flex', flexDirection: 'column', padding: '10px 0', gap: 2,
            }}>
              {NET_RAIL.map((slot) => {
                if (slot.id === 'divider') return <div key="div" style={{ height: 1, background: '#e8e8e8', margin: '6px 10px' }} />
                const active = networkPanel === slot.id
                const Icon = slot.Icon
                return (
                  <div key={slot.id} className="sbi-wrap" onClick={() => onNetworkPanelClick(slot.id)}>
                    <div className="sbi-icon" style={{ background: active ? '#ece9e2' : 'transparent', color: '#514f49' }}>
                      <Icon />
                    </div>
                    <div className="sbi-tooltip">{slot.tooltip}</div>
                  </div>
                )
              })}
            </aside>
          )}
          {activeView === 'network' && networkPanel === 'devices' && (
            <DeviceBrowserPane onClose={() => onNetworkPanelClick('devices')} />
          )}
          <main style={{
            flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 0.18s ease',
          }}>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
