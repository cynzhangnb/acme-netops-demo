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
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <line x1="5.5" y1="1" x2="5.5" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export default function ChatPane({ messages, isStreaming, onSend, onSaveArtifact, onOpenArtifact, onAddWidget, inputPrefill, onNew, onClose, currentSessionName, nameOverride, onRenameSession, canAddToCanvas = false, commandSet = 'default', onMessageAction, onDeviceClick }) {
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const [isEditingName, setIsEditingName] = useState(false)
  const [editValue, setEditValue] = useState('')
  const sessionName = nameOverride ?? deriveSessionName(messages, currentSessionName)

  function startEdit() {
    setEditValue(sessionName)
    setIsEditingName(true)
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* Session header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 44, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
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
        ) : (
          <span
            onClick={startEdit}
            title="Click to rename"
            style={{ fontSize: 13, fontWeight: 500, color: '#111', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1, cursor: 'text' }}
          >{sessionName}</span>
        )}
        {onClose ? (
          <button
            onClick={onClose}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 4px', marginRight: -4, border: 'none', borderRadius: 6, background: 'transparent', color: '#555', cursor: 'pointer', transition: 'background 0.1s, color 0.1s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#222' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#555' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 32 32" fill="currentColor">
              <polygon points="4 18 4 20 10.586 20 2 28.582 3.414 30 12 21.414 12 28 14 28 14 18 4 18"/>
              <polygon points="30 3.416 28.592 2 20 10.586 20 4 18 4 18 14 28 14 28 12 21.414 12 30 3.416"/>
            </svg>
          </button>
        ) : (
          <button
            onClick={() => onNew?.()}
            style={{ display: 'inline-flex', alignItems: 'center', padding: '5px 7px', border: 'none', borderRadius: 6, background: 'transparent', color: '#666', cursor: 'pointer', transition: 'background 0.1s, color 0.1s', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' }}
          >
            <PlusIcon />
          </button>
        )}
      </div>

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
          />
        ))}
        {isStreaming && <SkeletonMessage />}
        <div ref={bottomRef} />
      </div>

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
