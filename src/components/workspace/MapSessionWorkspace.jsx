import { useState, useRef, useEffect, useCallback } from 'react'
import InputArea from './InputArea'
import { useAIResponse } from '../../hooks/useAIResponse'
import { deriveSessionName } from './ChatPane'
import MessageBubble from './MessageBubble'
import SkeletonMessage from './SkeletonMessage'
import TopologyMap from '../artifacts/TopologyMap'
import ChangeAnalysisPage from '../changeanalysis/ChangeAnalysisPage'
// NewSessionButton removed — replaced with inline + New Session

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
function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
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

/* ── Map toolbar drawing tools ───────────────────────────────────────────── */
const MAP_TOOLS = [
  {
    id: 'page',
    label: 'Note',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M3 1.5H9L12 4.5V13.5H3V1.5Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round"/>
        <path d="M9 1.5V4.5H12" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <line x1="5" y1="7" x2="10" y2="7" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
        <line x1="5" y1="9.5" x2="8.5" y2="9.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'table',
    label: 'Table',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1.5" y="1.5" width="12" height="12" rx="1.25" stroke="currentColor" strokeWidth="1.25"/>
        <line x1="1.5" y1="5.5" x2="13.5" y2="5.5" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="1.5" y1="9.5" x2="13.5" y2="9.5" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="5.5" y1="1.5" x2="5.5" y2="13.5" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="9.5" y1="1.5" x2="9.5" y2="13.5" stroke="currentColor" strokeWidth="1.1"/>
      </svg>
    ),
  },
  {
    id: 'rect',
    label: 'Rectangle',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="2" y="3" width="11" height="9" rx="1.25" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    id: 'ellipse',
    label: 'Ellipse',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="7.5" cy="7.5" r="5.25" stroke="currentColor" strokeWidth="1.25"/>
      </svg>
    ),
  },
  {
    id: 'line',
    label: 'Line',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <line x1="2" y1="13" x2="13" y2="2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'arrow',
    label: 'Arrow',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <line x1="2.5" y1="12.5" x2="11.5" y2="3.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M11.5 3.5H7.5M11.5 3.5V7.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    id: 'text',
    label: 'Text',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M2.5 3.5H12.5M7.5 3.5V12.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M5.5 12.5H9.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'link',
    label: 'Link',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M6 5.5H4.5A2.5 2.5 0 0 0 4.5 10.5H6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <path d="M9 5.5H10.5A2.5 2.5 0 0 1 10.5 10.5H9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        <line x1="6" y1="8" x2="9" y2="8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'pen',
    label: 'Pen',
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M10.5 2L13 4.5L5.5 12L2.5 12.5L3 9.5L10.5 2Z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round" strokeLinecap="round"/>
        <line x1="8.5" y1="4" x2="11" y2="6.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/>
      </svg>
    ),
  },
]

/* ── Map Session Workspace ────────────────────────────────────────────────── */
export default function MapSessionWorkspace({ onSessionNameChange, onNew, sessions = [], onSwitchSession, onDeleteSession, externalMapToOpen, onExternalMapConsumed, isDraggingMap = false }) {
  const [sessionName, setSessionName]   = useState('')
  const [nameOverride, setNameOverride] = useState(null)

  /* Whether a session has been formally created (first AI response received) */
  const [sessionActive, setSessionActive]           = useState(false)
  const [sessionJustActivated, setSessionJustActivated] = useState(false)

  /* Header dropdown state */
  const [showSessions, setShowSessions]     = useState(false)
  const [showMenu, setShowMenu]             = useState(false)
  const [showShareMenu, setShowShareMenu]   = useState(false)
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

  /* Map toolbar state */
  const [activeTool, setActiveTool] = useState('select')
  const [mapSaveState, setMapSaveState] = useState('idle')
  const [loadingTabId, setLoadingTabId] = useState(null)
  function handleMapSave() {
    setMapSaveState('saved')
    setTimeout(() => setMapSaveState('idle'), 1600)
  }

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
    let targetTabId
    if (!mapArtifactsRef.current[currentTabId]) {
      /* Active tab is empty — render artifact in it, rename it */
      setMapTabs(tabs => tabs.map(t =>
        t.id === currentTabId ? { ...t, name: artifactRef.label ?? 'Map' } : t
      ))
      setMapArtifacts(prev => ({ ...prev, [currentTabId]: artifactRef }))
      targetTabId = currentTabId
    } else {
      /* Active tab already has content — open a new tab */
      const tabId = `artifact-${artifactRef.type}-${Date.now()}`
      setMapTabs(tabs => [...tabs, { id: tabId, name: artifactRef.label ?? 'Map' }])
      setActiveMapTab(tabId)
      setMapArtifacts(prev => ({ ...prev, [tabId]: artifactRef }))
      targetTabId = tabId
    }
    /* Show loading state on the tab for 1500ms */
    setLoadingTabId(targetTabId)
    setTimeout(() => setLoadingTabId(null), 1500)
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

  /* Activates the session — called on first AI response OR manual "session with current tabs" */
  const activateSession = useCallback((nameHint) => {
    const name = nameHint || mapTabs.find(t => t.id === activeMapTabRef.current)?.name || 'Untitled Session'
    setSessionActive(true)
    setSessionJustActivated(true)
    setTimeout(() => setSessionJustActivated(false), 900)
    setSessionName(name)
    onSessionNameChange?.(name)
  }, [onSessionNameChange]) // eslint-disable-line react-hooks/exhaustive-deps

  const { messages, isStreaming, sendMessage } = useAIResponse({
    onAddArtifact: handleAddArtifact,
    onTriggerSplit: () => {},
    onSetTopologyHighlight: () => {},
    onSetChangesMapOverlay: () => {},
    onPrefillInput: () => {},
    onFirstAIResponse: () => activateSession(),
  })

  /* Scroll to bottom on new messages */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  /* Derive session name from messages — only once session is active */
  useEffect(() => {
    if (!sessionActive || nameOverride) return
    const derived = deriveSessionName(messages, sessionName || 'Untitled Session')
    if (derived && derived !== sessionName) {
      setSessionName(derived)
      onSessionNameChange?.(derived)
    }
  }, [messages, sessionActive]) // eslint-disable-line react-hooks/exhaustive-deps

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
  const activeTabName = mapTabs.find(t => t.id === activeMapTab)?.name ?? 'Workspace'

  /* Share + AI toggle (+ New Session when active) — in session header or tab bar */
  const ShareAndAIButtons = (
    <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, flexShrink: 0, alignSelf: 'stretch' }}>
      {/* + New — only once a session exists */}
      {sessionActive && (
        <button
          onClick={() => { onNew?.() }}
          style={{
            display: 'inline-flex', alignItems: 'center',
            height: 26, padding: '0 9px', border: 'none', borderRadius: 5,
            background: 'transparent', color: '#444', alignSelf: 'center',
            fontSize: 12, fontWeight: 500, cursor: 'pointer',
            transition: 'background 0.1s', flexShrink: 0, marginRight: 2,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          + New
        </button>
      )}
      <div style={{ position: 'relative', alignSelf: 'center' }}>
        <button
          onClick={() => { setShowShareMenu(m => !m); setShowMenu(false); setShowSessions(false) }}
          title={sessionActive ? 'Share' : 'Share this artifact'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            height: 28, padding: '0 10px', border: 'none', borderRadius: 5,
            background: showShareMenu ? '#f0f0f0' : 'transparent',
            color: '#444', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', transition: 'background 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
          onMouseLeave={e => { e.currentTarget.style.background = showShareMenu ? '#f0f0f0' : 'transparent' }}
        >
          <ShareIcon />
          Share
        </button>

        {showShareMenu && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 1000,
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.13)', overflow: 'hidden',
            minWidth: sessionActive ? 230 : 260,
          }}>
            {sessionActive ? (
              <>
                <div style={{ padding: '10px 14px 6px', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Share as</div>
                {[
                  { label: 'Entire session with chat', desc: 'Includes all tabs + AI conversation' },
                  { label: 'Entire session without chat', desc: 'All tabs only, no chat history' },
                  { label: activeTabName, desc: 'This artifact only' },
                ].map(opt => (
                  <div
                    key={opt.label}
                    onMouseDown={e => { e.preventDefault(); setShowShareMenu(false) }}
                    style={{ padding: '8px 14px 9px', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7f7f7'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#111' }}>{opt.label}</div>
                    <div style={{ fontSize: 11.5, color: '#888', marginTop: 1 }}>{opt.desc}</div>
                  </div>
                ))}
              </>
            ) : (
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111', marginBottom: 4 }}>Share {activeTabName}</div>
                <div style={{ fontSize: 12, color: '#666', marginBottom: 10, lineHeight: 1.45 }}>Anyone with the link can view this artifact.</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f5f5f5', borderRadius: 6, padding: '6px 10px', fontSize: 12, color: '#555' }}>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    acme.io/map/{activeTabName.toLowerCase().replace(/\s+/g, '-')}
                  </span>
                  <button onMouseDown={e => e.preventDefault()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#555', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  </button>
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 8 }}>Shares this artifact only — not your AI conversation.</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI toggle — always a 40×40 square flush to the right edge of the header */}
      <button
        onClick={() => setShowAiPane(v => !v)}
        title={showAiPane ? 'Hide AI pane' : 'Show AI pane'}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          padding: 0,
          alignSelf: 'stretch',
          height: 'auto',
          width: 40,
          border: 'none',
          borderLeft: showAiPane ? '1px solid #e0e0e0' : 'none',
          borderRadius: 0,
          background: showAiPane ? '#e8e8e8' : 'transparent',
          color: showAiPane ? '#111' : '#333',
          cursor: 'pointer',
          transition: 'background 0.1s, color 0.1s',
          marginRight: -8,
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = showAiPane ? '#dedede' : '#f0f0f0'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = showAiPane ? '#e8e8e8' : 'transparent'
        }}
      >
        <AIPaneIcon />
      </button>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ── Session header — slides in from top when session activates ── */}
      <div ref={headerRef} style={{
        height: sessionActive ? 40 : 0,
        /* overflow:hidden only during the slide-in; once open, must be visible so the Share dropdown can escape */
        overflow: sessionActive ? 'visible' : 'hidden',
        flexShrink: 0,
        transition: 'height 380ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
      }}>
        {/* Inner content fades in after the container opens — feels natural, not abrupt */}
        <div style={{
          height: 40,
          display: 'flex', alignItems: 'center',
          padding: '0 8px', borderBottom: '1px solid #e8e8e8',
          gap: 4,
          opacity: sessionActive ? 1 : 0,
          transition: 'opacity 260ms ease 120ms',
        }}>
          {/* ── Left: session name + chevron ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0, flex: 1 }}>
            {isEditingName ? (
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
                  flex: 1, minWidth: 0, maxWidth: 280,
                  fontSize: 13, fontWeight: 500, color: '#111',
                  letterSpacing: '-0.01em', border: 'none', outline: 'none',
                  background: '#f5f5f5', borderRadius: 5, padding: '2px 8px',
                }}
              />
            ) : (
              <>
                <span
                  className={sessionJustActivated ? 'session-name-enter' : ''}
                  onClick={() => { setShowSessions(s => !s); setShowMenu(false); setShowShareMenu(false) }}
                  onMouseEnter={e => { if (!showSessions) e.currentTarget.style.background = '#f0f0f0' }}
                  onMouseLeave={e => { if (!showSessions) e.currentTarget.style.background = 'transparent' }}
                  style={{
                    fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.01em',
                    cursor: 'pointer', userSelect: 'none', maxWidth: 260, minWidth: 0,
                    padding: '3px 6px 3px 10px',
                    borderRadius: 6,
                    background: showSessions ? '#e8e8e8' : 'transparent',
                    transition: 'background 0.12s',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}
                >
                  {displayName}
                </span>

                {/* Chevron + rename/delete dropdown */}
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <button
                    onClick={e => { e.stopPropagation(); setShowMenu(m => !m); setShowSessions(false) }}
                    onMouseEnter={e => { e.currentTarget.style.background = showMenu ? '#e8e8e8' : '#f0f0f0'; e.currentTarget.style.color = '#555' }}
                    onMouseLeave={e => { e.currentTarget.style.background = showMenu ? '#e8e8e8' : 'transparent'; e.currentTarget.style.color = showMenu ? '#555' : '#aaa' }}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      height: 26, padding: '0 5px', border: 'none',
                      borderRadius: 6,
                      background: showMenu ? '#e8e8e8' : 'transparent',
                      color: showMenu ? '#555' : '#aaa',
                      cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
                    }}
                  >
                    <ChevronIcon />
                  </button>

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
              </>
            )}

          </div>

          {/* Sessions switcher dropdown */}
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
                  <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.name}</span>
                  <span
                    onMouseDown={e => { e.preventDefault(); e.stopPropagation(); onDeleteSession?.(s.id); setHoveredSessionId(null) }}
                    style={{ flexShrink: 0, fontSize: 11, color: '#b42318', opacity: hoveredSessionId === s.id ? 1 : 0, pointerEvents: hoveredSessionId === s.id ? 'auto' : 'none', transition: 'opacity 0.12s' }}
                  >
                    Delete
                  </span>
                </div>
              )) : (
                <div style={{ padding: '10px 16px', fontSize: 12, color: '#999' }}>No other sessions</div>
              )}
            </div>
          )}

          {/* ── Right: Share ▾ + AI ── */}
          {ShareAndAIButtons}
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
              {/* Map tab bar — Share+AI live here when free-floating, move up to session header once active */}
              <div style={{
                height: 40, display: 'flex', alignItems: 'center',
                padding: '0 8px', gap: 2,
                borderBottom: '1px solid #e8e8e8', background: '#fff', flexShrink: 0,
              }}>
                {mapTabs.map(tab => {
                  const isActive = tab.id === activeMapTab
                  const isLoading = tab.id === loadingTabId
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
                        animation: isLoading ? 'skeleton-pulse 1.1s ease-in-out infinite' : 'none',
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    >
                      {isLoading && (
                        <span style={{
                          display: 'inline-block', width: 8, height: 8, flexShrink: 0,
                          border: '1.5px solid #999', borderTopColor: 'transparent',
                          borderRadius: '50%', animation: 'spin 0.7s linear infinite',
                        }} />
                      )}
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
                {/* Spacer + Share/AI — only visible when no session header yet */}
                {!sessionActive && (
                  <>
                    <div style={{ flex: 1 }} />
                    {ShareAndAIButtons}
                  </>
                )}
              </div>

              {/* Map canvas — topology, changeAnalysis, or dot-grid depending on active tab */}
              {(() => {
                const artifact = mapArtifacts[activeMapTab]
                const isMapLoading = loadingTabId === activeMapTab

                /* ── Loading state — shown while map is opening ── */
                if (isMapLoading) {
                  return (
                    <div style={{
                      flex: 1, position: 'relative', overflow: 'hidden',
                      background: '#f8f8f8',
                      backgroundImage: 'radial-gradient(circle, #d8d8d8 1px, transparent 1px)',
                      backgroundSize: '22px 22px',
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 14,
                    }}>
                      {/* Spinner ring */}
                      <div style={{
                        width: 32, height: 32, flexShrink: 0,
                        border: '2.5px solid #e0e0e0',
                        borderTopColor: '#aaa',
                        borderRadius: '50%',
                        animation: 'spin 0.75s linear infinite',
                      }} />
                      <span style={{ fontSize: 12, color: '#aaa', letterSpacing: '0.01em' }}>
                        Loading map…
                      </span>
                    </div>
                  )
                }

                if (artifact?.type === 'topology') {
                  return (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                      {/* ── Map toolbar ── */}
                      <div style={{
                        height: 34, flexShrink: 0,
                        display: 'flex', alignItems: 'center',
                        padding: '0 12px',
                        borderBottom: '1px solid #ebebeb',
                        background: '#fff',
                        gap: 1,
                      }}>
                        {/* Drawing tools */}
                        {MAP_TOOLS.map(tool => (
                          <button
                            key={tool.id}
                            title={tool.label}
                            onClick={() => setActiveTool(tool.id)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: 28, height: 28, border: 'none', borderRadius: 6,
                              background: activeTool === tool.id ? '#e8e8e8' : 'transparent',
                              color: activeTool === tool.id ? '#111' : '#888',
                              cursor: 'pointer', transition: 'background 0.08s, color 0.08s',
                              flexShrink: 0,
                            }}
                            onMouseEnter={e => { if (activeTool !== tool.id) { e.currentTarget.style.background = '#f2f2f2'; e.currentTarget.style.color = '#333' } }}
                            onMouseLeave={e => { if (activeTool !== tool.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888' } }}
                          >
                            {tool.icon}
                          </button>
                        ))}

                        {/* Spacer */}
                        <div style={{ flex: 1 }} />

                        {/* Save — flat text only */}
                        <button
                          onClick={handleMapSave}
                          style={{
                            background: 'none', border: 'none', padding: '0 2px',
                            fontSize: 12, fontWeight: 500, cursor: 'pointer',
                            color: mapSaveState === 'saved' ? '#1a7a3f' : '#555',
                            transition: 'color 0.15s',
                          }}
                          onMouseEnter={e => { if (mapSaveState === 'idle') e.currentTarget.style.color = '#111' }}
                          onMouseLeave={e => { if (mapSaveState === 'idle') e.currentTarget.style.color = '#555' }}
                        >
                          {mapSaveState === 'saved' ? 'Saved' : 'Save'}
                        </button>
                      </div>

                      {/* Map canvas */}
                      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
                        <TopologyMap />
                      </div>
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
            {/* Zero-width sash — takes no layout space, hit-target straddles the border */}
            <div style={{ width: 0, flexShrink: 0, position: 'relative', zIndex: 11 }}>
              <div
                onMouseDown={handleResizeStart}
                style={{
                  position: 'absolute', top: 0, bottom: 0,
                  left: -3, width: 6,
                  cursor: 'col-resize',
                  background: 'transparent',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              />
            </div>

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
                padding: '20px 16px 28px',
              }}>
                {/* ── Illustration ── */}
                <div style={{
                  flex: 1, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', paddingBottom: 16,
                }}>
                  {/* AI icon — same as the AI pane button, scaled up */}
                  <svg width="60" height="60" viewBox="0 0 16 16" fill="none" style={{ marginBottom: 14, display: 'block' }}>
                    <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="1.2" stroke="#c8c8c8" strokeWidth="1.5"/>
                    <path d="M9.59998 10.6667V9.6H10.1333V5.86667H9.59998V4.8H11.7333V5.86667H11.2V9.6H11.7333V10.6667H9.59998Z" fill="#c8c8c8"/>
                    <path d="M7.73363 10.6667H8.80029L6.93336 4.8H5.33336L3.46851 10.6667H4.53453L4.85549 9.6H7.40381L7.73363 10.6667ZM5.17645 8.53333L6.04493 5.64741L6.18141 5.64613L7.074 8.53339L5.17645 8.53333Z" fill="#c8c8c8"/>
                  </svg>
                  <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.5, textAlign: 'center', maxWidth: 200 }}>
                    Ask questions about your network or open a map to get started.
                  </div>
                </div>

                {/* ── Prompts ── */}
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#555',
                  letterSpacing: '0.01em', marginBottom: 6, paddingLeft: 10,
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
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px 6px 8px' }} className="scrollbar-thin">
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
