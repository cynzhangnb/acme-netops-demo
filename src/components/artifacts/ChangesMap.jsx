import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

// Last 7 days — 6 devices
const NODES_7D = [
  { id: 'er7', label: 'ER-BOS-07', type: 'edge-router',   px: 50, py: 8,  changes: ['QoS Policy'] },
  { id: 'cr1', label: 'CR-BOS-01', type: 'core-router',   px: 26, py: 32, changes: ['NTP'] },
  { id: 'cr2', label: 'CR-BOS-02', type: 'core-router',   px: 72, py: 32, changes: ['BGP Policy', 'Static Route'] },
  { id: 'ds1', label: 'DS-BOS-01', type: 'dist-switch',   px: 19, py: 62, changes: ['ACL'] },
  { id: 'ds3', label: 'DS-BOS-03', type: 'dist-switch',   px: 66, py: 62, changes: ['Logging', 'OSPF'] },
  { id: 'as1', label: 'AS-BOS-01', type: 'access-switch', px: 19, py: 86, changes: ['VLAN'] },
]
const EDGES_7D = [
  { id: 'e1', a: 'er7', b: 'cr2', label: 'BGP' },
  { id: 'e2', a: 'cr1', b: 'cr2', label: 'iBGP' },
  { id: 'e3', a: 'cr1', b: 'ds1', label: 'OSPF' },
  { id: 'e4', a: 'cr2', b: 'ds3', label: 'BGP' },
  { id: 'e5', a: 'ds1', b: 'as1', label: 'OSPF' },
]

// Last 24 hours — 4 devices
const NODES_24H = [
  { id: 'er7', label: 'ER-BOS-07', type: 'edge-router',  px: 50, py: 12, changes: ['QoS Policy'] },
  { id: 'cr2', label: 'CR-BOS-02', type: 'core-router',  px: 50, py: 40, changes: ['BGP Policy', 'Static Route'] },
  { id: 'ds1', label: 'DS-BOS-01', type: 'dist-switch',  px: 24, py: 72, changes: ['ACL'] },
  { id: 'ds3', label: 'DS-BOS-03', type: 'dist-switch',  px: 74, py: 72, changes: ['OSPF'] },
]
const EDGES_24H = [
  { id: 'e1', a: 'er7', b: 'cr2', label: 'BGP' },
  { id: 'e3', a: 'cr2', b: 'ds1', label: 'OSPF' },
  { id: 'e4', a: 'cr2', b: 'ds3', label: 'BGP' },
]

// Pool of devices that can be added as discovered neighbors
const NEIGHBOR_POOL = [
  { label: 'AS-BOS-04', type: 'access-switch' },
  { label: 'AS-BOS-05', type: 'access-switch' },
  { label: 'AS-BOS-06', type: 'access-switch', noProtocol: true },
  { label: 'DS-BOS-07', type: 'dist-switch'   },
  { label: 'DS-BOS-08', type: 'dist-switch', noProtocol: true },
  { label: 'CR-BOS-03', type: 'core-router'   },
  { label: 'ER-BOS-08', type: 'edge-router'   },
  { label: 'AS-BOS-07', type: 'access-switch' },
]

function shuffled(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function neighborPositions(sourceNode, existingNodes, count) {
  const { px, py } = sourceNode

  // Build candidate positions in concentric rings around the source
  const candidates = []
  for (const dist of [22, 27, 17, 32]) {
    for (let deg = 0; deg < 360; deg += 6) {
      const rad = deg * Math.PI / 180
      const cpx = px + dist * Math.cos(rad)
      const cpy = py + dist * Math.sin(rad)
      if (cpx < 5 || cpx > 95 || cpy < 5 || cpy > 95) continue
      candidates.push({ px: cpx, py: cpy })
    }
  }

  function d2(a, b) {
    return Math.sqrt((a.px - b.px) ** 2 + (a.py - b.py) ** 2)
  }
  function minDistTo(pos, nodes) {
    if (!nodes.length) return Infinity
    return Math.min(...nodes.map(n => d2(pos, n)))
  }

  // Obstacles = all nodes except the source itself
  const obstacles = existingNodes.filter(n => n.id !== sourceNode.id)
  const placed = []
  const MIN_BETWEEN = 15 // min separation between placed extended nodes

  for (let i = 0; i < count; i++) {
    let best = null
    let bestScore = -Infinity
    for (const c of candidates) {
      if (placed.length > 0 && minDistTo(c, placed) < MIN_BETWEEN) continue
      const score = minDistTo(c, obstacles)
      if (score > bestScore) { bestScore = score; best = c }
    }
    if (!best) {
      const angle = (i * Math.PI * 2) / count
      best = {
        px: Math.max(6, Math.min(94, px + 22 * Math.cos(angle))),
        py: Math.max(6, Math.min(94, py + 22 * Math.sin(angle))),
      }
    }
    placed.push(best)
    obstacles.push(best) // treat as obstacle for the next placement
  }

  return placed
}

// BGP overlay — which node ids and edge ids are highlighted
const BGP_NODE_IDS = new Set(['er7', 'cr1', 'cr2'])
const BGP_EDGE_IDS = new Set(['e1', 'e2'])

// OSPF overlay — distribution → access links
const OSPF_NODE_IDS = new Set(['ds1', 'as1'])
const OSPF_EDGE_IDS = new Set(['e3', 'e5'])

// CRC error overlay — edges only, no node highlighting
const CRC_EDGE_IDS = new Set(['e3', 'e4'])
const CRC_EDGE_VALUES = { 'e3': 120, 'e4': 45 }

// Icons — reuse same style as TopologyMap
function CoreRouterSvg() {
  return (
    <svg width="18" height="15" viewBox="0 0 20 17" fill="none">
      <rect x="1.5" y="10" width="17" height="6" rx="1.5" stroke="#555" strokeWidth="1.2"/>
      <circle cx="6"  cy="13" r="0.9" fill="#555" opacity="0.55"/>
      <circle cx="10" cy="13" r="0.9" fill="#555" opacity="0.55"/>
      <circle cx="14" cy="13" r="0.9" fill="#555" opacity="0.55"/>
      <circle cx="10" cy="9.5" r="0.9" fill="#555"/>
      <path d="M7.2,7.8 Q10,5.8 12.8,7.8" stroke="#555" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M4.8,5.4 Q10,1.8 15.2,5.4" stroke="#555" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
    </svg>
  )
}
function DistSwitchSvg() {
  const s = { stroke: '#555', strokeLinecap: 'round', strokeLinejoin: 'round' }
  return (
    <svg width="18" height="12" viewBox="0 0 20 14" fill="none">
      <rect x="1" y="2" width="18" height="10" rx="2" {...s} strokeWidth={1.3}/>
      <line x1="5"   y1="5" x2="5"   y2="9" {...s} strokeWidth={1.1} opacity={0.6}/>
      <line x1="8.5" y1="5" x2="8.5" y2="9" {...s} strokeWidth={1.1} opacity={0.6}/>
      <line x1="12"  y1="5" x2="12"  y2="9" {...s} strokeWidth={1.1} opacity={0.6}/>
      <line x1="15"  y1="7" x2="18"  y2="7" {...s} strokeWidth={1.1}/>
      <path d="M16,5.5 L15,7 L16,8.5" {...s} strokeWidth={1.1} fill="none"/>
      <path d="M17,5.5 L18,7 L17,8.5" {...s} strokeWidth={1.1} fill="none"/>
    </svg>
  )
}
function AccessSwitchSvg() {
  return (
    <svg width="18" height="16" viewBox="0 0 20 18" fill="none">
      <rect x="1" y="1" width="18" height="12" rx="1.8" stroke="#555" strokeWidth="1.25"/>
      <line x1="10" y1="13" x2="10" y2="16" stroke="#555" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="6.5" y1="16" x2="13.5" y2="16" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}
function EdgeRouterSvg() {
  return (
    <svg width="18" height="15" viewBox="0 0 20 17" fill="none">
      <rect x="1.5" y="10" width="17" height="6" rx="1.5" stroke="#555" strokeWidth="1.2"/>
      <circle cx="6"  cy="13" r="0.9" fill="#555" opacity="0.55"/>
      <circle cx="10" cy="13" r="0.9" fill="#555" opacity="0.55"/>
      <circle cx="14" cy="13" r="0.9" fill="#555" opacity="0.55"/>
      <circle cx="10" cy="9.5" r="0.9" fill="#555"/>
      <path d="M7.5,8 Q10,6.2 12.5,8" stroke="#555" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      <path d="M5,5.6 Q10,2.5 15,5.6" stroke="#555" strokeWidth="1.1" fill="none" strokeLinecap="round"/>
      {/* WAN indicator */}
      <line x1="1.5" y1="13" x2="0" y2="13" stroke="#555" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  )
}
function NodeIcon({ type }) {
  if (type === 'core-router' || type === 'edge-router') return <CoreRouterSvg />
  if (type === 'dist-switch') return <DistSwitchSvg />
  return <AccessSwitchSvg />
}

function ChangeTag({ changes }) {
  const [hovered, setHovered] = useState(false)
  if (changes.length === 1) {
    return (
      <span style={{
        fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
        background: '#fef3c7', color: '#92400e', whiteSpace: 'nowrap',
      }}>{changes[0]}</span>
    )
  }
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span style={{
        fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
        background: '#fef3c7', color: '#92400e', whiteSpace: 'nowrap', cursor: 'default',
      }}>{changes.length} changes</span>
      {hovered && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 5px)', left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', borderRadius: 5,
          padding: '5px 8px', fontSize: 10, whiteSpace: 'nowrap',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)', zIndex: 100,
          display: 'flex', flexDirection: 'column', gap: 3,
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

function LayersIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M1.5 4.5L6.5 2L11.5 4.5L6.5 7L1.5 4.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M1.5 7L6.5 9.5L11.5 7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M1.5 9.5L6.5 12L11.5 9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function CollapseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M2 4L5.5 7.5L9 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

const CONTEXT_MENU_ITEMS = [
  { id: 'view-config',       label: 'View Configuration' },
  { id: 'view-properties',   label: 'View Properties' },
  { id: 'extend-neighbour',  label: 'Extend Neighbors', hasSubmenu: true },
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
  if (actionId === 'view-config')      return `Show me the running configuration for ${node.label} and explain the key sections.`
  if (actionId === 'view-properties')  return `Show me the device properties for ${node.label}, including role, status, and connected neighbors.`
  if (actionId === 'extend-all')       return `Extend neighbor view from ${node.label} — show all directly connected neighbors.`
  if (actionId === 'extend-bgp')       return `Extend neighbor view from ${node.label} — show BGP neighbors and peering sessions.`
  if (actionId === 'extend-ospf')      return `Extend neighbor view from ${node.label} — show OSPF neighbors and adjacencies.`
  if (actionId === 'extend-l2')        return `Extend neighbor view from ${node.label} — show Layer 2 neighbors via CDP/LLDP.`
  if (actionId === 'extend-advanced')  return `Show advanced neighbor selection for ${node.label}.`
  return ''
}

// Overlay definitions
const OVERLAY_DEFS = [
  {
    id: 'config-changes',
    label: 'Config Changes',
    dot: '#f59e0b',
  },
  {
    id: 'bgp',
    label: 'BGP Topology',
    dot: '#3b82f6',
  },
  {
    id: 'ospf',
    label: 'OSPF Topology',
    dot: '#059669',
  },
  {
    id: 'crc',
    label: 'CRC Errors',
    dot: '#ef4444',
  },
]

// Fixed canvas size used in widget mode so resizing the widget doesn't reflow the map contents
const WIDGET_NATURAL_W = 680
const WIDGET_NATURAL_H = 520

export default function ChangesMap({ filter, externalOverlay, widgetMode = false, onNodeAction, overlayCollapsedPref, onOverlayToggle }) {
  const is24h  = filter === 'last-24h'
  const NODES  = is24h ? NODES_24H  : NODES_7D
  const EDGES  = is24h ? EDGES_24H  : EDGES_7D

  const containerRef = useRef(null)
  const outerRef = useRef(null)
  const nodeRefs = useRef({})
  const [lines, setLines] = useState([])
  const [contextMenu, setContextMenu] = useState(null)
  const [hoveredMenuItem, setHoveredMenuItem] = useState(null)
  const [extendedNodes, setExtendedNodes] = useState([])
  const [extendedEdges, setExtendedEdges] = useState([])
  const [nodePositions, setNodePositions] = useState({}) // { [id]: { px, py } }
  const draggingRef = useRef(null) // { nodeId, startX, startY, startPx, startPy, cw, ch }
  const hasDraggedRef = useRef(false)

  // Spacebar pan
  const spaceRef = useRef(false)
  const isPanningRef = useRef(false)
  const panStartRef = useRef(null)
  const panRef = useRef({ x: 0, y: 0 })
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [spaceDown, setSpaceDown] = useState(false)
  const [panning, setPanning] = useState(false)

  // Scroll-wheel zoom (widget mode)
  const [zoom, setZoom] = useState(1)
  const zoomRef = useRef(1)

  const allNodes = useMemo(() =>
    [...NODES, ...extendedNodes].map(n => ({
      ...n,
      px: nodePositions[n.id]?.px ?? n.px,
      py: nodePositions[n.id]?.py ?? n.py,
    })),
    [NODES, extendedNodes, nodePositions]
  )
  const allEdges = useMemo(() => [...EDGES, ...extendedEdges], [EDGES, extendedEdges])

  // overlayState: { [overlayId]: boolean }
  const [overlayState, setOverlayState] = useState({ 'config-changes': true })

  // Overlay panel collapsed state:
  // - widget mode default: collapsed; focus/full mode default: expanded
  // - overlayCollapsedPref (from parent) persists user's manual choice across mode switches
  const defaultCollapsed = widgetMode
  const [overlayCollapsed, setOverlayCollapsed] = useState(
    overlayCollapsedPref !== null && overlayCollapsedPref !== undefined
      ? overlayCollapsedPref
      : defaultCollapsed
  )
  function toggleOverlayPanel() {
    const next = !overlayCollapsed
    setOverlayCollapsed(next)
    onOverlayToggle?.(next)
  }

  // When AI triggers a new overlay externally
  useEffect(() => {
    if (!externalOverlay) return
    setOverlayState(prev => {
      const next = { ...prev }
      if (externalOverlay === 'crc') {
        // CRC turns off all other overlays
        Object.keys(next).forEach(k => { next[k] = false })
      } else if (externalOverlay === 'bgp' || externalOverlay === 'ospf') {
        next['config-changes'] = false
      }
      next[externalOverlay] = true
      return next
    })
  }, [externalOverlay])

  const configChangesOn = !!overlayState['config-changes']
  const bgpOn  = !!overlayState['bgp']
  const ospfOn = !!overlayState['ospf']
  const crcOn  = !!overlayState['crc']
  const hasBgpOverlay  = 'bgp'  in overlayState
  const hasOspfOverlay = 'ospf' in overlayState
  const hasCrcOverlay  = 'crc'  in overlayState

  const toggleOverlay = (id) => {
    setOverlayState(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const computeLines = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const cw = container.offsetWidth
    const ch = container.offsetHeight
    const newLines = allEdges.map(edge => {
      const aNode = allNodes.find(n => n.id === edge.a)
      const bNode = allNodes.find(n => n.id === edge.b)
      if (!aNode || !bNode) return null
      const ax = (aNode.px / 100) * cw
      const ay = (aNode.py / 100) * ch
      const bx = (bNode.px / 100) * cw
      const by = (bNode.py / 100) * ch
      return { ...edge, x1: ax, y1: ay, x2: bx, y2: by }
    }).filter(Boolean)
    setLines(newLines)
  }, [allEdges, allNodes])

  useEffect(() => {
    const timer = setTimeout(computeLines, 30)
    const ro = new ResizeObserver(computeLines)
    if (containerRef.current) ro.observe(containerRef.current)
    return () => { clearTimeout(timer); ro.disconnect() }
  }, [computeLines])

  useEffect(() => {
    function close() { setContextMenu(null); setHoveredMenuItem(null) }
    function onKey(e) { if (e.key === 'Escape') close() }
    window.addEventListener('mousedown', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', onKey)
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
      if (isPanningRef.current && panStartRef.current) {
        const newPan = {
          x: panStartRef.current.px + (e.clientX - panStartRef.current.sx),
          y: panStartRef.current.py + (e.clientY - panStartRef.current.sy),
        }
        panRef.current = newPan
        setPan(newPan)
        return
      }
      if (!draggingRef.current) return
      const { nodeId, startX, startY, startPx, startPy, cw, ch } = draggingRef.current
      hasDraggedRef.current = true
      const dx = ((e.clientX - startX) / cw) * 100
      const dy = ((e.clientY - startY) / ch) * 100
      setNodePositions(prev => ({
        ...prev,
        [nodeId]: {
          px: Math.max(2, Math.min(98, startPx + dx)),
          py: Math.max(2, Math.min(98, startPy + dy)),
        },
      }))
    }
    function onMouseUp() {
      draggingRef.current = null
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

  // Wheel zoom — only active in widget mode
  useEffect(() => {
    if (!widgetMode) return
    const el = outerRef.current
    if (!el) return
    function onWheel(e) {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.1 : 0.9
      const newZoom = Math.max(0.3, Math.min(4, zoomRef.current * factor))
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const newPan = {
        x: mx - (mx - panRef.current.x) * (newZoom / zoomRef.current),
        y: my - (my - panRef.current.y) * (newZoom / zoomRef.current),
      }
      zoomRef.current = newZoom
      panRef.current = newPan
      setZoom(newZoom)
      setPan(newPan)
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [widgetMode])

  function handleNodeMouseDown(e, node) {
    if (spaceRef.current) return
    if (e.button !== 0) return
    hasDraggedRef.current = false
    const bounds = containerRef.current?.getBoundingClientRect()
    if (!bounds) return
    draggingRef.current = {
      nodeId: node.id,
      startX: e.clientX,
      startY: e.clientY,
      startPx: node.px,
      startPy: node.py,
      cw: bounds.width,
      ch: bounds.height,
    }
  }

  function handleNodeContextMenu(e, node) {
    e.preventDefault()
    e.stopPropagation()
    if (hasDraggedRef.current) { hasDraggedRef.current = false; return }
    const bounds = outerRef.current?.getBoundingClientRect()
    if (!bounds) return
    const menuW = 172, menuH = 110
    const x = Math.max(8, Math.min(e.clientX - bounds.left, bounds.width  - menuW - 8))
    const y = Math.max(8, Math.min(e.clientY - bounds.top,  bounds.height - menuH - 8))
    setContextMenu({ nodeId: node.id, x, y })
  }

  function extendNeighbors(sourceNode) {
    const existingLabels = new Set(allNodes.map(n => n.label))
    const available = NEIGHBOR_POOL.filter(n => !existingLabels.has(n.label))
    const ospfPool    = shuffled(available.filter(n => !n.noProtocol && n.type === 'access-switch'))
    const bgpPool     = shuffled(available.filter(n => !n.noProtocol && n.type !== 'access-switch'))
    const neutralPool = shuffled(available.filter(n => n.noProtocol))
    // Guarantee at least 1 OSPF and 1 BGP neighbor, fill remainder randomly up to 3
    const toAdd = []
    if (ospfPool.length > 0) toAdd.push(ospfPool[0])
    if (bgpPool.length  > 0) toAdd.push(bgpPool[0])
    const rest = shuffled([...ospfPool.slice(1), ...bgpPool.slice(1), ...neutralPool])
    while (toAdd.length < 3 && rest.length > 0) toAdd.push(rest.shift())
    if (toAdd.length === 0) return
    const positions = neighborPositions(sourceNode, allNodes, toAdd.length)
    const ts = Date.now()
    const newNodes = toAdd.map((n, i) => ({
      id: `ext-${ts}-${i}`,
      label: n.label,
      type: n.type,
      px: positions[i].px,
      py: positions[i].py,
      changes: [],
      isExtended: true,
      protocol: n.noProtocol ? null : n.type === 'access-switch' ? 'ospf' : 'bgp',
    }))
    const newEdges = newNodes.map((n, i) => ({
      id: `ext-edge-${ts}-${i}`,
      a: sourceNode.id,
      b: n.id,
      label: '',
      isExtended: true,
      protocol: n.protocol,
      label: n.protocol === 'bgp' ? 'BGP' : n.protocol === 'ospf' ? 'OSPF' : '',
    }))
    setExtendedNodes(prev => [...prev, ...newNodes])
    setExtendedEdges(prev => [...prev, ...newEdges])
  }

  function handleMenuAction(actionId) {
    const node = allNodes.find(n => n.id === contextMenu?.nodeId)
    if (!node) return
    setContextMenu(null)
    setHoveredMenuItem(null)
    if (actionId === 'extend-all') {
      extendNeighbors(node)
      return
    }
    onNodeAction?.({ actionId, node, prompt: buildNodePrompt(actionId, node) })
  }

  // Visible overlays for the panel (only show overlays that have been activated)
  const visibleOverlays = OVERLAY_DEFS.filter(o =>
    o.id === 'config-changes' ||
    (hasBgpOverlay  && o.id === 'bgp') ||
    (hasOspfOverlay && o.id === 'ospf') ||
    (hasCrcOverlay  && o.id === 'crc')
  )

  return (
    <div
      ref={outerRef}
      style={{
        position: 'relative', width: '100%', height: '100%', background: '#fff', overflow: 'hidden',
        cursor: panning ? 'grabbing' : spaceDown ? 'grab' : undefined,
      }}
      onMouseDown={e => {
        if (spaceRef.current) {
          e.preventDefault()
          isPanningRef.current = true
          panStartRef.current = { sx: e.clientX, sy: e.clientY, px: panRef.current.x, py: panRef.current.y }
          setPanning(true)
          return
        }
        setContextMenu(null)
        setHoveredMenuItem(null)
      }}
    >
      {!widgetMode && <div className="dot-grid" />}

      {/* Overlay control panel — minimized (icon only) or expanded */}
      <div style={{ position: 'absolute', top: 10, left: 10, zIndex: 10 }}>
        {overlayCollapsed ? (
          // Minimized: single icon button
          <button
            onClick={toggleOverlayPanel}
            title="Show overlays"
            style={{
              width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#fff', border: '1px solid #e4e4e4', borderRadius: 7,
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)', cursor: 'pointer', color: '#888',
              padding: 0,
            }}
          >
            <LayersIcon />
          </button>
        ) : (
          // Expanded: full panel
          <div style={{
            background: '#fff', border: '1px solid #e4e4e4', borderRadius: 8,
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden',
          }}>
            <div style={{
              padding: '5px 6px 4px 10px', fontSize: 9, fontWeight: 600, color: '#888',
              letterSpacing: '0.07em', textTransform: 'uppercase',
              borderBottom: '1px solid #f0f0f0',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ flex: 1 }}>Overlays</span>
              <button
                onClick={toggleOverlayPanel}
                title="Minimize"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: '#bbb', display: 'flex', alignItems: 'center', padding: '1px 2px',
                  borderRadius: 3, lineHeight: 1,
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#888'}
                onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
              >
                <CollapseIcon />
              </button>
            </div>
            {visibleOverlays.map((ov, i) => (
              <div
                key={ov.id}
                style={{
                  padding: '5px 10px',
                  display: 'flex', alignItems: 'center', gap: 8,
                  borderTop: i > 0 ? '1px solid #f0f0f0' : undefined,
                }}
              >
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: ov.dot, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: '#444', flex: 1, whiteSpace: 'nowrap' }}>{ov.label}</span>
                <button
                  onClick={() => toggleOverlay(ov.id)}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: overlayState[ov.id] ? '#555' : '#bbb',
                    padding: '1px 0', display: 'flex', flexShrink: 0, transition: 'color 0.15s',
                  }}
                  title={overlayState[ov.id] ? 'Hide overlay' : 'Show overlay'}
                >
                  {overlayState[ov.id] ? <EyeIcon /> : <EyeOffIcon />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Graph container — fixed size in widget mode so resize doesn't reflow map contents */}
      <div ref={containerRef} style={{
        position: 'absolute',
        ...(widgetMode
          ? { width: WIDGET_NATURAL_W, height: WIDGET_NATURAL_H }
          : { inset: 0 }),
        transform: widgetMode
          ? `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
          : `translate(${pan.x}px, ${pan.y}px)`,
        transformOrigin: '0 0',
      }}>
        {/* SVG edges */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', overflow: 'visible' }}>
          {lines.map(line => {
            const midX = (line.x1 + line.x2) / 2
            const midY = (line.y1 + line.y2) / 2

            // Determine edge style
            let strokeColor = '#b0aaa3'
            if (crcOn && CRC_EDGE_IDS.has(line.id)) {
              strokeColor = '#ef4444'
            } else if (bgpOn && BGP_EDGE_IDS.has(line.id)) {
              strokeColor = '#3b82f6'
            } else if (ospfOn && OSPF_EDGE_IDS.has(line.id)) {
              strokeColor = '#059669'
            } else if (line.isExtended) {
              if (bgpOn && line.protocol === 'bgp') strokeColor = '#3b82f6'
              else if (ospfOn && line.protocol === 'ospf') strokeColor = '#059669'
            }

            const displayLabel = (crcOn && CRC_EDGE_IDS.has(line.id))
              ? `CRC: ${CRC_EDGE_VALUES[line.id]}`
              : line.label

            return (
              <g key={line.id}>
                <line
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  stroke={strokeColor} strokeWidth={1.5}
                />
                {displayLabel && strokeColor !== '#b0aaa3' && (
                  <text
                    x={midX} y={midY - 9}
                    textAnchor="middle"
                    style={{ fontSize: 9, fontFamily: 'system-ui, sans-serif', fontWeight: 600, letterSpacing: '0.04em' }}
                    stroke="white" strokeWidth="4" paintOrder="stroke"
                    fill={crcOn && CRC_EDGE_IDS.has(line.id) ? '#ef4444' : '#999'}
                  >
                    {displayLabel}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Nodes */}
        {allNodes.map(node => {
          const isBgpNode = BGP_NODE_IDS.has(node.id)
          const isOspfNode = OSPF_NODE_IDS.has(node.id)
          const isExtended = !!node.isExtended
          // Border color: follow overlay state for both base and extended nodes
          let borderColor = '#d4d4d4'
          let boxShadow = 'none'
          if (bgpOn && ((!isExtended && isBgpNode) || (isExtended && node.protocol === 'bgp'))) {
            borderColor = '#3b82f6'
            boxShadow = '0 0 0 3px #3b82f618, 0 2px 6px rgba(0,0,0,0.07)'
          } else if (ospfOn && ((!isExtended && isOspfNode) || (isExtended && node.protocol === 'ospf'))) {
            borderColor = '#059669'
            boxShadow = '0 0 0 3px #05996918, 0 2px 6px rgba(0,0,0,0.07)'
          } else if (!isExtended && configChangesOn) {
            borderColor = '#f59e0b'
            boxShadow = '0 0 0 3px #f59e0b18, 0 2px 6px rgba(0,0,0,0.07)'
          }

          return (
            <div
              key={node.id}
              ref={el => { nodeRefs.current[node.id] = el }}
              onMouseDown={e => handleNodeMouseDown(e, node)}
              onContextMenu={e => handleNodeContextMenu(e, node)}
              style={{
                position: 'absolute',
                left: `${node.px}%`,
                top:  `${node.py}%`,
                transform: 'translate(-50%, -50%)',
                background: '#fff',
                border: `1.5px solid ${borderColor}`,
                borderRadius: 7,
                boxShadow,
                padding: '5px 8px',
                display: 'flex',
                cursor: draggingRef.current?.nodeId === node.id ? 'grabbing' : 'grab',
                userSelect: 'none',
                transition: draggingRef.current ? 'none' : 'border-color 0.2s, box-shadow 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Left: icon */}
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  <NodeIcon type={node.type} />
                </div>
                {/* Right: label + change tags */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' }}>
                    {node.label}
                  </span>
                  {!isExtended && configChangesOn && <ChangeTag changes={node.changes} />}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {contextMenu && (
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute', left: contextMenu.x, top: contextMenu.y,
            zIndex: 30, width: 152,
            background: '#fff', border: '1px solid #dfdfdf', borderRadius: 9,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)',
            padding: 4,
          }}
        >
          {CONTEXT_MENU_ITEMS.map(item => {
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
                      position: 'absolute', top: -5, left: 'calc(100% + 3px)',
                      zIndex: 40, width: 152,
                      background: '#fff', border: '1px solid #dfdfdf', borderRadius: 9,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)',
                      padding: 4,
                    }}
                  >
                    {EXTEND_SUBMENU_ITEMS.map((sub, i) => {
                      if (sub.separator) return <div key={`sep-${i}`} style={{ height: 1, background: '#f0ede8', margin: '4px 5px' }} />
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
    </div>
  )
}
