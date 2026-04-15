import { useState, useRef, useEffect } from 'react'
import SlashCommandMenu, { SLASH_COMMANDS, CHANGES_COMMANDS, CHANGE_ANALYSIS_COMMANDS, HOME_COMMANDS, NETWORK_COMMANDS } from './SlashCommandMenu'

// Return / Enter key icon
function SendIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 10 4 15 9 20"/>
      <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
    </svg>
  )
}

// Plus — add data source / context
function AddIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function AttachIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M11 6.5L6 11.5C4.3 13.2 1.7 13.2 0 11.5s-1.7-4.4 0-6.1L5.5 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
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

export default function InputArea({ onSend, isStreaming, placeholder = 'Ask anything about your network, or type / for commands…', initialValue = '', onValueChange, maxExpandHeight = 140, commandSet = 'default', disableAutoResize = false }) {
  const activeCommands =
    commandSet === 'home'           ? HOME_COMMANDS :
    commandSet === 'changes'        ? CHANGES_COMMANDS :
    commandSet === 'changeAnalysis' ? CHANGE_ANALYSIS_COMMANDS :
    commandSet === 'network'        ? NETWORK_COMMANDS :
    SLASH_COMMANDS
  const [value, setValue] = useState(initialValue)
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashIndex, setSlashIndex] = useState(0)
  const textareaRef = useRef(null)
  const wrapperRef = useRef(null)

  useEffect(() => {
    function handleOutsideClick(e) {
      if (slashOpen && wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setSlashOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [slashOpen])

  useEffect(() => {
    if (initialValue !== undefined) setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (disableAutoResize) return
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, maxExpandHeight) + 'px'
    }
  }, [value, disableAutoResize])

  function handleChange(e) {
    const v = e.target.value
    setValue(v)
    onValueChange?.(v)
    // Check for slash command
    const slashMatch = v.match(/^\/(\w*)$/)
    if (slashMatch) {
      setSlashOpen(true)
      setSlashQuery(slashMatch[1])
      setSlashIndex(0)
    } else {
      setSlashOpen(false)
    }
  }

  function handleSelect(prompt) {
    setValue(prompt)
    setSlashOpen(false)
    onValueChange?.(prompt)
    textareaRef.current?.focus()
  }

  function handleSend() {
    if (!value.trim() || isStreaming) return
    setSlashOpen(false)
    onSend(value)
    setValue('')
    onValueChange?.('')
  }

  function handleKeyDown(e) {
    if (slashOpen) {
      const filtered = activeCommands.filter(cmd =>
        !slashQuery || cmd.name.includes(slashQuery) || cmd.label.toLowerCase().includes(slashQuery)
      )
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIndex(i => Math.min(i + 1, filtered.length - 1)); return; }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSlashIndex(i => Math.max(i - 1, 0)); return; }
      if (e.key === 'Enter' && filtered[slashIndex]) {
        e.preventDefault()
        handleSelect(filtered[slashIndex].prompt)
        return
      }
      if (e.key === 'Escape') { setSlashOpen(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {slashOpen && (
        <SlashCommandMenu
          query={slashQuery}
          activeIndex={slashIndex}
          onSelect={handleSelect}
          commands={activeCommands}
        />
      )}
      <div className="ai-input-box">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isStreaming}
          rows={1}
          style={{ display: 'block' }}
        />
        <div className="ai-input-footer">
          {/* Add context / data source — left */}
          <button
            className="add-ctx-btn"
            title="Add context or data source"
            disabled={isStreaming}
          >
            <AddIcon />
          </button>

          <div style={{ flex: 1 }} />

          {isStreaming && <ThinkingDots />}

          {/* Send — right */}
          <button
            className="send-btn"
            onClick={handleSend}
            disabled={!value.trim() || isStreaming}
            style={{ opacity: (!value.trim() || isStreaming) ? 0.4 : 1 }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
