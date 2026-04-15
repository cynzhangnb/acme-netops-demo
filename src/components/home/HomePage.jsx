import { useState, useRef, useCallback } from 'react'
import InputArea from '../workspace/InputArea'
import { NETWORK_TEMPLATE } from '../workspace/SlashCommandMenu'
import AIWorkspace from '../workspace/AIWorkspace'

/* ── Chevron ──────────────────────────────────────────────────────────────── */
function Chevron({ open }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="#b0b0b0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

/* ── Skeleton primitives ──────────────────────────────────────────────────── */
function SkBar({ w = '100%', h = 8, radius = 4, style }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: '#e8e8e8', flexShrink: 0, ...style,
    }} />
  )
}

function SkDot({ color = '#d4d4d4', size = 8 }) {
  return <div style={{ width: size, height: size, borderRadius: '50%', background: color, flexShrink: 0 }} />
}

function SkTag() {
  return <div style={{ width: 34, height: 14, borderRadius: 4, background: '#ececec', flexShrink: 0 }} />
}

/* ── Skeleton row layouts ─────────────────────────────────────────────────── */
function WhatsNewRows() {
  const rows = [
    { dot: '#c8c8c8', w1: '55%', w2: '30%' },
    { dot: '#c8c8c8', w1: '65%', w2: '25%' },
    { dot: '#c8c8c8', w1: '50%', w2: '32%' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '9px 14px',
          borderBottom: i < rows.length - 1 ? '1px solid #f5f5f5' : 'none',
        }}>
          <SkDot color={r.dot} size={7} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
            <SkBar w={r.w1} h={8} />
            <SkBar w={r.w2} h={6} />
          </div>
          <SkTag />
        </div>
      ))}
    </div>
  )
}

function DeviceSummaryRows() {
  return (
    <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Two stat badges */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
        <div style={{ width: 72, height: 32, borderRadius: 7, background: '#efefef' }} />
        <div style={{ width: 72, height: 32, borderRadius: 7, background: '#efefef' }} />
      </div>
      {/* List rows */}
      {[['60%','28%'],['70%','20%'],['55%','28%'],['65%','22%']].map(([w1, w2], i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <SkDot color="#d0d0d0" size={8} />
          <SkBar w={w1} h={7} />
          <div style={{ flex: 1 }} />
          <SkBar w={w2} h={7} />
        </div>
      ))}
    </div>
  )
}

function RecentChangesRows() {
  const rows = [
    { dot: '#c8c8c8' },
    { dot: '#c8c8c8' },
    { dot: '#c8c8c8' },
    { dot: '#c8c8c8' },
    { dot: '#c8c8c8' },
  ]
  const widths = [['52%','40%'],['60%','35%'],['45%','50%'],['58%','38%'],['50%','42%']]
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {rows.map((r, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 14px',
          borderBottom: i < rows.length - 1 ? '1px solid #f5f5f5' : 'none',
        }}>
          <SkDot color={r.dot} size={8} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <SkBar w={widths[i][0]} h={7} />
            <SkBar w={widths[i][1]} h={6} />
          </div>
          <SkTag />
        </div>
      ))}
    </div>
  )
}

function NetworkDiscoveryRows() {
  const widths = [['55%','22%'],['62%','18%'],['48%','24%'],['58%','20%'],['52%','22%']]
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {widths.map(([w1, w2], i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 9,
          padding: '8px 14px',
          borderBottom: i < widths.length - 1 ? '1px solid #f5f5f5' : 'none',
        }}>
          <SkDot color="#d0d0d0" size={8} />
          <SkBar w={w1} h={7} />
          <div style={{ flex: 1 }} />
          <SkBar w={w2} h={7} />
        </div>
      ))}
    </div>
  )
}

/* ── Collapsible section ──────────────────────────────────────────────────── */
function Section({ title, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e6e6e6',
      borderRadius: 10,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'none', border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid #f0f0f0' : 'none',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 600, color: '#222', letterSpacing: '-0.01em' }}>{title}</span>
        <Chevron open={open} />
      </button>
      {open && children}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════ */
/*  MAIN — HomePage                                                           */
/* ══════════════════════════════════════════════════════════════════════════ */
const SHORTCUTS = [
  { label: 'Explore Network' },
  { label: 'Diagnose Issues' },
  { label: 'Review Changes' },
  // { label: 'Get Device Info' },   // reserved for future use
  // { label: 'Discover Network' },  // removed
]

const SECOND_LAYER = {
  'Explore Network': [
    { label: 'Show me the network topology',  prompt: NETWORK_TEMPLATE },
    { label: 'Give me an overview of a site', prompt: 'Give me an overview of the Boston site, including its devices, layout, and key connections.' },
    { label: 'Get device info',               prompt: 'Show me device details for US-BOS-R1' },
    { label: 'Show recent device health',     prompt: 'Show me the recent health status of devices in my network' },
  ],
}

export default function HomePage({ onStartAI, initialPrompt = '', sessionKey = 0, onSessionNameChange, restoredSession, currentSessionName }) {
  const [homeInput, setHomeInput] = useState('')
  const [activeShortcut, setActiveShortcut] = useState(null)
  const [hoverPrompt, setHoverPrompt] = useState(null)
  const [insightWidth, setInsightWidth] = useState(380)
  const isDragging = useRef(false)

  const handleResizeStart = useCallback((e) => {
    e.preventDefault()
    isDragging.current = true
    const startX = e.clientX
    const startWidth = insightWidth

    const onMove = (ev) => {
      if (!isDragging.current) return
      // dragging the handle left → pane gets wider; right → narrower
      const delta = startX - ev.clientX
      setInsightWidth(Math.max(260, Math.min(600, startWidth + delta)))
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
  }, [insightWidth])

  // ── Active session: render AIWorkspace inline, full-height ──────────────
  if (sessionKey > 0) {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f5f5' }}>
        <AIWorkspace
          key={sessionKey}
          initialPrompt={initialPrompt}
          onSessionNameChange={onSessionNameChange}
          onNew={() => onStartAI('')}
          restoredSession={restoredSession}
          currentSessionName={currentSessionName}
        />
      </div>
    )
  }

  const handleShortcut = (label) => {
    if (SECOND_LAYER[label]) {
      // has a second layer — drill in
      setActiveShortcut(label)
    } else {
      // no second layer — pre-fill directly
      if (label === 'Diagnose Issues') setHomeInput('I have a voice issue from 10.8.1.4 to 10.8.3.134. Can you help?')
      if (label === 'Review Changes')  setHomeInput('Show recent configuration changes in my network')
      // preserved for future use:
      if (label === 'Get Device Info') setHomeInput('Show me device details for US-BOS-R1')
    }
  }

  const handleSecondLayer = (prompt) => {
    setHoverPrompt(null)
    setHomeInput(prompt)
    setActiveShortcut(null)
  }

  return (
    <div style={{
      flex: 1,
      overflow: 'hidden',
      background: '#f6f6f7',
      display: 'flex',
      flexDirection: 'row',
    }}>

      {/* ── LEFT: AI Entry ──────────────────────────────────────────────── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '7% 48px 40px',
        minWidth: 0,
      }}>
        <div style={{ width: '100%', maxWidth: 660, display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Icon + Title */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: '#fff', border: '1px solid #e4e4e4',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Network topology icon — same as AI Workspace, stronger contrast */}
              {(() => {
                const cx = 22, cy = 22, r = 15
                const nodes = [270, 330, 30, 90, 150, 210].map(deg => {
                  const rad = (deg * Math.PI) / 180
                  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
                })
                return (
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <circle cx={cx} cy={cy} r={r} stroke="#999" strokeWidth="1" strokeDasharray="2.5 3"/>
                    {nodes.map((n, i) => (
                      <line key={`s${i}`} x1={cx} y1={cy} x2={n.x} y2={n.y}
                        stroke="#aaa" strokeWidth="1.1" strokeLinecap="round"/>
                    ))}
                    {nodes.map((n, i) => (
                      <circle key={`n${i}`} cx={n.x} cy={n.y} r="2.6"
                        fill="#fff" stroke="#777" strokeWidth="1.3"/>
                    ))}
                    <circle cx={cx} cy={cy} r="5" fill="#fff" stroke="#444" strokeWidth="1.6"/>
                    <circle cx={cx} cy={cy} r="2" fill="#555"/>
                  </svg>
                )
              })()}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 600, color: '#111', letterSpacing: '-0.025em', lineHeight: 1.2, marginBottom: 6 }}>
                NB Workspace
              </div>
              <div style={{ fontSize: 13, color: '#777', lineHeight: 1.5 }}>
                Ask, explore and troubleshoot your network
              </div>
            </div>
          </div>

          {/* Input */}
          <div>
            <InputArea
              onSend={(text) => {
                setHomeInput('')
                const lower = text.trim().toLowerCase()
                const isNetworkTemplate = text === NETWORK_TEMPLATE
                const isRecentChanges = [
                  'what changed', 'what has changed', 'recent change', 'recent update',
                  'what changed in my network', 'what changed of my network',
                  'network change', 'config change', 'configuration change',
                ].some(kw => lower.includes(kw))
                const sent = isNetworkTemplate
                  ? 'Help me understand my network. Scope: Boston data center. Focus on: topology and structure'
                  : isRecentChanges
                    ? 'Show recent configuration changes in my network'
                    : text
                onStartAI(sent)
              }}
              isStreaming={false}
              placeholder="Ask about your network, or choose a topic below"
              initialValue={hoverPrompt ?? homeInput}
              onValueChange={v => { setHoverPrompt(null); setHomeInput(v) }}
              maxExpandHeight={120}
              commandSet="home"
              disableAutoResize={hoverPrompt !== null}
            />
          </div>

          {/* Shortcut area — layer 1 or layer 2 */}
          {activeShortcut ? (
            /* ── Second layer: drill-down prompts ── */
            <div style={{ border: '1px solid #e2e2e2', borderRadius: 12, background: '#fff', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
              {/* Header — click anywhere to go back */}
              <div
                onClick={() => { setActiveShortcut(null); setHoverPrompt(null) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 14px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                <span style={{ fontSize: 12, fontWeight: 400, color: '#767676', lineHeight: 1 }}>{activeShortcut}</span>
              </div>
              {/* Prompt rows */}
              {SECOND_LAYER[activeShortcut].map(({ label, prompt }, i) => {
                const isLast = i === SECOND_LAYER[activeShortcut].length - 1
                return (
                  <button
                    key={label}
                    onClick={() => handleSecondLayer(prompt)}
                    onMouseEnter={() => setHoverPrompt(prompt)}
                    onMouseLeave={() => setHoverPrompt(null)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      width: '100%', padding: '11px 16px',
                      border: 'none', borderBottom: isLast ? 'none' : '1px solid #f5f5f5',
                      background: 'transparent', cursor: 'pointer', textAlign: 'left',
                      fontSize: 13, color: '#222', lineHeight: 1.4,
                      transition: 'background 0.12s',
                    }}
                    onMouseDown={e => e.currentTarget.style.background = '#efefef'}
                    onMouseUp={e => e.currentTarget.style.background = '#f5f5f5'}
                  >
                    <span>{label}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            /* ── First layer: 3 shortcut chips ── */
            <div style={{ display: 'flex', gap: 7 }}>
              {SHORTCUTS.map(({ label }) => (
                <button
                  key={label}
                  onClick={() => handleShortcut(label)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    border: '1px solid #e0e0e0', borderRadius: 7,
                    fontSize: 12, fontWeight: 400, color: '#555',
                    cursor: 'pointer', background: '#fff', whiteSpace: 'nowrap',
                    transition: 'border-color 0.12s, background 0.12s, color 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#efefef'; e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.color = '#111' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.color = '#555' }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* ── Resize handle ────────────────────────────────────────────────── */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          width: 5, flexShrink: 0, cursor: 'col-resize', position: 'relative',
          display: 'flex', alignItems: 'stretch', justifyContent: 'center',
        }}
        onMouseEnter={e => e.currentTarget.querySelector('span').style.background = '#c8c8c8'}
        onMouseLeave={e => e.currentTarget.querySelector('span').style.background = '#e8e8e8'}
      >
        <span style={{
          display: 'block', width: 1, background: '#e8e8e8',
          transition: 'background 0.15s',
        }} />
      </div>

      {/* ── RIGHT: Quick Insights panel ─────────────────────────────────── */}
      <div style={{
        width: insightWidth,
        flexShrink: 0,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        background: '#f6f6f7',
      }}>
        {/* Panel header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 14px 8px',
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Quick Insights
          </span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </div>

        {/* Sections */}
        <div style={{ padding: '0 10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Section title="What's New" defaultOpen={false}>
            <WhatsNewRows />
          </Section>

          <Section title="Device Summary" defaultOpen={true}>
            <DeviceSummaryRows />
          </Section>

          <Section title="Recent Detected Change" defaultOpen={true}>
            <RecentChangesRows />
          </Section>

          <Section title="Network Discovery" defaultOpen={true}>
            <NetworkDiscoveryRows />
          </Section>
        </div>
      </div>

    </div>
  )
}
