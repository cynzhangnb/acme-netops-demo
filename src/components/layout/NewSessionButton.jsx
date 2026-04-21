import { useState, useRef, useEffect } from 'react'

function ChevronDownSmall() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <polyline points="2,3.5 5,6.5 8,3.5" stroke="currentColor" strokeWidth="1.4"
        strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function SparkleSmall() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <path d="M5.5 1L6.4 4.1L9.5 5L6.4 5.9L5.5 9L4.6 5.9L1.5 5L4.6 4.1L5.5 1Z"
        stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  )
}

export default function NewSessionButton({ onNew, onNewWithTabs, hasTabs = false }) {
  const [showDropdown, setShowDropdown] = useState(false)
  const [chevronHovered, setChevronHovered] = useState(false)
  const [mainHovered, setMainHovered] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!showDropdown) return
    function close(e) {
      if (!dropdownRef.current?.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [showDropdown])

  const showChevron = hasTabs

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} ref={dropdownRef}>
      {/* Main button */}
      <button
        onClick={onNew}
        onMouseEnter={() => setMainHovered(true)}
        onMouseLeave={() => setMainHovered(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          height: 28,
          paddingLeft: 9,
          paddingRight: showChevron ? 6 : 9,
          border: 'none',
          borderRadius: showChevron ? '5px 0 0 5px' : 5,
          background: mainHovered ? '#f0f0f0' : 'transparent',
          color: mainHovered ? '#111' : '#444',
          fontSize: 12, fontWeight: 500, cursor: 'pointer',
          transition: 'background 0.1s, color 0.1s',
          borderRight: showChevron ? '1px solid #e0e0e0' : 'none',
        }}
        title="New blank session"
      >
        + New Session
      </button>

      {/* Chevron — only shown when free-floating tabs exist */}
      {showChevron && (
        <button
          onClick={() => setShowDropdown(v => !v)}
          onMouseEnter={() => setChevronHovered(true)}
          onMouseLeave={() => setChevronHovered(false)}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 22, height: 28,
            border: 'none', borderRadius: '0 5px 5px 0',
            background: chevronHovered || showDropdown ? '#f0f0f0' : 'transparent',
            color: chevronHovered || showDropdown ? '#111' : '#666',
            cursor: 'pointer',
            transition: 'background 0.1s, color 0.1s',
          }}
          title="More options"
        >
          <ChevronDownSmall />
        </button>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', right: 0,
          minWidth: 210, zIndex: 400,
          background: '#fff', border: '1px solid #e4e4e4',
          borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
          padding: 4, overflow: 'hidden',
        }}>
          <button
            onClick={() => { setShowDropdown(false); onNewWithTabs?.() }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '8px 12px', border: 'none', borderRadius: 5,
              background: 'transparent', color: '#222',
              fontSize: 12, textAlign: 'left', cursor: 'pointer',
            }}
          >
            <SparkleSmall />
            <span>New session with current tabs</span>
          </button>
        </div>
      )}
    </div>
  )
}
