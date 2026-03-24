import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'
import SkeletonMessage from './SkeletonMessage'
import InputArea from './InputArea'

export const SESSION_NAME_RULES = [
  { keywords: ['boston'], name: 'Boston Network' },
  { keywords: ['nyc', 'new york'], name: 'NYC Network' },
  { keywords: ['traffic', 'trend'], name: 'Traffic Analysis' },
  { keywords: ['routing'], name: 'Routing Design' },
  { keywords: ['vlan'], name: 'VLAN Segmentation' },
  { keywords: ['unused'], name: 'Unused Ports Audit' },
  { keywords: ['troubleshoot'], name: 'Troubleshooting' },
  { keywords: ['discover'], name: 'Device Discovery' },
  { keywords: ['intent'], name: 'Routing Intent' },
  { keywords: ['capacity', 'bandwidth'], name: 'Capacity Planning' },
]

export function deriveSessionName(messages) {
  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length === 0) return 'New Session'
  const allText = userMessages.map(m => m.content).join(' ').toLowerCase()
  for (const rule of SESSION_NAME_RULES) {
    if (rule.keywords.some(kw => allText.includes(kw))) return rule.name
  }
  const first = userMessages[0].content.trim()
  return first.length > 32 ? first.slice(0, 30) + '…' : first
}

function PlusIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <line x1="5.5" y1="1" x2="5.5" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      <line x1="1" y1="5.5" x2="10" y2="5.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export default function ChatPane({ messages, isStreaming, onSend, onSaveArtifact, onOpenArtifact, inputPrefill }) {
  const bottomRef = useRef(null)
  const sessionName = deriveSessionName(messages)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isStreaming])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* Session header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 44, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: '#111', letterSpacing: '-0.01em' }}>{sessionName}</span>
        <button
          onClick={() => {}}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: 'none', borderRadius: 6, background: 'transparent', fontSize: 11, fontWeight: 500, color: '#666', cursor: 'pointer', transition: 'background 0.1s, color 0.1s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666' }}
        >
          <PlusIcon /> New
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}
           className="scrollbar-thin">
        {messages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onSaveArtifact={onSaveArtifact}
            onOpenArtifact={onOpenArtifact}
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
          />
        </div>
      </div>
    </div>
  )
}
