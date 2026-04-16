import { useCallback, useState, useEffect, useRef } from 'react'
import { useAIResponse } from '../../hooks/useAIResponse'
import { useArtifactManager } from '../../hooks/useArtifactManager'
import ChatPane from './ChatPane'
import ArtifactPane from '../artifacts/ArtifactPane'
import { deriveSessionName } from './ChatPane'

const CHANGES_PROMPT_KEYWORDS = ['recent configuration changes', 'recent device changes']
const NETWORK_PROMPT_KEYWORDS  = ['boston data center', 'help me understand my network']

/* ── Icons for the lifted session header ─────────────────────────────────── */
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <line x1="7" y1="1.5" x2="7" y2="12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1.5" y1="7" x2="12.5" y2="7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
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
function ArchiveIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/>
      <rect x="1" y="3" width="22" height="5"/>
      <line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )
}

const DEFAULT_CHAT_W = 400   /* width of the right AI pane when split */
const MIN_CHAT_W     = 300
const MAX_CHAT_W     = 600

export default function AIWorkspace({
  initialPrompt = '',
  onSessionNameChange,
  onNew,
  onClose,
  restoredSession,
  currentSessionName = 'New Session',
  sessions = [],
  onSwitchSession,
  onDeleteSession,
  currentSessionListId = null,
  externalArtifact = null,   // { _key, type, label, ... } — triggers adding an artifact tab
}) {
  const promptLower = initialPrompt.toLowerCase()
  const commandSet =
    CHANGES_PROMPT_KEYWORDS.some(kw => promptLower.includes(kw)) ? 'changes'  :
    NETWORK_PROMPT_KEYWORDS.some(kw  => promptLower.includes(kw)) ? 'network' :
    'default'

  /* ── View mode ─────────────────────────────────────────────────────────── */
  const [localViewMode, setLocalViewMode] = useState(restoredSession ? 'split' : 'chat')
  const didAutoSend = useRef(false)

  /* ── Per-artifact state ─────────────────────────────────────────────────── */
  const [topologyHighlight,  setTopologyHighlight]  = useState(null)
  const [changesMapOverlay,  setChangesMapOverlay]  = useState(null)
  const [inputPrefill,       setInputPrefill]       = useState('')
  const [sessionNameOverride, setSessionNameOverride] = useState(null)

  const { artifacts, activeArtifactId, setActiveArtifactId, addArtifact, removeArtifact } =
    useArtifactManager(
      restoredSession?.artifacts        || [],
      restoredSession?.activeArtifactId || null,
    )

  const [widgetsByArtifact, setWidgetsByArtifact] = useState({})

  /* ── Right-pane (AI chat) width — user can drag the sash ──────────────── */
  const [chatPaneWidth, setChatPaneWidth] = useState(DEFAULT_CHAT_W)
  const [showChat,      setShowChat]      = useState(true)
  const isDraggingSash = useRef(false)

  /* ── Pending artifact: shown as skeleton during split transition ──────── */
  const [pendingArtifactRef, setPendingArtifactRef] = useState(null)

  /* ── Session header state ──────────────────────────────────────────────── */
  const [isEditingName,   setIsEditingName]   = useState(false)
  const [editValue,       setEditValue]       = useState('')
  const [showMenu,        setShowMenu]        = useState(false)
  const [showSessions,    setShowSessions]    = useState(false)
  const [nameAreaHovered, setNameAreaHovered] = useState(false)
  const [hoveredSessionId, setHoveredSessionId] = useState(null)
  const headerRef    = useRef(null)
  const nameInputRef = useRef(null)

  /* ── Callbacks ─────────────────────────────────────────────────────────── */
  const handleAddWidget = useCallback((artifactRef) => {
    setWidgetsByArtifact(prev => ({
      ...prev,
      [activeArtifactId]: [...(prev[activeArtifactId] || []), artifactRef],
    }))
    setLocalViewMode('split')
  }, [activeArtifactId])

  const handleTriggerSplit  = useCallback(() => setLocalViewMode('split'), [])
  const handleSetHighlight  = useCallback((val) => setTopologyHighlight(val), [])

  const handleAddArtifact = useCallback((artifactRef) => {
    addArtifact(artifactRef)
    setLocalViewMode('split')
  }, [addArtifact])

  const handleSaveArtifact = useCallback((artifactRef) => {
    if (!artifactRef) return
    addArtifact(artifactRef)
    setLocalViewMode('split')
  }, [addArtifact])

  const handleOpenArtifact = useCallback((artifactRef) => {
    const existing = artifacts.find(a => a.type === artifactRef.type && a.label === artifactRef.label)
    if (existing) {
      // Already open — just switch to it (no skeleton needed)
      setActiveArtifactId(existing.id)
      setLocalViewMode('split')
      return
    }
    // New artifact: animate chat right first, show skeleton, then load content
    setPendingArtifactRef(artifactRef)
    setLocalViewMode('split')
    setTimeout(() => {
      addArtifact(artifactRef)
      if (artifactRef.type === 'topology') setTopologyHighlight(null)
      setPendingArtifactRef(null)
    }, 380) // matches the CSS transition duration
  }, [artifacts, addArtifact, setActiveArtifactId])

  /* ── Open artifact from outside (e.g. drag-drop from network pane) ──────── */
  useEffect(() => {
    if (!externalArtifact) return
    const { _key, ...artifactRef } = externalArtifact
    handleOpenArtifact(artifactRef)
  }, [externalArtifact])

  const handleRenameSession = useCallback((name) => {
    setSessionNameOverride(name)
    onSessionNameChange?.(name)
  }, [onSessionNameChange])

  const handleTopologyNodeAction = useCallback(({ prompt }) => {
    if (!prompt) return
    setInputPrefill(prompt)
    if (localViewMode === 'entry') setLocalViewMode('chat')
  }, [localViewMode])

  /* ── AI response hook ──────────────────────────────────────────────────── */
  const { messages, isStreaming, sendMessage } = useAIResponse({
    onAddArtifact:          handleAddArtifact,
    onTriggerSplit:         handleTriggerSplit,
    onSetTopologyHighlight: handleSetHighlight,
    onSetChangesMapOverlay: setChangesMapOverlay,
    onPrefillInput:         setInputPrefill,
    initialMessages:        restoredSession?.messages || [],
  })

  // Declared after `messages` so the dependency array evaluates correctly
  const handleRemoveArtifact = useCallback((id) => {
    removeArtifact(id)
    if (artifacts.length <= 1) {
      // No AI conversation yet — go back to home instead of leaving an empty workspace
      if (!messages?.length) {
        onClose?.()
        return
      }
      setLocalViewMode('chat')
    }
  }, [removeArtifact, artifacts.length, messages, onClose])

  /* ── Derived (needs messages from hook above) ───────────────────────────── */
  const sessionName = sessionNameOverride ?? deriveSessionName(messages ?? [], currentSessionName)
  const isSplit = localViewMode === 'split' && (artifacts.length > 0 || pendingArtifactRef !== null)

  /* ── Auto-send initial prompt ──────────────────────────────────────────── */
  useEffect(() => {
    if (initialPrompt && !didAutoSend.current) {
      didAutoSend.current = true
      setLocalViewMode('chat')
      sendMessage(initialPrompt)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derive session name from messages ─────────────────────────────────── */
  useEffect(() => {
    if (sessionNameOverride) return
    onSessionNameChange?.(deriveSessionName(messages, currentSessionName))
  }, [messages, currentSessionName]) // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Session header interactions ───────────────────────────────────────── */
  function startHeaderEdit() {
    setEditValue(sessionName)
    setIsEditingName(true)
    setShowMenu(false)
  }
  function confirmHeaderEdit() {
    const t = editValue.trim()
    if (t) handleRenameSession(t)
    setIsEditingName(false)
  }
  useEffect(() => {
    if (isEditingName) nameInputRef.current?.select()
  }, [isEditingName])

  /* Close dropdowns on outside click */
  useEffect(() => {
    if (!showMenu && !showSessions) return
    const handler = e => {
      if (!headerRef.current?.contains(e.target)) {
        setShowMenu(false)
        setShowSessions(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu, showSessions])

  /* ── Sash drag (resize AI pane width) ─────────────────────────────────── */
  function handleSashMouseDown(e) {
    e.preventDefault()
    isDraggingSash.current = true
    const startX    = e.clientX
    const startW    = chatPaneWidth

    function onMove(ev) {
      if (!isDraggingSash.current) return
      /* Dragging left = wider chat pane */
      const next = Math.max(MIN_CHAT_W, Math.min(MAX_CHAT_W, startW + (startX - ev.clientX)))
      setChatPaneWidth(next)
    }
    function onUp() {
      isDraggingSash.current = false
      document.body.style.cursor  = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    document.body.style.cursor     = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  /* ── Send ───────────────────────────────────────────────────────────────── */
  function handleSend(text) {
    setInputPrefill('')
    sendMessage(text)
  }

  /* ════════════════════════════════════════════════════════════════════════ */
  /*  Render                                                                  */
  /* ════════════════════════════════════════════════════════════════════════ */

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ── Session header — full-width, always at top ── */}
      <div ref={headerRef} style={{
        height: 40, flexShrink: 0, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px 0 8px', borderBottom: '1px solid #e8e8e8',
        background: '#fff',
      }}>
        {/* Left: session name */}
        {isEditingName ? (
          <input
            ref={nameInputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={confirmHeaderEdit}
            onKeyDown={e => {
              if (e.key === 'Enter')  { e.preventDefault(); confirmHeaderEdit() }
              if (e.key === 'Escape') { e.preventDefault(); setIsEditingName(false) }
            }}
            style={{
              flex: 1, minWidth: 0,
              fontSize: 13, fontWeight: 500, color: '#111',
              letterSpacing: '-0.01em', border: 'none', outline: 'none',
              background: '#f5f5f5', borderRadius: 5, padding: '2px 6px',
            }}
          />
        ) : (
          /* Outer: 30% max-width cap + anchor for the dropdown */
          <div
            style={{ maxWidth: '30%', minWidth: 0, position: 'relative', flexShrink: 1, display: 'flex', alignItems: 'center', gap: 2 }}
            onMouseEnter={() => setNameAreaHovered(true)}
            onMouseLeave={() => setNameAreaHovered(false)}
          >

            {/* Name — separate click target: opens sessions list */}
            <span
              onClick={() => { setShowSessions(s => !s); setShowMenu(false) }}
              style={{
                fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.01em',
                minWidth: 0, flex: '1 1 auto',
                height: 26, display: 'flex', alignItems: 'center',
                padding: '0 6px 0 10px',
                borderRadius: showSessions || nameAreaHovered || showMenu ? '6px 0 0 6px' : 6,
                cursor: 'pointer', userSelect: 'none',
                background: showSessions ? '#e8e8e8' : nameAreaHovered || showMenu ? '#f0f0f0' : 'transparent',
                transition: 'background 0.12s, border-radius 0.12s',
              }}
            >
              <span style={{ minWidth: 0, width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {sessionName}
              </span>
            </span>

            {/* Chevron — separate click target with its own dropdown anchor */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={e => { e.stopPropagation(); setShowMenu(m => !m); setShowSessions(false) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: 26, padding: '0 5px',
                  border: 'none',
                  borderRadius: showMenu || nameAreaHovered ? '0 6px 6px 0' : 5,
                  background: showMenu ? '#e8e8e8' : nameAreaHovered ? '#f0f0f0' : 'transparent',
                  color: showMenu || nameAreaHovered ? '#555' : '#888', cursor: 'pointer',
                  transition: 'background 0.12s, color 0.12s, border-radius 0.12s',
                }}
              >
                <ChevronIcon />
              </button>

              {/* Dropdown anchored directly below the chevron */}
              {showMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300,
                  background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 140,
                }}>
                  <div
                    onMouseDown={e => { e.preventDefault(); startHeaderEdit() }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', fontSize: 13, color: '#222', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <RenameIcon /> Rename
                  </div>
                  <div
                    onMouseDown={e => { e.preventDefault(); onNew?.(); setShowMenu(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', fontSize: 13, color: '#d32f2f', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <ArchiveIcon /> Delete
                  </div>
                </div>
              )}
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
            <div style={{ maxHeight: 10 * 40, overflowY: 'auto' }} className="scrollbar-thin">
              {(() => {
                // Keep current session in the list and pin it to the top.
                const currentId = currentSessionListId ?? restoredSession?.id
                const seenIds   = new Set()
                const seenNames = new Set()
                const sessionItems = sessions.filter(s => {
                  if (seenIds.has(s.id)) return false
                  if (s.name && seenNames.has(s.name)) return false
                  seenIds.add(s.id)
                  if (s.name) seenNames.add(s.name)
                  return true
                })
                const orderedSessions = currentId
                  ? [
                      ...sessionItems.filter(s => s.id === currentId),
                      ...sessionItems.filter(s => s.id !== currentId),
                    ]
                  : sessionItems

                return orderedSessions.length > 0
                  ? orderedSessions.map(s => (
                      (() => {
                        const isInteractive = s.id === 's1' || s.id === 's2'
                        const isCurrent = s.id === currentId
                        return (
                      <div
                        key={s.id}
                        onMouseEnter={e => { setHoveredSessionId(s.id); e.currentTarget.style.background = '#f5f5f5' }}
                        onMouseLeave={e => { setHoveredSessionId(prev => prev === s.id ? null : prev); e.currentTarget.style.background = 'transparent' }}
                        onMouseDown={e => {
                          e.preventDefault()
                          if (isCurrent || !isInteractive) return
                          onSwitchSession?.(s.id)
                          setShowSessions(false)
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '9px 16px',
                          fontSize: 12.5,
                          color: '#222',
                          cursor: isCurrent ? 'default' : (isInteractive ? 'pointer' : 'default'),
                          borderBottom: '1px solid #f5f5f5',
                          background: 'transparent',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: isCurrent ? '#378ADD' : 'transparent',
                            flexShrink: 0,
                          }} />
                          <span style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: isCurrent ? 500 : 400 }}>
                            {s.name}
                          </span>
                        </div>
                        <span
                          onMouseDown={e => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (!isInteractive) return
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
                            cursor: isInteractive ? 'pointer' : 'default',
                          }}
                        >
                          Delete
                        </span>
                      </div>
                        )
                      })()
                    ))
                  : <div style={{ padding: '10px 16px', fontSize: 12, color: '#999' }}>No other sessions</div>
              })()}
            </div>
          </div>
        )}

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {/* + New */}
          <button
            onClick={onNew}
            title="New session"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              height: 28, padding: '0 9px', border: 'none', borderRadius: 5,
              background: 'transparent', color: '#444',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#111' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444' }}
          >
            + New
          </button>

          {/* Share */}
          <button
            title="Share session"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, border: 'none', borderRadius: 5,
              background: 'transparent', color: '#444',
              cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#111' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"/>
              <circle cx="6" cy="12" r="3"/>
              <circle cx="18" cy="19" r="3"/>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
            </svg>
          </button>

          {/* Show / hide chat pane — only when an artifact is open */}
          {isSplit && (
            <button
            onClick={() => setShowChat(v => !v)}
            title={showChat ? 'Hide AI pane' : 'Show AI pane'}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, border: 'none', borderRadius: 5,
                background: showChat ? '#f0f0f0' : 'transparent',
                color: '#333',
                cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
                marginLeft: 6,
              }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
            onMouseLeave={e => { e.currentTarget.style.background = showChat ? '#f0f0f0' : 'transparent'; e.currentTarget.style.color = '#333' }}
          >
            <AIPaneIcon />
          </button>
        )}

        </div>
      </div>

      {/* ── Content area — flex row so artifact grows left→right and pushes chat right ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: Artifact pane — always in DOM at width:0, grows to fill space on split */}
        <div style={{
          flexShrink: 0,
          width: !isSplit ? 0 : showChat ? `calc(100% - ${chatPaneWidth + 5}px)` : '100%',
          overflow: 'hidden',
          position: 'relative',
          transition: isDraggingSash.current ? 'none' : 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Skeleton: shown while artifact is loading during the split transition */}
          {pendingArtifactRef !== null && (
            <div style={{ position: 'absolute', inset: 0, background: '#f8f9fa', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 40, borderBottom: '1px solid #e8e8e8', background: '#fff', display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
                <div style={{ width: 130, height: 20, borderRadius: 5, background: '#eaecef', animation: 'skeleton-pulse 1.4s ease-in-out infinite' }} />
              </div>
              <div style={{ flex: 1, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 16, borderRadius: 4, background: '#eaecef', width: '45%', animation: 'skeleton-pulse 1.4s ease-in-out infinite' }} />
                <div style={{ height: 1, background: '#e8e8e8', margin: '4px 0' }} />
                {[1,2,3,4,5].map(i => (
                  <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#eaecef', flexShrink: 0, animation: 'skeleton-pulse 1.4s ease-in-out infinite' }} />
                    <div style={{ flex: 1, height: 14, borderRadius: 4, background: '#eaecef', animation: 'skeleton-pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
                    <div style={{ width: '25%', height: 14, borderRadius: 4, background: '#eaecef', animation: 'skeleton-pulse 1.4s ease-in-out infinite', animationDelay: `${i * 0.07}s` }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {artifacts.length > 0 && (
            <ArtifactPane
              artifacts={artifacts}
              activeArtifactId={activeArtifactId}
              onSetActive={setActiveArtifactId}
              onRemove={handleRemoveArtifact}
              topologyHighlight={topologyHighlight}
              onClearTopologyOverlay={() => setTopologyHighlight(null)}
              changesMapOverlay={changesMapOverlay}
              widgets={widgetsByArtifact[activeArtifactId] || []}
              onTopologyNodeAction={handleTopologyNodeAction}
            />
          )}
        </div>

        {/* Sash — same pattern as HomePage: 1px visible line with 5px grab area */}
        {isSplit && showChat && (
          <div
            onMouseDown={artifacts.length > 0 ? handleSashMouseDown : undefined}
            style={{
              flexShrink: 0,
              width: 5,
              cursor: artifacts.length > 0 ? 'col-resize' : 'default',
              position: 'relative',
              display: 'flex',
              alignItems: 'stretch',
              justifyContent: 'flex-start',
              zIndex: 10,
            }}
            onMouseEnter={e => {
              if (!artifacts.length) return
              e.currentTarget.querySelector('span').style.background = '#c8c8c8'
            }}
            onMouseLeave={e => {
              e.currentTarget.querySelector('span').style.background = '#e8e8e8'
            }}
          >
            <span style={{
              display: 'block',
              width: 1,
              background: '#e8e8e8',
              transition: 'background 0.15s',
            }} />
          </div>
        )}

        {/* RIGHT: Chat pane — flex:1 fills whatever width is left.
            In full chat mode it's 100%. In split mode it's chatPaneWidth.
            The artifact growing from the left naturally pushes this pane right. */}
        <div style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          background: '#fff',
          borderLeft: 'none',
        }}>
          <ChatPane
            hideHeader
            messages={messages}
            isStreaming={isStreaming}
            onSend={handleSend}
            onSaveArtifact={handleSaveArtifact}
            onOpenArtifact={handleOpenArtifact}
            onAddWidget={handleAddWidget}
            inputPrefill={inputPrefill}
            canAddToCanvas={isSplit}
            commandSet={commandSet}
            isNarrowLayout={isSplit}
          />
        </div>
      </div>
    </div>
  )
}
