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
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
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

  /* Session is "active" (has a name, appears in history) only after first AI response.
     Restored sessions start active; fresh ones start free-floating. */
  const [sessionActive, setSessionActive] = useState(
    !!(restoredSession?.messages?.length) || !!initialPrompt
  )
  const [sessionJustActivated, setSessionJustActivated] = useState(false)
  const activateSession = useCallback(() => {
    setSessionActive(prev => {
      if (prev) return prev
      setSessionJustActivated(true)
      setTimeout(() => setSessionJustActivated(false), 900)
      return true
    })
  }, [])

  const { artifacts, activeArtifactId, setActiveArtifactId, addArtifact, removeArtifact } =
    useArtifactManager(
      restoredSession?.artifacts        || [],
      restoredSession?.activeArtifactId || null,
    )

  const [widgetsByArtifact, setWidgetsByArtifact] = useState({})

  /* ── Right-pane (AI chat) width — user can drag the sash ──────────────── */
  const [chatPaneWidth, setChatPaneWidth] = useState(DEFAULT_CHAT_W)
  // Show chat pane by default only when there's already a conversation (restored session or auto-sent prompt).
  // Opening a fresh artifact (e.g. device report) starts with the artifact filling the full width.
  const [showChat,      setShowChat]      = useState(!!(initialPrompt || restoredSession?.messages?.length))
  const isDraggingSash = useRef(false)

  /* ── Pending artifact: shown as skeleton during split transition ──────── */
  const [pendingArtifactRef, setPendingArtifactRef] = useState(null)

  /* ── Session header state ──────────────────────────────────────────────── */
  const [isEditingName,   setIsEditingName]   = useState(false)
  const [editValue,       setEditValue]       = useState('')
  const [showMenu,           setShowMenu]           = useState(false)
  const [showDeleteConfirm,  setShowDeleteConfirm]  = useState(false)
  const [showSessions,       setShowSessions]       = useState(false)
  const [nameAreaHovered, setNameAreaHovered] = useState(false)

  const [hoveredSessionId,    setHoveredSessionId]    = useState(null)
  const [pinnedSessionIds,    setPinnedSessionIds]    = useState(new Set())
  const [sessionMenuOpenId,   setSessionMenuOpenId]   = useState(null)
  const [sessionDelConfirmId, setSessionDelConfirmId] = useState(null)
  const [sessionEditingId,    setSessionEditingId]    = useState(null)
  const [sessionEditValue,    setSessionEditValue]    = useState('')
  const [sessionLocalNames,   setSessionLocalNames]   = useState({})
  const [sessionDeletedIds,   setSessionDeletedIds]   = useState(new Set())
  const [sessionMenuPos,      setSessionMenuPos]      = useState(null)

  function toggleSessionPin(id) {
    setPinnedSessionIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const headerRef      = useRef(null)
  const nameInputRef   = useRef(null)
  const sessionMenuRef = useRef(null)

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
    // New artifact: slide chat pane right (380 ms), add artifact behind skeleton,
    // then clear skeleton at 900 ms so the loading state is clearly visible.
    setPendingArtifactRef(artifactRef)
    setLocalViewMode('split')
    setTimeout(() => {
      addArtifact(artifactRef)
      if (artifactRef.type === 'topology') setTopologyHighlight(null)
    }, 380) // add content once slide animation finishes
    setTimeout(() => setPendingArtifactRef(null), 900) // hold loading state for 900 ms
  }, [artifacts, addArtifact, setActiveArtifactId])

  /* ── Open artifact from outside (e.g. network pane, CA sidebar) ──────────── */
  // suppressTransitionRef: set true before the state changes so the render that
  // applies them reads 'none' for the width transition — no slide-in animation.
  // Reset via requestAnimationFrame after the browser has painted the new layout.
  const suppressTransitionRef = useRef(false)

  // Guard ref: prevents the same _key from being processed twice (React 18 Strict Mode
  // double-fires effects; without this, two identical tabs would be created).
  const lastExternalKeyRef = useRef(null)
  useEffect(() => {
    if (!externalArtifact) return
    if (externalArtifact._key === lastExternalKeyRef.current) return
    lastExternalKeyRef.current = externalArtifact._key
    const { _key, ...artifactRef } = externalArtifact

    // If already open, just switch to it (no animation needed)
    const existing = artifacts.find(a => a.type === artifactRef.type && a.label === artifactRef.label)
    if (existing) {
      setActiveArtifactId(existing.id)
      setLocalViewMode('split')
      return
    }

    // New external artifact: open instantly as a tab with a skeleton loading overlay.
    // 1. Suppress the width CSS transition for this render
    // 2. Add the artifact immediately (tab appears in the tab bar right away)
    // 3. Show skeleton overlay for 900 ms (loading feedback)
    suppressTransitionRef.current = true
    addArtifact(artifactRef)
    if (artifactRef.type === 'topology') setTopologyHighlight(null)
    setPendingArtifactRef(artifactRef)          // skeleton overlay
    setLocalViewMode('split')
    requestAnimationFrame(() => { suppressTransitionRef.current = false })
    setTimeout(() => setPendingArtifactRef(null), 900)
  }, [externalArtifact]) // eslint-disable-line react-hooks/exhaustive-deps

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
    onFirstAIResponse:      activateSession,
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
    setShowDeleteConfirm(false)
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
      // Use composedPath() so the check works even if React has already removed
      // the clicked element from the DOM (e.g. the Delete menu item) before this
      // document-level handler fires.
      const path = e.composedPath ? e.composedPath() : []
      const inside = path.includes(headerRef.current) || headerRef.current?.contains(e.target)
      if (!inside) {
        setShowMenu(false)
        setShowDeleteConfirm(false)
        setShowSessions(false)
        setSessionMenuOpenId(null)
        setSessionMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu, showSessions])

  /* Close session overflow menu on outside click */
  useEffect(() => {
    if (!sessionMenuOpenId) return
    const handler = e => {
      const path = e.composedPath ? e.composedPath() : []
      if (!path.includes(sessionMenuRef.current) && !sessionMenuRef.current?.contains(e.target)) {
        setSessionMenuOpenId(null); setSessionDelConfirmId(null); setSessionMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [sessionMenuOpenId])

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

      {/* ── Session header — slides in when session activates, hidden when free-floating ── */}
      <div ref={headerRef} style={{
        height: sessionActive ? 40 : 0,
        overflow: sessionActive ? 'visible' : 'hidden',
        flexShrink: 0, position: 'relative',
        transition: 'height 380ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
      <div style={{
        height: 40,
        display: 'flex', alignItems: 'center',
        padding: '0 8px', borderBottom: '1px solid #e8e8e8',
        background: '#fff',
        opacity: sessionActive ? 1 : 0,
        transition: 'opacity 260ms ease 120ms',
      }}>
        {/* Left: rename input or session name */}
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
          /* Session name + chevron — shared hover zone highlights both */
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, minWidth: 0, flex: 1 }}>

            {/* Shared hover wrapper */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 120, maxWidth: '70%' }}
              onMouseEnter={() => setNameAreaHovered(true)}
              onMouseLeave={() => setNameAreaHovered(false)}
            >
            {/* Name — opens sessions list */}
            <span
              onClick={() => { setShowSessions(s => !s); setShowMenu(false) }}
              className={sessionJustActivated ? 'session-name-enter' : ''}
              style={{
                fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.01em',
                cursor: 'pointer', userSelect: 'none', flex: 1, minWidth: 0,
                height: 26, padding: '0 4px 0 10px',
                borderRadius: '6px 0 0 6px',
                display: 'flex', alignItems: 'center',
                background: showSessions ? '#e8e8e8' : (nameAreaHovered ? '#f0f0f0' : 'transparent'),
                transition: 'background 0.12s',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}
            >
              {sessionName}
            </span>

            {/* Chevron — separate click target */}
            <div
              className={sessionJustActivated ? 'session-chrome-enter' : ''}
              style={{ position: 'relative', flexShrink: 0 }}
            >
              <button
                onClick={e => { e.stopPropagation(); setShowMenu(m => { if (m) setShowDeleteConfirm(false); return !m }); setShowSessions(false) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  height: 26, padding: '0 5px', border: 'none',
                  borderRadius: '0 6px 6px 0',
                  background: showMenu ? '#e8e8e8' : (nameAreaHovered ? '#f0f0f0' : 'transparent'),
                  color: (nameAreaHovered || showMenu) ? '#555' : '#aaa',
                  cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
                }}
              >
                <ChevronIcon />
              </button>

              {/* Dropdown anchored directly below the chevron */}
              {showMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 300,
                  background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 180,
                }}>
                  {showDeleteConfirm ? (
                    /* ── Confirmation state ── */
                    <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ fontSize: 13, color: '#222', fontWeight: 500, lineHeight: 1.4 }}>
                        Delete this session?
                      </div>
                      <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>
                        This action cannot be undone.
                      </div>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          onMouseDown={e => { e.preventDefault(); setShowDeleteConfirm(false) }}
                          style={{ padding: '5px 12px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', fontSize: 12, color: '#555', cursor: 'pointer', fontWeight: 500 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                        >Cancel</button>
                        <button
                          onMouseDown={e => { e.preventDefault(); onNew?.(); setShowMenu(false); setShowDeleteConfirm(false) }}
                          style={{ padding: '5px 12px', border: 'none', borderRadius: 6, background: '#d32f2f', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#b71c1c' }}
                          onMouseLeave={e => { e.currentTarget.style.background = '#d32f2f' }}
                        >Delete</button>
                      </div>
                    </div>
                  ) : (
                    /* ── Normal menu state ── */
                    <>
                      <div
                        onMouseDown={e => { e.preventDefault(); startHeaderEdit() }}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', fontSize: 12, color: '#222', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <RenameIcon /> Rename
                      </div>
                      <div
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(true) }}
                        onClick={e => { e.preventDefault(); e.stopPropagation() }}
                        style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', fontSize: 12, color: '#d32f2f', cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <ArchiveIcon /> Delete
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            </div>{/* end shared hover wrapper */}
          </div>
        )}

        {/* Sessions switcher dropdown — anchored to full header width */}
        {showSessions && (
          <div style={{
            position: 'absolute', top: 40, left: 8, minWidth: 300, maxWidth: 380, zIndex: 300,
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
          }}>
            {(() => {
              const currentId = currentSessionListId ?? restoredSession?.id
              const seenIds = new Set(); const seenNames = new Set()
              const sessionItems = sessions.filter(s => {
                if (s.current) return false
                if (sessionDeletedIds.has(s.id)) return false
                if (seenIds.has(s.id)) return false
                if (s.name && seenNames.has(s.name)) return false
                seenIds.add(s.id); if (s.name) seenNames.add(s.name)
                return true
              }).slice(0, 10)

              const pinned = sessionItems.filter(s => pinnedSessionIds.has(s.id))
              const recent = sessionItems.filter(s => !pinnedSessionIds.has(s.id))

              const renderSessionRow = (s) => {
                const isInteractive = s.id === 's1' || s.id === 's2'
                const isCurrent     = s.id === currentId
                const isPinned      = pinnedSessionIds.has(s.id)
                const isHovered     = hoveredSessionId === s.id
                const isEditing     = sessionEditingId === s.id
                const displayName   = sessionLocalNames[s.id] || (isCurrent ? sessionName : s.name)

                function openSessionOverflow(e) {
                  e.preventDefault(); e.stopPropagation()
                  if (sessionMenuOpenId === s.id) { setSessionMenuOpenId(null); setSessionMenuPos(null); return }
                  const rect = e.currentTarget.getBoundingClientRect()
                  setSessionMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
                  setSessionMenuOpenId(s.id); setSessionDelConfirmId(null)
                }

                return (
                  <div
                    key={s.id}
                    onMouseEnter={() => setHoveredSessionId(s.id)}
                    onMouseLeave={() => setHoveredSessionId(prev => prev === s.id ? null : prev)}
                    onMouseDown={e => {
                      if (isEditing) return
                      e.preventDefault()
                      if (isCurrent || !isInteractive) return
                      onSwitchSession?.(s.id)
                      setShowSessions(false)
                    }}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '5px 8px 5px 8px',
                      cursor: isCurrent || isEditing ? 'default' : (isInteractive ? 'pointer' : 'default'),
                      background: isHovered ? '#f0f0f0' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Current-session dot */}
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: isCurrent ? '#378ADD' : 'transparent', flexShrink: 0, marginRight: 6 }} />
                    {/* Name / rename input */}
                    {isEditing ? (
                      <input
                        autoFocus
                        value={sessionEditValue}
                        onChange={e => setSessionEditValue(e.target.value)}
                        onBlur={() => { const t = sessionEditValue.trim(); if (t) setSessionLocalNames(prev => ({ ...prev, [s.id]: t })); setSessionEditingId(null) }}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { e.preventDefault(); const t = sessionEditValue.trim(); if (t) setSessionLocalNames(prev => ({ ...prev, [s.id]: t })); setSessionEditingId(null) }
                          if (e.key === 'Escape') { e.preventDefault(); setSessionEditingId(null) }
                        }}
                        onMouseDown={e => e.stopPropagation()}
                        style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#111', border: '1px solid #c8c8c8', borderRadius: 4, padding: '1px 5px', outline: 'none', background: '#fff' }}
                      />
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: isCurrent ? 500 : 400, color: '#222', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {displayName}
                      </span>
                    )}
                    {/* Right slot: time fades out, pin + overflow fade in */}
                    <div style={{ position: 'relative', flexShrink: 0, marginLeft: 8, minWidth: 52, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 11, color: '#888', opacity: isHovered ? 0 : 1, transition: 'opacity 0.12s', pointerEvents: 'none', whiteSpace: 'nowrap' }}>
                        {s.ago}
                      </span>
                      {/* Pin */}
                      <button
                        onMouseDown={e => { e.preventDefault(); e.stopPropagation(); toggleSessionPin(s.id) }}
                        title={isPinned ? 'Unpin' : 'Pin session'}
                        style={{
                          position: 'absolute', right: 22, width: 20, height: 20,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3,
                          color: '#555',
                          opacity: isHovered || sessionMenuOpenId === s.id ? 1 : 0,
                          pointerEvents: isHovered || sessionMenuOpenId === s.id ? 'auto' : 'none',
                          transition: 'opacity 0.12s, background 0.1s, color 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e5e1da'; e.currentTarget.style.color = '#374151' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#555' }}
                      >
                        {isPinned
                          ? <svg width="11" height="11" viewBox="0 0 32 32" fill="currentColor"><path d="M28.5858,13.3137,30,11.9,20,2,18.6858,3.415l1.1858,1.1857L8.38,14.3225,6.6641,12.6067,5.25,14l5.6572,5.6773L2,28.5831,3.41,30l8.9111-8.9087L18,26.7482l1.3929-1.414L17.6765,23.618l9.724-11.4895Z"/></svg>
                          : <svg width="11" height="11" viewBox="0 0 32 32" fill="currentColor"><path d="M28.59,13.31,30,11.9,20,2,18.69,3.42,19.87,4.6,8.38,14.32,6.66,12.61,5.25,14l5.66,5.68L2,28.58,3.41,30l8.91-8.91L18,26.75l1.39-1.42-1.71-1.71L27.4,12.13ZM16.26,22.2,9.8,15.74,21.29,6,26,10.71Z"/></svg>
                        }
                      </button>
                      {/* Overflow (⋯) */}
                      <button
                        onMouseDown={openSessionOverflow}
                        title="More options"
                        style={{
                          position: 'absolute', right: -2, width: 20, height: 20,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: sessionMenuOpenId === s.id ? '#e0e0e0' : 'none',
                          border: 'none', cursor: 'pointer', borderRadius: 3, color: '#555',
                          opacity: isHovered || sessionMenuOpenId === s.id ? 1 : 0,
                          pointerEvents: isHovered || sessionMenuOpenId === s.id ? 'auto' : 'none',
                          transition: 'opacity 0.12s, background 0.1s, color 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e5e1da'; e.currentTarget.style.color = '#374151' }}
                        onMouseLeave={e => { e.currentTarget.style.background = sessionMenuOpenId === s.id ? '#e0e0e0' : 'none'; e.currentTarget.style.color = '#555' }}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                )
              }

              if (sessionItems.length === 0) {
                return <div style={{ padding: '10px 14px', fontSize: 12, color: '#999' }}>No sessions</div>
              }
              return (
                <div style={{ maxHeight: 10 * 32, overflowY: 'auto' }} className="scrollbar-thin">
                  {pinned.length > 0 && (
                    <>
                      <div style={{ padding: '6px 14px 2px', fontSize: 10.5, fontWeight: 500, color: '#aaa', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Pinned</div>
                      {pinned.map(renderSessionRow)}
                      {recent.length > 0 && <div style={{ height: 1, background: '#ebebeb', margin: '4px 8px' }} />}
                    </>
                  )}
                  {recent.map(renderSessionRow)}
                </div>
              )
            })()}
          </div>
        )}

        {/* Right: controls — stretch container so AI button can fill full height */}
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 2, flexShrink: 0, alignSelf: 'stretch' }}>
          {/* + New — only once a session exists */}
          {sessionActive && (
            <button
              onClick={onNew}
              title="New session"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                height: 26, padding: '0 9px', border: 'none', borderRadius: 5,
                background: 'transparent', color: '#444', alignSelf: 'center',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'background 0.1s, color 0.1s', flexShrink: 0, marginRight: 2,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#1a1a1a' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444' }}
            >
              <PlusIcon />&nbsp;New
            </button>
          )}

          {/* Share */}
          <button
            title="Share"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              height: 28, width: 28, padding: 0, border: 'none', borderRadius: 5,
              background: 'transparent', color: '#1a1a1a',
              cursor: 'pointer', transition: 'background 0.1s', alignSelf: 'center', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <svg width="15" height="17" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 18v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>
              <polyline points="16 9 12 4 8 9"/>
              <line x1="12" y1="4" x2="12" y2="17"/>
            </svg>
          </button>

          {/* AI toggle — 40×40 square flush to right edge, same as MapSessionWorkspace */}
          {isSplit && (
            <button
              onClick={() => setShowChat(v => !v)}
              title={showChat ? 'Hide AI pane' : 'Show AI pane'}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 0,
                alignSelf: 'stretch',
                height: 'auto',
                width: 40,
                border: 'none',
                borderLeft: showChat ? '1px solid #e0e0e0' : 'none',
                borderRadius: 0,
                background: showChat ? '#e8e8e8' : 'transparent',
                color: showChat ? '#111' : '#333',
                cursor: 'pointer',
                transition: 'background 0.1s, color 0.1s',
                marginRight: -8,
                flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = showChat ? '#dedede' : '#f0f0f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = showChat ? '#e8e8e8' : 'transparent' }}
            >
              <AIPaneIcon />
            </button>
          )}
        </div>
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
          transition: (isDraggingSash.current || suppressTransitionRef.current) ? 'none' : 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Loading overlay: shown while a new artifact tab is opening */}
          {pendingArtifactRef !== null && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 10,
              background: '#fff',
              display: 'flex', flexDirection: 'column',
            }}>
              {/* Indeterminate progress bar */}
              <div style={{ height: 2, overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ height: '100%', background: '#378ADD', animation: 'progress-indeterminate 1.4s ease-in-out infinite' }} />
              </div>
              {/* Centered spinner + label */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <svg width="32" height="32" viewBox="0 0 36 36" fill="none"
                  style={{ animation: 'spin 0.9s linear infinite' }}>
                  <circle cx="18" cy="18" r="15" stroke="#e8e8e8" strokeWidth="3"/>
                  <circle cx="18" cy="18" r="15" stroke="#378ADD" strokeWidth="3"
                    strokeLinecap="round" strokeDasharray="28 66"/>
                </svg>
                <span style={{ fontSize: 12, color: '#767676' }}>
                  Opening {pendingArtifactRef.label}…
                </span>
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
              headerRight={!sessionActive ? (
                /* Free-floating: Share + AI toggle in the artifact tab bar */
                <div style={{ display: 'flex', alignItems: 'stretch', alignSelf: 'stretch', gap: 2, marginLeft: 2 }}>
                  <button
                    title="Share"
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      height: 28, width: 28, padding: 0, border: 'none', borderRadius: 5,
                      background: 'transparent', color: '#444',
                      cursor: 'pointer', transition: 'background 0.1s', alignSelf: 'center', flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <svg width="15" height="17" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 18v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4"/>
                      <polyline points="16 9 12 4 8 9"/>
                      <line x1="12" y1="4" x2="12" y2="17"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => setShowChat(v => !v)}
                    title={showChat ? 'Hide AI pane' : 'Show AI pane'}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      padding: 0, alignSelf: 'stretch', height: 'auto', width: 40,
                      border: 'none', borderRadius: 0,
                      borderLeft: showChat ? '1px solid #e0e0e0' : 'none',
                      background: showChat ? '#e8e8e8' : 'transparent',
                      color: showChat ? '#111' : '#333',
                      cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
                      marginRight: -8, flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = showChat ? '#dedede' : '#f0f0f0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = showChat ? '#e8e8e8' : 'transparent' }}
                  >
                    <AIPaneIcon />
                  </button>
                </div>
              ) : null}
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

      {/* Session overflow menu — fixed so it escapes overflow:hidden */}
      {sessionMenuOpenId && sessionMenuPos && (
        <div
          ref={sessionMenuRef}
          style={{
            position: 'fixed', top: sessionMenuPos.top, right: sessionMenuPos.right,
            zIndex: 1000,
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden',
          }}
        >
          {sessionDelConfirmId === sessionMenuOpenId ? (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#222', fontWeight: 500, lineHeight: 1.4 }}>Delete this session?</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>This action cannot be undone.</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setSessionDelConfirmId(null) }}
                  style={{ padding: '5px 12px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', fontSize: 12, color: '#555', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                >Cancel</button>
                <button
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setSessionDeletedIds(prev => { const n = new Set(prev); n.add(sessionMenuOpenId); return n }); setSessionMenuOpenId(null); setSessionMenuPos(null); setSessionDelConfirmId(null) }}
                  style={{ padding: '5px 12px', border: 'none', borderRadius: 6, background: '#d32f2f', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#b71c1c' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#d32f2f' }}
                >Delete</button>
              </div>
            </div>
          ) : (
            <>
              <div
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setSessionEditingId(sessionMenuOpenId); setSessionEditValue(sessionLocalNames[sessionMenuOpenId] || sessions.find(s => s.id === sessionMenuOpenId)?.name || ''); setSessionMenuOpenId(null); setSessionMenuPos(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', fontSize: 12, color: '#222', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <RenameIcon /> Rename
              </div>
              <div
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setSessionDelConfirmId(sessionMenuOpenId) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', fontSize: 12, color: '#d32f2f', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <ArchiveIcon /> Delete
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
