import { useState, useRef } from 'react'
import InputArea from './InputArea'

// Displayed in the textarea when user clicks "Explore Network"
const NETWORK_TEMPLATE = `Help me explore my network.
Scope: [e.g. a site, a specific device]
Focus on:
- routing design and path selection
- network segmentation
- policies and access control
- logical connectivity between devices`

// What actually gets submitted as the user message
const EXPLORE_SEND_TEXT = `Help me explore my network.
Scope: Boston Data Center`

const SHORTCUTS = [
  { label: 'Explore Network',   active: true  },
  { label: 'Create Map',         active: false },
  { label: 'Troubleshoot',       active: false },
  { label: 'Change Analysis',    active: false },
  { label: 'Network Inventory',  active: false },
  { label: 'Find Devices',       active: false },
  { label: 'Trace Route',        active: false },
  { label: '…',                  active: false },
]

/* ── Elegant network topology icon — monochromatic, hexagonal spoke design */
function NetworkIcon() {
  // 6 outer nodes at r=15 from center (22,22) in 44×44 viewbox
  // angles: 270°(top), 330°, 30°, 90°(bottom), 150°, 210°
  const cx = 22, cy = 22, r = 15
  const nodes = [270, 330, 30, 90, 150, 210].map(deg => {
    const rad = (deg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  })
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      {/* Outer dashed ring */}
      <circle cx={cx} cy={cy} r={r} stroke="#d4d4d4" strokeWidth="1" strokeDasharray="2.5 3"/>
      {/* Spoke lines center → outer */}
      {nodes.map((n, i) => (
        <line key={`s${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y}
          stroke="#d8d8d8" strokeWidth="1.1" strokeLinecap="round"/>
      ))}
      {/* Outer nodes */}
      {nodes.map((n, i) => (
        <circle key={`n${i}`} cx={n.x} cy={n.y} r="2.6"
          fill="#fff" stroke="#b8b8b8" strokeWidth="1.2"/>
      ))}
      {/* Center hub */}
      <circle cx={cx} cy={cy} r="5" fill="#fff" stroke="#888" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r="2"  fill="#999"/>
    </svg>
  )
}

export default function AIEntryView({ onSend, isStreaming }) {
  const [prefill, setPrefill] = useState('')
  // Holds the actual text to submit when the Explore shortcut was used.
  // Cleared as soon as the user edits the textarea manually.
  const sendOverrideRef = useRef(null)

  function handleSend(text) {
    const actual = sendOverrideRef.current ?? text
    sendOverrideRef.current = null
    onSend(actual)
  }

  function handleShortcut() {
    sendOverrideRef.current = EXPLORE_SEND_TEXT
    setPrefill(NETWORK_TEMPLATE)
  }

  function handleValueChange(v) {
    sendOverrideRef.current = null   // user edited — discard the override
    setPrefill(v)
  }

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      padding: '10% 40px 40px',
      background: '#f5f5f5',
    }}>
      {/* ── Icon ── */}
      <div style={{
        width: 72, height: 72, borderRadius: 16,
        background: '#fff', border: '1px solid #e4e4e4',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 20, flexShrink: 0,
      }}>
        <NetworkIcon />
      </div>

      <div style={{ fontSize: 20, fontWeight: 600, color: '#111', marginBottom: 6, letterSpacing: '-0.02em' }}>
        AI Workspace
      </div>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 28, textAlign: 'center' }}>
        Ask, explore, and troubleshoot your network.
      </div>

      {/* ── Input ── */}
      <div style={{ width: '100%', maxWidth: 560 }}>
        <InputArea
          onSend={handleSend}
          isStreaming={isStreaming}
          placeholder="Do anything with AI… (type / for commands)"
          initialValue={prefill}
          onValueChange={handleValueChange}
        />
      </div>

      <div style={{ height: 18 }} />

      {/* ── Shortcut grid — 4 per row, rectangular, Claude-style ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 7, width: '100%', maxWidth: 560,
      }}>
        {SHORTCUTS.map(({ label, active }) => (
          <button
            key={label}
            onClick={active ? handleShortcut : undefined}
            style={{
              padding: '7px 10px',
              border: '1px solid #ddd',
              borderRadius: 7,
              fontSize: 11, fontWeight: 400,
              color: '#444',
              cursor: active ? 'pointer' : 'default',
              background: '#fff',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
              transition: 'border-color 0.1s, background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#f5f5f5'
              e.currentTarget.style.borderColor = '#c8c8c8'
              e.currentTarget.style.color = '#111'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#fff'
              e.currentTarget.style.borderColor = '#ddd'
              e.currentTarget.style.color = '#444'
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
