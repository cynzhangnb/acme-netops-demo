import { useState, useCallback, useRef, useEffect } from 'react'
import AppFrame from './components/layout/AppFrame'
import HomePage from './components/home/HomePage'
import InputArea from './components/workspace/InputArea'
import ChangeAnalysisPage from './components/changeanalysis/ChangeAnalysisPage'
import MapSessionWorkspace from './components/workspace/MapSessionWorkspace'
import ShareModal from './components/modals/ShareModal'
import DocumentModal from './components/modals/DocumentModal'
import { useSessionManager } from './hooks/useSessionManager'

/* ── Boston Network restored session snapshot ───────────────────────────── */
const BOSTON_RESTORED_SESSION = {
  id: 's1',
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

/* ── Recent Changes restored session snapshot ──────────────────────────── */
const RECENT_CHANGES_RESTORED_SESSION = {
  id: 's2',
  messages: [
    {
      id: 'c-msg-1',
      role: 'user',
      content: 'Show recent configuration changes in my network',
      timestamp: '2026-03-29T14:31:00.000Z',
    },
    {
      id: 'c-msg-2',
      role: 'assistant',
      content: `**8 configuration changes detected** in the last 7 days across the Boston network.

- **CR-BOS-01** — NTP server list updated; added 10.20.1.2 as secondary peer
- **AS-BOS-01** — Interface Ethernet0/4 moved from VLAN 210 to VLAN 220
- **DS-BOS-03** — Logging buffer size increased from 64000 to 128000
- **CR-BOS-02** — BGP route-policy updated; voice traffic local-preference lowered from 150 → 100
- **CR-BOS-02** — Static route for 10.8.3.0/24 next-hop changed to 10.0.2.1
- **DS-BOS-01** — ACL \`MGMT-ACCESS\` modified; new permit entry added for 10.20.5.0/24
- **DS-BOS-03** — OSPF hello interval changed from 10s → 5s on Ethernet0/1
- **ER-BOS-07** — QoS policy \`WAN-QOS\` updated; voice class CIR reduced from 4096000 to 2048000

← View Changes`,
      timestamp: '2026-03-29T14:31:03.000Z',
      artifactRef: { type: 'changeAnalysis', label: 'Recent Changes · Last 7 days', dataKey: null },
    },
  ],
  artifacts: [
    { id: 'c-artifact-1', type: 'changeAnalysis', label: 'Recent Changes · Last 7 days', dataKey: null, savedToWorkspace: true },
  ],
  activeArtifactId: 'c-artifact-1',
}

const DEMO_SESSION_NAMES = {
  s1: 'Boston Network',
  s2: 'Show recent configuration changes in my network',
}

const DEMO_SESSION_OPTIONS = [
  { id: 's1', name: 'Boston Network' },
  { id: 's2', name: 'Recent Configuration Changes' },
  { id: 's3', name: 'Core Router Analysis' },
  { id: 's4', name: 'Firewall Policy Review' },
  { id: 's5', name: 'VLAN Segmentation' },
  { id: 's6', name: 'Incident · Packet Loss' },
  { id: 's7', name: 'BGP Peer Troubleshoot' },
]

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

function AIPaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <rect x="0.75" y="0.75" width="14.5" height="14.5" rx="1.2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M9.59998 10.6667V9.6H10.1333V5.86667H9.59998V4.8H11.7333V5.86667H11.2V9.6H11.7333V10.6667H9.59998Z" fill="currentColor"/>
      <path d="M7.73363 10.6667H8.80029L6.93336 4.8H5.33336L3.46851 10.6667H4.53453L4.85549 9.6H7.40381L7.73363 10.6667ZM5.17645 8.53333L6.04493 5.64741L6.18141 5.64613L7.074 8.53339L5.17645 8.53333Z" fill="currentColor"/>
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
          placeholder="Ask about your network, / for shortcuts, @ to reference"
          maxExpandHeight={100}
        />
      </div>
    </div>
  )
}


/* ── Map Tab View ───────────────────────────────────────────────────────── */
function MapTabView({ name, isLoading }) {
  return (
    <div style={{
      flex: 1, height: '100%', position: 'relative', overflow: 'hidden',
      background: '#fff',
      backgroundImage: 'radial-gradient(circle, #d8d8d8 1px, transparent 1px)',
      backgroundSize: '22px 22px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16,
    }}>
      {/* Indeterminate progress bar under the tab strip */}
      {isLoading && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#378ADD', animation: 'progress-indeterminate 1.4s ease-in-out infinite' }} />
        </div>
      )}

      {isLoading ? (
        /* Spinner + label */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none"
            style={{ animation: 'spin 0.9s linear infinite' }}>
            {/* Track */}
            <circle cx="18" cy="18" r="15" stroke="#e8e8e8" strokeWidth="3"/>
            {/* Arc */}
            <circle cx="18" cy="18" r="15" stroke="#378ADD" strokeWidth="3"
              strokeLinecap="round" strokeDasharray="28 66"/>
          </svg>
          <span style={{ fontSize: 12, color: '#767676' }}>Loading {name}…</span>
        </div>
      ) : (
        <>
          <div style={{
            width: 48, height: 48, borderRadius: 10,
            background: '#fff', border: '1px solid #e4e4e4',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 500, color: '#333', letterSpacing: '-0.01em' }}>{name}</div>
          <div style={{ fontSize: 12, color: '#aaa' }}>Map canvas coming soon</div>
        </>
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
  const [viewMode, setViewMode] = useState('home') // 'home' | 'workspace' | 'network' | 'map-session'
  const [showHomeInsights, setShowHomeInsights] = useState(true)
  const [modalOpen, setModalOpen] = useState(null)
  const [homeSessionKey, setHomeSessionKey] = useState(0)
  const [initialPrompt, setInitialPrompt] = useState('')
  const [restoredSession, setRestoredSession] = useState(null)
  const [currentSessionName, setCurrentSessionName] = useState('New Session')
  const [activeSessionListId, setActiveSessionListId] = useState(null)
  const [networkPanel, setNetworkPanel] = useState(null)
  const [changeAnalysisMounted, setChangeAnalysisMounted] = useState(false)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [openTabs, setOpenTabs] = useState([])          // [{id, label}]
  const [activeTabId, setActiveTabId] = useState(null)  // 'change-analysis' | 'inventory' | null

  const { sessions, activeSessionId, startSession, commitSession, deleteSession, selectSession, updateSession } = useSessionManager()

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
      setShowHomeInsights(true)
      setInitialPrompt(prompt)
      setRestoredSession(null)
      setExternalArtifactToOpen(null)   // clear any stale drag artifact
      setActiveSessionListId(null)
      startSession()           // reserves an ID in memory — NOT saved to history yet
      setHomeSessionKey(k => k + 1)
      setViewMode('workspace')
    })
  }, [startSession, navigate])

  const enterNetwork = useCallback(() => {
    setShowHomeInsights(true)
    setViewMode('network')
  }, [])

  const enterMapSession = useCallback(() => {
    navigate(() => {
      setShowHomeInsights(true)
      setOpenTabs([])
      setActiveTabId(null)
      setCurrentSessionName('New Session')
      setActiveSessionListId(null)
      startSession()           // reserve ID so commitSession works when AI responds
      setViewMode('map-session')
    })
  }, [navigate, startSession])

  const enterChangeAnalysis = useCallback(() => {
    setOpenTabs(prev => prev.find(t => t.id === 'change-analysis') ? prev : [...prev, { id: 'change-analysis', label: 'Change Analysis' }])
    setActiveTabId('change-analysis')
    setChangeAnalysisMounted(true)
  }, [])

  const openReportInSession = useCallback((id, label) => {
    const artifactId = `report-${id}`
    if (viewModeRef.current === 'workspace') {
      /* Active AI session — inject report as a new artifact tab */
      setExternalArtifactToOpen({ _key: Date.now(), type: 'report', label, dataKey: id })
      return
    }
    /* No active session — create one with the report pre-loaded */
    navigate(() => {
      setShowHomeInsights(true)
      setActiveSessionListId(null)
      setRestoredSession({
        messages: [],
        artifacts: [{ id: artifactId, type: 'report', label, dataKey: id }],
        activeArtifactId: artifactId,
      })
      setInitialPrompt('')
      startSession()
      setHomeSessionKey(k => k + 1)
      setViewMode('workspace')
    })
  }, [navigate, startSession])

  const closeTab = useCallback((id) => {
    setOpenTabs(prev => {
      const next = prev.filter(t => t.id !== id)
      setActiveTabId(curr => curr === id ? (next[next.length - 1]?.id ?? null) : curr)
      return next
    })
  }, [])

  const [loadingTabId, setLoadingTabId] = useState(null)

  /* Track viewMode in a ref so openMapTab (stable callback) can read it */
  const viewModeRef = useRef(viewMode)
  useEffect(() => { viewModeRef.current = viewMode }, [viewMode])
  const openTabsRef = useRef(openTabs)
  useEffect(() => { openTabsRef.current = openTabs }, [openTabs])

  /* When in map-session mode, maps from the network pane open inside MapSessionWorkspace */
  const [externalMapToOpen, setExternalMapToOpen] = useState(null)

  /* Artifact to inject into active AIWorkspace (from drag-drop while in workspace mode) */
  const [externalArtifactToOpen, setExternalArtifactToOpen] = useState(null)

  /* Auto-clear after one render cycle so it's consumed exactly once */
  useEffect(() => {
    if (!externalArtifactToOpen) return
    const t = setTimeout(() => setExternalArtifactToOpen(null), 200)
    return () => clearTimeout(t)
  }, [externalArtifactToOpen])

  /* Drag state forwarded from AppFrame so MapSessionWorkspace can block its AI pane */
  const [isDraggingMap, setIsDraggingMap] = useState(false)

  const openMapResourceTab = useCallback((id, label) => {
    const tabId = `map-${id}`
    setOpenTabs(prev => prev.some(t => t.id === tabId) ? prev : [...prev, { id: tabId, label }])
    setActiveTabId(tabId)
    setLoadingTabId(tabId)
    window.setTimeout(() => {
      setLoadingTabId(curr => curr === tabId ? null : curr)
    }, 900)
  }, [])

  const openMapTab = useCallback((id, label) => {
    if (viewModeRef.current === 'workspace') {
      /* Active AI session — open map as a new artifact tab inside that session */
      setExternalArtifactToOpen({ _key: Date.now(), type: 'networkMap', label, mapId: id })
      return
    }
    if (openTabsRef.current.length > 0) {
      openMapResourceTab(id, label)
      return
    }
    if (viewModeRef.current === 'map-session') {
      /* Already in map-session — just open the map inside MapSessionWorkspace */
      setExternalMapToOpen({ id, label })
      return
    }
    /* Any other view → transition to map-session with the map pre-loaded */
    navigate(() => {
      setShowHomeInsights(true)
      setOpenTabs([])
      setActiveTabId(null)
      setCurrentSessionName('New Session')
      setActiveSessionListId(null)
      setViewMode('map-session')
      setExternalMapToOpen({ id, label })
    })
  }, [navigate, openMapResourceTab])

  const handleSelectSession = useCallback((id) => {
    navigate(() => {
      setShowHomeInsights(true)
      selectSession(id)
      setInitialPrompt('')
      setExternalArtifactToOpen(null)   // clear any stale drag artifact
      setCurrentSessionName(DEMO_SESSION_NAMES[id] || 'New Session')
      setActiveSessionListId(id)
      setHomeSessionKey(k => k + 1)

      if (id === 's2') {
        setRestoredSession(RECENT_CHANGES_RESTORED_SESSION)
        setOpenTabs([])
        setActiveTabId(null)
        setViewMode('workspace')
        return
      }

      setOpenTabs([])
      setActiveTabId(null)
      setRestoredSession(id === 's1' ? BOSTON_RESTORED_SESSION : null)
      setViewMode('workspace')
    })
  }, [selectSession, navigate])

  const handleDeleteSession = useCallback((id) => {
    deleteSession(id)
    if (activeSessionId === id) {
      setShowHomeInsights(true)
      setViewMode('home')
    }
  }, [deleteSession, activeSessionId])

  // Called by AIWorkspace whenever the derived session name changes.
  // Commits the session to history on the first real name (i.e. once the
  // user has exchanged at least one message with the AI).
  const handleSessionNameChange = useCallback((name) => {
    setCurrentSessionName(name)
    if (!activeSessionId || name === 'New Session') return
    const isCommitted = sessions.some(s => s.id === activeSessionId)
    if (isCommitted) {
      updateSession(activeSessionId, { name })
    } else {
      commitSession(activeSessionId, name)
    }
  }, [activeSessionId, sessions, commitSession, updateSession])

  return (
    <>
      <AppFrame
        activeView={openTabs.length > 0 ? 'resource' : viewMode}
        onGoHome={() => { setShowHomeInsights(true); setRestoredSession(null); setCurrentSessionName('New Session'); setActiveSessionListId(null); setViewMode('home'); setHomeSessionKey(0); setInitialPrompt(''); setOpenTabs([]); setActiveTabId(null) }}
        onGoAI={() => enterWorkspace()}
        onGoNetwork={enterNetwork}
        onGoChangeAnalysis={enterChangeAnalysis}
        onOpenReportTab={openReportInSession}
        currentSessionName={currentSessionName}
        activeSessionListId={activeSessionListId}
        onOpenSession={handleSelectSession}
        networkPanel={networkPanel}
        onNetworkPanelClick={(id) => setNetworkPanel(prev => prev === id ? null : id)}
        isTransitioning={isTransitioning}
        onOpenTab={openMapTab}
        onDragMapStateChange={setIsDraggingMap}
      >
        {openTabs.length > 0 ? (
          /* ── Resource tab workspace ── */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{
              height: 40,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px 0 8px',
              borderBottom: '1px solid #e8e8e8',
              background: '#fff',
            }}>
              <div style={{ maxWidth: '30%', minWidth: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#111',
                    letterSpacing: '-0.01em',
                    minWidth: 0,
                    display: 'flex',
                    alignItems: 'center',
                    height: 26,
                    padding: '0 10px',
                    borderRadius: 6,
                    background: '#f5f5f5',
                  }}
                >
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {currentSessionName}
                  </span>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                <button
                  onClick={() => { setShowHomeInsights(true); setActiveSessionListId(null); setViewMode('home'); setHomeSessionKey(0); setInitialPrompt(''); setOpenTabs([]); setActiveTabId(null) }}
                  title="New session"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    height: 28,
                    padding: '0 9px',
                    border: 'none',
                    borderRadius: 5,
                    background: 'transparent',
                    color: '#444',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'background 0.1s, color 0.1s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#111' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#444' }}
                >
                  + New
                </button>
                <button
                  title="AI pane unavailable in this view"
                  disabled
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 28,
                    height: 28,
                    border: 'none',
                    borderRadius: 5,
                    background: 'transparent',
                    color: '#333',
                    cursor: 'default',
                  }}
                >
                  <AIPaneIcon />
                </button>
              </div>
            </div>

            {/* Tab bar */}
            <div style={{
              height: 40, display: 'flex', alignItems: 'center',
              borderBottom: '1px solid #e8e8e8', background: '#fff',
              padding: '0 8px', gap: 2, flexShrink: 0,
            }}>
              {openTabs.map(tab => {
                const isActive = tab.id === activeTabId
                return (
                  <div
                    key={tab.id}
                    onClick={() => setActiveTabId(tab.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '0 6px 0 12px', height: 28, borderRadius: 6,
                      cursor: 'pointer',
                      background: isActive ? '#f5f5f5' : 'transparent',
                      color: isActive ? '#111' : '#767676',
                      fontSize: 12, fontWeight: isActive ? 500 : 400,
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                    onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    <span>{tab.label}</span>
                    <button
                      onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        padding: '2px 3px', borderRadius: 4,
                        display: 'flex', alignItems: 'center', lineHeight: 1,
                        color: '#bbb',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.color = '#444' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#bbb' }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Tab content */}
            {changeAnalysisMounted && (
              <div style={{ display: activeTabId === 'change-analysis' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
                <ChangeAnalysisPage />
              </div>
            )}
            {openTabs.filter(t => t.id.startsWith('map-')).map(tab => (
              <div key={tab.id} style={{ display: activeTabId === tab.id ? 'flex' : 'none', flex: 1, overflow: 'hidden' }}>
                <MapTabView name={tab.label} isLoading={loadingTabId === tab.id} />
              </div>
            ))}
          </div>
        ) : (
          /* ── Normal view modes ── */
          <>
            {viewMode === 'home' || viewMode === 'workspace' ? (
              <HomePage
                sessions={DEMO_SESSION_OPTIONS}
                onStartAI={enterWorkspace}
                onOpenSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                onGoHome={(showInsights = true) => { navigate(() => { setShowHomeInsights(showInsights); setRestoredSession(null); setCurrentSessionName('New Session'); setActiveSessionListId(null); setViewMode('home'); setHomeSessionKey(0); setInitialPrompt('') }) }}
                showQuickInsights={showHomeInsights}
                initialPrompt={initialPrompt}
                sessionKey={homeSessionKey}
                onSessionNameChange={handleSessionNameChange}
                restoredSession={restoredSession}
                currentSessionName={currentSessionName}
                currentSessionListId={activeSessionListId}
                onEnterMapSession={enterMapSession}
                onReviewChange={enterChangeAnalysis}
                externalArtifact={externalArtifactToOpen}
              />
            ) : viewMode === 'network' ? (
              <NetworkView onStartAI={enterWorkspace} />
            ) : viewMode === 'map-session' ? (
              <MapSessionWorkspace
                onSessionNameChange={setCurrentSessionName}
                onNew={() => navigate(() => { setShowHomeInsights(true); setViewMode('home'); setHomeSessionKey(0) })}
                onAllTabsClosed={() => navigate(() => { setShowHomeInsights(true); setViewMode('home'); setHomeSessionKey(0) })}
                sessions={sessions}
                onSwitchSession={handleSelectSession}
                onDeleteSession={handleDeleteSession}
                externalMapToOpen={externalMapToOpen}
                onExternalMapConsumed={() => setExternalMapToOpen(null)}
                isDraggingMap={isDraggingMap}
              />
            ) : null}
          </>
        )}
      </AppFrame>

      {modalOpen === 'share'    && <ShareModal    onClose={() => setModalOpen(null)} />}
      {modalOpen === 'document' && <DocumentModal onClose={() => setModalOpen(null)} />}
    </>
  )
}
