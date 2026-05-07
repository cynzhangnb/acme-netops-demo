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
function AIPaneIcon({ open = false }) {
  return open ? (
    /* Filled — pane is open */
    <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M28,4H4A2,2,0,0,0,2,6V26a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V6A2,2,0,0,0,28,4ZM4,6H20V26H4Z"/>
    </svg>
  ) : (
    /* Outline — pane is closed */
    <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M28,4H4A2,2,0,0,0,2,6V26a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V6A2,2,0,0,0,28,4ZM4,6H20V26H4ZM28,26H22V6h6Z"/>
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

function ArtifactTabIconInline({ type }) {
  const s = { width: 12, height: 12, style: { flexShrink: 0, display: 'block' } }
  if (type === 'topology' || type === 'changesMap' || type === 'networkMap') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="5" rx="1"/><line x1="12" y1="7" x2="12" y2="11"/>
      <line x1="4" y1="11" x2="20" y2="11"/><line x1="4" y1="11" x2="4" y2="16"/>
      <line x1="12" y1="11" x2="12" y2="16"/><line x1="20" y1="11" x2="20" y2="16"/>
      <circle cx="4" cy="19" r="2.5"/><circle cx="12" cy="19" r="2.5"/><circle cx="20" cy="19" r="2.5"/>
    </svg>
  )
  if (type === 'chart' || type === 'trafficChart') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  )
  if (type === 'table' || type === 'qosTable' || type === 'crcTable' || type === 'iosTable') return (
    <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="9" x2="9" y2="21"/>
    </svg>
  )
  if (type === 'changeAnalysis' || type === 'compare') return (
    <svg {...s} viewBox="0 0 32 32" fill="currentColor">
      <path d="m24,21v2h1.7483c-2.2363,3.1196-5.8357,5-9.7483,5-6.6169,0-12-5.3833-12-12h-2c0,7.7197,6.2803,14,14,14,4.355,0,8.3743-2.001,11-5.3452v1.3452h2v-5h-5Z"/>
      <path d="m16,2c-4.355,0-8.3743,2.001-11,5.3452v-1.3452h-2v5h5v-2h-1.7483c2.2363-3.1196,5.8357-5,9.7483-5,6.6169,0,12,5.3833,12,12h2c0-7.7197-6.2803-14-14-14Z"/>
      <line x1="13" y1="11.5" x2="19" y2="11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="16" x2="19" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="20.5" x2="19" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'report') return (
    <svg {...s} viewBox="0 0 32 32" fill="currentColor">
      <path d="M25.7,9.3l-7-7C18.5,2.1,18.3,2,18,2H8C6.9,2,6,2.9,6,4v24c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V10C26,9.7,25.9,9.5,25.7,9.3z M18,4.4l5.6,5.6H18V4.4z M24,28H8V4h8v6c0,1.1,0.9,2,2,2h6V28z"/>
      <rect x="10" y="22" width="12" height="2"/><rect x="10" y="16" width="12" height="2"/>
    </svg>
  )
  return null
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
  const [hoveredTabId,        setHoveredTabId]        = useState(null)
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', position: 'relative' }}>

      {/* ── Session header — scoped to left column width when chat is open ── */}
      <div ref={headerRef} style={{
        height: sessionActive ? 40 : 0,
        overflow: sessionActive ? 'visible' : 'hidden',
        flexShrink: 0, position: 'relative',
        width: (isSplit && showChat) ? `calc(100% - ${chatPaneWidth + 5}px)` : '100%',
        transition: (isDraggingSash.current || suppressTransitionRef.current)
          ? 'height 380ms cubic-bezier(0.4, 0, 0.2, 1)'
          : 'height 380ms cubic-bezier(0.4, 0, 0.2, 1), width 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
      <div style={{
        height: 40,
        display: 'flex', alignItems: 'center',
        padding: '0 8px',
        background: 'var(--t-bg)',
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

        {/* Right: controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {/* + New — only once a session exists */}
          {sessionActive && (
            <button
              onClick={onNew}
              title="New session"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                height: 28, padding: '0 10px', border: 'none', borderRadius: 5,
                background: 'transparent', color: '#555',
                fontSize: 12, fontWeight: 500, cursor: 'pointer',
                transition: 'background 0.1s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <PlusIcon />New
            </button>
          )}

          {/* Share — text button */}
          <button
            title="Share"
            style={{
              display: 'inline-flex', alignItems: 'center',
              height: 28, padding: '0 10px', border: 'none', borderRadius: 5,
              background: 'transparent', color: '#555',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              transition: 'background 0.1s', flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Share
          </button>

          {/* AI toggle */}
          {isSplit && (
            <button
              onClick={() => setShowChat(v => !v)}
              title={showChat ? 'Hide AI pane' : 'Show AI pane'}
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                padding: 0, height: 28, width: 28,
                border: 'none', borderRadius: 5,
                background: 'transparent', color: '#555',
                cursor: 'pointer', transition: 'background 0.1s', flexShrink: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <AIPaneIcon open={showChat} />
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
          display: 'flex', flexDirection: 'column',
          transition: (isDraggingSash.current || suppressTransitionRef.current) ? 'none' : 'width 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>

          {/* ── Folder tab bar — scoped to artifact column ── */}
          {artifacts.length > 0 && (
            <div style={{
              height: 36,
              display: 'flex', alignItems: 'flex-end',
              padding: '0 8px 0',
              background: 'var(--t-bg)',
              borderBottom: '1px solid var(--t-border)',
              flexShrink: 0,
              gap: 2,
            }}>
              {artifacts.map(artifact => {
                const isActive = artifact.id === activeArtifactId
                return (
                  <div
                    key={artifact.id}
                    onClick={() => setActiveArtifactId(artifact.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '0 24px 0 10px', height: 28,
                      borderRadius: '7px 7px 0 0',
                      background: isActive ? 'var(--t-bg)' : 'transparent',
                      border: isActive ? '1px solid var(--t-border)' : '1px solid transparent',
                      borderBottom: isActive ? '1px solid var(--t-bg)' : '1px solid transparent',
                      marginBottom: -1, position: 'relative', zIndex: isActive ? 1 : 0,
                      cursor: 'pointer', userSelect: 'none', flexShrink: 0, overflow: 'hidden',
                      fontSize: 12, fontWeight: isActive ? 500 : 400,
                      color: isActive ? 'var(--t-tx-2)' : 'var(--t-tx-5)',
                      transition: 'background 0.1s, color 0.1s',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'var(--t-bg-hover)'; setHoveredTabId(artifact.id) }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; setHoveredTabId(null) }}
                  >
                    <ArtifactTabIconInline type={artifact.type} />
                    {artifact.label}
                    {(isActive || hoveredTabId === artifact.id) && (
                      <button
                        onClick={e => { e.stopPropagation(); handleRemoveArtifact(artifact.id) }}
                        style={{
                          position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                          background: isActive ? 'var(--t-bg)' : 'var(--t-bg-hover)',
                          border: 'none', cursor: 'pointer',
                          padding: '1px 2px', borderRadius: 3,
                          color: 'var(--t-tx-5)',
                          display: 'flex', alignItems: 'center',
                          transition: 'color 0.1s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.color = 'var(--t-tx-2)' }}
                        onMouseLeave={e => { e.currentTarget.style.color = 'var(--t-tx-5)' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
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
              hideTabBar={true}
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
                      background: 'transparent',
                      color: showChat ? '#111' : '#666',
                      cursor: 'pointer', transition: 'background 0.1s, color 0.1s',
                      marginRight: -4, flexShrink: 0,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <AIPaneIcon open={showChat} />
                  </button>
                </div>
              ) : null}
            />
          )}
        </div>

        {/* RIGHT: Chat — only in normal flex flow when no artifacts (free-floating chat) */}
        {!isSplit && (
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', background: '#fff' }}>
            <ChatPane
              hideHeader
              messages={messages}
              isStreaming={isStreaming}
              onSend={handleSend}
              onSaveArtifact={handleSaveArtifact}
              onOpenArtifact={handleOpenArtifact}
              onAddWidget={handleAddWidget}
              inputPrefill={inputPrefill}
              canAddToCanvas={false}
              commandSet={commandSet}
              isNarrowLayout={false}
            />
          </div>
        )}
      </div>

      {/* ── Sash — absolutely positioned so it spans full height incl. above session header ── */}
      {isSplit && showChat && (
        <div
          onMouseDown={artifacts.length > 0 ? handleSashMouseDown : undefined}
          style={{
            position: 'absolute',
            top: 0, right: chatPaneWidth, bottom: 0,
            width: 5,
            cursor: artifacts.length > 0 ? 'col-resize' : 'default',
            zIndex: 10,
            display: 'flex', alignItems: 'stretch', justifyContent: 'flex-start',
          }}
          onMouseEnter={e => {
            if (!artifacts.length) return
            e.currentTarget.querySelector('span').style.background = '#c8c8c8'
          }}
          onMouseLeave={e => {
            e.currentTarget.querySelector('span').style.background = '#e8e8e8'
          }}
        >
          <span style={{ display: 'block', width: 1, background: '#e8e8e8', transition: 'background 0.15s' }} />
        </div>
      )}

      {/* ── Chat pane — always in DOM when split; slides in/out from the right edge ── */}
      {isSplit && (
        <div style={{
          position: 'absolute',
          top: 0, right: 0, bottom: 0,
          width: chatPaneWidth,
          overflow: 'hidden',
          background: '#fff',
          zIndex: 1,
          transform: showChat ? 'translateX(0)' : 'translateX(100%)',
          transition: (isDraggingSash.current || suppressTransitionRef.current)
            ? 'none'
            : 'transform 0.32s cubic-bezier(0.4, 0, 0.2, 1), width 0.38s cubic-bezier(0.4, 0, 0.2, 1)',
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
      )}

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
