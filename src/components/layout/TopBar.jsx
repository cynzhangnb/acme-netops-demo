// All icons use 24-viewBox Lucide-compatible style for consistent weight & rendering

/* ── icons ─────────────────────────────────────────────────────────────── */
function BurgerIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  )
}

// All tab icons rendered at the same 15×15 px — uniform optical weight

function HomeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9,22 9,12 15,12 15,22"/>
    </svg>
  )
}

// Simple 4-point star — clean AI metaphor, single path, same visual weight as HomeIcon
function AITabIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
    </svg>
  )
}

// Network tab — globe with status dot (bottom-right)
function NetworkTabIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      {/* Globe outline */}
      <circle cx="11" cy="11" r="8.5"/>
      {/* Horizontal equator */}
      <line x1="2.5" y1="11" x2="19.5" y2="11"/>
      {/* Vertical meridian arc */}
      <path d="M11 2.5 C8 5.5 8 16.5 11 19.5"/>
      <path d="M11 2.5 C14 5.5 14 16.5 11 19.5"/>
      {/* Status dot — bottom right */}
      <circle cx="19" cy="19" r="2.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function HelpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <circle cx="12" cy="17" r="0.5" fill="currentColor" stroke="none"/>
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}

function VDivider() {
  return <div style={{ width: 1, height: 18, background: '#e8e8e8', flexShrink: 0, alignSelf: 'center', margin: '0 2px' }} />
}

const icoBtn = {
  width: 32, height: 32, borderRadius: 5,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', color: '#666', flexShrink: 0,
}

/* ── Tab ────────────────────────────────────────────────────────────────── */
function Tab({ icon, label, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        height: 44,
        display: 'flex', alignItems: 'center',
        gap: label ? 6 : 0,
        padding: '0 13px',
        background: 'transparent',
        borderBottom: active ? '2px solid #378ADD' : '2px solid transparent',
        cursor: 'pointer',
        color: active ? '#111' : '#666',
        fontSize: 12,
        fontWeight: active ? 500 : 400,
        flexShrink: 0,
        userSelect: 'none',
        transition: 'border-color 0.15s, color 0.1s',
        boxSizing: 'border-box',
      }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = '#333'; e.currentTarget.style.borderBottomColor = '#d0d0d0'; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = '#666'; e.currentTarget.style.borderBottomColor = 'transparent'; } }}
    >
      {icon}
      {label && <span style={{ lineHeight: 1 }}>{label}</span>}
    </div>
  )
}

/* ── TopBar ─────────────────────────────────────────────────────────────── */
export default function TopBar({ onGoHome, onGoAI, onGoNetwork, activeView }) {
  return (
    <header style={{
      height: 44, background: '#fff', borderBottom: '1px solid #e4e4e4',
      display: 'flex', alignItems: 'center', flexShrink: 0, zIndex: 30,
      gap: 0,
    }}>

      {/* Hamburger — 44×44 touch target */}
      <div
        onClick={onGoHome}
        style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#666', flexShrink: 0 }}
        onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
      >
        <BurgerIcon />
      </div>

      <VDivider />

      {/* Logo + app name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px', flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: '#378ADD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          N
        </div>
        <div
          style={{ fontSize: 13, fontWeight: 600, color: '#111', display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', padding: '3px 6px', borderRadius: 4 }}
          onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          ACME NetOps <ChevronDownIcon />
        </div>
      </div>

      {/* ── Navigation tabs ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <Tab icon={<HomeIcon />}       label={null}          active={activeView === 'home'}      onClick={onGoHome}    />
        <VDivider />
        <Tab icon={<AITabIcon />}      label="AI Workspace"  active={activeView === 'workspace'} onClick={onGoAI}      />
        {/* Network tab hidden — page preserved, not removed */}
      </div>

      <div style={{ flex: 1 }} />

      {/* ── Right actions ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, paddingRight: 12 }}>
        <div
          style={icoBtn}
          title="Help"
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#666'; }}
        >
          <HelpIcon />
        </div>

        <div style={{ margin: '0 8px' }}><VDivider /></div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', border: '1px solid #e4e4e4', borderRadius: 5, fontSize: 12, color: '#444', background: '#fafafa', cursor: 'default', whiteSpace: 'nowrap' }}>
          Hybrid Network <span style={{ color: '#888' }}><ChevronDownIcon /></span>
        </div>
      </div>
    </header>
  )
}
