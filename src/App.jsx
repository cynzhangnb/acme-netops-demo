import { useState, useCallback } from 'react'
import AppFrame from './components/layout/AppFrame'
import HomePage from './components/home/HomePage'
import InputArea from './components/workspace/InputArea'
import ChangeAnalysisPage from './components/changeanalysis/ChangeAnalysisPage'
import ShareModal from './components/modals/ShareModal'
import DocumentModal from './components/modals/DocumentModal'
import { useSessionManager } from './hooks/useSessionManager'

/* ── Boston Network restored session snapshot ───────────────────────────── */
const BOSTON_RESTORED_SESSION = {
  messages: [
    {
      id: 'r-msg-1',
      role: 'user',
      content: 'Help me understand my network. Scope: Boston data center. Focus on: topology and structure',
      timestamp: '2026-03-24T10:00:00.000Z',
    },
    {
      id: 'r-msg-2',
      role: 'assistant',
      content: `Here's a high-level view of the Boston data center. It follows a standard 3-tier architecture with clear separation between core, distribution, and access layers.

**Scope:**
- 127 devices · 3 tiers · 18 segments (42 VLANs)

**Structure:**
- Core layer (top): 2 routers providing backbone connectivity
- Distribution layer (middle): 6 switches aggregating traffic
- Access layer (bottom): 45 switches connecting end systems

Each access switch connects upstream through distribution to the core, forming a hierarchical structure.

**Key Insight:**
Traffic is aggregated at the distribution layer, making it a critical point for performance and troubleshooting.

**You can explore further:**
- how routing is handled across layers
- how the network is segmented
- connections for a specific device or switch`,
      timestamp: '2026-03-24T10:00:02.000Z',
      artifactRef: { type: 'topology', label: 'Boston data center map', dataKey: 'boston-full' },
    },
  ],
  artifacts: [
    { id: 'r-artifact-1', type: 'topology', label: 'Boston data center map', dataKey: 'boston-full', savedToWorkspace: true },
  ],
  activeArtifactId: 'r-artifact-1',
}

/* ── Network topology illustration ─────────────────────────────────────── */
function NetworkIllustration() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
      <line x1="22" y1="14" x2="11" y2="26" stroke="#d4d4d4" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="22" y1="14" x2="33" y2="26" stroke="#d4d4d4" strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="11" y1="26" x2="6"  y2="37" stroke="#dcdcdc" strokeWidth="1" strokeLinecap="round"/>
      <line x1="11" y1="26" x2="16" y2="37" stroke="#dcdcdc" strokeWidth="1" strokeLinecap="round"/>
      <line x1="33" y1="26" x2="28" y2="37" stroke="#dcdcdc" strokeWidth="1" strokeLinecap="round"/>
      <line x1="33" y1="26" x2="38" y2="37" stroke="#dcdcdc" strokeWidth="1" strokeLinecap="round"/>
      <line x1="11" y1="26" x2="33" y2="26" stroke="#e0e0e0" strokeWidth="1" strokeDasharray="2.5 2.5" strokeLinecap="round"/>
      <circle cx="22" cy="12" r="5"   fill="#fff" stroke="#b0b0b0" strokeWidth="1.5"/>
      <circle cx="22" cy="12" r="2"   fill="#c8c8c8"/>
      <circle cx="11" cy="26" r="3.5" fill="#fff" stroke="#c0c0c0" strokeWidth="1.3"/>
      <circle cx="11" cy="26" r="1.4" fill="#d4d4d4"/>
      <circle cx="33" cy="26" r="3.5" fill="#fff" stroke="#c0c0c0" strokeWidth="1.3"/>
      <circle cx="33" cy="26" r="1.4" fill="#d4d4d4"/>
      <circle cx="6"  cy="37" r="2.2" fill="#fff" stroke="#d0d0d0" strokeWidth="1.2"/>
      <circle cx="16" cy="37" r="2.2" fill="#fff" stroke="#d0d0d0" strokeWidth="1.2"/>
      <circle cx="28" cy="37" r="2.2" fill="#fff" stroke="#d0d0d0" strokeWidth="1.2"/>
      <circle cx="38" cy="37" r="2.2" fill="#fff" stroke="#d0d0d0" strokeWidth="1.2"/>
    </svg>
  )
}

/* ── Sparkle / AI icon ─────────────────────────────────────────────────── */
function SparkleIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 18L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"/>
    </svg>
  )
}

/* ── Close icon ────────────────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

/* ── Docked AI Pane ─────────────────────────────────────────────────────── */
const AI_PANE_SHORTCUTS = [
  { label: 'Explain topology',  prompt: 'Explain the current network topology and how devices are connected.' },
  { label: 'Find issues',       prompt: 'Are there any network issues or anomalies I should be aware of?' },
  { label: 'Trace a path',      prompt: 'Trace the path from source to destination in this network.' },
  { label: 'Segment overview',  prompt: 'Give me an overview of the network segments and VLANs.' },
]

function AIPane({ onClose, onAsk }) {
  return (
    <div style={{
      width: 320, flexShrink: 0,
      borderLeft: '1px solid #e4e4e4',
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{
        height: 44, borderBottom: '1px solid #f0f0f0',
        padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: '#f0f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f86e8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 5,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', background: 'transparent', cursor: 'pointer', color: '#888',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888' }}
        >
          <CloseIcon />
        </button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px 14px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }} />
        <InputArea
          onSend={onAsk}
          isStreaming={false}
          placeholder="Ask anything about your network…"
          maxExpandHeight={100}
        />
      </div>
    </div>
  )
}

/* ── Inventory View ─────────────────────────────────────────────────────── */
const INVENTORY_DEVICES = [
  { hostname: 'core-sw-01',   type: 'Switch',   ip: '10.0.1.1' },
  { hostname: 'core-sw-02',   type: 'Switch',   ip: '10.0.1.2' },
  { hostname: 'edge-rtr-01',  type: 'Router',   ip: '10.0.2.1' },
  { hostname: 'fw-01',        type: 'Firewall', ip: '10.0.3.1' },
  { hostname: 'dist-sw-01',   type: 'Switch',   ip: '10.0.4.1' },
  { hostname: 'dist-sw-02',   type: 'Switch',   ip: '10.0.4.2' },
  { hostname: 'access-sw-03', type: 'Switch',   ip: '10.0.5.3' },
  { hostname: 'vpn-gw-01',    type: 'VPN GW',  ip: '10.0.6.1' },
]

function InventoryView({ onStartAI }) {
  const [aiPaneOpen, setAiPaneOpen] = useState(false)

  function handleAsk(text) {
    setAiPaneOpen(false)
    onStartAI(text)
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden', position: 'relative' }}>
      {/* Main content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '36px 48px' }} className="scrollbar-thin">
        <h2 style={{ fontSize: 17, fontWeight: 600, color: '#111', margin: '0 0 20px', letterSpacing: '-0.01em' }}>
          Device Inventory
        </h2>

        {/* Table */}
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
            padding: '9px 20px', borderBottom: '1px solid #ebebeb',
            background: '#fafafa',
          }}>
            {['Hostname', 'Type', 'IP Address'].map(col => (
              <span key={col} style={{ fontSize: 11, fontWeight: 500, color: '#888', letterSpacing: '0.02em' }}>{col}</span>
            ))}
          </div>
          {/* Rows */}
          {INVENTORY_DEVICES.map((d, i) => (
            <div
              key={d.hostname}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr',
                padding: '11px 20px',
                borderBottom: i < INVENTORY_DEVICES.length - 1 ? '1px solid #f2f2f2' : 'none',
                cursor: 'default', transition: 'background 0.1s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: '#111', fontFamily: 'ui-monospace, monospace' }}>{d.hostname}</span>
              <span style={{ fontSize: 13, color: '#555' }}>{d.type}</span>
              <span style={{ fontSize: 13, color: '#555', fontFamily: 'ui-monospace, monospace' }}>{d.ip}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI pane */}
      {aiPaneOpen && (
        <AIPane onClose={() => setAiPaneOpen(false)} onAsk={handleAsk} />
      )}

      {/* Floating AI button */}
      {!aiPaneOpen && (
        <button
          onClick={() => setAiPaneOpen(true)}
          title="Open AI Assistant"
          style={{
            position: 'absolute', bottom: 24, right: 24,
            width: 46, height: 46, borderRadius: '50%',
            background: '#378ADD', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 12px rgba(55,138,221,0.35)',
            transition: 'background 0.15s, transform 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2b6fb5'; e.currentTarget.style.transform = 'scale(1.06)' }}
          onMouseLeave={e => { e.currentTarget.style.background = '#378ADD'; e.currentTarget.style.transform = 'scale(1)' }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
          </svg>
        </button>
      )}
    </div>
  )
}

/* ── Network View ───────────────────────────────────────────────────────── */
function NetworkView({ onStartAI }) {
  const [aiPaneOpen, setAiPaneOpen] = useState(false)

  function handleAsk(text) {
    setAiPaneOpen(false)
    onStartAI(text)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      {/* Dot-grid canvas */}
      <div style={{
        flex: 1, overflow: 'hidden', position: 'relative',
        background: '#fff',
        backgroundImage: 'radial-gradient(circle, #d8d8d8 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'flex-start',
        padding: '10% 40px 40px',
      }}>
        {/* Empty state */}
        <div style={{
          width: 72, height: 72, borderRadius: 16,
          background: '#fff', border: '1px solid #e4e4e4',
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20, flexShrink: 0,
        }}>
          <NetworkIllustration />
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: '#111', letterSpacing: '-0.02em', textAlign: 'center' }}>
          Visualize, build and explore your network
        </div>

        {/* Floating AI button — hidden when pane is open */}
        {!aiPaneOpen && (
          <button
            onClick={() => setAiPaneOpen(true)}
            title="Open AI Assistant"
            style={{
              position: 'absolute', bottom: 24, right: 24,
              width: 46, height: 46, borderRadius: '50%',
              background: '#378ADD',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(55,138,221,0.35)',
              transition: 'background 0.15s, box-shadow 0.15s, transform 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2b6fb5'; e.currentTarget.style.transform = 'scale(1.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#378ADD'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
            </svg>
          </button>
        )}
      </div>

      {/* Docked AI pane */}
      {aiPaneOpen && (
        <AIPane onClose={() => setAiPaneOpen(false)} onAsk={handleAsk} />
      )}
    </div>
  )
}

/* ── App ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [viewMode, setViewMode] = useState('home') // 'home' | 'workspace' | 'network' | 'inventory' | 'change-analysis'
  const [modalOpen, setModalOpen] = useState(null)
  const [homeSessionKey, setHomeSessionKey] = useState(0)
  const [initialPrompt, setInitialPrompt] = useState('')
  const [restoredSession, setRestoredSession] = useState(null)
  const [currentSessionName, setCurrentSessionName] = useState('New Session')
  const [networkPanel, setNetworkPanel] = useState(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const { sessions, activeSessionId, createSession, deleteSession, selectSession } = useSessionManager()

  // Fade-out → swap content → fade-in
  const navigate = useCallback((callback) => {
    setIsTransitioning(true)
    setTimeout(() => {
      callback()
      setTimeout(() => setIsTransitioning(false), 40)
    }, 180)
  }, [])

  const enterWorkspace = useCallback((prompt = '') => {
    navigate(() => {
      setInitialPrompt(prompt)
      setRestoredSession(null)
      createSession('New Session')
      setHomeSessionKey(k => k + 1)
      setViewMode('workspace')
    })
  }, [createSession, navigate])

  const enterNetwork = useCallback(() => {
    setViewMode('network')
  }, [])

  const enterInventory = useCallback(() => {
    setViewMode('inventory')
  }, [])

  const enterChangeAnalysis = useCallback(() => {
    setViewMode('change-analysis')
  }, [])

  const handleSelectSession = useCallback((id) => {
    navigate(() => {
      selectSession(id)
      setInitialPrompt('')
      setRestoredSession(id === 's1' ? BOSTON_RESTORED_SESSION : null)
      setHomeSessionKey(k => k + 1)
      setViewMode('workspace')
    })
  }, [selectSession, navigate])

  const handleDeleteSession = useCallback((id) => {
    deleteSession(id)
    if (activeSessionId === id) setViewMode('home')
  }, [deleteSession, activeSessionId])

  return (
    <>
      <AppFrame
        activeView={viewMode}
        onGoHome={() => { setViewMode('home'); setHomeSessionKey(0); setInitialPrompt('') }}
        onGoAI={() => enterWorkspace()}
        onGoNetwork={enterNetwork}
        onGoInventory={enterInventory}
        onGoChangeAnalysis={enterChangeAnalysis}
        currentSessionName={currentSessionName}
        onOpenSession={handleSelectSession}
        networkPanel={networkPanel}
        onNetworkPanelClick={(id) => setNetworkPanel(prev => prev === id ? null : id)}
        isTransitioning={isTransitioning}
      >
        {viewMode === 'home' || viewMode === 'workspace' ? (
          <HomePage
            sessions={sessions}
            onStartAI={enterWorkspace}
            onOpenSession={handleSelectSession}
            initialPrompt={initialPrompt}
            sessionKey={homeSessionKey}
            onSessionNameChange={setCurrentSessionName}
            restoredSession={restoredSession}
            currentSessionName={currentSessionName}
          />
        ) : viewMode === 'network' ? (
          <NetworkView onStartAI={enterWorkspace} />
        ) : viewMode === 'change-analysis' ? (
          <ChangeAnalysisPage />
        ) : null}
      </AppFrame>

      {modalOpen === 'share'    && <ShareModal    onClose={() => setModalOpen(null)} />}
      {modalOpen === 'document' && <DocumentModal onClose={() => setModalOpen(null)} />}
    </>
  )
}
