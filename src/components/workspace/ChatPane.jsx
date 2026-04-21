import { useEffect, useRef, useState } from 'react'
import MessageBubble from './MessageBubble'
import SkeletonMessage from './SkeletonMessage'
import InputArea from './InputArea'

export const SESSION_NAME_RULES = [
  { keywords: ['boston'], name: 'Boston Network' },
  { keywords: ['nyc', 'new york'], name: 'NYC Network' },
  { keywords: ['traffic', 'trend'], preserveName: true },
  { keywords: ['routing'], name: 'Routing Design' },
  { keywords: ['vlan'], name: 'VLAN Segmentation' },
  { keywords: ['unused'], name: 'Unused Ports Audit' },
  { keywords: ['voice issue', 'voice'], name: 'Troubleshoot voice issues from 10.8.1.4 to 10.8.3.134' },
  { keywords: ['troubleshoot'], name: 'Troubleshooting' },
  { keywords: ['discover'], name: 'Device Discovery' },
  { keywords: ['intent'], name: 'Routing Intent' },
  { keywords: ['capacity', 'bandwidth'], name: 'Capacity Planning' },
]

export function deriveSessionName(messages, currentName = 'New Session') {
  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length === 0) return currentName || 'New Session'
  const allText = userMessages.map(m => m.content).join(' ').toLowerCase()
  for (const rule of SESSION_NAME_RULES) {
    if (rule.keywords.some(kw => allText.includes(kw))) {
      if (rule.preserveName) return currentName || 'New Session'
      return rule.name
    }
  }
  const first = userMessages[0].content.trim()
  return first.length > 72 ? first.slice(0, 70) + '…' : first
}

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

export default function ChatPane({ messages, isStreaming, onSend, onSaveArtifact, onOpenArtifact, onAddWidget, inputPrefill, onNew, onClose, currentSessionName, nameOverride, onRenameSession, onArchive, sessions, onSwitchSession, canAddToCanvas = false, commandSet = 'default', onMessageAction, onDeviceClick, hideHeader = false, isNarrowLayout = false }) {
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const headerRef = useRef(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [nameHovered, setNameHovered] = useState(false)
  const [showSessions, setShowSessions] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const sessionName = nameOverride ?? deriveSessionName(messages, currentSessionName)

  // Use new sessions-based header when sessions prop is provided
  const useSessioHeader = sessions !== undefined

  function startEdit() {
    setEditValue(sessionName)
    setIsEditingName(true)
    setShowMenu(false)
  }
  function confirmEdit() {
    const trimmed = editValue.trim()
    if (trimmed) onRenameSession?.(trimmed)
    setIsEditingName(false)
  }
  function cancelEdit() {
    setIsEditingName(false)
  }
  useEffect(() => {
    if (isEditingName) inputRef.current?.select()
  }, [isEditingName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  // Close dropdowns on outside click
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'inherit' }}>

      {/* Session header — hidden when parent renders its own full-width header */}
      {!hideHeader && <div ref={headerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 40, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>

        {/* Left: session name */}
        {isEditingName ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={confirmEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); confirmEdit() }
              if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
            }}
            style={{
              flex: 1, minWidth: 0, fontSize: 13, fontWeight: 500, color: '#111',
              letterSpacing: '-0.01em', border: 'none', outline: 'none',
              background: '#f5f5f5', borderRadius: 5, padding: '2px 6px',
              margin: '-2px -6px',
            }}
          />
        ) : useSessioHeader ? (
          /* Sessions-aware name area: click name = sessions list, click chevron = menu */
          <div
            style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 3, cursor: 'default' }}
            onMouseEnter={() => setNameHovered(true)}
            onMouseLeave={() => setNameHovered(false)}
          >
            <span
              onClick={() => { setShowSessions(s => !s); setShowMenu(false) }}
              style={{ fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, cursor: 'pointer', userSelect: 'none' }}
            >{sessionName}</span>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button
                onClick={e => { e.stopPropagation(); setShowMenu(m => !m); setShowSessions(false) }}
                style={{
                  display: 'inline-flex', alignItems: 'center', padding: '2px 3px',
                  border: 'none', borderRadius: 4, background: 'transparent',
                  color: nameHovered ? '#666' : 'transparent',
                  cursor: 'pointer', transition: 'color 0.1s, background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <ChevronIcon />
              </button>
              {/* Rename / Delete context menu — aligned to chevron */}
              {showMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 200,
                  background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden', minWidth: 140,
                }}>
                  <div
                    onMouseDown={e => { e.preventDefault(); startEdit(); setShowMenu(false) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 14px', fontSize: 13, color: '#222', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <RenameIcon /> Rename
                  </div>
                  <div
                    onMouseDown={e => { e.preventDefault(); onArchive?.(); setShowMenu(false) }}
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
        ) : (
          /* Default: click name to rename inline */
          <span
            onClick={startEdit}
            title="Click to rename"
            style={{ fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1, cursor: 'text' }}
          >{sessionName}</span>
        )}

        {/* Right: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {onNew && (
            <button
              onClick={() => onNew()}
              title="New session"
              style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 7px', border: 'none', borderRadius: 6, background: 'transparent', color: '#666', cursor: 'pointer', transition: 'background 0.1s, color 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' }}
            >
              <PlusIcon />
            </button>
          )}
          {onClose ? (
            <button
              onClick={onClose}
              style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 4px', marginRight: -12, border: 'none', borderRadius: 6, background: 'transparent', color: '#555', cursor: 'pointer', transition: 'background 0.1s, color 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#222' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
                <polygon points="4 18 4 20 10.586 20 2 28.582 3.414 30 12 21.414 12 28 14 28 14 18 4 18"/>
                <polygon points="30 3.416 28.592 2 20 10.586 20 4 18 4 18 14 28 14 28 12 21.414 12 30 3.416"/>
              </svg>
            </button>
          ) : (
            !onNew && (
              <button
                onClick={() => onNew?.()}
                style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 7px', border: 'none', borderRadius: 6, background: 'transparent', color: '#666', cursor: 'pointer', transition: 'background 0.1s, color 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' }}
              >
                <PlusIcon />
              </button>
            )
          )}
        </div>

        {/* Sessions dropdown */}
        {showSessions && (
          <div style={{
            position: 'absolute', top: 40, left: 0, right: 0, zIndex: 200,
            background: '#fff', border: '1px solid #e8e8e8', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
          }}>
            {sessions && sessions.length > 0 ? sessions.map(s => (
              <div
                key={s.id}
                onMouseDown={e => { e.preventDefault(); onSwitchSession?.(s.id); setShowSessions(false) }}
                style={{ padding: '9px 14px', fontSize: 12.5, color: '#222', cursor: 'pointer', borderBottom: '1px solid #f5f5f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {s.name}
              </div>
            )) : (
              <div style={{ padding: '10px 14px', fontSize: 12, color: '#999' }}>No previous sessions</div>
            )}
          </div>
        )}

      </div>}

      {messages.length === 0 && !isStreaming ? (
        /* ── Empty state ── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 16px 28px' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
            {/* NB Workspace hub-and-spoke icon */}
            <svg width="64" height="64" viewBox="0 0 44 44" fill="none" style={{ marginBottom: 14, display: 'block' }}>
              <circle cx="22" cy="22" r="15" stroke="#ccc" strokeWidth="1" strokeDasharray="2.5 3"/>
              <line x1="22" y1="22" x2="22" y2="7" stroke="#ccc" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="22" y1="22" x2="34.990" y2="14.5" stroke="#ccc" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="22" y1="22" x2="34.990" y2="29.5" stroke="#ccc" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="22" y1="22" x2="22" y2="37" stroke="#ccc" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="22" y1="22" x2="9.010" y2="29.5" stroke="#ccc" strokeWidth="1.1" strokeLinecap="round"/>
              <line x1="22" y1="22" x2="9.010" y2="14.5" stroke="#ccc" strokeWidth="1.1" strokeLinecap="round"/>
              <circle cx="22" cy="7" r="2.6" fill="#fff" stroke="#bbb" strokeWidth="1.3"/>
              <circle cx="34.990" cy="14.5" r="2.6" fill="#fff" stroke="#bbb" strokeWidth="1.3"/>
              <circle cx="34.990" cy="29.5" r="2.6" fill="#fff" stroke="#bbb" strokeWidth="1.3"/>
              <circle cx="22" cy="37" r="2.6" fill="#fff" stroke="#bbb" strokeWidth="1.3"/>
              <circle cx="9.010" cy="29.5" r="2.6" fill="#fff" stroke="#bbb" strokeWidth="1.3"/>
              <circle cx="9.010" cy="14.5" r="2.6" fill="#fff" stroke="#bbb" strokeWidth="1.3"/>
              <circle cx="22" cy="22" r="5" fill="#fff" stroke="#aaa" strokeWidth="1.6"/>
              <circle cx="22" cy="22" r="2" fill="#bbb"/>
            </svg>
            <div style={{ fontSize: 12.5, color: '#888', lineHeight: 1.5, textAlign: 'center', maxWidth: 200 }}>
              Ask questions about your network or open a map to get started.
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#555', letterSpacing: '0.01em', marginBottom: 6, paddingLeft: 10 }}>
            Try asking
          </div>
          {[
            { label: 'Show network topology', prompt: 'Show network topology of [location]' },
            { label: 'Expand neighbours of this device', prompt: 'Expand neighbours of @device' },
            { label: 'Trace path between A and B', prompt: 'Trace path between @deviceA and @deviceB' },
          ].map(({ label, prompt }) => (
            <div
              key={label}
              onClick={() => onSend?.(prompt)}
              onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              style={{ padding: '9px 10px', borderRadius: 7, cursor: 'pointer', fontSize: 13, color: '#222', background: 'transparent', transition: 'background 0.12s', marginBottom: 2 }}
            >
              {label}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}
             className="scrollbar-thin">
          {messages.map(msg => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onSaveArtifact={onSaveArtifact}
              onOpenArtifact={onOpenArtifact}
              onAddWidget={onAddWidget}
              canAddToCanvas={canAddToCanvas}
              onAction={onMessageAction}
              onDeviceClick={onDeviceClick}
              isNarrowLayout={isNarrowLayout}
            />
          ))}
          {isStreaming && <SkeletonMessage />}
          <div ref={bottomRef} />
        </div>
      )}

      <div style={{ padding: '16px 24px', borderTop: '1px solid #f0f0f0', flexShrink: 0, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 680 }}>
          <InputArea
            onSend={onSend}
            isStreaming={isStreaming}
            initialValue={inputPrefill || ''}
            commandSet={commandSet}
          />
        </div>
      </div>
    </div>
  )
}
