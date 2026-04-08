import { useState } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import DeviceBrowserPane from '../network/DeviceBrowserPane'

/* ── Network rail ────────────────────────────────────────────────────────── */
const NIC = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.85', strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' }

function NetDevicesIcon() { return <svg {...NIC}><path d="M8.5 7.5 a5 5 0 0 1 7 0"/><path d="M6 5 a8.5 8.5 0 0 1 12 0"/><rect x="5" y="11" width="14" height="7" rx="1.5"/><circle cx="8.5" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg> }
function NetMapsIcon()    { return <svg {...NIC}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg> }
function NetNoteIcon()    { return <svg {...NIC}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> }
function NetRectIcon()    { return <svg {...NIC}><rect x="3" y="5" width="18" height="14" rx="1.5"/></svg> }
function NetCircleIcon()  { return <svg {...NIC}><circle cx="12" cy="12" r="9"/></svg> }
function NetLineIcon()    { return <svg {...NIC}><line x1="4" y1="12" x2="20" y2="12"/></svg> }
function NetArrowIcon()   { return <svg {...NIC}><line x1="5" y1="19" x2="19" y2="5"/><polyline points="10 5 19 5 19 14"/></svg> }

const NET_RAIL = [
  { id: 'devices', tooltip: 'Devices',   Icon: NetDevicesIcon },
  { id: 'maps',    tooltip: 'Maps',      Icon: NetMapsIcon    },
  { id: 'divider' },
  { id: 'note',    tooltip: 'Note',      Icon: NetNoteIcon    },
  { id: 'rect',    tooltip: 'Rectangle', Icon: NetRectIcon    },
  { id: 'circle',  tooltip: 'Circle',    Icon: NetCircleIcon  },
  { id: 'line',    tooltip: 'Line',      Icon: NetLineIcon    },
  { id: 'arrow',   tooltip: 'Arrow',     Icon: NetArrowIcon   },
]

/* ── Fake session data ───────────────────────────────────────────────────── */
const FAKE_SESSIONS = [
  { id: 'current', name: null,              preview: '',                                              ago: 'Now',       artifacts: 0, current: true },
  { id: 's1',      name: 'Boston Network',  preview: 'Explored topology of the Boston data center',  ago: 'Just now',  artifacts: 1  },
  { id: 's2',      name: 'Core Router Analysis',    preview: 'Analyzed routing tables on Core-Router-01', ago: '2h ago',  artifacts: 2  },
  { id: 's3',      name: 'Firewall Policy Review',  preview: 'Reviewed DMZ firewall ACL rules',           ago: 'Yesterday', artifacts: 1 },
  { id: 's4',      name: 'VLAN Segmentation',       preview: 'Mapped VLANs across distribution layer',   ago: '2d ago',  artifacts: 3  },
  { id: 's5',      name: 'Incident · Packet Loss',  preview: 'Traced packet drops on AccessSwitch-F2',   ago: '3d ago',  artifacts: 1  },
  { id: 's6',      name: 'BGP Peer Troubleshoot',   preview: 'Investigated BGP flap on Edge-Router-02',  ago: '5d ago',  artifacts: 2  },
]

/* ── Session History Pane ────────────────────────────────────────────────── */
function SessionHistoryPane({ onClose, currentSessionName, onSelectSession }) {
  return (
    <div style={{
      width: 264,
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      border: '1px solid #e8e8e8',
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.06)',
      maxHeight: 'calc(100vh - 100px)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        height: 44, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderBottom: '1px solid #f0f0f0', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>Session History</span>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 4, padding: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#555' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Session list */}
      <div style={{ flex: 1, overflowY: 'auto' }} className="scrollbar-thin">
        {FAKE_SESSIONS.map((s) => {
          const displayName = s.current ? (currentSessionName || 'New Session') : s.name
          const isNewEmpty = s.current && displayName === 'New Session'
          return (
            <div
              key={s.id}
              onClick={() => { if (!s.current) { onSelectSession?.(s.id); onClose() } }}
              style={{
                padding: '10px 14px',
                borderBottom: '1px solid #f5f5f5',
                cursor: s.current ? 'default' : 'pointer',
                background: s.current ? '#f7f9ff' : 'transparent',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!s.current) e.currentTarget.style.background = '#f8f8f8' }}
              onMouseLeave={e => { if (!s.current) e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: s.preview && !isNewEmpty ? 3 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  {s.current && (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#378ADD', flexShrink: 0 }} />
                  )}
                  <span style={{ fontSize: 12, fontWeight: s.current ? 600 : 500, color: s.current ? '#111' : '#222', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName}
                  </span>
                </div>
                <span style={{ fontSize: 10, color: '#bbb', flexShrink: 0, marginLeft: 8 }}>{s.ago}</span>
              </div>
              {s.preview && !isNewEmpty && (
                <div style={{ fontSize: 11, color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: s.current ? 12 : 0 }}>
                  {s.preview}
                </div>
              )}
              {s.artifacts > 0 && (
                <div style={{ marginTop: 5, paddingLeft: s.current ? 12 : 0 }}>
                  <span style={{ fontSize: 10, color: '#999', background: '#f0f0f0', borderRadius: 3, padding: '1px 6px' }}>
                    {s.artifacts} artifact{s.artifacts !== 1 ? 's' : ''}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function AppFrame({ children, activeView, onGoHome, onGoAI, onGoNetwork, onGoInventory, onGoChangeAnalysis, currentSessionName, onOpenSession, networkPanel, onNetworkPanelClick, isTransitioning }) {
  const [activePanel, setActivePanel] = useState(null)

  function handleIconClick(id) {
    if (id === 'home')             { onGoHome();             return }
    if (id === 'network')          { return }
    if (id === 'inventory')        { onGoInventory();        return }
    if (id === 'change-analysis')  { onGoChangeAnalysis();   return }
    setActivePanel(prev => prev === id ? null : id)
  }

  function handleSelectSession(id) {
    onOpenSession?.(id)
    setActivePanel(null)
  }

  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', flexDirection: 'column',
      background: '#fff',
    }}>
      <TopBar
        onGoHome={onGoHome}
        onGoNetwork={onGoNetwork}
        activeView={activeView}
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        {activeView !== 'network' && (
          <Sidebar variant="home" activePanel={activePanel} activeView={activeView} onIconClick={handleIconClick} />
        )}
        {activePanel === 'history' && (
          <>
            {/* Backdrop — click outside to close */}
            <div
              onClick={() => setActivePanel(null)}
              style={{ position: 'absolute', inset: 0, zIndex: 199 }}
            />
            {/* Floating pane anchored just right of the sidebar */}
            <div style={{
              position: 'absolute', left: 52, top: 8,
              zIndex: 200,
            }}>
              <SessionHistoryPane
                onClose={() => setActivePanel(null)}
                currentSessionName={currentSessionName}
                onSelectSession={handleSelectSession}
              />
            </div>
          </>
        )}
        {activeView === 'network' && (
          <aside style={{ width: 44, flexShrink: 0, height: '100%', background: '#fafafa', borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', padding: '10px 0', gap: 2 }}>
            {NET_RAIL.map((slot, i) => {
              if (slot.id === 'divider') return <div key="div" style={{ height: 1, background: '#e8e8e8', margin: '6px 10px' }} />
              const active = networkPanel === slot.id
              const Icon = slot.Icon
              return (
                <div key={slot.id} className="sbi-wrap" onClick={() => onNetworkPanelClick(slot.id)}>
                  <div className="sbi-icon" style={{ background: active ? '#ece9e2' : 'transparent', color: '#514f49' }}>
                    <Icon />
                  </div>
                  <div className="sbi-tooltip">{slot.tooltip}</div>
                </div>
              )
            })}
          </aside>
        )}
        {activeView === 'network' && networkPanel === 'devices' && (
          <DeviceBrowserPane onClose={() => onNetworkPanelClick('devices')} />
        )}
        <main style={{
          flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column',
          opacity: isTransitioning ? 0 : 1,
          transition: 'opacity 0.18s ease',
        }}>
          {children}
        </main>
      </div>
    </div>
  )
}
