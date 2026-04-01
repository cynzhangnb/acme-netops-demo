import { useState, useEffect, useRef, useCallback } from 'react'
import TopologyMap from './TopologyMap'
import TrafficChart from './TrafficChart'
import DeviceTable from './DeviceTable'
import VoicePath from './VoicePath'
import ChangeAnalysis from './ChangeAnalysis'
import ShareModal from '../modals/ShareModal'

function CloseIcon() {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function ShareIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="9" cy="2" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="2" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="9" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.1"/><line x1="3.5" y1="4.7" x2="7.5" y2="2.8" stroke="currentColor" strokeWidth="1.1"/><line x1="3.5" y1="6.3" x2="7.5" y2="8.2" stroke="currentColor" strokeWidth="1.1"/></svg>
}
function EnlargeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <polyline points="1,4 1,1 4,1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="7,1 10,1 10,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="10,7 10,10 7,10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="4,10 1,10 1,7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function BackArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <polyline points="7,2 3,6.5 7,11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="3" y1="6.5" x2="11" y2="6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// Natural size for topology map scaling (matches full-canvas render)
const TOPO_NATURAL_W = 640
const TOPO_NATURAL_H = 500

function ArtifactContent({ artifact, highlight, widgetMode }) {
  if (!artifact) return null

  if (artifact.type === 'topology' && widgetMode) {
    // In widget mode, scale the map proportionally to fit the widget
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <ScaledTopology highlight={highlight} />
      </div>
    )
  }

  switch (artifact.type) {
    case 'topology':      return <TopologyMap highlight={highlight} widgetMode={false} />
    case 'chart':         return <TrafficChart />
    case 'table':         return <DeviceTable />
    case 'voicePath':     return <VoicePath widgetMode={widgetMode} />
    case 'changeAnalysis': return <ChangeAnalysis />
    default: return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 12 }}>
        Unknown artifact
      </div>
    )
  }
}

// Topology rendered at natural size, scaled down to fill the widget container
function ScaledTopology({ highlight }) {
  const outerRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const update = () => {
      const s = Math.min(el.offsetWidth / TOPO_NATURAL_W, el.offsetHeight / TOPO_NATURAL_H)
      setScale(s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#fff' }}>
      <div style={{
        width: TOPO_NATURAL_W, height: TOPO_NATURAL_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute', top: 0, left: 0,
      }}>
        <TopologyMap highlight={highlight} widgetMode={true} />
      </div>
    </div>
  )
}

function ResizeHandle({ onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{ position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, cursor: 'nwse-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', zIndex: 5 }}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <line x1="9" y1="1" x2="1" y2="9" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="9" y1="4.5" x2="4.5" y2="9" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

function CanvasWidget({ item, onDragStart, onResizeStart, highlight, isFocused, onFocus, isNew, onEnlarge, onDelete }) {
  return (
    <div
      onMouseDown={() => onFocus(item.id)}
      style={{
        position: 'absolute',
        left: item.x, top: item.y, width: item.w, height: item.h,
        background: '#fff',
        border: '1px solid #e2e2e2',
        borderRadius: 8,
        boxShadow: isFocused ? '0 4px 20px rgba(0,0,0,0.13)' : '0 1px 6px rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        zIndex: isFocused ? 10 : 1,
        animation: isNew ? 'widgetEnter 0.32s cubic-bezier(0.2,0,0,1) both' : undefined,
        transition: 'box-shadow 0.12s',
      }}
    >
      {/* Title bar / drag handle */}
      <div
        onMouseDown={(e) => { e.stopPropagation(); onFocus(item.id); onDragStart(e, item.id) }}
        style={{
          height: 30, padding: '0 8px 0 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#fafafa', borderBottom: '1px solid #f0f0f0',
          cursor: 'grab', flexShrink: 0, userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 500, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </span>
        {/* Enlarge button */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEnlarge(item.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#bbb', padding: '2px 3px', display: 'flex', alignItems: 'center',
            borderRadius: 3, flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#555'}
          onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
          title="Focus view"
        >
          <EnlargeIcon />
        </button>
        {/* Delete button */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#bbb', padding: '2px 3px', display: 'flex', alignItems: 'center',
            borderRadius: 3, flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#e53e3e'}
          onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
          title="Remove from canvas"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ArtifactContent
          artifact={item}
          highlight={item.isMain ? highlight : null}
          widgetMode={true}
        />
      </div>

      <ResizeHandle onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, item.id) }} />
    </div>
  )
}

export default function ArtifactPane({ artifacts, activeArtifactId, onSetActive, onRemove, topologyHighlight, widgets = [] }) {
  const active = artifacts.find(a => a.id === activeArtifactId)
  const [modal, setModal] = useState(null)
  const canvasRef = useRef(null)
  const [canvasItems, setCanvasItems] = useState([])
  const [focusedId, setFocusedId] = useState(null)
  const [newItemIds, setNewItemIds] = useState(new Set())
  const [expandedItemId, setExpandedItemId] = useState(null) // widget in focus view
  const canvasItemsRef = useRef([])
  const dragState = useRef(null)
  const resizeState = useRef(null)

  useEffect(() => { canvasItemsRef.current = canvasItems }, [canvasItems])

  // Reset canvas when active artifact changes
  useEffect(() => {
    if (!active) { setCanvasItems([]); return }
    const init = () => {
      const el = canvasRef.current
      if (!el) return
      const cw = el.offsetWidth || 600
      const ch = el.offsetHeight || 500
      const item = {
        id: `${active.id}__main`,
        type: active.type,
        label: active.label,
        isMain: true,
        x: 0, y: 0, w: cw, h: ch,
      }
      setCanvasItems([item])
      setNewItemIds(new Set())
      setExpandedItemId(null)
      setFocusedId(item.id)
    }
    const t = setTimeout(init, 0)
    return () => clearTimeout(t)
  }, [activeArtifactId]) // eslint-disable-line

  // Add new widgets — map goes full-width, new artifact below
  useEffect(() => {
    if (!widgets.length) return
    const el = canvasRef.current
    if (!el) return
    const cw = el.offsetWidth || 600
    const ch = el.offsetHeight || 500

    setCanvasItems(prev => {
      const next = [...prev]
      const existingWidgets = next.filter(i => !i.isMain)
      const isFirstWidget = existingWidgets.length === 0
      const addedIds = []

      for (const w of widgets) {
        const key = `${w.type}::${w.label}`
        if (next.some(i => `${i.type}::${i.label}` === key)) continue

        if (isFirstWidget) {
          // Shrink main to full-width top row
          const mainIdx = next.findIndex(i => i.isMain)
          if (mainIdx >= 0) {
            const mainH = Math.max(200, Math.round(ch * 0.50))
            next[mainIdx] = { ...next[mainIdx], x: 16, y: 16, w: cw - 32, h: mainH }
          }
        }

        // Place below the main artifact
        const mainItem = next.find(i => i.isMain)
        const belowY = mainItem ? mainItem.y + mainItem.h + 16 : 16

        // Secondary widgets: 50% width, placed side by side below main
        const rowWidgets = next.filter(i => !i.isMain)
        const widgetW = Math.max(220, Math.round((cw - 48) / 2))
        const widgetH = Math.max(180, Math.round(ch * 0.40))

        // Place this new widget after existing ones in the row
        const rowX = 16 + rowWidgets.length * (widgetW + 16)

        const newItem = {
          id: `widget-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: w.type,
          label: w.label,
          isMain: false,
          x: rowX, y: belowY, w: widgetW, h: widgetH,
        }
        next.push(newItem)
        addedIds.push(newItem.id)
        setFocusedId(newItem.id)
      }

      if (addedIds.length) {
        setNewItemIds(prev => { const s = new Set(prev); addedIds.forEach(id => s.add(id)); return s })
        setTimeout(() => {
          setNewItemIds(prev => { const s = new Set(prev); addedIds.forEach(id => s.delete(id)); return s })
        }, 500)
      }

      return next
    })
  }, [widgets]) // eslint-disable-line

  const handleDragStart = useCallback((e, id) => {
    e.preventDefault()
    const item = canvasItemsRef.current.find(i => i.id === id)
    if (!item) return
    dragState.current = { id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y }
    document.body.style.cursor = 'grabbing'
  }, [])

  const handleResizeStart = useCallback((e, id) => {
    e.preventDefault()
    const item = canvasItemsRef.current.find(i => i.id === id)
    if (!item) return
    resizeState.current = { id, startX: e.clientX, startY: e.clientY, origW: item.w, origH: item.h }
    document.body.style.cursor = 'nwse-resize'
  }, [])

  useEffect(() => {
    function onMouseMove(e) {
      if (dragState.current) {
        const { id, startX, startY, origX, origY } = dragState.current
        setCanvasItems(prev => prev.map(i =>
          i.id === id ? { ...i, x: Math.max(0, origX + (e.clientX - startX)), y: Math.max(0, origY + (e.clientY - startY)) } : i
        ))
      }
      if (resizeState.current) {
        const { id, startX, startY, origW, origH } = resizeState.current
        setCanvasItems(prev => prev.map(i =>
          i.id === id ? { ...i, w: Math.max(200, origW + (e.clientX - startX)), h: Math.max(140, origH + (e.clientY - startY)) } : i
        ))
      }
    }
    function onMouseUp() { dragState.current = null; resizeState.current = null; document.body.style.cursor = '' }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [])

  const isFocusMode = canvasItems.length === 1
  const expandedItem = expandedItemId ? canvasItems.find(i => i.id === expandedItemId) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: isFocusMode ? '#fff' : '#f0f0f0' }}>
      {/* Header tabs */}
      <div style={{
        height: 44, background: '#fff', borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
          {artifacts.map(artifact => {
            const isActive = artifact.id === activeArtifactId
            return (
              <div key={artifact.id} onClick={() => onSetActive(artifact.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
                  fontSize: 12, fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#111' : '#555',
                  background: isActive ? '#f5f5f5' : 'transparent',
                  flexShrink: 0, whiteSpace: 'nowrap', transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {artifact.label}
                <button onClick={e => { e.stopPropagation(); onRemove(artifact.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ccc', padding: 1, display: 'flex', alignItems: 'center', borderRadius: 3, lineHeight: 1 }}
                  onMouseEnter={e => e.currentTarget.style.color = '#888'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                ><CloseIcon /></button>
              </div>
            )
          })}
          {artifacts.length === 0 && <span style={{ fontSize: 12, color: '#bbb' }}>No artifacts</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button onClick={() => setModal('share')}
            style={{ padding: '4px 10px', border: '1px solid #d0d0d0', borderRadius: 5, fontSize: 12, fontWeight: 500, color: '#333', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          ><ShareIcon /> Share</button>
        </div>
      </div>

      {/* Content */}
      <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: (isFocusMode || expandedItem) ? 'hidden' : 'auto' }}>
        {/* Expanded widget focus view */}
        {expandedItem ? (
          <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 20, display: 'flex', flexDirection: 'column' }}>
            {/* Mini toolbar */}
            <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
              <button
                onClick={() => setExpandedItemId(null)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 4 }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                <BackArrowIcon /> Back to canvas
              </button>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <ArtifactContent artifact={expandedItem} highlight={expandedItem.isMain ? topologyHighlight : null} widgetMode={false} />
            </div>
          </div>
        ) : isFocusMode ? (
          /* Focus mode: single artifact fills the pane, no widget chrome */
          canvasItems.length === 1 ? (
            <div style={{ position: 'absolute', inset: 0 }}>
              <ArtifactContent artifact={canvasItems[0]} highlight={topologyHighlight} widgetMode={false} />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 12 }}>
              No artifact selected
            </div>
          )
        ) : (
          /* Canvas mode: dot grid + widget cards */
          (() => {
            const minW = canvasItems.length ? Math.max(...canvasItems.map(i => i.x + i.w + 32)) : 0
            const minH = canvasItems.length ? Math.max(...canvasItems.map(i => i.y + i.h + 32)) : 0
            return (
              <div
                style={{ position: 'relative', minWidth: minW, minHeight: minH, width: '100%', height: '100%' }}
                onMouseDown={() => setFocusedId(null)}
              >
                <div style={{
                  position: 'absolute', inset: 0, pointerEvents: 'none',
                  backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }} />
                {canvasItems.map(item => (
                  <CanvasWidget
                    key={item.id}
                    item={item}
                    onDragStart={handleDragStart}
                    onResizeStart={handleResizeStart}
                    highlight={topologyHighlight}
                    isFocused={focusedId === item.id}
                    onFocus={setFocusedId}
                    isNew={newItemIds.has(item.id)}
                    onEnlarge={setExpandedItemId}
                    onDelete={id => setCanvasItems(prev => prev.filter(i => i.id !== id))}
                  />
                ))}
              </div>
            )
          })()
        )}
      </div>

      {modal === 'share' && <ShareModal onClose={() => setModal(null)} />}
    </div>
  )
}
