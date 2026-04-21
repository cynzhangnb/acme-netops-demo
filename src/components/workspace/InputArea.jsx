import { useState, useRef, useEffect } from 'react'
import SlashCommandMenu, { CommandMenu, COMMAND_MENU_ITEMS, SLASH_COMMANDS, CHANGES_COMMANDS, CHANGE_ANALYSIS_COMMANDS, HOME_COMMANDS, NETWORK_COMMANDS, ReviewChangesSubmenu, REVIEW_CHANGES_ITEMS } from './SlashCommandMenu'

function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 10 4 15 9 20"/>
      <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
    </svg>
  )
}

function AddIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  )
}

function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div className="thinking-dot" />
      <div className="thinking-dot" />
      <div className="thinking-dot" />
      <span style={{ fontSize: 11, color: '#999', marginLeft: 4 }}>Thinking…</span>
    </div>
  )
}

export default function InputArea({
  onSend,
  isStreaming,
  placeholder = 'Ask about your network, / for shortcuts, @ to reference',
  initialValue = '',
  onValueChange,
  maxExpandHeight = 140,
  commandSet = 'default',
  disableAutoResize = false,
  onCommand,        /* called with command id when "/" item is selected */
  inputHint,        /* optional hint text rendered inside the box below textarea */
  externalPreview,  /* display-only override from parent (e.g. hover prompt); never alters internal value */
}) {
  const activeHashCommands =
    commandSet === 'home'           ? HOME_COMMANDS :
    commandSet === 'changes'        ? CHANGES_COMMANDS :
    commandSet === 'changeAnalysis' ? CHANGE_ANALYSIS_COMMANDS :
    commandSet === 'network'        ? NETWORK_COMMANDS :
    SLASH_COMMANDS

  const [value, setValue]         = useState(initialValue)

  /* "/" command menu state */
  const [cmdOpen, setCmdOpen]           = useState(false)
  const [cmdIndex, setCmdIndex]         = useState(-1) /* -1 = nothing highlighted until user navigates */
  /* Hover preview: temporarily overrides displayed textarea value.
     We keep "value" as the real "/" so parent state never diverges. */
  const [cmdHoverPreview, setCmdHoverPreview] = useState(null)
  /* Remembers which command was pre-filled so onCommand fires on send, not on click */
  const [pendingCommandId, setPendingCommandId] = useState(null)

  /* Review Changes sub-menu state */
  const [reviewChangeOpen, setReviewChangeOpen]   = useState(false)
  const [reviewChangeIndex, setReviewChangeIndex] = useState(0)

  /* "#" hash command menu state (was slash menu) */
  const [hashOpen, setHashOpen]   = useState(false)
  const [hashQuery, setHashQuery] = useState('')
  const [hashIndex, setHashIndex] = useState(0)

  const textareaRef = useRef(null)
  const wrapperRef  = useRef(null)

  /* Sync initialValue → internal state; focus textarea when pre-filled externally */
  useEffect(() => {
    if (initialValue !== undefined) {
      setValue(initialValue)
      if (initialValue) setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }, [initialValue])

  /* Close menus on outside click */
  useEffect(() => {
    if (!cmdOpen && !hashOpen && !reviewChangeOpen) return
    function handle(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setCmdOpen(false)
        setHashOpen(false)
        setReviewChangeOpen(false)
        setCmdHoverPreview(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [cmdOpen, hashOpen])

  /* Auto-resize – skip during any hover preview or when disabled */
  useEffect(() => {
    if (disableAutoResize || cmdHoverPreview !== null || externalPreview != null) return
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, maxExpandHeight) + 'px'
    }
  }, [value, disableAutoResize, cmdHoverPreview, externalPreview])

  /* ── The value actually rendered in the textarea ───────────────────────── */
  const displayValue = cmdHoverPreview !== null ? cmdHoverPreview
    : externalPreview != null ? externalPreview
    : value

  /* ── onChange ─────────────────────────────────────────────────────────── */
  function handleChange(e) {
    const raw = e.target.value

    /* If we were showing a hover preview, the user typed INTO it.
       Extract the extra character(s) they actually typed. */
    if (cmdHoverPreview !== null) {
      const extra = raw.length > cmdHoverPreview.length
        ? raw.slice(cmdHoverPreview.length)
        : ''
      setCmdOpen(false)
      setCmdHoverPreview(null)
      setValue(extra)
      onValueChange?.(extra)
      return
    }

    setValue(raw)
    onValueChange?.(raw)

    /* Trigger "/" command menu */
    if (raw === '/') {
      setCmdOpen(true)
      setCmdIndex(-1)   /* nothing highlighted until user navigates */
      setCmdHoverPreview(null)
      setHashOpen(false)
      return
    }

    /* Trigger "#" hash command menu */
    const hashMatch = raw.match(/^#(\w*)$/)
    if (hashMatch) {
      setHashOpen(true)
      setHashQuery(hashMatch[1])
      setHashIndex(0)
      setCmdOpen(false)
      return
    }

    /* Neither – close both menus */
    setCmdOpen(false)
    setHashOpen(false)
  }

  /* ── Command menu (/) selection ───────────────────────────────────────── */
  function handleCommandSelect(id) {
    if (id === 'review-change') {
      setReviewChangeOpen(true)
      setReviewChangeIndex(0)
      setCmdOpen(false)
      setCmdHoverPreview(null)
      return
    }
    /* new-map: auto-send immediately — no pre-fill, fires the command right away */
    if (id === 'new-map') {
      setCmdOpen(false)
      setCmdHoverPreview(null)
      setValue('')
      onValueChange?.('')
      onCommand?.('new-map', 'Create a blank map canvas')
      return
    }
    const item = COMMAND_MENU_ITEMS.find(i => i.id === id)
    const prefilledText = item?.hoverPrompt ?? ''
    setValue(prefilledText)
    onValueChange?.(prefilledText)
    setPendingCommandId(id)
    setCmdOpen(false)
    setCmdHoverPreview(null)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  /* ── Review Changes sub-menu selection ───────────────────────────────── */
  function handleReviewChangeSelect(prompt) {
    setValue(prompt)
    onValueChange?.(prompt)
    setReviewChangeOpen(false)
    setCmdHoverPreview(null)
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  /* ── Hash menu (#) selection ──────────────────────────────────────────── */
  function handleHashSelect(prompt) {
    setValue(prompt)
    setHashOpen(false)
    onValueChange?.(prompt)
    textareaRef.current?.focus()
  }

  /* ── Send ─────────────────────────────────────────────────────────────── */
  function handleSend() {
    const v = (cmdHoverPreview !== null ? cmdHoverPreview : value).trim()
    if (!v || isStreaming) return
    const cmdId = pendingCommandId
    setCmdOpen(false)
    setHashOpen(false)
    setReviewChangeOpen(false)
    setCmdHoverPreview(null)
    setPendingCommandId(null)
    setValue('')
    onValueChange?.('')
    if (cmdId) {
      onCommand?.(cmdId, v)
    } else {
      onSend(v)
    }
  }

  /* ── Keyboard navigation ──────────────────────────────────────────────── */
  function handleKeyDown(e) {
    if (reviewChangeOpen) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setReviewChangeIndex(i => Math.min(i + 1, REVIEW_CHANGES_ITEMS.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setReviewChangeIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && REVIEW_CHANGES_ITEMS[reviewChangeIndex]) { e.preventDefault(); handleReviewChangeSelect(REVIEW_CHANGES_ITEMS[reviewChangeIndex].prompt); return }
      if (e.key === 'Escape')    { setReviewChangeOpen(false); return }
    }
    if (cmdOpen) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = Math.min(cmdIndex + 1, COMMAND_MENU_ITEMS.length - 1)
        setCmdIndex(next)
        setCmdHoverPreview(COMMAND_MENU_ITEMS[next]?.hoverPrompt ?? null)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        const next = Math.max(cmdIndex - 1, -1)
        setCmdIndex(next)
        setCmdHoverPreview(next >= 0 ? (COMMAND_MENU_ITEMS[next]?.hoverPrompt ?? null) : null)
        return
      }
      if (e.key === 'Enter')  { e.preventDefault(); handleCommandSelect(COMMAND_MENU_ITEMS[cmdIndex]?.id); return }
      if (e.key === 'Escape') { setCmdOpen(false); setCmdHoverPreview(null); return }
    }
    if (hashOpen) {
      const filtered = activeHashCommands.filter(cmd =>
        !hashQuery || cmd.name.includes(hashQuery) || cmd.label.toLowerCase().includes(hashQuery)
      )
      if (e.key === 'ArrowDown') { e.preventDefault(); setHashIndex(i => Math.min(i + 1, filtered.length - 1)); return }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setHashIndex(i => Math.max(i - 1, 0)); return }
      if (e.key === 'Enter' && filtered[hashIndex]) { e.preventDefault(); handleHashSelect(filtered[hashIndex].prompt); return }
      if (e.key === 'Escape')    { setHashOpen(false); return }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = !!(displayValue.trim()) && !isStreaming

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>

      {/* Review Changes sub-menu */}
      {reviewChangeOpen && (
        <ReviewChangesSubmenu
          activeIndex={reviewChangeIndex}
          onSelect={handleReviewChangeSelect}
          onBack={() => {
            setReviewChangeOpen(false)
            setCmdOpen(true)
            setCmdIndex(COMMAND_MENU_ITEMS.findIndex(i => i.id === 'review-change'))
          }}
          onHoverChange={preview => setCmdHoverPreview(preview)}
        />
      )}

      {/* "/" command menu */}
      {cmdOpen && (
        <CommandMenu
          activeIndex={cmdIndex}
          onSelect={handleCommandSelect}
          onHoverChange={preview => {
            setCmdHoverPreview(preview)
            /* restore real height when preview clears */
          }}
        />
      )}

      {/* "#" hash command menu */}
      {hashOpen && (
        <SlashCommandMenu
          query={hashQuery}
          activeIndex={hashIndex}
          onSelect={handleHashSelect}
          commands={activeHashCommands}
        />
      )}

      <div className="ai-input-box">
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          rows={1}
          style={{ display: 'block' }}
        />

        {/* Optional contextual hint – shown when a hover preview has a hint */}
        {inputHint && (
          <div style={{
            padding: '0 16px 6px',
            fontSize: 11, color: '#aaa', lineHeight: 1.4,
          }}>
            {inputHint}
          </div>
        )}

        <div className="ai-input-footer">
          <button className="add-ctx-btn" title="Add context" disabled={isStreaming}>
            <AddIcon />
          </button>

          <div style={{ flex: 1 }} />

          {isStreaming && <ThinkingDots />}

          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!canSend}
            style={{
              opacity: canSend ? 1 : 0.4,
              ...(canSend ? { background: '#222', borderColor: '#222', color: '#fff' } : {}),
            }}
            onMouseEnter={e => { if (canSend) { e.currentTarget.style.background = '#111'; e.currentTarget.style.borderColor = '#111' } }}
            onMouseLeave={e => { if (canSend) { e.currentTarget.style.background = '#222'; e.currentTarget.style.borderColor = '#222' } }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
