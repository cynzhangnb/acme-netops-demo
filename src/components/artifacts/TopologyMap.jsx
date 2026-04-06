import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Node data — 3 tiers: Core → Distribution → Access ───────────────────────
const NODES = [
  // Core layer — AS200, iBGP full mesh between the two routers
  { id: 'cr1', label: 'CR-BOS-01', ip: '10.0.0.1', type: 'core-router', px: 33, py: 12, status: 'up',       as: 'AS200' },
  { id: 'cr2', label: 'CR-BOS-02', ip: '10.0.0.2', type: 'core-router', px: 62, py: 12, status: 'up',       as: 'AS200' },
  // Distribution layer — BGP extended, 3 AS domains; routing transition points
  { id: 'ds1', label: 'DS-BOS-01', ip: '10.1.1.1', type: 'dist-switch', px: 8,  py: 45, status: 'up',       as: 'AS100' },
  { id: 'ds2', label: 'DS-BOS-02', ip: '10.1.2.1', type: 'dist-switch', px: 22, py: 45, status: 'up',       as: 'AS100' },
  { id: 'ds3', label: 'DS-BOS-03', ip: '10.1.3.1', type: 'dist-switch', px: 38, py: 45, status: 'up',       as: 'AS300' },
  { id: 'ds4', label: 'DS-BOS-04', ip: '10.1.4.1', type: 'dist-switch', px: 54, py: 45, status: 'degraded', as: 'AS300' },
  { id: 'ds5', label: 'DS-BOS-05', ip: '10.1.5.1', type: 'dist-switch', px: 68, py: 45, status: 'up',       as: 'AS65502' },
  { id: 'ds6', label: 'DS-BOS-06', ip: '10.1.6.1', type: 'dist-switch', px: 84, py: 45, status: 'up',       as: 'AS65502' },
  // Access layer — OSPF local routing
  { id: 'es1', label: 'AS-BOS-01', ip: '10.2.1.1', type: 'access-switch', px: 15, py: 78, status: 'up' },
  { id: 'es2', label: 'AS-BOS-02', ip: '10.2.2.1', type: 'access-switch', px: 46, py: 78, status: 'down' },
  { id: 'es3', label: 'AS-BOS-03', ip: '10.2.3.1', type: 'access-switch', px: 76, py: 78, status: 'up' },
]

const EDGES = [
  // iBGP — core routers (AS200 ↔ AS200, full mesh)
  { id: 'e0',  a: 'cr1', b: 'cr2' },
  // BGP — core → distribution (AS200 peering with AS100/AS300/AS65502)
  { id: 'e1',  a: 'cr1', b: 'ds1' },
  { id: 'e2',  a: 'cr1', b: 'ds2' },
  { id: 'e3',  a: 'cr1', b: 'ds3' },
  { id: 'e4',  a: 'cr1', b: 'ds4' },
  { id: 'e5',  a: 'cr2', b: 'ds3' },
  { id: 'e6',  a: 'cr2', b: 'ds4' },
  { id: 'e7',  a: 'cr2', b: 'ds5' },
  { id: 'e8',  a: 'cr2', b: 'ds6' },
  // OSPF — distribution → access (local routing)
  { id: 'e9',  a: 'ds1', b: 'es1' },
  { id: 'e10', a: 'ds2', b: 'es1' },
  { id: 'e11', a: 'ds3', b: 'es2' },
  { id: 'e12', a: 'ds4', b: 'es2' },
  { id: 'e13', a: 'ds5', b: 'es3' },
  { id: 'e14', a: 'ds6', b: 'es3' },
  // EIGRP — internal lateral links within distribution AS domains
  { id: 'e15', a: 'ds3', b: 'ds4' },
  { id: 'e16', a: 'ds5', b: 'ds6' },
]

// Protocol per edge
const EDGE_PROTOCOLS = {
  e0: 'bgp',
  e1: 'bgp', e2: 'bgp', e3: 'bgp',  e4: 'bgp',
  e5: 'bgp', e6: 'bgp', e7: 'bgp',  e8: 'bgp',
  e9: 'ospf', e10: 'ospf', e11: 'ospf',
  e12: 'ospf', e13: 'ospf', e14: 'ospf',
  e15: 'eigrp', e16: 'eigrp',
}

// Edge labels — BGP includes peer AS number in the label
const EDGE_LABELS = {
  e0: 'BGP AS200',    // iBGP between core routers
  e1: 'BGP AS100', e2: 'BGP AS100',
  e3: 'BGP AS300', e4: 'BGP AS300',
  e5: 'BGP AS300', e6: 'BGP AS300',
  e7: 'BGP AS65502', e8: 'BGP AS65502',
  e9: 'OSPF', e10: 'OSPF', e11: 'OSPF',
  e12: 'OSPF', e13: 'OSPF', e14: 'OSPF',
  e15: 'EIGRP', e16: 'EIGRP',
}


// Visual style per protocol — accessible contrast, clear hierarchy
const PROTOCOL_STYLES = {
  bgp:   { stroke: '#2563eb', strokeWidth: 2.5, opacity: 1,    dashArray: '' },
  ospf:  { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 1,    dashArray: '' },
  eigrp: { stroke: '#94a3b8', strokeWidth: 1.5, opacity: 1,    dashArray: '6 3' },
}

// Label text color — #555 on white = 5.7:1, passes WCAG AA
const LABEL_FILL = '#555'


const HIGHLIGHT_GROUPS = {
  routing: {
    nodes: ['cr1','cr2','ds1','ds2','ds3','ds4','ds5','ds6','es1','es2','es3'],
    edges: ['e0','e1','e2','e3','e4','e5','e6','e7','e8','e9','e10','e11','e12','e13','e14','e15','e16'],
    mode: 'routing',
  },
  vlan100: {
    nodes: ['cr1','ds1','ds2','es1'],
    edges: ['e9','e10','e1','e2'],
    color: '#8b5cf6',
    label: 'VLAN 100 — Management',
  },
  changes: {
    nodes: ['cr1','cr2','ds1','ds3','es1'],
    edges: ['e0','e1','e3','e5','e9'],
    color: '#f59e0b',
    label: 'Config Changes — Last 7 days',
    nodeChanges: {
      cr1: ['NTP'],
      cr2: ['BGP Policy', 'Static Route'],
      ds1: ['ACL'],
      ds3: ['Logging', 'OSPF'],
      es1: ['VLAN'],
    },
  },
}


// ─── Device icons — recognizable to network engineers ────────────────────────

// Core Router: router hardware box + wifi signal arcs (standard router icon)
function CoreRouterSvg() {
  return (
    <svg width="20" height="17" viewBox="0 0 20 17" fill="none">
      {/* Router body */}
      <rect x="1.5" y="10" width="17" height="6" rx="1.5" stroke="#555" strokeWidth="1.2"/>
      {/* Port indicators */}
      <circle cx="6"  cy="13" r="0.9" fill="#555" opacity="0.55"/>
      <circle cx="10" cy="13" r="0.9" fill="#555" opacity="0.55"/>
      <circle cx="14" cy="13" r="0.9" fill="#555" opacity="0.55"/>
      {/* Signal source dot */}
      <circle cx="10" cy="9.5" r="0.9" fill="#555"/>
      {/* Inner signal arc */}
      <path d="M7.2,7.8 Q10,5.8 12.8,7.8" stroke="#555" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      {/* Outer signal arc */}
      <path d="M4.8,5.4 Q10,1.8 15.2,5.4" stroke="#555" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
    </svg>
  )
}

// Distribution Switch (L3 / Multilayer): rectangle body + port slots + routing arrow indicator
function DistSwitchSvg() {
  const s = { stroke: '#555', strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg width="20" height="14" viewBox="0 0 20 14" fill="none">
      <rect x="1" y="2" width="18" height="10" rx="2" {...s} strokeWidth={1.3}/>
      {/* Port slots */}
      <line x1="5"  y1="5" x2="5"  y2="9" {...s} strokeWidth={1.1} opacity={0.6}/>
      <line x1="8.5" y1="5" x2="8.5" y2="9" {...s} strokeWidth={1.1} opacity={0.6}/>
      <line x1="12" y1="5" x2="12" y2="9" {...s} strokeWidth={1.1} opacity={0.6}/>
      {/* L3 routing indicator — small bidirectional arrow at right */}
      <line x1="15" y1="7" x2="18" y2="7" {...s} strokeWidth={1.1}/>
      <path d="M16,5.5 L15,7 L16,8.5" {...s} strokeWidth={1.1} fill="none"/>
      <path d="M17,5.5 L18,7 L17,8.5" {...s} strokeWidth={1.1} fill="none"/>
    </svg>
  )
}

// End System / Access Switch: desktop monitor icon
function AccessSwitchSvg() {
  return (
    <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
      {/* Monitor screen */}
      <rect x="1" y="1" width="18" height="12" rx="1.8" stroke="#555" strokeWidth="1.25"/>
      {/* Stand post */}
      <line x1="10" y1="13" x2="10" y2="16" stroke="#555" strokeWidth="1.2" strokeLinecap="round"/>
      {/* Stand base */}
      <line x1="6.5" y1="16" x2="13.5" y2="16" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

function NodeIcon({ type }) {
  if (type === 'core-router')   return <CoreRouterSvg />
  if (type === 'dist-switch')   return <DistSwitchSvg />
  return <AccessSwitchSvg />
}

function NodeChangeTag({ changes }) {
  const [hovered, setHovered] = useState(false)
  if (!changes || changes.length === 0) return null
  const label = changes.length === 1 ? changes[0] : `${changes.length} changes`
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        fontSize: 8, fontWeight: 600, padding: '1px 4px', borderRadius: 3,
        background: '#fef3c7', color: '#92400e', whiteSpace: 'nowrap', cursor: 'default',
        display: 'inline-block',
      }}>{label}</span>
      {hovered && changes.length > 1 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', borderRadius: 5,
          padding: '4px 7px', fontSize: 10, whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 100,
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <div style={{
            position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
            borderBottom: '4px solid #1a1a1a',
          }} />
          {changes.map(c => <div key={c}>{c}</div>)}
        </div>
      )}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1.5 6.5C1.5 6.5 3.5 2.5 6.5 2.5C9.5 2.5 11.5 6.5 11.5 6.5C11.5 6.5 9.5 10.5 6.5 10.5C3.5 10.5 1.5 6.5 1.5 6.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6.5" cy="6.5" r="1.5" fill="currentColor" opacity="0.7"/>
    </svg>
  )
}
function EyeOffIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1.5 6.5C1.5 6.5 3.5 2.5 6.5 2.5C9.5 2.5 11.5 6.5 11.5 6.5C11.5 6.5 9.5 10.5 6.5 10.5C3.5 10.5 1.5 6.5 1.5 6.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.35"/>
      <line x1="2" y1="2" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function ZoomInIcon()  { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="5.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1.2"/><line x1="5.5" y1="3" x2="5.5" y2="8" stroke="currentColor" strokeWidth="1.2"/><line x1="8.5" y1="8.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ZoomOutIcon() { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/><line x1="3" y1="5.5" x2="8" y2="5.5" stroke="currentColor" strokeWidth="1.2"/><line x1="8.5" y1="8.5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> }
function ResetIcon()   { return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6a4 4 0 0 1 4-4 4 4 0 0 1 2.83 1.17L11 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/><polyline points="11,2 11,5 8,5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg> }

const NODE_MENU_ITEMS = [
  { id: 'view-config', label: 'View Configuration' },
  { id: 'view-properties', label: 'View Properties' },
  { id: 'extend-neighbour', label: 'Extend Neighbors', hasSubmenu: true },
]

const EXTEND_SUBMENU_ITEMS = [
  { id: 'extend-all',      label: 'All neighbors' },
  { id: 'extend-bgp',      label: 'BGP neighbors' },
  { id: 'extend-ospf',     label: 'OSPF neighbors' },
  { id: 'extend-l2',       label: 'Layer 2 neighbors' },
  { separator: true },
  { id: 'extend-advanced', label: 'Advanced selection…' },
]

function ChevronRightIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <polyline points="3.5,2 6.5,5 3.5,8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function buildNodePrompt(actionId, node) {
  if (!node) return ''
  if (actionId === 'view-config') {
    return `Show me the running configuration for ${node.label} (${node.ip}) and explain the key sections.`
  }
  if (actionId === 'view-properties') {
    return `Show me the device properties for ${node.label} (${node.ip}), including role, status, IP, AS, and connected neighbors.`
  }
  if (actionId === 'extend-all')      return `Extend neighbor view from ${node.label} — show all directly connected neighbors.`
  if (actionId === 'extend-bgp')      return `Extend neighbor view from ${node.label} — show BGP neighbors and peering sessions.`
  if (actionId === 'extend-ospf')     return `Extend neighbor view from ${node.label} — show OSPF neighbors and adjacencies.`
  if (actionId === 'extend-l2')       return `Extend neighbor view from ${node.label} — show Layer 2 neighbors via CDP/LLDP.`
  if (actionId === 'extend-advanced') return `Show advanced neighbor selection for ${node.label} (${node.ip}).`
  return `Extend neighbour view from ${node.label} (${node.ip}) and show the next-hop devices and links around it.`
}


// ─── Component ────────────────────────────────────────────────────────────────

export default function TopologyMap({ highlight, widgetMode = false, onNodeAction, onClearOverlay }) {
  const containerRef = useRef(null)
  const outerRef     = useRef(null)
  const nodeRefs    = useRef({})
  const [lines, setLines] = useState([])
  const [zoom,  setZoom]  = useState(1)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)

  const [hoveredMenuItem, setHoveredMenuItem] = useState(null)
  const [overlayOn, setOverlayOn] = useState(true)

  // Spacebar pan
  const spaceRef     = useRef(false)
  const isPanningRef = useRef(false)
  const panStartRef  = useRef(null)
  const panRef       = useRef({ x: 0, y: 0 })
  const [pan,       setPan]       = useState({ x: 0, y: 0 })
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning,   setPanning]   = useState(false)
  // Reset visibility whenever the active overlay changes
  useEffect(() => { setOverlayOn(true) }, [highlight])

  const group         = highlight ? HIGHLIGHT_GROUPS[highlight] : null
  const isRoutingMode = group?.mode === 'routing'
  // When overlayOn is false, render the map as neutral (no highlight)
  const effectiveGroup = overlayOn ? group : null

  const computeLines = useCallback(() => {
    if (!containerRef.current) return
    const bounds = containerRef.current.getBoundingClientRect()
    if (bounds.width === 0) return
    const newLines = EDGES.map(edge => {
      const na = nodeRefs.current[edge.a]
      const nb = nodeRefs.current[edge.b]
      if (!na || !nb) return null
      const ra = na.getBoundingClientRect()
      const rb = nb.getBoundingClientRect()
      return {
        id: edge.id,
        x1: (ra.left + ra.right) / 2 - bounds.left,
        y1: (ra.top  + ra.bottom) / 2 - bounds.top,
        x2: (rb.left + rb.right) / 2 - bounds.left,
        y2: (rb.top  + rb.bottom) / 2 - bounds.top,
      }
    }).filter(Boolean)
    setLines(newLines)
  }, [])

  useEffect(() => {
    const timer = setTimeout(computeLines, 60)
    const ro = new ResizeObserver(computeLines)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => { clearTimeout(timer); ro.disconnect() }
  }, [computeLines, zoom, highlight])

  useEffect(() => {
    function closeMenu() {
      setContextMenu(null)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('mousedown', closeMenu)
    window.addEventListener('scroll', closeMenu, true)
    window.addEventListener('resize', closeMenu)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', closeMenu)
      window.removeEventListener('scroll', closeMenu, true)
      window.removeEventListener('resize', closeMenu)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === 'Space' && !e.repeat) {
        const tag = e.target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea') return
        e.preventDefault()
        spaceRef.current = true
        setSpaceDown(true)
      }
    }
    function onKeyUp(e) {
      if (e.code === 'Space') {
        spaceRef.current = false
        isPanningRef.current = false
        setSpaceDown(false)
        setPanning(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    function onMouseMove(e) {
      if (!isPanningRef.current || !panStartRef.current) return
      const newPan = {
        x: panStartRef.current.px + (e.clientX - panStartRef.current.sx),
        y: panStartRef.current.py + (e.clientY - panStartRef.current.sy),
      }
      panRef.current = newPan
      setPan(newPan)
    }
    function onMouseUp() {
      if (isPanningRef.current) {
        isPanningRef.current = false
        setPanning(false)
      }
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  function isNodeHighlighted(id) { return !effectiveGroup || effectiveGroup.nodes.includes(id) }
  function isEdgeHighlighted(id) { return !effectiveGroup || effectiveGroup.edges.includes(id) }

  function handleNodeContextMenu(e, node) {
    e.preventDefault()
    e.stopPropagation()
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return
    const menuWidth = 164
    const menuHeight = 102
    const x = Math.min(e.clientX - bounds.left, bounds.width - menuWidth - 8)
    const y = Math.min(e.clientY - bounds.top, bounds.height - menuHeight - 8)
    setSelectedNodeId(node.id)
    setContextMenu({
      nodeId: node.id,
      x: Math.max(8, x),
      y: Math.max(8, y),
    })
  }

  function handleMenuAction(actionId) {
    const node = NODES.find(n => n.id === contextMenu?.nodeId)
    if (!node) return
    setSelectedNodeId(node.id)
    setContextMenu(null)
    setHoveredMenuItem(null)
    onNodeAction?.({
      actionId,
      node,
      prompt: buildNodePrompt(actionId, node),
    })
  }

  function handleNodeSelect(node) {
    if (!node) return
    setSelectedNodeId(node.id)
    onNodeAction?.({
      actionId: 'select-node',
      node,
    })
  }

  const toolBtnStyle = {
    width: 26, height: 26, border: '1px solid #e0e0e0', borderRadius: 5,
    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: '#888',
  }

  return (
    <div
      ref={outerRef}
      style={{
        position: 'relative', width: '100%', height: '100%', overflow: 'hidden',
        background: widgetMode ? '#fff' : undefined,
        cursor: panning ? 'grabbing' : spaceDown ? 'grab' : undefined,
      }}
      onMouseDown={e => {
        if (spaceRef.current) {
          e.preventDefault()
          isPanningRef.current = true
          panStartRef.current = { sx: e.clientX, sy: e.clientY, px: panRef.current.x, py: panRef.current.y }
          setPanning(true)
        }
      }}
    >
      {!widgetMode && <div className="dot-grid" />}

      {/* Zoom toolbar — focus mode only */}
      {!widgetMode && <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button style={toolBtnStyle} onClick={() => setZoom(z => Math.min(z + 0.2, 2))}   onMouseEnter={e=>e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}><ZoomInIcon /></button>
        <button style={toolBtnStyle} onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} onMouseEnter={e=>e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}><ZoomOutIcon /></button>
        <button style={toolBtnStyle} onClick={() => setZoom(1)}                            onMouseEnter={e=>e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}><ResetIcon /></button>
      </div>}

      {/* Legend — focus mode only */}
      {!widgetMode && isRoutingMode ? (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 10,
          background: '#fff', border: '1px solid #e0e0e0', borderRadius: 8,
          padding: '9px 13px', fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        }}>
          {/* BGP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="22" height="4" style={{ flexShrink: 0 }}><line x1="0" y1="2" x2="22" y2="2" stroke="#2563eb" strokeWidth="2.5"/></svg>
            <span style={{ color: '#333', fontWeight: 500 }}>BGP</span>
            <span style={{ color: '#666' }}>backbone</span>
          </div>
          {/* OSPF */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="22" height="4" style={{ flexShrink: 0 }}><line x1="0" y1="2" x2="22" y2="2" stroke="#94a3b8" strokeWidth="1.5"/></svg>
            <span style={{ color: '#333', fontWeight: 500 }}>OSPF</span>
            <span style={{ color: '#666' }}>access layer</span>
          </div>
          {/* EIGRP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="22" height="4" style={{ flexShrink: 0 }}><line x1="0" y1="2" x2="22" y2="2" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="6 3"/></svg>
            <span style={{ color: '#333', fontWeight: 500 }}>EIGRP</span>
            <span style={{ color: '#666' }}>internal</span>
          </div>
        </div>
      ) : (!widgetMode && group?.label) ? (
        <div style={{
          position: 'absolute', top: 10, left: 10, zIndex: 10,
          background: '#fff', border: '1px solid #e4e4e4', borderRadius: 8,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden',
        }}>
          <div style={{ padding: '5px 10px 4px', fontSize: 9, fontWeight: 600, color: '#888', letterSpacing: '0.07em', textTransform: 'uppercase', borderBottom: '1px solid #f0f0f0' }}>
            Overlays
          </div>
          <div style={{ padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: group.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#444', flex: 1, whiteSpace: 'nowrap' }}>{group.label}</span>
            <button
              onClick={() => setOverlayOn(v => !v)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: overlayOn ? '#555' : '#bbb', padding: '1px 0', display: 'flex', flexShrink: 0, transition: 'color 0.15s' }}
              title={overlayOn ? 'Hide overlay' : 'Show overlay'}
            >
              {overlayOn ? <EyeIcon /> : <EyeOffIcon />}
            </button>
          </div>
        </div>
      ) : null}

      {/* Graph container */}
      <div
        ref={containerRef}
        onMouseDown={() => setContextMenu(null)}
        style={{
          position: 'absolute', inset: 0,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: panning ? 'none' : 'transform 0.25s ease',
        }}
      >
        {/* SVG edges */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          {lines.map(line => {
            if (isRoutingMode) {
              const protocol = EDGE_PROTOCOLS[line.id] || 'ospf'
              const s = PROTOCOL_STYLES[protocol]
              const midX = (line.x1 + line.x2) / 2
              const midY = (line.y1 + line.y2) / 2
              const rawAngle = Math.atan2(line.y2 - line.y1, line.x2 - line.x1) * 180 / Math.PI
              // Normalize so text never renders upside-down
              const angle = rawAngle > 90 || rawAngle < -90 ? rawAngle + 180 : rawAngle
              const labelText = EDGE_LABELS[line.id] || protocol.toUpperCase()
              // Gap in the line where the label sits — sized to fit the text
              const halfGap = labelText.length * 3.4 + 6
              const dx = line.x2 - line.x1, dy = line.y2 - line.y1
              const len = Math.sqrt(dx * dx + dy * dy) || 1
              const ux = dx / len, uy = dy / len
              return (
                <g key={line.id}>
                  {/* Line split into two segments — gap at label position */}
                  <line
                    x1={line.x1} y1={line.y1}
                    x2={midX - ux * halfGap} y2={midY - uy * halfGap}
                    stroke={s.stroke} strokeWidth={s.strokeWidth}
                    strokeDasharray={s.dashArray || undefined}
                    style={{ transition: 'all 0.4s ease' }}
                  />
                  <line
                    x1={midX + ux * halfGap} y1={midY + uy * halfGap}
                    x2={line.x2} y2={line.y2}
                    stroke={s.stroke} strokeWidth={s.strokeWidth}
                    strokeDasharray={s.dashArray || undefined}
                    style={{ transition: 'all 0.4s ease' }}
                  />
                  {/* Protocol label — paint-order halo keeps it readable without a box */}
                  <g transform={`translate(${midX},${midY}) rotate(${angle})`}>
                    <text textAnchor="middle" dominantBaseline="central"
                      stroke="white" strokeWidth="3.5" paintOrder="stroke"
                      style={{ fontSize: 9, fontFamily: 'system-ui, sans-serif',
                               fontWeight: 600, letterSpacing: '0.04em' }}
                      fill={LABEL_FILL}
                    >
                      {labelText}
                    </text>
                  </g>
                </g>
              )
            }
            // Default / vlan mode
            const hl = isEdgeHighlighted(line.id)
            return (
              <line key={line.id}
                x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                stroke={effectiveGroup && hl ? effectiveGroup.color : '#ccc'}
                strokeWidth={effectiveGroup && hl ? 2 : 1}
                opacity={effectiveGroup ? (hl ? 1 : 0.15) : 1}
                style={{ transition: 'all 0.4s ease' }}
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {NODES.map(node => {
          const hl = isNodeHighlighted(node.id)
          const isHovered = hoveredNode === node.id
          const isSelected = selectedNodeId === node.id
          const nodeChanges = (highlight === 'changes' && overlayOn && hl && group?.nodeChanges) ? group.nodeChanges[node.id] : null

          return (
            <div
              key={node.id}
              ref={el => { nodeRefs.current[node.id] = el }}
              className="ng-node"
              style={{
                left: `${node.px}%`, top: `${node.py}%`,
                position: 'absolute',
                opacity: isRoutingMode ? 1 : (effectiveGroup ? (hl ? 1 : 0.15) : 1),
                borderColor: isSelected || isHovered ? '#2563eb' : (effectiveGroup && hl && !isRoutingMode ? effectiveGroup.color : '#d4d4d4'),
                boxShadow: isSelected || isHovered ? '0 2px 8px rgba(37,99,235,0.18)' : (effectiveGroup && hl && !isRoutingMode ? `0 0 0 2px ${effectiveGroup.color}22` : 'none'),
                transition: 'all 0.35s ease',
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={(e) => { e.stopPropagation(); handleNodeSelect(node) }}
              onContextMenu={(e) => handleNodeContextMenu(e, node)}
            >
              <NodeIcon type={node.type} />

              <span className="ng-lbl">{node.label}</span>
              <span className="ng-ip">{node.ip}</span>
              {nodeChanges && <NodeChangeTag changes={nodeChanges} />}
            </div>
          )
        })}
      </div>

      {contextMenu && (
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 30,
            width: 152,
            background: '#fff',
            border: '1px solid #dfdfdf',
            borderRadius: 9,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)',
            padding: 4,
          }}
        >
          {NODE_MENU_ITEMS.map(item => {
            if (!item.hasSubmenu) {
              return (
                <button
                  key={item.id}
                  onClick={() => handleMenuAction(item.id)}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ea'; setHoveredMenuItem(null) }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center',
                    padding: '4px 8px', border: 'none', borderRadius: 5,
                    background: 'transparent', color: '#2f2d29',
                    fontSize: 11.5, textAlign: 'left', cursor: 'pointer',
                  }}
                >
                  {item.label}
                </button>
              )
            }
            // Submenu trigger
            return (
              <div
                key={item.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredMenuItem(item.id)}
                onMouseLeave={() => setHoveredMenuItem(null)}
              >
                <button
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '4px 8px', border: 'none', borderRadius: 5,
                    background: hoveredMenuItem === item.id ? '#f3f0ea' : 'transparent',
                    color: '#2f2d29', fontSize: 11.5, textAlign: 'left', cursor: 'default',
                  }}
                >
                  <span>{item.label}</span>
                  <span style={{ color: '#aaa', display: 'flex', alignItems: 'center' }}><ChevronRightIcon /></span>
                </button>

                {hoveredMenuItem === item.id && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -4,
                      left: 'calc(100% + 3px)',
                      zIndex: 40,
                      width: 152,
                      background: '#fff',
                      border: '1px solid #dfdfdf',
                      borderRadius: 9,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)',
                      padding: 4,
                    }}
                  >
                    {EXTEND_SUBMENU_ITEMS.map((sub, i) => {
                      if (sub.separator) {
                        return <div key={`sep-${i}`} style={{ height: 1, background: '#f0ede8', margin: '4px 5px' }} />
                      }
                      return (
                        <button
                          key={sub.id}
                          onClick={() => handleMenuAction(sub.id)}
                          onMouseEnter={e => e.currentTarget.style.background = '#f3f0ea'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center',
                            padding: '4px 8px', border: 'none', borderRadius: 5,
                            background: 'transparent', color: sub.id === 'extend-advanced' ? '#666' : '#2f2d29',
                            fontSize: 11.5, textAlign: 'left', cursor: 'pointer',
                          }}
                        >
                          {sub.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredNode && (() => {
        const node = NODES.find(n => n.id === hoveredNode)
        if (!node) return null
        return (
          <div style={{
            position: 'absolute', bottom: 12, left: 12,
            background: '#1a1a1a', color: '#fff', borderRadius: 6,
            padding: '6px 10px', fontSize: 11, pointerEvents: 'none', zIndex: 20, lineHeight: 1.6,
          }}>
            <div style={{ fontWeight: 500 }}>{node.label}</div>
            <div style={{ color: '#bbb' }}>{node.ip}</div>
            {node.as && <div style={{ color: '#888', fontFamily: 'monospace', fontSize: 10 }}>{node.as}</div>}
          </div>
        )
      })()}
    </div>
  )
}
