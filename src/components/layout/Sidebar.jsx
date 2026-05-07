import { useState, useEffect, useRef } from 'react'
import DomainSwitcher from './DomainSwitcher'
import netBrainLogo from '../../../logo/logo.svg'
import { useTheme } from '../../ThemeContext'

/* ── Icons ──────────────────────────────────────────────────────────────── */

/** Simple hamburger — shown in collapsed state to re-expand */
function HamburgerIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round">
      <line x1="3" y1="6"  x2="21" y2="6"  />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

/** Product logo mark — shown in expanded state */
function LogoMark() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 6,
      background: '#2e2e2e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    }}>
      <span style={{ color: '#fff', fontSize: 12, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1 }}>N</span>
    </div>
  )
}

/** Left sidebar icon — IBM Carbon-style outline */
function CollapseIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor" style={{ display: 'block', transform: 'translateY(1px)' }}>
      <path d="M28,4H4A2,2,0,0,0,2,6V26a2,2,0,0,0,2,2H28a2,2,0,0,0,2-2V6A2,2,0,0,0,28,4ZM4,6h6V26H4ZM28,26H12V6H28Z" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5"  y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function NetworkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor">
      <circle cx="21" cy="21" r="2"/>
      <circle cx="7" cy="7" r="2"/>
      <path d="M27,31a4,4,0,1,1,4-4A4.0118,4.0118,0,0,1,27,31Zm0-6a2,2,0,1,0,2,2A2.0059,2.0059,0,0,0,27,25Z"/>
      <path d="M30,16A14.0412,14.0412,0,0,0,16,2,13.0426,13.0426,0,0,0,9.2,3.8l1.1,1.7a24.4254,24.4254,0,0,1,2.4-1A25.1349,25.1349,0,0,0,10,15H4a11.1489,11.1489,0,0,1,1.4-4.7L3.9,9A13.8418,13.8418,0,0,0,2,16,13.9983,13.9983,0,0,0,16,30a13.3656,13.3656,0,0,0,5.2-1l-.6-1.9a11.4416,11.4416,0,0,1-5.2.9h0A21.0713,21.0713,0,0,1,12,17H29.9A3.4019,3.4019,0,0,0,30,16ZM12.8,27.6h0a13.02,13.02,0,0,1-5.3-3.1A12.5053,12.5053,0,0,1,4,17h6A25.0022,25.0022,0,0,0,12.8,27.6ZM12,15A21.4461,21.4461,0,0,1,15.3,4h1.4A21.4461,21.4461,0,0,1,20,15Zm10,0A23.2777,23.2777,0,0,0,19.2,4.4,12.0919,12.0919,0,0,1,27.9,15Z"/>
    </svg>
  )
}
function MapIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="5" rx="1"/>
      <line x1="12" y1="7" x2="12" y2="11"/>
      <line x1="4" y1="11" x2="20" y2="11"/>
      <line x1="4"  y1="11" x2="4"  y2="16"/>
      <line x1="12" y1="11" x2="12" y2="16"/>
      <line x1="20" y1="11" x2="20" y2="16"/>
      <circle cx="4"  cy="19" r="2.5"/>
      <circle cx="12" cy="19" r="2.5"/>
      <circle cx="20" cy="19" r="2.5"/>
    </svg>
  )
}
function InventoryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/>
      <line x1="3" y1="9"  x2="21" y2="9"/>
      <line x1="3" y1="15" x2="21" y2="15"/>
      <line x1="9" y1="9"  x2="9"  y2="21"/>
    </svg>
  )
}
function ChangeAnalysisIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 32 32" fill="currentColor">
      {/* Circular arrow — bottom */}
      <path d="m24,21v2h1.7483c-2.2363,3.1196-5.8357,5-9.7483,5-6.6169,0-12-5.3833-12-12h-2c0,7.7197,6.2803,14,14,14,4.355,0,8.3743-2.001,11-5.3452v1.3452h2v-5h-5Z"/>
      {/* Circular arrow — top */}
      <path d="m16,2c-4.355,0-8.3743,2.001-11,5.3452v-1.3452h-2v5h5v-2h-1.7483c2.2363-3.1196,5.8357-5,9.7483-5,6.6169,0,12,5.3833,12,12h2c0-7.7197-6.2803-14-14-14Z"/>
      {/* Narrow hamburger — 3 lines, width (6) < height span (9) */}
      <line x1="13" y1="11.5" x2="19" y2="11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="16"   x2="19" y2="16"   stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <line x1="13" y1="20.5" x2="19" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}
function HistoryIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/>
      <polyline points="12 7 12 12 15.5 15.5"/>
    </svg>
  )
}
function SessionIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )
}
function ChevronDownIcon({ open }) {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.18s', transform: open ? 'none' : 'rotate(-90deg)', flexShrink: 0 }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  )
}
/* Outline pin — hover action (same path as pin.svg) */
function PinOutlineIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 32 32" fill="currentColor" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M28.59,13.31,30,11.9,20,2,18.69,3.42,19.87,4.6,8.38,14.32,6.66,12.61,5.25,14l5.66,5.68L2,28.58,3.41,30l8.91-8.91L18,26.75l1.39-1.42-1.71-1.71L27.4,12.13ZM16.26,22.2,9.8,15.74,21.29,6,26,10.71Z"/>
    </svg>
  )
}
/* Filled pin — shown persistently when pinned (same path as pin--filled.svg) */
function PinFilledIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 32 32" fill="currentColor" style={{ display: 'block', flexShrink: 0 }}>
      <path d="M28.5858,13.3137,30,11.9,20,2,18.6858,3.415l1.1858,1.1857L8.38,14.3225,6.6641,12.6067,5.25,14l5.6572,5.6773L2,28.5831,3.41,30l8.9111-8.9087L18,26.7482l1.3929-1.414L17.6765,23.618l9.724-11.4895Z"/>
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

const MOCK_TENANTS = [
  {
    id: 'tenant-nblive',
    name: 'NBLIVE',
    domains: [
      { id: 'd1', name: 'Hybrid Network' },
      { id: 'd2', name: 'CVE Ongoing Project' },
      { id: 'd3', name: 'CVE Release Domain' },
      { id: 'd4', name: 'Dongxu-Demo' },
    ],
  },
  {
    id: 'tenant-playground',
    name: 'NetBrain Playground',
    domains: [
      { id: 'd5', name: 'Playground-1' },
    ],
  },
]

/* ── Tooltip bubble ─────────────────────────────────────────────────────── */
function Tooltip({ label }) {
  return (
    <div style={{
      position: 'absolute',
      left: 46,                /* just past the 44-px collapsed rail */
      top: '50%', transform: 'translateY(-50%)',
      background: '#1a1a1a', color: '#fff',
      fontSize: 11, padding: '4px 8px',
      borderRadius: 4, whiteSpace: 'nowrap',
      pointerEvents: 'none', zIndex: 400,
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>
      {/* arrow */}
      <div style={{
        position: 'absolute', left: -4, top: '50%', transform: 'translateY(-50%)',
        width: 0, height: 0,
        borderTop: '4px solid transparent',
        borderBottom: '4px solid transparent',
        borderRight: '4px solid #1a1a1a',
      }} />
      {label}
    </div>
  )
}

/* ── Theme toggle ────────────────────────────────────────────────────────── */
function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <line x1="12" y1="2" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="22"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="2" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="22" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  )
}
function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title="Appearance"
        style={{
          width: 32, height: 36,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open || hovered ? 'var(--t-bg-hover-w)' : 'transparent',
          border: 'none', cursor: 'pointer',
          color: 'var(--t-tx-6)',
          transition: 'background 0.12s, color 0.12s',
          flexShrink: 0,
        }}
      >
        {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 4px)',
          right: 0,
          zIndex: 1300,
          background: 'var(--t-bg)',
          border: '1px solid var(--t-border)',
          borderRadius: 8,
          boxShadow: 'var(--t-shadow-menu)',
          minWidth: 130,
          overflow: 'hidden',
          padding: '3px 0',
        }}>
          <div style={{ padding: '5px 10px 3px', fontSize: 10.5, fontWeight: 600, color: 'var(--t-tx-8)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
            Appearance
          </div>
          {[
            { key: 'light', label: 'Light', icon: <SunIcon /> },
            { key: 'dark',  label: 'Dark',  icon: <MoonIcon /> },
          ].map(({ key, label, icon }) => {
            const isActive = theme === key
            return (
              <div
                key={key}
                onClick={() => { setTheme(key); setOpen(false) }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--t-bg-hover-w)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '6px 12px',
                  fontSize: 13, cursor: 'pointer',
                  color: isActive ? 'var(--t-tx-1)' : 'var(--t-tx-2)',
                  fontWeight: isActive ? 500 : 400,
                  background: 'transparent',
                }}
              >
                <span style={{ color: isActive ? 'var(--t-tx-2)' : 'var(--t-tx-6)' }}>{icon}</span>
                {label}
                {isActive && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 'auto', color: '#378ADD' }}>
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Unified nav item (works for both expanded and collapsed) ────────────── */
function SideNavItem({ icon, label, active, onClick, expanded, showTooltip, rightSlot }) {
  const [hovered, setHovered] = useState(false)
  const bg = active ? 'var(--t-bg-active-w)' : hovered ? 'var(--t-bg-hover-w)' : 'transparent'

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center',
          width: '100%', height: 32,
          padding: '0 6px',
          background: bg, border: 'none', borderRadius: 6,
          cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.12s',
        }}
      >
        {/* Icon — always at a fixed left position so it never shifts */}
        <span style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 22, flexShrink: 0, color: 'var(--t-tx-2)',
        }}>
          {icon}
        </span>

        {/* Label — fades in/out; max-width clamps it so it never wraps outside */}
        <span style={{
          fontSize: 13, color: 'var(--t-tx-2)', fontWeight: 400,
          whiteSpace: 'nowrap', overflow: 'hidden',
          maxWidth: expanded ? 160 : 0,
          opacity: expanded ? 1 : 0,
          marginLeft: expanded ? 7 : 0,
          transition: 'max-width 0.22s ease, opacity 0.16s ease, margin-left 0.22s ease',
          lineHeight: 1.3,
        }}>
          {label}
        </span>

        {/* Right slot (e.g. chevron) — fades when collapsed */}
        {rightSlot && (
          <span style={{
            marginLeft: 'auto', paddingLeft: 4, flexShrink: 0,
            opacity: expanded ? 1 : 0,
            transition: 'opacity 0.16s ease',
          }}>
            {rightSlot}
          </span>
        )}
      </button>

      {/* Tooltip — only when collapsed, not during animation */}
      {showTooltip && hovered && <Tooltip label={label} />}
    </div>
  )
}

/* ── Sidebar ─────────────────────────────────────────────────────────────── */
export default function Sidebar({
  expanded,
  onToggle,
  onNew,
  onGoHome,
  onGoNetwork,
  networkActive,
  onGoMap,
  mapActive,
  onGoInventory,
  inventoryActive,
  onGoChangeAnalysis,
  sessions = [],
  currentSessionName,
  activeSessionListId = null,
  onSelectSession,
  pinnedIds = new Set(),
  onTogglePin,
}) {
  const [sessionsOpen,      setSessionsOpen]      = useState(true)
  const [hoveredSessionId,  setHoveredSessionId]  = useState(null)
  const [openMenuId,        setOpenMenuId]        = useState(null)
  const [deleteConfirmId,   setDeleteConfirmId]   = useState(null)
  const [editingId,         setEditingId]         = useState(null)
  const [editValue,         setEditValue]         = useState('')
  const [localNames,        setLocalNames]        = useState({})
  const [deletedIds,        setDeletedIds]        = useState(new Set())
  const [menuPos,           setMenuPos]           = useState(null)
  const menuRef = useRef(null)

  /* Account menu */
  const [accountMenuOpen,   setAccountMenuOpen]   = useState(false)
  const [accountMenuPos,    setAccountMenuPos]    = useState(null)
  const [userBtnHovered,    setUserBtnHovered]    = useState(false)
  const accountMenuRef = useRef(null)
  const userBtnRef     = useRef(null)

  /* Domain switcher */
  const [switcherOpen,    setSwitcherOpen]    = useState(false)
  const [switcherPos,     setSwitcherPos]     = useState(null)
  const [activeTenantId,  setActiveTenantId]  = useState('tenant-nblive')
  const [activeDomainId,  setActiveDomainId]  = useState('d1')
  const domainBtnRef = useRef(null)
  const switcherRef = useRef(null)
  const activeTenant = MOCK_TENANTS.find(tenant => tenant.id === activeTenantId) ?? MOCK_TENANTS[0]
  const activeDomain = activeTenant?.domains.find(domain => domain.id === activeDomainId) ?? activeTenant?.domains[0]

  useEffect(() => {
    if (!accountMenuOpen) return
    const handler = e => {
      const path = e.composedPath ? e.composedPath() : []
      if (!path.includes(accountMenuRef.current) && !path.includes(userBtnRef.current)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountMenuOpen])

  function toggleAccountMenu(e) {
    e.stopPropagation()
    setSwitcherOpen(false)
    if (accountMenuOpen) { setAccountMenuOpen(false); return }
    const rect = userBtnRef.current.getBoundingClientRect()
    setAccountMenuPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left })
    setAccountMenuOpen(true)
  }

  useEffect(() => {
    if (!switcherOpen) return
    const handler = e => {
      const path = e.composedPath ? e.composedPath() : []
      if (!path.includes(switcherRef.current) && !path.includes(domainBtnRef.current)) {
        setSwitcherOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [switcherOpen])

  useEffect(() => {
    if (!expanded) setSwitcherOpen(false)
  }, [expanded])

  function toggleDomainSwitcher(e) {
    e.stopPropagation()
    setAccountMenuOpen(false)
    setOpenMenuId(null)
    setDeleteConfirmId(null)
    setMenuPos(null)
    if (switcherOpen) {
      setSwitcherOpen(false)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setSwitcherPos({ top: rect.top, left: rect.left, bottom: rect.bottom, right: rect.right })
    setSwitcherOpen(true)
  }

  function handleDomainSelect(tenantId, domainId) {
    setActiveTenantId(tenantId)
    setActiveDomainId(domainId)
  }

  /* Close overflow menu on outside click */
  useEffect(() => {
    if (!openMenuId) return
    const handler = e => {
      const path = e.composedPath ? e.composedPath() : []
      if (!path.includes(menuRef.current) && !menuRef.current?.contains(e.target)) {
        setOpenMenuId(null); setDeleteConfirmId(null); setMenuPos(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openMenuId])

  function togglePin(e, id) {
    e.stopPropagation()
    onTogglePin?.(id)
  }

  function openOverflow(e, s) {
    e.preventDefault(); e.stopPropagation()
    setSwitcherOpen(false)
    if (openMenuId === s.id) { setOpenMenuId(null); setMenuPos(null); return }
    const rect = e.currentTarget.getBoundingClientRect()
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
    setOpenMenuId(s.id); setDeleteConfirmId(null)
  }

  function startRename(s) {
    setOpenMenuId(null); setMenuPos(null)
    setEditingId(s.id); setEditValue(localNames[s.id] || s.name)
  }

  function confirmRename() {
    const t = editValue.trim()
    if (t && editingId) setLocalNames(prev => ({ ...prev, [editingId]: t }))
    setEditingId(null)
  }

  function confirmDelete(id) {
    setDeletedIds(prev => { const n = new Set(prev); n.add(id); return n })
    setOpenMenuId(null); setMenuPos(null); setDeleteConfirmId(null)
  }
  /* During the width animation we keep overflow:hidden so labels don't bleed.
     After the transition settles, we switch to overflow:visible so tooltips
     can escape the 44-px rail. */
  const [isAnimating, setIsAnimating] = useState(false)

  function handleToggle() {
    setIsAnimating(true)
    setSwitcherOpen(false)
    onToggle()
    setTimeout(() => setIsAnimating(false), 260)
  }

  /* Tooltips are only meaningful when the sidebar is collapsed and static */
  const showTooltip = !expanded && !isAnimating

  return (
    <aside style={{
      width: expanded ? 220 : 44,
      flexShrink: 0, height: '100%',
      background: 'var(--t-bg-2)', borderRight: '1px solid var(--t-border-2)',
      display: 'flex', flexDirection: 'column',
      /* clip labels during animation; let tooltips overflow when static */
      overflow: isAnimating ? 'hidden' : 'visible',
      transition: 'width 0.22s ease',
      /* keep the aside itself from contributing to page scroll */
      position: 'relative',
    }}>

      {/* ── Header: logo + brand (expanded) or hamburger (collapsed) ── */}
      <div style={{
        height: 40, display: 'flex', alignItems: 'center',
        flexShrink: 0, overflow: 'hidden',
      }}>
        {expanded ? (
          /* Expanded: logo mark + name + collapse button — padded to match nav items */
          <>
            {/* Product logo — navigates home */}
            <div
              onClick={onGoHome}
              style={{
                display: 'flex', alignItems: 'center',
                flex: 1, minWidth: 0, cursor: 'pointer',
                padding: '0 5px 0 16px', height: '100%',
              }}
            >
              <img
                src={netBrainLogo}
                alt="NetBrain"
                style={{
                  width: 86,
                  height: 20,
                  display: 'block',
                  flexShrink: 0,
                }}
              />
            </div>

            {/* Collapse button — right side */}
            <button
              onClick={handleToggle}
              title="Collapse sidebar"
              style={{
                flexShrink: 0, width: 28, height: 28, marginRight: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--t-tx-2)', borderRadius: 5,
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--t-bg-hover)'; e.currentTarget.style.color = 'var(--t-tx-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--t-tx-2)' }}
            >
              <CollapseIcon />
            </button>
          </>
        ) : (
          /* Collapsed: hamburger fills the full 44px header — same center as nav icons */
          <button
            onClick={handleToggle}
            title="Expand sidebar"
            style={{
              width: 44, height: 40, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--t-tx-2)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--t-bg-hover-w)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <HamburgerIcon />
          </button>
        )}
      </div>

      {expanded && (
        <button
          ref={domainBtnRef}
          onClick={toggleDomainSwitcher}
          title={activeDomain?.name}
          style={{
            height: 30,
            margin: '8px 7px 2px',
            padding: '0 8px 0 9px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            flexShrink: 0,
            border: 'none',
            borderRadius: 7,
            background: switcherOpen ? 'var(--t-bg-active-w)' : 'var(--t-bg-domain)',
            color: 'var(--t-tx-1)',
            cursor: 'pointer',
            textAlign: 'left',
            transition: 'background 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--t-bg-active-w)' }}
          onMouseLeave={e => { e.currentTarget.style.background = switcherOpen ? 'var(--t-bg-active-w)' : 'var(--t-bg-domain)' }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#378ADD', flexShrink: 0 }} />
          <span style={{ minWidth: 0, flex: 1, fontSize: 12.5, fontWeight: 500, color: 'var(--t-tx-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.1 }}>
            {activeDomain?.name ?? 'No domain'}
          </span>
        </button>
      )}

      {switcherOpen && switcherPos && (
        <div ref={switcherRef}>
          <DomainSwitcher
            tenants={MOCK_TENANTS}
            activeTenantId={activeTenantId}
            activeDomainId={activeDomainId}
            isAdmin={true}
            anchorRect={switcherPos}
            onSelect={handleDomainSelect}
            onClose={() => setSwitcherOpen(false)}
          />
        </div>
      )}

      {/* ── Nav items ─────────────────────────────────────────────────── */}
      <div style={{ padding: '4px 5px 4px', display: 'flex', flexDirection: 'column', gap: 1, flexShrink: 0 }}>
        <SideNavItem
          icon={<PlusIcon />}
          label="New Session"
          onClick={onNew}
          expanded={expanded}
          showTooltip={showTooltip}
        />
        <SideNavItem
          icon={<NetworkIcon />}
          label="Network"
          onClick={onGoNetwork}
          active={networkActive}
          expanded={expanded}
          showTooltip={showTooltip}
        />
        <SideNavItem
          icon={<MapIcon />}
          label="Map"
          onClick={onGoMap}
          active={mapActive}
          expanded={expanded}
          showTooltip={showTooltip}
        />
        <SideNavItem
          icon={<InventoryIcon />}
          label="Inventory"
          onClick={onGoInventory}
          active={inventoryActive}
          expanded={expanded}
          showTooltip={showTooltip}
        />
        <SideNavItem
          icon={<ChangeAnalysisIcon />}
          label="Change Analysis"
          onClick={onGoChangeAnalysis}
          expanded={expanded}
          showTooltip={showTooltip}
        />
      </div>

      {/* divider */}
      <div style={{ height: 1, background: 'var(--t-border-2)', margin: '4px 8px', flexShrink: 0 }} />

      {/* ── Sessions section ──────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

        {/* History entry point moved to top-left of home page (collapsed mode) */}

        {/* When expanded: plain section label + session list */}
        {expanded && (
          <>
            {/* Section label */}
            <div
              onClick={() => setSessionsOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '6px 11px 4px',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <span style={{
                fontSize: 10.5, fontWeight: 500, color: 'var(--t-tx-8)',
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>
                Sessions
              </span>
              <ChevronDownIcon open={sessionsOpen} />
            </div>

            {/* Session list */}
            {sessionsOpen && (() => {
              const allSessions = sessions.filter(s => !s.current && !deletedIds.has(s.id))
              const pinned  = allSessions.filter(s => pinnedIds.has(s.id))
              const recent  = allSessions.filter(s => !pinnedIds.has(s.id))

              const renderSession = (s) => {
                const isActive      = s.id === activeSessionListId || (!!currentSessionName && s.name === currentSessionName && !activeSessionListId)
                const isInteractive = s.id === 's1' || s.id === 's2'
                const isHovered     = hoveredSessionId === s.id
                const isPinned      = pinnedIds.has(s.id)
                const isEditing     = editingId === s.id
                const displayName   = localNames[s.id] || s.name
                const showIcons     = isHovered || openMenuId === s.id

                return (
                  <div
                    key={s.id}
                    onClick={() => { if (isEditing || !isInteractive || isActive) return; onSelectSession?.(s.id) }}
                    onMouseEnter={() => setHoveredSessionId(s.id)}
                    onMouseLeave={() => setHoveredSessionId(prev => prev === s.id ? null : prev)}
                    style={{
                      padding: '5px 4px 5px 11px',
                      borderRadius: 5, margin: '0 3px',
                      background: isHovered && !isActive ? 'var(--t-bg-hover-w)' : 'transparent',
                      cursor: isActive || isEditing ? 'default' : 'pointer',
                      transition: 'background 0.1s',
                      display: 'flex', alignItems: 'center', gap: 4,
                    }}
                  >
                    {isActive && !isEditing && (
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#378ADD', flexShrink: 0 }} />
                    )}
                    {isEditing ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={confirmRename}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  { e.preventDefault(); confirmRename() }
                          if (e.key === 'Escape') { e.preventDefault(); setEditingId(null) }
                        }}
                        onClick={e => e.stopPropagation()}
                        style={{ flex: 1, minWidth: 0, fontSize: 12, color: '#111', border: '1px solid #c8c8c8', borderRadius: 4, padding: '1px 5px', outline: 'none', background: '#fff' }}
                      />
                    ) : (
                      <span style={{
                        fontSize: 12, color: isActive ? 'var(--t-tx-1)' : 'var(--t-tx-3)',
                        fontWeight: isActive ? 500 : 400,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        lineHeight: 1.4, flex: 1, minWidth: 0,
                      }}>
                        {displayName}
                      </span>
                    )}
                    {/* Pin */}
                    <button
                      onClick={e => togglePin(e, s.id)}
                      title={isPinned ? 'Unpin' : 'Pin session'}
                      style={{
                        flexShrink: 0, width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', cursor: 'pointer', borderRadius: 3,
                        color: '#555',
                        opacity: isPinned || showIcons ? 1 : 0,
                        pointerEvents: isPinned || showIcons ? 'auto' : 'none',
                        transition: 'opacity 0.1s, color 0.1s, background 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--t-bg-hover)'; e.currentTarget.style.color = 'var(--t-tx-2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#555' }}
                    >
                      {isPinned ? <PinFilledIcon /> : <PinOutlineIcon />}
                    </button>
                    {/* Overflow (⋯) */}
                    <button
                      onMouseDown={e => openOverflow(e, s)}
                      title="More options"
                      style={{
                        flexShrink: 0, width: 20, height: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: openMenuId === s.id ? '#e0e0e0' : 'none',
                        border: 'none', cursor: 'pointer', borderRadius: 3,
                        color: '#555',
                        opacity: showIcons ? 1 : 0,
                        pointerEvents: showIcons ? 'auto' : 'none',
                        transition: 'opacity 0.1s, background 0.1s, color 0.1s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--t-bg-hover)'; e.currentTarget.style.color = 'var(--t-tx-2)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = openMenuId === s.id ? '#e0e0e0' : 'none'; e.currentTarget.style.color = '#555' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
                      </svg>
                    </button>
                  </div>
                )
              }

              return (
                <div style={{ flex: 1, overflowY: 'auto', marginTop: 1, animation: 'fadeInMsg 0.18s ease both' }} className="scrollbar-thin">
                  {pinned.length > 0 && (
                    <>
                      <div style={{ padding: '4px 11px 2px', fontSize: 10.5, fontWeight: 500, color: 'var(--t-tx-7)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        Pinned
                      </div>
                      {pinned.map(renderSession)}
                      {recent.length > 0 && <div style={{ height: 1, background: 'var(--t-border-2)', margin: '4px 8px 4px' }} />}
                    </>
                  )}
                  {recent.map(renderSession)}
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <div style={{ borderTop: '1px solid var(--t-border-2)', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <button
          ref={userBtnRef}
          onClick={toggleAccountMenu}
          onMouseEnter={() => setUserBtnHovered(true)}
          onMouseLeave={() => setUserBtnHovered(false)}
          style={{
            display: 'flex', alignItems: 'center',
            justifyContent: expanded ? 'flex-start' : 'center',
            flex: 1, minWidth: 0, height: 36,
            padding: expanded ? '0 6px' : 0,
            background: accountMenuOpen || userBtnHovered ? 'var(--t-bg-hover-w)' : 'transparent',
            border: 'none', borderRadius: 0, cursor: 'pointer',
            transition: 'background 0.12s',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 22, flexShrink: 0, color: 'var(--t-tx-2)' }}>
            <UserIcon />
          </span>
          <span style={{
            fontSize: 13, color: 'var(--t-tx-2)', fontWeight: 400,
            whiteSpace: 'nowrap', overflow: 'hidden',
            maxWidth: expanded ? 160 : 0,
            opacity: expanded ? 1 : 0,
            marginLeft: expanded ? 7 : 0,
            transition: 'max-width 0.22s ease, opacity 0.16s ease, margin-left 0.22s ease',
            lineHeight: 1.3,
          }}>
            Account
          </span>
        </button>
        {showTooltip && userBtnHovered && <Tooltip label="Account" />}

        {/* Theme toggle — only when expanded */}
        {expanded && <ThemeToggle />}
      </div>

      {/* Account menu — fixed position, opens above footer button */}
      {accountMenuOpen && accountMenuPos && (
        <div
          ref={accountMenuRef}
          style={{
            position: 'fixed',
            bottom: accountMenuPos.bottom,
            left: accountMenuPos.left,
            zIndex: 1200,
            background: 'var(--t-bg)',
            border: '1px solid var(--t-border)',
            borderRadius: 10,
            boxShadow: 'var(--t-shadow-menu)',
            minWidth: 220,
            overflow: 'hidden',
            padding: '4px 0',
          }}
        >
          {/* Email header — compact, tight, gray */}
          <div style={{
            padding: '7px 14px 5px',
            fontSize: 11.5, color: 'var(--t-tx-4)', fontWeight: 400,
          }}>
            cynthia.zhang@netbrain.com
          </div>

          {/* Divider after email */}
          <div style={{ height: 1, background: 'var(--t-border-3)', margin: '3px 0' }} />

          {/* Menu items */}
          {[
            {
              label: 'User Profile',
              icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              ),
            },
            {
              label: 'Get Help',
              icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              ),
            },
            {
              label: 'Open Support Ticket',
              icon: (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              ),
            },
          ].map(({ label, icon }) => (
            <div
              key={label}
              onMouseDown={e => { e.preventDefault(); setAccountMenuOpen(false) }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--t-bg-hover-w)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              style={{
                display: 'flex', alignItems: 'center', gap: 9,
                padding: '5px 14px', fontSize: 13, color: 'var(--t-tx-2)',
                cursor: 'pointer', background: 'transparent',
              }}
            >
              <span style={{ color: 'var(--t-tx-4)', display: 'flex' }}>{icon}</span>
              {label}
            </div>
          ))}

          {/* Admin Tools section */}
          <div style={{ background: 'var(--t-bg-section)', borderTop: '1px solid var(--t-border-3)', borderBottom: '1px solid var(--t-border-3)', marginTop: 3 }}>
            <div style={{ padding: '6px 14px 3px', fontSize: 10.5, fontWeight: 600, color: 'var(--t-tx-8)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Admin Tools
            </div>
            {[
              { label: 'Account Manager' },
              { label: 'Tenant Manager' },
              { label: 'Domain Manager' },
            ].map(({ label }) => (
              <div
                key={label}
                onMouseDown={e => { e.preventDefault(); setAccountMenuOpen(false) }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--t-bg-hover-w)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '5px 14px', fontSize: 13, color: 'var(--t-tx-2)',
                  cursor: 'pointer', background: 'transparent',
                }}
              >
                <span>{label}</span>
                <span style={{ display: 'flex', color: 'var(--t-tx-7)' }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  </svg>
                </span>
              </div>
            ))}
          </div>

          {/* Log out */}
          <div
            onMouseDown={e => { e.preventDefault(); setAccountMenuOpen(false) }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--t-bg-hover-w)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              padding: '5px 14px', fontSize: 13, color: 'var(--t-tx-2)',
              cursor: 'pointer', background: 'transparent',
            }}
          >
            <span style={{ color: 'var(--t-tx-4)', display: 'flex' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </span>
            Log out
          </div>
        </div>
      )}

      {/* Session overflow menu — fixed to escape sidebar overflow */}
      {openMenuId && menuPos && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed', top: menuPos.top, right: menuPos.right,
            zIndex: 1000,
            background: 'var(--t-bg)', border: '1px solid var(--t-border)', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: 160, overflow: 'hidden',
          }}
        >
          {deleteConfirmId === openMenuId ? (
            <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, color: '#222', fontWeight: 500, lineHeight: 1.4 }}>Delete this session?</div>
              <div style={{ fontSize: 12, color: '#888', lineHeight: 1.4 }}>This action cannot be undone.</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(null) }}
                  style={{ padding: '5px 12px', border: '1px solid #e0e0e0', borderRadius: 6, background: '#fff', fontSize: 12, color: '#555', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f5f5f5' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff' }}
                >Cancel</button>
                <button
                  onMouseDown={e => { e.preventDefault(); e.stopPropagation(); confirmDelete(openMenuId) }}
                  style={{ padding: '5px 12px', border: 'none', borderRadius: 6, background: '#d32f2f', fontSize: 12, color: '#fff', cursor: 'pointer', fontWeight: 500 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#b71c1c' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#d32f2f' }}
                >Delete</button>
              </div>
            </div>
          ) : (
            <>
              <div
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); const s = sessions.find(x => x.id === openMenuId); if (s) startRename(s) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', fontSize: 12, color: 'var(--t-tx-3)', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--t-bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Rename
              </div>
              <div
                onMouseDown={e => { e.preventDefault(); e.stopPropagation(); setDeleteConfirmId(openMenuId) }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', fontSize: 12, color: '#d32f2f', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fff5f5'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Delete
              </div>
            </>
          )}
        </div>
      )}
    </aside>
  )
}
