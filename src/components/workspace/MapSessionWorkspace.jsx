import { useState, useRef, useEffect, useCallback } from 'react'
import InputArea from './InputArea'
import { useAIResponse } from '../../hooks/useAIResponse'
import { deriveSessionName } from './ChatPane'
import MessageBubble from './MessageBubble'
import SkeletonMessage from './SkeletonMessage'
import TopologyMap from '../artifacts/TopologyMap'
import ChangeAnalysisPage from '../changeanalysis/ChangeAnalysisPage'

/* ── Header icons ─────────────────────────────────────────────────────────── */
function ChevronIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <polyline points="2,4 6,8 10,4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function AIPaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.59998 10.6667V9.6H10.1333V5.86667H9.59998V4.8H11.7333V5.86667H11.2V9.6H11.7333V10.6667H9.59998Z" fill="currentColor"/>
      <path d="M7.73363 10.6667H8.80029L6.93336 4.8H5.33336L3.46851 10.6667H4.53453L4.85549 9.6H7.40381L7.73363 10.6667ZM5.17645 8.53333L6.04493 5.64741L6.18141 5.64613L7.074 8.53339L5.17645 8.53333Z" fill="currentColor"/>
    </svg>
  )
}
function RenameIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}
function DeleteIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  )
}

/* ── Sample prompts shown in the AI pane empty state ─────────────────────── */
const MAP_TRY_PROMPTS = [
  {
    label: 'Show network topology',
    prompt: 'Show network topology of [location]',
    hint: '@ to reference a location',
  },
  {
    label: 'Expand neighbours of this device',
    prompt: 'Expand neighbours of @device',
    hint: '@ to reference a device',
  },
  {
    label: 'Trace path between A and B',
    prompt: 'Trace path between @deviceA and @deviceB',
    hint: '@ to reference devices',
  },
]

/* ── Small icons ──────────────────────────────────────────────────────────── */
function CloseTabIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function MapDotGrid() {
  return (
    <div style={{
      flex: 1,
      background: '#fff',
      backgroundImage: 'radial-gradient(circle, #d8d8d8 1px, transparent 1px)',
      backgroundSize: '22px 22px',
    }} />
  )
}

/* ── Map Session Workspace ────────────────────────────────────────────────── */
export default function MapSessionWorkspace({ onSessionNameChange, onNew, sessions = [], onSwitchSession, onDeleteSession, externalMapToOpen, onExternalMapConsumed, isDraggingMap = false }) {
  const [sessionName, setSessionName]   = useState('New Session')
  const [nameOverride, setNameOverride] = useState(null)

  /* Header dropdown state */
  const [showSessions, setShowSessions]     = useState(false)
  const [showMenu, setShowMenu]             = useState(false)
  const [isEditingName, setIsEditingName]   = useState(false)
  const [editValue, setEditValue]           = useState('')
  const [nameAreaHovered, setNameAreaHovered] = useState(false)
  const [hoveredSessionId, setHoveredSessionId] = useState(null)
  const headerRef = useRef(null)
  const renameInputRef = useRef(null)

  /* Map tabs + artifact registry (tabId → artifactRef) */
  const [mapTabs, setMapTabs]           = useState([{ id: 'map-1', name: 'New Map 1' }])
  const [activeMapTab, setActiveMapTab] = useState('map-1')
  const [mapArtifacts, setMapArtifacts] = useState({}) /* { [tabId]: artifactRef } */
  const activeMapTabRef  = useRef('map-1') /* stable ref so callbacks can read current tab */
  const mapArtifactsRef  = useRef({})      /* mirrors mapArtifacts — avoids setState-inside-setState */
  useEffect(() => { activeMapTabRef.current = activeMapTab }, [activeMapTab])
  useEffect(() => { mapArtifactsRef.current = mapArtifacts }, [mapArtifacts])

  /* AI pane state */
  const [hoverPrompt, setHoverPrompt] = useState(null)  /* display-only preview on hover */
  const [inputValue, setInputValue]   = useState('')

  /* AI pane visibility + resize — hidden by default when a map is opened directly */
  const [showAiPane, setShowAiPane] = useState(false)
  const [aiPaneWidth, setAiPaneWidth] = useState(360)
  const isDragging = useRef(false)

  const bottomRef = useRef(null)

  /* ── Artifact handlers ──────────────────────────────────────────────────── */
  const handleAddArtifact = useCallback((artifactRef) => {
    const currentTabId = activeMapTabRef.current
    /* Read current state from ref — never call setX inside a setState updater */
    if (!mapArtifactsRef.current[currentTabId]) {
      /* Active tab is empty — render artifact in it, rename it */
      setMapTabs(tabs => tabs.map(t =>
        t.id === currentTabId ? { ...t, name: artifactRef.label ?? 'Map' } : t
      ))
      setMapArtifacts(prev => ({ ...prev, [currentTabId]: artifactRef }))
    } else {
      /* Active tab already has content — open a new tab */
      const tabId = `artifact-${artifactRef.type}-${Date.now()}`
      setMapTabs(tabs => [...tabs, { id: tabId, name: artifactRef.label ?? 'Map' }])
      setActiveMapTab(tabId)
      setMapArtifacts(prev => ({ ...prev, [tabId]: artifactRef }))
    }
  }, [])

  /* Open a map pushed in from the network pane (drag-drop or click "Open") */
  useEffect(() => {
    if (!externalMapToOpen) return
    handleAddArtifact({ type: 'topology', label: externalMapToOpen.label, dataKey: externalMapToOpen.id })
    onExternalMapConsumed?.()
  }, [externalMapToOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenArtifact = useCallback((artifactRef) => {
    /* Read current state from ref — never call setX inside a setState updater */
    const current = mapArtifactsRef.current
    const existingTabId = Object.keys(current).find(
      id => current[id].type === artifactRef.type && current[id].label === artifactRef.label
    )
    if (existingTabId) {
      /* Tab may have been closed — re-add it if missing, then focus */
      setMapTabs(tabs => {
        const exists = tabs.some(t => t.id === existingTabId)
        return exists ? tabs : [...tabs, { id: existingTabId, name: artifactRef.label ?? 'Map' }]
      })
      setActiveMapTab(existingTabId)
      return
    }
    /* No existing tab — create one */
    const tabId = `artifact-${artifactRef.type}-${Date.now()}`
    setMapTabs(tabs => [...tabs, { id: tabId, name: artifactRef.label ?? 'Map' }])
    setActiveMapTab(tabId)
    setMapArtifacts(prev => ({ ...prev, [tabId]: artifactRef }))
  }, [])

  const { messages, isStreaming, sendMessage } = useAIResponse({
    onAddArtifact: handleAddArtifact,
    onTriggerSplit: () => {},
    onSetTopologyHighlight: () => {},
    onSetChangesMapOverlay: () => {},
    onPrefillInput: () => {},
  })

  /* Scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  /* Derive session name from messages */
  useEffect(() => {
    if (nameOverride) return
    const derived = deriveSessionName(messages, 'New Session')
    setSessionName(derived)
    onSessionNameChange?.(derived)
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  /* Close header dropdowns on outside click */
  useEffect(() => {
    if (!showSessions && !showMenu) return
    const handler = e => {
      if (!headerRef.current?.contains(e.target)) {
        setShowSessions(false)
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSessions, showMenu])

  /* Focus rename input when editing starts */
  useEffect(() => {
    if (isEditingName) renameInputRef.current?.select()
  }, [isEditingName])

  function startEdit() {
    setEditValue(displayName)
    setIsEditingName(true)
    setShowMenu(false)
  }
  function confirmEdit() {
    const trimmed = editValue.trim()
    if (trimmed) { setNameOverride(trimmed); onSessionNameChange?.(trimmed) }
    setIsEditingName(false)
  }

  function handleSend(text) {
    setInputValue('')
    sendMessage(text)
  }

  function closeMapTab(id) {
    const remaining = mapTabs.filter(t => t.id !== id)
    setMapTabs(remaining)
    if (activeMapTab === id) setActiveMapTab(remaining[0]?.id ?? null)
    /* Keep artifact in registry so we can re-open it from the tile */
  }

  function handleResizeStart(e) {
    e.preventDefault()
    isDragging.current = true
    const startX = e.clientX
    const startWidth = aiPaneWidth
    const onMove = ev => {
      if (!isDragging.current) return
      /* Drag left → pane wider, drag right → pane narrower */
      const next = Math.max(260, Math.min(600, startWidth + (startX - ev.clientX)))
      setAiPaneWidth(next)
    }
    const onUp = () => {
      isDragging.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const displayName = nameOverride ?? sessionName

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ── Session header – spans full width above both panes ── */}
      <div ref={headerRef} style={{
        height: 40, flexShrink: 0, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px 0 8px', borderBottom: '1px solid #e8e8e8',
      }}>
        {isEditingName ? (
          /* Inline rename input */
          <input
            ref={renameInputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={confirmEdit}
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); confirmEdit() }
              if (e.key === 'Escape') { e.preventDefault(); setIsEditingName(false) }
            }}
            style={{
              flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: '#111',
              letterSpacing: '-0.01em', border: 'none', outline: 'none',
              background: '#f5f5f5', borderRadius: 5, padding: '2px 6px',
            }}
          />
        ) : (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}
            onMouseEnter={() => setNameAreaHovered(true)}
            onMouseLeave={() => setNameAreaHovered(false)}
          >
            {/* Session name pill — 12px left padding aligns text with tab label (8px tabbar + 12px tab) */}
            <span
              onClick={() => { setShowSessions(s => !s); setShowMenu(false) }}
              style={{
                fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.01em',
                cursor: 'pointer', userSelect: 'none', maxWidth: 300, minWidth: 0, flex: '1 1 auto',
                padding: '3px 8px 3px 12px',
                borderRadius: showSessions || nameAreaHovered || showMenu ? '6px 0 0 6px' : 5,
                background: showSessions ? '#e8e8e8' : nameAreaHovered || showMenu ? '#f0f0f0' : 'transparent',
                transition: 'background 0.12s, border-radius 0.12s',
              }}
            >
              <span style={{ minWidth: 0, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {displayName}
              </span>
            </span>

            {/* Chevron pill — highlights together with the session name, with a small gap between pills */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0,
              opacity: 1,
              pointerEvents: 'auto',
            }}>
              {/* Chevron button — click = rename/delete menu */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <button
                  onClick={e => { e.stopPropagation(); setShowMenu(m => !m); setShowSessions(false) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '3px 5px', border: 'none',
                    borderRadius: showMenu || nameAreaHovered ? '0 6px 6px 0' : 4,
                    background: showMenu ? '#e8e8e8' : nameAreaHovered ? '#f0f0f0' : 'transparent',
                    color: showMenu || nameAreaHovered ? '#555' : '#999', cursor: 'pointer',
                    transition: 'background 0.1s, color 0.1s, border-radius 0.12s',
                  }}
                >
                  <ChevronIcon />
                </button>

              {/* Rename / Delete context menu */}
              {showMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300,
                  background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 140,
                }}>
                  <div
                    onMouseDown={e => { e.preventDefault(); startEdit() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', fontSize: 13, color: '#222', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <RenameIcon /> Rename
                  </div>
                  <div
                    onMouseDown={e => { e.preventDefault(); setShowMenu(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', fontSize: 13, color: '#d32f2f', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <DeleteIcon /> Delete
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}

        {/* Sessions switcher dropdown — anchored to full header width */}
        {showSessions && (
          <div style={{
            position: 'absolute', top: 40, left: 0, width: '50%', minWidth: 280, maxWidth: 520, zIndex: 300,
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
          }}>
            {sessions.length > 0 ? sessions.filter(s => !s.current).map(s => (
              <div
                key={s.id}
                onMouseEnter={e => { setHoveredSessionId(s.id); e.currentTarget.style.background = '#f5f5f5' }}
                onMouseLeave={e => { setHoveredSessionId(prev => prev === s.id ? null : prev); e.currentTarget.style.background = 'transparent' }}
                onMouseDown={e => { e.preventDefault(); onSwitchSession?.(s.id); setShowSessions(false) }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 16px', fontSize: 12.5, color: '#222', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}
              >
                <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {s.name}
                </span>
                <span
                  onMouseDown={e => {
                    e.preventDefault()
                    e.stopPropagation()
                    onDeleteSession?.(s.id)
                    setHoveredSessionId(null)
                  }}
                  style={{
                    flexShrink: 0,
                    fontSize: 11,
                    color: '#b42318',
                    opacity: hoveredSessionId === s.id ? 1 : 0,
                    pointerEvents: hoveredSessionId === s.id ? 'auto' : 'none',
                    transition: 'opacity 0.12s',
                  }}
                >
                  Delete
                </span>
              </div>
            )) : (
              <div style={{ padding: '10px 16px', fontSize: 12, color: '#999' }}>No other sessions</div>
            )}
          </div>
        )}

        {/* ── Right-side header controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>

          {/* + New */}
          <button
            onClick={onNew}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              height: 28, padding: '0 9px', border: 'none', borderRadius: 5,
              background: 'transparent', color: '#444',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#111' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444' }}
            title="New session"
          >
            + New
          </button>

          {/* Show / hide AI pane */}
          <button
            onClick={() => setShowAiPane(v => !v)}
            title={showAiPane ? 'Hide AI pane' : 'Show AI pane'}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, border: 'none', borderRadius: 5,
              background: showAiPane ? '#f0f0f0' : 'transparent',
              color: '#333',
              cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
            onMouseLeave={e => { e.currentTarget.style.background = showAiPane ? '#f0f0f0' : 'transparent'; e.currentTarget.style.color = '#333' }}
          >
            <AIPaneIcon />
          </button>

        </div>
      </div>

      {/* ── Content row ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left: Map canvas area ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {mapTabs.length === 0 ? (
            /* ── Empty workspace state ── */
            <div style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: '#fff',
            }}>
              <div style={{ width: 300 }}>
                {/* Icon */}
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" style={{ marginBottom: 18, display: 'block' }}>
                  <rect x="6" y="10" width="52" height="42" rx="5" stroke="#d4d4d4" strokeWidth="1.5"/>
                  <line x1="6" y1="23" x2="58" y2="23" stroke="#d4d4d4" strokeWidth="1.5"/>
                  <rect x="11" y="15" width="16" height="8" rx="2.5" stroke="#d4d4d4" strokeWidth="1.5"/>
                  <rect x="30" y="15" width="16" height="8" rx="2.5" stroke="#d4d4d4" strokeWidth="1.5" strokeDasharray="3 2"/>
                  <rect x="11" y="28" width="18" height="14" rx="3" stroke="#d4d4d4" strokeWidth="1.5"/>
                  <rect x="33" y="28" width="18" height="14" rx="3" stroke="#d4d4d4" strokeWidth="1.5"/>
                  <line x1="11" y1="47" x2="38" y2="47" stroke="#d4d4d4" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>

                {/* Title */}
                <div style={{
                  fontSize: 15, fontWeight: 600, color: '#1a1a1a',
                  marginBottom: 8, letterSpacing: '-0.01em',
                }}>
                  Workspace
                </div>

                {/* Description */}
                <div style={{
                  fontSize: 13, color: '#555', lineHeight: 1.5,
                }}>
                  Open maps, reports, and other artifacts here to explore and manage your network context. Everything you open becomes part of your current session.
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Map tab bar */}
              <div style={{
                height: 40, display: 'flex', alignItems: 'center',
                padding: '0 8px', gap: 2,
                borderBottom: '1px solid #e8e8e8', background: '#fff', flexShrink: 0,
              }}>
                {mapTabs.map(tab => {
                  const isActive = tab.id === activeMapTab
                  return (
                    <div
                      key={tab.id}
                      onClick={() => setActiveMapTab(tab.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        padding: '0 6px 0 12px', height: 28, borderRadius: 6,
                        background: isActive ? '#f0f0f0' : 'transparent',
                        cursor: 'pointer', userSelect: 'none',
                        fontSize: 12, fontWeight: isActive ? 500 : 400,
                        color: isActive ? '#111' : '#767676',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      {tab.name}
                      <button
                        onClick={e => { e.stopPropagation(); closeMapTab(tab.id) }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          padding: '2px 3px', borderRadius: 4, color: '#bbb',
                          display: 'flex', alignItems: 'center',
                          transition: 'background 0.1s, color 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.color = '#555' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#bbb' }}
                      >
                        <CloseTabIcon />
                      </button>
                    </div>
                  )
                })}
              </div>

              {/* Map canvas — topology, changeAnalysis, or dot-grid depending on active tab */}
              {(() => {
                const artifact = mapArtifacts[activeMapTab]
                if (artifact?.type === 'topology') {
                  return (
                    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                      <TopologyMap />
                    </div>
                  )
                }
                if (artifact?.type === 'changeAnalysis') {
                  return (
                    <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                      <ChangeAnalysisPage embedded={true} />
                    </div>
                  )
                }
                return <MapDotGrid />
              })()}
            </>
          )}
        </div>

        {/* ── Resize handle + AI pane (hidden when showAiPane is false) ── */}
        {showAiPane && (
          <>
            <div
              onMouseDown={handleResizeStart}
              style={{
                width: 5, flexShrink: 0, cursor: 'col-resize',
                background: 'transparent', position: 'relative', zIndex: 10,
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            />

            {/* ── Right: AI pane ── */}
            <div style={{
              width: aiPaneWidth, flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              background: '#fff', overflow: 'hidden',
              borderLeft: '1px solid #e8e8e8',
              position: 'relative',
            }}>
              {/* Drag blocker — prevents the AppFrame drop zone from accepting drops on the AI pane */}
              {isDraggingMap && (
                <div
                  style={{ position: 'absolute', inset: 0, zIndex: 301, cursor: 'no-drop' }}
                  onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'none' }}
                  onDrop={e => { e.preventDefault(); e.stopPropagation() }}
                />
              )}

          {/* Messages or empty "Try asking" state */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            {messages.length === 0 ? (
              /* ── Empty state ── */
              <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                justifyContent: 'flex-end', padding: '20px 16px 28px',
              }}>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#555',
                  letterSpacing: '0.01em', marginBottom: 8, paddingLeft: 2,
                }}>
                  Try asking
                </div>
                {MAP_TRY_PROMPTS.map(({ label, prompt, hint }) => (
                  <div
                    key={label}
                    onClick={() => { setHoverPrompt(null); setInputValue(prompt) }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; setHoverPrompt(prompt) }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; setHoverPrompt(null) }}
                    style={{
                      padding: '9px 10px', borderRadius: 7,
                      cursor: 'pointer', fontSize: 13, color: '#222',
                      background: 'transparent', transition: 'background 0.12s',
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                ))}
              </div>
            ) : (
              /* ── Message list ── */
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 16px 8px' }} className="scrollbar-thin">
                {messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onSaveArtifact={handleOpenArtifact}
                    onOpenArtifact={handleOpenArtifact}
                    onAddWidget={() => {}}
                    canAddToCanvas={false}
                    isNarrowLayout={true}
                  />
                ))}
                {isStreaming && <SkeletonMessage />}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {/* Input area */}
          <div style={{
            padding: '12px 14px 16px',
            borderTop: '1px solid #f0f0f0', flexShrink: 0,
          }}>
            <InputArea
              onSend={handleSend}
              isStreaming={isStreaming}
              initialValue={inputValue}
              onValueChange={v => setInputValue(v)}
              placeholder="Ask about your network, / for shortcuts, @ to reference"
              externalPreview={hoverPrompt}
              maxExpandHeight={100}
            />
          </div>
        </div>
          </>
        )}
      </div>
    </div>
  )
}
