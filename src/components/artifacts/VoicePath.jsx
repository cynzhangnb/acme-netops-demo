import { useState, useRef, useCallback, useEffect } from 'react'

const NODE_MENU_ITEMS = [
  { id: 'view-config', label: 'View Configuration' },
  { id: 'view-properties', label: 'View Properties' },
  { id: 'extend-neighbour', label: 'Extend Neighbour' },
]

function buildNodePrompt(actionId, node) {
  if (!node) return ''
  if (actionId === 'view-config') {
    return `Show me the running configuration for ${node.label} (${node.ip || 'endpoint'}) and explain the key sections.`
  }
  if (actionId === 'view-properties') {
    return `Show me the device properties for ${node.label}${node.ip ? ` (${node.ip})` : ''}, including role, status, path context, and connected neighbors.`
  }
  return `Extend neighbour view from ${node.label}${node.ip ? ` (${node.ip})` : ''} and show the adjacent devices and links around it.`
}

// ── Initial node layout ───────────────────────────────────────────────────────
const INIT = {
  src:     { x: 315, y: 20,  w: 80,  h: 30 },
  asSrc:   { x: 290, y: 80,  w: 130, h: 38 },
  dsSrc:   { x: 290, y: 158, w: 130, h: 38 },
  crBos02: { x: 100, y: 254, w: 130, h: 52 },  // PROBLEM node
  crBos01: { x: 480, y: 254, w: 130, h: 42 },  // return-path node
  erBos07: { x: 100, y: 354, w: 130, h: 52 },  // latency node
  dsDst:   { x: 290, y: 430, w: 130, h: 38 },
  asDst:   { x: 290, y: 508, w: 130, h: 38 },
  dst:     { x: 315, y: 596, w: 80,  h: 30 },
}

// ── Geometry helpers (operate on a positions map) ────────────────────────────
const g = (pos) => ({
  cx:  (id) => pos[id].x + pos[id].w / 2,
  cy:  (id) => pos[id].y + pos[id].h / 2,
  top: (id) => pos[id].y,
  bot: (id) => pos[id].y + pos[id].h,
  lft: (id) => pos[id].x,
  rgt: (id) => pos[id].x + pos[id].w,
})

// ── Icons ────────────────────────────────────────────────────────────────────
function RouterIcon({ color = '#666' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="8" width="20" height="8" rx="2"/>
      <line x1="6" y1="12" x2="6.01" y2="12" strokeWidth="2.5"/>
      <line x1="10" y1="12" x2="10.01" y2="12" strokeWidth="2.5"/>
      <path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2"/>
    </svg>
  )
}
function SwitchIcon({ color = '#666' }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="6" rx="1.5"/>
      <rect x="2" y="13" width="20" height="6" rx="1.5"/>
      <circle cx="6" cy="8" r="0.9" fill={color} stroke="none"/>
      <circle cx="6" cy="16" r="0.9" fill={color} stroke="none"/>
    </svg>
  )
}
function PhoneIcon({ color = '#3b6ef5' }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11.8a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({ label, color }) {
  return (
    <div style={{
      position: 'absolute', top: -11, right: -8,
      background: color, color: '#fff',
      fontSize: 8.5, fontWeight: 600, padding: '1.5px 5px',
      borderRadius: 8, whiteSpace: 'nowrap',
      boxShadow: `0 1px 4px ${color}55`,
      pointerEvents: 'none', userSelect: 'none',
    }}>{label}</div>
  )
}

// ── SVG arrowhead markers ─────────────────────────────────────────────────────
function Markers() {
  return (
    <defs>
      <marker id="vp-fwd" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <polygon points="0 0, 6 3, 0 6" fill="#1e40af"/>
      </marker>
      <marker id="vp-ret" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
        <polygon points="0 0, 6 3, 0 6" fill="#3b82f6"/>
      </marker>
    </defs>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function VoicePath({ widgetMode = false, onNodeAction }) {
  const [pos, setPos]     = useState(INIT)
  const [pan, setPan]     = useState({ x: 40, y: 20 })
  const [scale, setScale] = useState(1)
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [contextMenu, setContextMenu] = useState(null)
  const dragging  = useRef(null)   // { id, startX, startY, origX, origY }
  const panning   = useRef(null)   // { startX, startY, origPanX, origPanY }
  const containerRef = useRef(null)

  const nodeMeta = {
    src:     { id: 'src', label: '10.8.1.4', ip: '10.8.1.4', type: 'endpoint' },
    asSrc:   { id: 'asSrc', label: 'AS-BOS-01', ip: '10.8.1.1', type: 'access-switch' },
    dsSrc:   { id: 'dsSrc', label: 'DS-BOS-01', ip: '10.1.1.1', type: 'dist-switch' },
    crBos02: { id: 'crBos02', label: 'CR-BOS-02', ip: '10.0.0.2', type: 'core-router' },
    crBos01: { id: 'crBos01', label: 'CR-BOS-01', ip: '10.0.0.1', type: 'core-router' },
    erBos07: { id: 'erBos07', label: 'ER-BOS-07', ip: '10.2.7.1', type: 'edge-router' },
    dsDst:   { id: 'dsDst', label: 'DS-BOS-03', ip: '10.1.3.1', type: 'dist-switch' },
    asDst:   { id: 'asDst', label: 'AS-BOS-03', ip: '10.8.3.1', type: 'access-switch' },
    dst:     { id: 'dst', label: '10.8.3.134', ip: '10.8.3.134', type: 'endpoint' },
  }

  // ── Pointer events ───────────────────────────────────────────────────────
  const onNodeDown = useCallback((e, id) => {
    e.stopPropagation()
    e.preventDefault()
    if (e.button !== 0) return
    setSelectedNodeId(id)
    onNodeAction?.({
      actionId: 'select-node',
      node: nodeMeta[id],
    })
    dragging.current = { id, startX: e.clientX, startY: e.clientY, origX: pos[id].x, origY: pos[id].y }
  }, [pos, onNodeAction, nodeMeta])

  const onBgDown = useCallback((e) => {
    if (dragging.current) return
    panning.current = { startX: e.clientX, startY: e.clientY, origPanX: pan.x, origPanY: pan.y }
  }, [pan])

  const onMove = useCallback((e) => {
    if (dragging.current) {
      const { id, startX, startY, origX, origY } = dragging.current
      const dx = (e.clientX - startX) / scale
      const dy = (e.clientY - startY) / scale
      setPos(prev => ({ ...prev, [id]: { ...prev[id], x: origX + dx, y: origY + dy } }))
    } else if (panning.current) {
      const dx = e.clientX - panning.current.startX
      const dy = e.clientY - panning.current.startY
      setPan({ x: panning.current.origPanX + dx, y: panning.current.origPanY + dy })
    }
  }, [scale])

  const onUp = useCallback(() => {
    dragging.current = null
    panning.current  = null
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup',   onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [onMove, onUp])

  // Wheel zoom — attach with passive:false so we can preventDefault
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e) => {
      e.preventDefault()
      setScale(s => Math.min(Math.max(s * (e.deltaY < 0 ? 1.08 : 0.92), 0.25), 4))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [])

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

  // ── Compute edge paths from current positions ────────────────────────────
  const { cx, cy, top, bot, lft, rgt } = g(pos)

  // Forward path segments (src→asSrc→dsSrc→crBos02→erBos07→dsDst→asDst→dst)
  const fwdEdges = [
    [cx('src'),            bot('src'),     cx('asSrc'),        top('asSrc')],
    [cx('asSrc'),          bot('asSrc'),   cx('dsSrc'),        top('dsSrc')],
    [lft('dsSrc') + 35,    bot('dsSrc'),   cx('crBos02'),      top('crBos02')],
    [cx('crBos02'),        bot('crBos02'), cx('erBos07'),      top('erBos07')],
    [cx('erBos07'),        bot('erBos07'), lft('dsDst') + 35,  top('dsDst')],
    [cx('dsDst'),          bot('dsDst'),   cx('asDst'),        top('asDst')],
    [cx('asDst'),          bot('asDst'),   cx('dst'),          top('dst')],
  ]

  // Return path: dsDst → crBos01 → dsSrc  (curved, right side bypass)
  const cpX1 = Math.max(rgt('dsDst'), rgt('crBos01')) + 64
  const retD1 = `M ${cx('dsDst')} ${cy('dsDst')} C ${cpX1} ${cy('dsDst')} ${cpX1} ${cy('crBos01')} ${cx('crBos01')} ${cy('crBos01')}`
  const cpX2 = Math.max(rgt('crBos01'), rgt('dsSrc')) + 64
  const retD2 = `M ${cx('crBos01')} ${cy('crBos01')} C ${cpX2} ${cy('crBos01')} ${cpX2} ${cy('dsSrc')} ${cx('dsSrc')} ${cy('dsSrc')}`

  // Label midpoint on crBos02→erBos07 edge
  const lblX = (cx('crBos02') + cx('erBos07')) / 2 + 2
  const lblY = (bot('crBos02') + top('erBos07')) / 2

  // ── Canvas total size for SVG ─────────────────────────────────────────────
  const SVG_W = 900, SVG_H = 900

  // ── Node renderer ─────────────────────────────────────────────────────────
  const Node = ({ id, label, ip, icon: Icon, iconColor, borderColor, bg, badge, badgeColor }) => {
    const n = pos[id]
    const isEp = id === 'src' || id === 'dst'
    const isSelected = selectedNodeId === id
    const resolvedBorderColor = isSelected ? '#2563eb' : (borderColor || '#d4d4d4')
    const resolvedShadow = isSelected
      ? '0 0 0 2px rgba(37,99,235,0.14), 0 2px 8px rgba(37,99,235,0.18)'
      : borderColor && borderColor !== '#d4d4d4'
        ? `0 0 0 2px ${borderColor}28, 0 1px 4px rgba(0,0,0,0.07)`
        : '0 1px 3px rgba(0,0,0,0.06)'
    return (
      <div
        onMouseDown={(e) => onNodeDown(e, id)}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          const bounds = containerRef.current?.getBoundingClientRect()
          if (!bounds) return
          const menuWidth = 164
          const menuHeight = 102
          const x = Math.min(e.clientX - bounds.left, bounds.width - menuWidth - 8)
          const y = Math.min(e.clientY - bounds.top, bounds.height - menuHeight - 8)
          setSelectedNodeId(id)
          setContextMenu({ nodeId: id, x: Math.max(8, x), y: Math.max(8, y) })
        }}
        onMouseUp={(e) => {
          if (e.button !== 0) return
          e.stopPropagation()
          setSelectedNodeId(id)
          onNodeAction?.({
            actionId: 'select-node',
            node: nodeMeta[id],
          })
        }}
        style={{
          position: 'absolute',
          left: n.x, top: n.y, width: n.w, height: n.h,
          background: bg || '#fff',
          border: `1.5px solid ${resolvedBorderColor}`,
          borderRadius: isEp ? 10 : 7,
          display: 'flex', alignItems: 'center',
          gap: isEp ? 5 : 6,
          padding: isEp ? '0 8px' : '0 8px',
          cursor: 'grab',
          boxShadow: resolvedShadow,
          userSelect: 'none',
        }}
      >
        {badge && <Badge label={badge} color={badgeColor} />}
        {isEp ? (
          <>
            <Icon />
            <div style={{ fontSize: 11, fontWeight: 600, color: '#1e3fa0' }}>{label}</div>
          </>
        ) : (
          <>
            <Icon color={iconColor || '#666'} />
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: '#111', lineHeight: 1.3 }}>{label}</div>
              <div style={{ fontSize: 10.5, color: '#555', lineHeight: 1.3 }}>{ip}</div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={onBgDown}
      style={{
        width: '100%', height: '100%', overflow: 'hidden', position: 'relative',
        background: widgetMode ? '#fff' : '#fafafa',
        backgroundImage: widgetMode ? 'none' : 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
        backgroundSize: '20px 20px',
        cursor: panning.current ? 'grabbing' : 'default',
      }}
    >
      {contextMenu && (
        <div
          onMouseDown={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            left: contextMenu.x,
            top: contextMenu.y,
            zIndex: 30,
            width: 164,
            background: '#fff',
            border: '1px solid #dfdfdf',
            borderRadius: 9,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.07)',
            padding: 5,
          }}
        >
          {NODE_MENU_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => {
                const node = nodeMeta[contextMenu.nodeId]
                setContextMenu(null)
                if (!node) return
                onNodeAction?.({
                  actionId: item.id,
                  node,
                  prompt: buildNodePrompt(item.id, node),
                })
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '7px 9px',
                border: 'none',
                borderRadius: 7,
                background: 'transparent',
                color: '#2f2d29',
                fontSize: 11.5,
                textAlign: 'left',
                cursor: 'pointer',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#f3f0ea'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Zoom controls — focus mode only */}
      {!widgetMode && <div style={{
        position: 'absolute', bottom: 16, right: 16, zIndex: 20,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {[['＋', 1.15], ['－', 0.85]].map(([lbl, f]) => (
          <button key={lbl} onClick={() => setScale(s => Math.min(Math.max(s * f, 0.25), 4))}
            style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d4d4d4', background: '#fff', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >{lbl}</button>
        ))}
        <button onClick={() => { setScale(1); setPan({ x: 40, y: 20 }) }}
          style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #d4d4d4', background: '#fff', cursor: 'pointer', fontSize: 9, fontWeight: 600, color: '#666', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff'}
        >FIT</button>
      </div>}

      {/* Legend — focus mode only */}
      {!widgetMode && <div style={{
        position: 'absolute', bottom: 16, left: 16, zIndex: 20,
        background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
        padding: '7px 11px', display: 'flex', flexDirection: 'column', gap: 5,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 9.5, fontWeight: 600, color: '#999', letterSpacing: '0.05em', marginBottom: 1 }}>LEGEND</div>
        {[
          { dash: false, color: '#1e40af', label: 'Forward path' },
          { dash: true,  color: '#3b82f6', label: 'Return path'  },
        ].map(({ dash, color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, color: '#333' }}>
            <svg width="28" height="8">
              <line x1="0" y1="4" x2="28" y2="4" stroke={color} strokeWidth="1.8"
                strokeDasharray={dash ? '4,3' : 'none'}/>
            </svg>
            {label}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, color: '#333' }}>
          <div style={{ width: 12, height: 10, borderRadius: 3, border: '2px solid #ef4444', background: '#fef2f2' }}/>
          Problem node
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 10.5, color: '#333' }}>
          <div style={{ width: 12, height: 10, borderRadius: 3, border: '2px solid #1e40af', background: '#fffbeb' }}/>
          Latency spike
        </div>
      </div>}

      {/* Pannable + zoomable canvas */}
      <div style={{
        position: 'absolute',
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
        transformOrigin: '0 0',
        width: SVG_W, height: SVG_H,
      }}>
        {/* SVG edge layer */}
        <svg
          width={SVG_W} height={SVG_H}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
        >
          <Markers />

          {/* Forward path */}
          {fwdEdges.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="#1e40af" strokeWidth="1.8" markerEnd="url(#vp-fwd)"/>
          ))}

          {/* BGP issue label on crBos02→erBos07 segment */}
          <text x={lblX} y={lblY} textAnchor="middle" fontSize="9" fill="#ef4444" fontWeight="600">BGP issue</text>

          {/* Return path curves */}
          <path d={retD1} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#vp-ret)"/>
          <path d={retD2} fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="5,3" markerEnd="url(#vp-ret)"/>
        </svg>

        {/* Node layer */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <Node id="src"     label="10.8.1.4"  icon={PhoneIcon} bg="#eff6ff" borderColor="#bfdbfe" />
          <Node id="asSrc"   label="AS-BOS-01" ip="10.8.1.1"  icon={SwitchIcon} />
          <Node id="dsSrc"   label="DS-BOS-01" ip="10.1.1.1"  icon={SwitchIcon} />
          <Node id="crBos02" label="CR-BOS-02" ip="10.0.0.2"  icon={RouterIcon} iconColor="#ef4444"
            borderColor="#ef4444" bg="#fef2f2" badge="Policy Change" badgeColor="#ef4444" />
          <Node id="crBos01" label="CR-BOS-01" ip="10.0.0.1"  icon={RouterIcon} iconColor="#3b82f6"
            borderColor="#93c5fd" bg="#eff6ff" />
          <Node id="erBos07" label="ER-BOS-07" ip="10.2.7.1"  icon={RouterIcon} iconColor="#d97706"
            borderColor="#1e40af" bg="#fffbeb" badge="+42ms latency" badgeColor="#d97706" />
          <Node id="dsDst"   label="DS-BOS-03" ip="10.1.3.1"  icon={SwitchIcon} />
          <Node id="asDst"   label="AS-BOS-03" ip="10.8.3.1"  icon={SwitchIcon} />
          <Node id="dst"     label="10.8.3.134" icon={PhoneIcon} bg="#eff6ff" borderColor="#bfdbfe" />
        </div>
      </div>
    </div>
  )
}
