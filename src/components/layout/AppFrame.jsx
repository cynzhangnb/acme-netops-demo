import { useState, useEffect, useRef } from 'react'
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

/* ── Shared session-row icons ────────────────────────────────────────────── */
function SessionOverflowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
    </svg>
  )
}
function SessionRenameIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function SessionTrashIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

/* ── Session History Pane ────────────────────────────────────────────────── */
function SessionHistoryPane({ onClose, currentSessionName, onSelectSession, pinnedIds = new Set(), onTogglePin }) {
  const [hoveredId,       setHoveredId]       = useState(null)
  const [openMenuId,      setOpenMenuId]      = useState(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)
  const [editingId,       setEditingId]       = useState(null)
  const [editValue,       setEditValue]       = useState('')
  const [localNames,      setLocalNames]      = useState({})
  const [deletedIds,      setDeletedIds]      = useState(new Set())
  const [menuPos,         setMenuPos]         = useState(null)
  const menuRef    = useRef(null)
  const editInputRef = useRef(null)

  /* Close overflow menu on outside click */
  useEffect(() => {
    if (!openMenuId) return
    const handler = e => {
      const path = e.composedPath ? e.composedPath() : []
      if (!path.includes(menuRef.current) && !menuRef.current?.contains(e.target)) {
        setOpenMenuId(null); setDeleteConfirmId(null); setMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  /* Focus rename input when editing starts */
  useEffect(() => { if (editingId) editInputRef.current?.focus() }, [editingId])

  const sessions = FAKE_SESSIONS.filter(s => !s.current && !deletedIds.has(s.id))
  const pinned   = sessions.filter(s => pinnedIds.has(s.id))
  const recent   = sessions.filter(s => !pinnedIds.has(s.id))

  function openOverflowMenu(e, s) {
    e.preventDefault(); e.stopPropagation()
    if (openMenuId === s.id) { setOpenMenuId(null); setMenuPos(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpenMenuId(s.id); setDeleteConfirmId(null)
  }

  function startRename(s) {
    setOpenMenuId(null); setMenuPos(null)
    setEditingId(s.id); setEditValue(localNames[s.id] || s.name)
  }

  function confirmRename() {
    const t = editValue.trim()
    if (t && editingId) setLocalNames(prev => ({ ...prev, [editingId]: t }))
    setEditingId(null)
  }

  function confirmDelete(id) {
    setDeletedIds(prev => { const n = new Set(prev); n.add(id); return n })
    setOpenMenuId(null); setMenuPos(null); setDeleteConfirmId(null)
  }

  const renderRow = (s) => {
    const isInteractive = s.id === 's1' || s.id === 's2'
    const isPinned      = pinnedIds.has(s.id)
    const isHovered     = hoveredId === s.id
    const isEditing     = editingId === s.id
    const displayName   = localNames[s.id] || s.name

    return (
      <div
        key={s.id}
        onClick={() => { if (isEditing || !isInteractive) return; onSelectSession?.(s.id); onClose() }}
        onMouseEnter={() => setHoveredId(s.id)}
        onMouseLeave={() => setHoveredId(prev => prev === s.id ? null : prev)}
        style={{
          display: 'flex', alignItems: 'center',
          padding: '5px 8px 5px 14px',
          cursor: isInteractive && !isEditing ? 'pointer' : 'default',
          background: isHovered ? '#f0f0f0' : 'transparent',
          transition: 'background 0.1s',
        }}
      >
        {isEditing ? (
          <input
            ref={editInputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={confirmRename}
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); confirmRename() }
              if (e.key === 'Escape') { e.preventDefault(); setEditingId(null) }
            }}
            onClick={e => e.stopPropagation()}
            style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#111', border: '1px solid #c8c8c8', borderRadius: 4, padding: '1px 5px', outline: 'none', background: '#fff' }}
          />
        ) : (
          <span style={{ fontSize: 12, fontWeight: 400, color: '#222', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {displayName}
          </span>
        )}

        {/* Right slot: timestamp fades, pin + overflow fade in on hover */}
        <div style={{ position: 'relative', flexShrink: 0, marginLeft: 8, minWidth: 52, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 11, color: '#666', opacity: isHovered ? 0 : 1, transition: 'opacity 0.12s', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
            {s.ago}
          </span>
          {/* Pin */}
          <button
            onClick={e => { e.stopPropagation(); onTogglePin?.(s.id) }}
            title={isPinned ? 'Unpin' : 'Pin session'}
            style={{
              position: 'absolute', right: 22, width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3,
              color: '#6b7280',
              opacity: isHovered || openMenuId === s.id ? 1 : 0,
              pointerEvents: isHovered || openMenuId === s.id ? 'auto' : 'none',
              transition: 'opacity 0.12s, background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e5e1da'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
          >
            {isPinned
              ? <svg width="11" height="11" viewBox="0 0 32 32" fill="currentColor"><path d="M28.5858,13.3137,30,11.9,20,2,18.6858,3.415l1.1858,1.1857L8.38,14.3225,6.6641,12.6067,5.25,14l5.6572,5.6773L2,28.5831,3.41,30l8.9111-8.9087L18,26.7482l1.3929-1.414L17.6765,23.618l9.724-11.4895Z"/></svg>
              : <svg width="11" height="11" viewBox="0 0 32 32" fill="currentColor"><path d="M28.59,13.31,30,11.9,20,2,18.69,3.42,19.87,4.6,8.38,14.32,6.66,12.61,5.25,14l5.66,5.68L2,28.58,3.41,30l8.91-8.91L18,26.75l1.39-1.42-1.71-1.71L27.4,12.13ZM16.26,22.2,9.8,15.74,21.29,6,26,10.71Z"/></svg>
            }
          </button>
          {/* Overflow (⋯) */}
          <button
            onMouseDown={e => openOverflowMenu(e, s)}
            title="More options"
            style={{
              position: 'absolute', right: -2, width: 20, height: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: openMenuId === s.id ? '#e0e0e0' : 'none',
              border: 'none', cursor: 'pointer', borderRadius: 3,
              color: '#6b7280',
              opacity: isHovered || openMenuId === s.id ? 1 : 0,
              pointerEvents: isHovered || openMenuId === s.id ? 'auto' : 'none',
              transition: 'opacity 0.12s, background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#e5e1da'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.background = openMenuId === s.id ? '#e0e0e0' : 'none'; e.currentTarget.style.color = '#6b7280' }}
          >
            <SessionOverflowIcon />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      width: 280, flexShrink: 0,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      height: '100%',
      border: '1px solid #e8e8e8',
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>Sessions</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#374151' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        {pinned.length > 0 && (
          <>
            <div style={{ padding: '5px 14px 3px', fontSize: 10.5, fontWeight: 500, color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pinned</div>
            {pinned.map(renderRow)}
            {recent.length > 0 && <div style={{ height: 1, background: '#ebebeb', margin: '4px 8px' }} />}
          </>
        )}
        {recent.map(renderRow)}
      </div>

      {/* Overflow menu — fixed so it escapes overflow:hidden */}
      {openMenuId && menuPos && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed', top: menuPos.top, right: menuPos.right,
            zIndex: 1000,
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden',
          }}
        >
          {deleteConfirmId === openMenuId ? (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#222', fontWeight: 500, lineHeight: 1.4 }}>Delete this session?</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>This action cannot be undone.</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(null) }}
                  style={{ padding: '5px 12px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', fontSize: 12, color: '#555', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                >Cancel</button>
                <button
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); confirmDelete(openMenuId) }}
                  style={{ padding: '5px 12px', border: 'none', borderRadius: 6, background: '#d32f2f', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#b71c1c' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#d32f2f' }}
                >Delete</button>
              </div>
            </div>
          ) : (
            <>
              <div
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); const s = sessions.find(x => x.id === openMenuId); if (s) startRename(s) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', fontSize: 12, color: '#222', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <SessionRenameIcon /> Rename
              </div>
              <div
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(openMenuId) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', fontSize: 12, color: '#d32f2f', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <SessionTrashIcon /> Delete
              </div>
            </>
          )}
        </div>
      )}
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
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: '#888' }}>
      <rect x="8" y="2" width="8" height="5" rx="1"/>
      <line x1="12" y1="7" x2="12" y2="11"/>
      <line x1="4" y1="11" x2="20" y2="11"/>
      <line x1="4"  y1="11" x2="4"  y2="16"/>
      <line x1="12" y1="11" x2="12" y2="16"/>
      <line x1="20" y1="11" x2="20" y2="16"/>
      <circle cx="4"  cy="19" r="2.5"/>
      <circle cx="12" cy="19" r="2.5"/>
      <circle cx="20" cy="19" r="2.5"/>
    </svg>
  )
}

/* Pin icon — outline stroke when floating, filled when pinned */
function PinIcon({ pinned }) {
  if (pinned) {
    /* pin--filled.svg: solid silhouette = visually "locked in place" */
    return (
      <svg
        width="15" height="15" viewBox="0 0 32 32"
        fill="currentColor"
        style={{ display: 'block', flexShrink: 0 }}
      >
        <path d="M28.5858,13.3137,30,11.9,20,2,18.6858,3.415l1.1858,1.1857L8.38,14.3225,6.6641,12.6067,5.25,14l5.6572,5.6773L2,28.5831,3.41,30l8.9111-8.9087L18,26.7482l1.3929-1.414L17.6765,23.618l9.724-11.4895Z"/>
      </svg>
    )
  }
  /* pin.svg: outline silhouette — floating state */
  return (
    <svg
      width="15" height="15" viewBox="0 0 32 32"
      fill="currentColor"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <path d="M28.59,13.31,30,11.9,20,2,18.69,3.42,19.87,4.6,8.38,14.32,6.66,12.61,5.25,14l5.66,5.68L2,28.58,3.41,30l8.91-8.91L18,26.75l1.39-1.42-1.71-1.71L27.4,12.13ZM16.26,22.2,9.8,15.74,21.29,6,26,10.71Z"/>
    </svg>
  )
}

function MapList({ onOpenTab, onMapDragStart, onMapDragEnd }) {
  const [hoveredId, setHoveredId]   = useState(null)
  const [openingId, setOpeningId]   = useState(null)

  function handleOpen(e, map) {
    e.stopPropagation()
    if (openingId) return
    setOpeningId(map.id)
    onOpenTab(map.id, map.name)
    setTimeout(() => setOpeningId(null), 1200)
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
      {MAP_INSTANCES.map((map, i) => {
        const isOpening = openingId === map.id
        return (
          <div
            key={map.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('text/plain', map.id)
              e.dataTransfer.effectAllowed = 'copy'
              requestAnimationFrame(() => onMapDragStart(map))
            }}
            onDragEnd={onMapDragEnd}
            onMouseEnter={() => setHoveredId(map.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 14px',
              background: isOpening ? '#f0f6ff' : hoveredId === map.id ? '#f0f0f0' : 'transparent',
              transition: 'background 0.15s',
              cursor: 'grab',
              userSelect: 'none',
            }}
          >
            <MapItemIcon />
            <span style={{ flex: 1, fontSize: 12, color: isOpening ? '#378ADD' : '#222', lineHeight: 1.4, transition: 'color 0.15s' }}>{map.name}</span>
            {/* plain text link — no button chrome whatsoever */}
            <span
              onClick={(e) => handleOpen(e, map)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                fontSize: 12, color: '#378ADD',
                cursor: isOpening ? 'default' : 'pointer',
                flexShrink: 0, userSelect: 'none', lineHeight: 1.5,
                visibility: (hoveredId === map.id || isOpening) ? 'visible' : 'hidden',
                opacity: isOpening ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!isOpening) e.currentTarget.style.color = '#1a56a0' }}
              onMouseLeave={e => { if (!isOpening) e.currentTarget.style.color = '#378ADD' }}
            >
              {isOpening ? (
                <>
                  <span style={{
                    display: 'inline-block', width: 9, height: 9,
                    border: '1.5px solid #378ADD', borderTopColor: 'transparent',
                    borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
                  }} />
                  Opening
                </>
              ) : 'Open'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Device category icons — match sidebar icon style (#514f49, same stroke weight) ── */
const DIC = { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: '#514f49', strokeWidth: '1.6', strokeLinecap: 'round', strokeLinejoin: 'round' }
function CatRouterIcon()   { return <svg {...DIC}><circle cx="12" cy="12" r="9"/><line x1="3" y1="12" x2="21" y2="12"/><path d="M12 3a15 15 0 0 1 4 9 15 15 0 0 1-4 9 15 15 0 0 1-4-9 15 15 0 0 1 4-9z"/></svg> }
function CatSwitchIcon()   { return <svg {...DIC}><rect x="2" y="7" width="20" height="10" rx="2"/><line x1="6" y1="11" x2="6" y2="13"/><line x1="10" y1="11" x2="10" y2="13"/><line x1="14" y1="11" x2="14" y2="13"/><line x1="18" y1="11" x2="18" y2="13"/></svg> }
function CatFirewallIcon() { return <svg {...DIC}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function CatServerIcon()   { return <svg {...DIC}><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> }
function CatDefaultIcon()  { return <svg {...DIC}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg> }

const DEVICE_TYPE_ICON = {
  'Core Router':          CatRouterIcon,
  'WAN Router':           CatRouterIcon,
  'Firewall':             CatFirewallIcon,
  'Load Balancer':        CatFirewallIcon,
  'Distribution Switch':  CatSwitchIcon,
  'Access Switch':        CatSwitchIcon,
}
function CategoryIcon({ type }) {
  const Icon = DEVICE_TYPE_ICON[type] || CatDefaultIcon
  return <Icon />
}

/* Group allDevices by type, preserving insertion order */
function groupDevicesByType(devices) {
  const map = new Map()
  devices.forEach(d => {
    if (!map.has(d.type)) map.set(d.type, [])
    map.get(d.type).push(d)
  })
  return Array.from(map.entries()).map(([type, items]) => ({ type, items }))
}

/* ── Device tree (used inside NetworkBrowserPane Device tab) ─────────────── */
function DeviceTreeTab({ onOpenDeviceInMap, onDeviceDragStart, onDeviceDragEnd }) {
  const [openGroups, setOpenGroups] = useState(() => {
    const init = {}
    groupDevicesByType(allDevices).forEach(({ type }) => { init[type] = true })
    return init
  })
  const [search, setSearch] = useState('')
  const [hoveredId, setHoveredId] = useState(null)
  const [dragging, setDragging] = useState(false)
  const query = search.trim().toLowerCase()

  const groups = groupDevicesByType(allDevices)
    .map(g => ({
      ...g,
      items: query ? g.items.filter(d => d.hostname.toLowerCase().includes(query) || d.ip.includes(query)) : g.items,
    }))
    .filter(g => !query || g.items.length > 0)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Search */}
      <div style={{ padding: '5px 10px', flexShrink: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#fff', border: '1px solid #e4e4e4', borderRadius: 6,
          padding: '3px 8px',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search devices…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 12, color: '#222',
            }}
          />
        </div>
      </div>

      {/* Tree */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        {groups.map(({ type, items }) => {
          const open = openGroups[type] ?? true
          return (
            <div key={type}>
              {/* Category header — same padding/density as map rows */}
              <div
                onClick={() => setOpenGroups(p => ({ ...p, [type]: !p[type] }))}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 14px', cursor: 'pointer', userSelect: 'none',
                  background: 'transparent', transition: 'background 0.12s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.14s', color: '#bbb' }}>
                  <polyline points="2.5,1.5 6.5,4.5 2.5,7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <CategoryIcon type={type} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#222', flex: 1 }}>{type}</span>
                <span style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>{items.length}</span>
              </div>

              {/* Device rows — single line, same density, no IP, no status */}
              {open && items.map(d => (
                <div
                  key={d.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', d.id)
                    e.dataTransfer.effectAllowed = 'copy'
                    requestAnimationFrame(() => { setDragging(true); onDeviceDragStart?.(d) })
                  }}
                  onDragEnd={() => { setDragging(false); onDeviceDragEnd?.() }}
                  onMouseEnter={() => setHoveredId(d.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 14px 5px 31px',
                    cursor: dragging ? 'grabbing' : 'grab',
                    userSelect: 'none',
                    background: hoveredId === d.id ? '#f0f0f0' : 'transparent',
                    transition: 'background 0.12s',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{d.hostname}</span>
                  {/* "Open in map" hover link */}
                  <span
                    onClick={(e) => { e.stopPropagation(); onOpenDeviceInMap?.(d) }}
                    style={{
                      fontSize: 12, color: '#378ADD',
                      cursor: 'pointer', flexShrink: 0,
                      userSelect: 'none', lineHeight: 1.5,
                      visibility: hoveredId === d.id ? 'visible' : 'hidden',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#1a56a0' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#378ADD' }}
                  >
                    Open in map
                  </span>
                </div>
              ))}
            </div>
          )
        })}
      </div>

    </div>
  )
}

function NetworkBrowserPane({ tab, onTabChange, onPin, onClose, pinned, onOpenTab, onMapDragStart, onMapDragEnd, onDeviceDragStart, onDeviceDragEnd, onOpenDeviceInMap }) {
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
              color: '#6b7280',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
          >
            <PinIcon pinned={pinned} />
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6b7280',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
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
      ) : tab === 'device' ? (
        <DeviceTreeTab onOpenDeviceInMap={onOpenDeviceInMap} onDeviceDragStart={onDeviceDragStart} onDeviceDragEnd={onDeviceDragEnd} />
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
          padding: `5px 14px 5px ${indent}px`,
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

        {/* Folder icon — closed: simple outline, open: open-folder metaphor (both stroke, no fill) */}
        {isFolder ? (
          open ? (
            /* Open folder — front flap lifted, showing interior */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>
            </svg>
          ) : (
            /* Closed folder — simple outline */
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          )
        ) : (
          <svg width="14" height="14" viewBox="0 0 32 32" fill="currentColor" style={{ flexShrink: 0 }}>
            <path d="M25.7,9.3l-7-7C18.5,2.1,18.3,2,18,2H8C6.9,2,6,2.9,6,4v24c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V10C26,9.7,25.9,9.5,25.7,9.3z M18,4.4l5.6,5.6H18V4.4z M24,28H8V4h8v6c0,1.1,0.9,2,2,2h6V28z"/>
            <rect x="10" y="22" width="12" height="2"/>
            <rect x="10" y="16" width="12" height="2"/>
          </svg>
        )}

        {/* Label */}
        <span style={{ fontSize: 12, fontWeight: 400, lineHeight: '1.35', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {node.label}
        </span>

        {/* Open button — reports only; always in DOM to prevent jitter */}
        {!isFolder && (
          <span
            onClick={e => { e.stopPropagation(); onOpen?.(node) }}
            style={{
              fontSize: 12, color: '#378ADD',
              cursor: 'pointer', flexShrink: 0,
              userSelect: 'none', lineHeight: 1.5,
              visibility: hovered ? 'visible' : 'hidden',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#1a56a0' }}
            onMouseLeave={e => { e.currentTarget.style.color = '#378ADD' }}
          >
            Open
          </span>
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
      width: 280, flexShrink: 0,
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
              color: '#6b7280',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
          >
            <PinIcon pinned={pinned} />
          </button>
          <button
            onClick={onClose}
            title="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: 26, height: 26, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
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
export default function AppFrame({ children, activeView, onGoHome, onGoAI, onGoNetwork, onGoChangeAnalysis, currentSessionName, activeSessionListId, onOpenSession, networkPanel, onNetworkPanelClick, isTransitioning, onOpenTab, onOpenReportTab, onDragMapStateChange, openNetworkPaneRequest, onDeviceDrop }) {
  const [sidebarExpanded, setSidebarExpanded]   = useState(true)
  const [showHistory, setShowHistory]           = useState(false)
  const [networkPaneOpen, setNetworkPaneOpen]   = useState(false)
  const [networkPinned, setNetworkPinned]       = useState(false)
  const [networkTab, setNetworkTab]             = useState('site')
  const [inventoryPaneOpen, setInventoryPaneOpen] = useState(false)
  const [inventoryPinned,   setInventoryPinned]   = useState(false)
  const [draggingMap,    setDraggingMap]    = useState(null)  // { id, name }
  const [draggingReport, setDraggingReport] = useState(null)  // { id, label }
  const [draggingDevice, setDraggingDevice] = useState(null)  // device object
  const [isDragOver, setIsDragOver]         = useState(false)
  const [pinnedSessionIds, setPinnedSessionIds] = useState(new Set())

  function toggleSessionPin(id) {
    setPinnedSessionIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSelectSession(id) {
    onOpenSession?.(id)
    setShowHistory(false)
  }

  function handleNetworkToggle() {
    if (networkPinned) {
      // clicking the already-pinned pane → unpin / close it
      setNetworkPinned(false)
      setNetworkPaneOpen(false)
    } else if (inventoryPinned) {
      // swap: inventory was pinned → close it, open network as pinned
      setInventoryPinned(false)
      setInventoryPaneOpen(false)
      setNetworkPinned(true)
      setShowHistory(false)
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
      // clicking the already-pinned pane → unpin / close it
      setInventoryPinned(false)
      setInventoryPaneOpen(false)
    } else if (networkPinned) {
      // swap: network was pinned → close it, open inventory as pinned
      setNetworkPinned(false)
      setNetworkPaneOpen(false)
      setInventoryPinned(true)
      setShowHistory(false)
    } else {
      const opening = !inventoryPaneOpen
      setInventoryPaneOpen(prev => !prev)
      if (opening) {
        setNetworkPaneOpen(false)
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

  /* Open NetworkBrowserPane to a specific tab when requested externally (e.g. from blank canvas) */
  useEffect(() => {
    if (!openNetworkPaneRequest) return
    setNetworkPaneOpen(true)
    setNetworkTab(openNetworkPaneRequest.tab ?? 'device')
    setInventoryPaneOpen(false)
    setInventoryPinned(false)
    setShowHistory(false)
  }, [openNetworkPaneRequest]) // eslint-disable-line react-hooks/exhaustive-deps

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
  function handleDeviceDragStart(device) { setDraggingDevice(device); onDragMapStateChange?.(true) }
  function handleDeviceDragEnd()         { setDraggingDevice(null); setIsDragOver(false); onDragMapStateChange?.(false) }
  function handleOpenDeviceInMap(device, actionId) {
    onDeviceDrop?.(device)
  }
  function handleDropZoneDrop(e) {
    e.preventDefault()
    if (draggingMap)    { onOpenTab?.(draggingMap.id, draggingMap.name) }
    if (draggingReport?.id === 'device-report') { onOpenReportTab?.(draggingReport.id, draggingReport.label) }
    if (draggingDevice) { onDeviceDrop?.(draggingDevice) }
    setDraggingMap(null)
    setDraggingReport(null)
    setDraggingDevice(null)
    setIsDragOver(false)
    onDragMapStateChange?.(false)
  }
  const isDragging = draggingMap || draggingReport || draggingDevice
  const draggingLabel = draggingMap ? draggingMap.name : draggingReport?.label || draggingDevice?.hostname

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
        onGoChangeAnalysis={onGoChangeAnalysis}
        sessions={FAKE_SESSIONS}
        currentSessionName={currentSessionName}
        activeSessionListId={activeSessionListId}
        onSelectSession={handleSelectSession}
        pinnedIds={pinnedSessionIds}
        onTogglePin={toggleSessionPin}
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
          onDeviceDragStart={handleDeviceDragStart}
          onDeviceDragEnd={handleDeviceDragEnd}
          onOpenDeviceInMap={handleOpenDeviceInMap}
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

        {/* History button — top-left of home screen, only when sidebar is collapsed */}
        {!sidebarExpanded && activeView === 'home' && (
          <button
            onClick={handleHistoryToggle}
            title="Show Sessions"
            style={{
              position: 'absolute', left: 8, top: 8, zIndex: 50,
              width: 30, height: 30, borderRadius: 7,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: showHistory ? '#ece9e2' : 'transparent',
              border: '1px solid',
              borderColor: showHistory ? '#ddd9d0' : 'transparent',
              cursor: 'pointer', color: '#555',
              transition: 'background 0.12s, border-color 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { if (!showHistory) { e.currentTarget.style.background = '#f0ede7'; e.currentTarget.style.borderColor = '#e5e1db'; e.currentTarget.style.color = '#222' } }}
            onMouseLeave={e => { if (!showHistory) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#555' } }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/>
              <polyline points="12 7 12 12 15.5 15.5"/>
            </svg>
          </button>
        )}

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
                onDeviceDragStart={handleDeviceDragStart}
                onDeviceDragEnd={handleDeviceDragEnd}
                onOpenDeviceInMap={handleOpenDeviceInMap}
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
            <div style={{ position: 'absolute', left: 8, top: 8, height: 'calc(100% - 16px)', zIndex: 200 }}>
              <SessionHistoryPane
                onClose={() => setShowHistory(false)}
                currentSessionName={currentSessionName}
                onSelectSession={handleSelectSession}
                pinnedIds={pinnedSessionIds}
                onTogglePin={toggleSessionPin}
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
                stroke={isDragOver ? '#378ADD' : '#aaa'} strokeWidth="1.5"
                strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'stroke 0.15s' }}>
                <rect x="8" y="2" width="8" height="5" rx="1"/>
                <line x1="12" y1="7" x2="12" y2="11"/>
                <line x1="4" y1="11" x2="20" y2="11"/>
                <line x1="4"  y1="11" x2="4"  y2="16"/>
                <line x1="12" y1="11" x2="12" y2="16"/>
                <line x1="20" y1="11" x2="20" y2="16"/>
                <circle cx="4"  cy="19" r="2.5"/>
                <circle cx="12" cy="19" r="2.5"/>
                <circle cx="20" cy="19" r="2.5"/>
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
