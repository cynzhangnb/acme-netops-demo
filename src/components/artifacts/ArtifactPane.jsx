import { useState, useEffect, useRef, useCallback } from 'react'
import TopologyMap from './TopologyMap'
import TrafficChart from './TrafficChart'
import DeviceTable from './DeviceTable'
import VoicePath from './VoicePath'
import ChangeAnalysis from './ChangeAnalysis'
import ChangesMap from './ChangesMap'
import IOSVersionTable from './IOSVersionTable'
import QoSTable from './QoSTable'
import CRCTable from './CRCTable'
import ShareModal from '../modals/ShareModal'
import { getDeviceConfig } from '../../data/deviceConfigs'

function CloseIcon() {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function ShareIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="9" cy="2" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="2" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="9" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.1"/><line x1="3.5" y1="4.7" x2="7.5" y2="2.8" stroke="currentColor" strokeWidth="1.1"/><line x1="3.5" y1="6.3" x2="7.5" y2="8.2" stroke="currentColor" strokeWidth="1.1"/></svg>
}
function EnlargeIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
      <polyline points="1,4 1,1 4,1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="7,1 10,1 10,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="10,7 10,10 7,10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="4,10 1,10 1,7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function BackArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <polyline points="7,2 3,6.5 7,11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="3" y1="6.5" x2="11" y2="6.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

function SplitScreenIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="18" rx="2"/>
      <line x1="12" y1="3" x2="12" y2="21"/>
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.2"/>
      <line x1="8.6" y1="8.6" x2="11" y2="11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function ChevronUpIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <polyline points="2,6 5,3 8,6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
      <polyline points="2,4 5,7 8,4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildConfigPaneState(device) {
  return {
    mode: 'single',
    dock: 'right',
    leftDevice: device,
    rightDevice: null,
    pendingSelection: null,
    searchQuery: '',
    activeMatchIndex: 0,
    statusMessage: null,
    width: 420,
    height: 300,
  }
}

function ConfigCodeView({ title, subtitle, configText, query, allMatches, activeMatchIndex, paneKey, compact = false, onClosePane, closeLabel }) {
  const lineRefs = useRef({})
  const lines = configText.split('\n')

  useEffect(() => {
    const active = allMatches[activeMatchIndex]
    if (!active || active.pane !== paneKey) return
    const el = lineRefs.current[active.lineIndex]
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [allMatches, activeMatchIndex, paneKey])

  const activeLookup = new Set(
    allMatches
      .map((match, index) => ({ ...match, index }))
      .filter(match => match.pane === paneKey)
      .map(match => `${match.lineIndex}:${match.occurrenceIndex}:${match.index}`)
  )

  function renderLine(line, lineIndex) {
    if (!query) return line || ' '
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'ig')
    const parts = line.split(regex)
    let occurrenceIndex = -1
    return parts.map((part, index) => {
      if (!part) return <span key={index} />
      const isMatch = part.toLowerCase() === query.toLowerCase()
      if (!isMatch) return <span key={index}>{part}</span>
      occurrenceIndex += 1
      const globalIndex = allMatches.findIndex(match => match.pane === paneKey && match.lineIndex === lineIndex && match.occurrenceIndex === occurrenceIndex)
      const isActive = globalIndex === activeMatchIndex
      return (
        <mark
          key={index}
          style={{
            background: isActive ? '#fbbf24' : '#fef08a',
            color: '#1f1f1d',
            borderRadius: 3,
            padding: '0 1px',
          }}
        >
          {part}
        </mark>
      )
    })
  }

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        border: 'none',
        borderRadius: 0,
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      <div style={{ height: 32, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1efea', flexShrink: 0, background: '#fcfbf9' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#1f1f1d', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {subtitle ? `${title} ${subtitle}` : title}
          </div>
        </div>
        {onClosePane && (
          <button
            onClick={onClosePane}
            aria-label={closeLabel || `Close ${title} configuration`}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#98958f', width: 22, height: 22, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ea' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <CloseIcon />
          </button>
        )}
      </div>
      <div className="config-scroll-area" style={{ flex: 1, overflow: 'auto', background: '#fffdf9' }}>
        {lines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            ref={el => { lineRefs.current[lineIndex] = el }}
            style={{
              display: 'grid',
              gridTemplateColumns: '24px 1fr',
              gap: 6,
              padding: '0 8px 0 6px',
              minHeight: 24,
              alignItems: 'baseline',
                background: activeLookup.has(`${lineIndex}:0:${activeMatchIndex}`) ? '#fff7d6' : 'transparent',
            }}
          >
            <span style={{ fontSize: 11, color: '#a19d95', textAlign: 'right', userSelect: 'none', paddingTop: 3 }}>{lineIndex + 1}</span>
            <code style={{ fontSize: 11.5, lineHeight: 1.75, color: '#222', fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '2px 0' }}>
              {renderLine(line, lineIndex)}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}

function DockRightIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1.25" y="1.25" width="9.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1"/>
      <line x1="7.25" y1="1.5" x2="7.25" y2="10.5" stroke="currentColor" strokeWidth="1"/>
    </svg>
  )
}

function DockBottomIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1.25" y="1.25" width="9.5" height="9.5" rx="1.5" stroke="currentColor" strokeWidth="1"/>
      <line x1="1.5" y1="7.25" x2="10.5" y2="7.25" stroke="currentColor" strokeWidth="1"/>
    </svg>
  )
}

function ConfigWorkspacePane({ state, onClose, onEnterCompare, onSetDock, onSearchChange, onPrevMatch, onNextMatch, onCloseCompareSide }) {
  const leftText = state.leftDevice ? getDeviceConfig(state.leftDevice.label) : ''
  const rightText = state.rightDevice ? getDeviceConfig(state.rightDevice.label) : ''
  const searchNeedles = state.searchQuery.trim()
  const activePanes = state.mode === 'compare' ? ['left', 'right'] : ['left']
  const sourceByPane = { left: leftText, right: rightText }
  const allMatches = []

  if (searchNeedles) {
    activePanes.forEach(pane => {
      const lines = sourceByPane[pane].split('\n')
      lines.forEach((line, lineIndex) => {
        const regex = new RegExp(escapeRegExp(searchNeedles), 'ig')
        let match
        let occurrenceIndex = 0
        while ((match = regex.exec(line)) !== null) {
          allMatches.push({ pane, lineIndex, occurrenceIndex })
          occurrenceIndex += 1
        }
      })
    })
  }

  const safeActiveMatchIndex = allMatches.length ? Math.min(state.activeMatchIndex, allMatches.length - 1) : 0
  const isBottomDock = state.dock === 'bottom'
  const title = state.mode === 'compare'
    ? `Comparing ${state.leftDevice?.label || '—'} ↔ ${state.rightDevice?.label || '—'}`
    : 'Configuration'
  const subtitle = ''

  const shellStyle = isBottomDock
    ? { height: state.height, borderTop: '1px solid #e8e6e1', borderLeft: 'none', width: '100%' }
    : { width: state.width, borderLeft: 'none', borderTop: 'none', height: '100%' }

  return (
    <aside style={{ ...shellStyle, flexShrink: 0, background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .config-scroll-area::-webkit-scrollbar { width: 8px; height: 8px; }
        .config-scroll-area::-webkit-scrollbar-track { background: transparent; }
        .config-scroll-area::-webkit-scrollbar-thumb { background: #d7d2ca; border-radius: 999px; border: 2px solid transparent; background-clip: padding-box; }
        .config-scroll-area { scrollbar-width: thin; scrollbar-color: #d7d2ca transparent; }
      `}</style>
      <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #f1efea', flexShrink: 0 }}>
        {isBottomDock ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, minHeight: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flexShrink: 1 }}>
              <div style={{ minWidth: 110, flexShrink: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f1f1d', lineHeight: 1.2 }}>{title}</div>
              </div>
              <div style={{ position: 'relative', width: 'min(320px, 32vw)', minWidth: 180, flexShrink: 1 }}>
                <span style={{ position: 'absolute', left: 10, top: 8, color: '#8a8a84' }}><SearchIcon /></span>
                <input
                  value={state.searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder="Search configuration"
                  style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #dfdbd4', padding: '0 10px 0 28px', fontSize: 12, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: '#6f6c66', minWidth: 40, textAlign: 'right' }}>
                  {allMatches.length ? `${safeActiveMatchIndex + 1}/${allMatches.length}` : '0/0'}
                </span>
                <button onClick={onPrevMatch} disabled={!allMatches.length} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd8d1', background: '#fff', color: '#2f2d29', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: allMatches.length ? 'pointer' : 'default', opacity: allMatches.length ? 1 : 0.45 }}><ChevronUpIcon /></button>
                <button onClick={onNextMatch} disabled={!allMatches.length} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd8d1', background: '#fff', color: '#2f2d29', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: allMatches.length ? 'pointer' : 'default', opacity: allMatches.length ? 1 : 0.45 }}><ChevronDownIcon /></button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {state.mode === 'single' ? (
                <button
                  onClick={onEnterCompare}
                  style={{ height: 28, padding: '0 10px', borderRadius: 6, border: 'none', background: 'transparent', color: '#2f2d29', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ea' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  + Compare
                </button>
              ) : null}
              <button
                onClick={() => onSetDock('right')}
                aria-label="Dock configuration pane right"
                title="Dock right"
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#2f2d29', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ea' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <DockRightIcon />
              </button>
              <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9a9892', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ea' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <CloseIcon />
              </button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minHeight: 28 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1f1f1d', lineHeight: 1.2 }}>{title}</div>
                {subtitle && <div style={{ fontSize: 11, color: '#7b776f', marginTop: 4 }}>{subtitle}</div>}
                {state.statusMessage && <div style={{ fontSize: 11, color: '#9a3412', marginTop: 4 }}>{state.statusMessage}</div>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {state.mode === 'single' ? (
                  <button
                    onClick={onEnterCompare}
                    style={{ height: 28, padding: '0 10px', borderRadius: 6, border: 'none', background: 'transparent', color: '#2f2d29', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ea' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    + Compare
                  </button>
                ) : null}
                <button
                  onClick={() => onSetDock('bottom')}
                  aria-label="Dock configuration pane bottom"
                  title="Dock bottom"
                  style={{ width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', color: '#2f2d29', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ea' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <DockBottomIcon />
                </button>
                <button
                  onClick={onClose}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#9a9892', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f3f0ea' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'nowrap' }}>
              <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0 }}>
                <span style={{ position: 'absolute', left: 10, top: 8, color: '#8a8a84' }}><SearchIcon /></span>
                <input
                  value={state.searchQuery}
                  onChange={e => onSearchChange(e.target.value)}
                  placeholder="Search configuration"
                  style={{ width: '100%', height: 30, borderRadius: 6, border: '1px solid #dfdbd4', padding: '0 10px 0 28px', fontSize: 12, outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ fontSize: 11, color: '#6f6c66', minWidth: 40, textAlign: 'right' }}>
                  {allMatches.length ? `${safeActiveMatchIndex + 1}/${allMatches.length}` : '0/0'}
                </span>
                <button onClick={onPrevMatch} disabled={!allMatches.length} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd8d1', background: '#fff', color: '#2f2d29', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: allMatches.length ? 'pointer' : 'default', opacity: allMatches.length ? 1 : 0.45 }}><ChevronUpIcon /></button>
                <button onClick={onNextMatch} disabled={!allMatches.length} style={{ width: 28, height: 28, borderRadius: 6, border: '1px solid #ddd8d1', background: '#fff', color: '#2f2d29', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: allMatches.length ? 'pointer' : 'default', opacity: allMatches.length ? 1 : 0.45 }}><ChevronDownIcon /></button>
              </div>
            </div>
          </>
        )}
      </div>

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: state.mode === 'compare' ? 'row' : 'column',
          gap: 0,
          padding: 0,
        }}
      >
        <ConfigCodeView
          title={state.leftDevice?.label || '—'}
          subtitle={state.leftDevice?.ip || 'No device selected'}
          configText={leftText}
          query={state.searchQuery}
          allMatches={allMatches}
          activeMatchIndex={safeActiveMatchIndex}
          paneKey="left"
          compact={state.mode === 'single'}
          onClosePane={state.mode === 'compare' ? () => onCloseCompareSide('left') : null}
          closeLabel={state.leftDevice ? `Close ${state.leftDevice.label} configuration` : 'Close left configuration'}
        />
        {state.mode === 'compare' && (
          state.rightDevice ? (
            <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #ece9e3' }}>
              <ConfigCodeView
                title={state.rightDevice.label}
                subtitle={state.rightDevice.ip || 'No management IP'}
                configText={rightText}
                query={state.searchQuery}
                allMatches={allMatches}
                activeMatchIndex={safeActiveMatchIndex}
                paneKey="right"
                onClosePane={() => onCloseCompareSide('right')}
                closeLabel={state.rightDevice ? `Close ${state.rightDevice.label} configuration` : 'Close right configuration'}
              />
            </div>
          ) : (
            <div style={{ flex: 1, minWidth: 0, borderLeft: '1px solid #ece9e3', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fcfbf9', color: '#7b776f', fontSize: 12, padding: 24, textAlign: 'center' }}>
              Select another device to view configuration and compare.
            </div>
          )
        )}
      </div>
    </aside>
  )
}

function buildDeviceProperties(node) {
  if (!node) return null

  const roleMap = {
    'core-router': 'Core Router',
    'dist-switch': 'Distribution Switch',
    'access-switch': 'Access Switch',
    'edge-router': 'Edge Router',
    endpoint: 'Endpoint',
  }

  const healthMap = {
    up: 'Healthy',
    degraded: 'Degraded',
    down: 'Down',
  }

  return {
    node,
    title: node.label,
    subtitle: node.ip || 'No management IP',
    tabs: {
      overview: [
        { section: 'Identity', label: 'Hostname', value: node.label },
        { section: 'Identity', label: 'Mgmt IP', value: node.ip || '—' },
        { section: 'Identity', label: 'Mgmt Interface', value: node.type === 'endpoint' ? 'eth0' : node.type === 'core-router' ? 'GigabitEthernet0/0/0' : 'Ethernet0/3' },
        { section: 'Identity', label: 'Device Type', value: roleMap[node.type] === 'Core Router' ? 'Cisco Router' : roleMap[node.type] || 'Network Device' },
        { section: 'Identity', label: 'Table Status', value: node.status === 'down' ? '0' : node.status === 'degraded' ? '21' : '35' },
        { section: 'Identity', label: 'Vendor', value: 'Cisco' },
        { section: 'Identity', label: 'Model', value: node.type === 'core-router' ? 'ASR 1001-X' : node.type === 'dist-switch' ? 'C9500-24Y4C' : node.type === 'access-switch' ? 'C9300-48P' : 'IP Endpoint' },
        { section: 'Identity', label: 'Software Version', value: node.type === 'endpoint' ? '—' : node.type === 'core-router' ? '17.9.4a' : '17.3.6' },
        { section: 'Identity', label: 'Serial Number', value: node.type === 'endpoint' ? '—' : `69${node.label.length}3${(node.ip || '').replace(/\D/g, '').slice(0, 6) || '0604'}` },
        { section: 'Identity', label: 'Site', value: 'My Network\\NetBrain DC\\Boston' },
        { section: 'Identity', label: 'Geolocation', value: 'Boston, MA, US' },
        { section: 'Identity', label: 'Location', value: 'Boston' },
        { section: 'Identity', label: 'External Zone', value: node.type === 'edge-router' ? 'Internet Edge' : '—' },
        { section: 'Identity', label: 'Contact', value: 'Network Operations' },
        { section: 'System', label: 'System Memory Size', value: node.type === 'endpoint' ? '—' : node.type === 'core-router' ? '8839753088' : '4294967296' },
        { section: 'System', label: 'Operating System', value: node.type === 'endpoint' ? 'Embedded' : 'IOS' },
        { section: 'System', label: 'Asset Tag', value: node.type === 'endpoint' ? 'VOICE-ENDPOINT' : `BOS-${node.label}` },
        { section: 'System', label: 'Hierarchy Layer', value: node.type === 'core-router' ? 'Core' : node.type === 'dist-switch' ? 'Distribution' : node.type === 'access-switch' ? 'Access' : 'Endpoint' },
        { section: 'System', label: 'Description', value: node.badge || (node.type === 'endpoint' ? 'Voice endpoint' : 'Managed infrastructure node') },
        { section: 'System', label: 'sysObjectID', value: node.type === 'endpoint' ? '—' : '1.3.6.1.4.1.9.1.1' },
        { section: 'Health', label: 'Status', value: healthMap[node.status] || (node.badge ? 'Attention required' : 'Healthy') },
        { section: 'Health', label: 'CPU', value: node.status === 'degraded' ? '74%' : node.status === 'down' ? '—' : '31%' },
        { section: 'Health', label: 'Memory', value: node.status === 'degraded' ? '61%' : node.status === 'down' ? '—' : '44%' },
      ],
      interfaces: [
        { section: 'Interfaces', label: 'Active Interfaces', value: node.type === 'endpoint' ? '1' : node.type === 'core-router' ? '18' : '24' },
        { section: 'Interfaces', label: 'Neighbours', value: node.type === 'endpoint' ? '1 direct path' : 'Topology-connected' },
        { section: 'Interfaces', label: 'Primary Link', value: node.type === 'endpoint' ? 'Voice endpoint uplink' : 'Primary forwarding path' },
      ],
      alerts: [
        { section: 'Alerts', label: 'Open Alerts', value: node.badge ? '1' : node.status === 'down' ? '1' : '0' },
        { section: 'Alerts', label: 'Last Change', value: node.status === 'degraded' ? '2 hours ago' : 'No recent changes' },
        { section: 'Alerts', label: 'Health Signal', value: node.badge || (node.status === 'down' ? 'Connectivity loss' : 'Within baseline') },
      ],
    },
    width: 336,
  }
}

// Shared resize sash — vertical (col) or horizontal (row)
function ResizeSash({ onMouseDown, orientation = 'col' }) {
  const [hovered, setHovered] = useState(false)
  const isCol = orientation === 'col'
  const lineStyle = isCol
    ? { position: 'absolute', top: 0, bottom: 0, left: 1, width: 1, background: hovered ? '#4f86e8' : '#e4e4e4', transition: 'background 0.12s' }
    : { position: 'absolute', left: 0, right: 0, top: 1, height: 1, background: hovered ? '#4f86e8' : '#e4e4e4', transition: 'background 0.12s' }
  const pillStyle = isCol
    ? { position: 'absolute', width: 4, height: 32, borderRadius: 2, background: '#4f86e8', zIndex: 1 }
    : { position: 'absolute', height: 4, width: 32, borderRadius: 2, background: '#4f86e8', zIndex: 1 }
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flexShrink: 0,
        width: isCol ? 4 : '100%',
        height: isCol ? '100%' : 4,
        cursor: isCol ? 'col-resize' : 'row-resize',
        position: 'relative', zIndex: 10,
        background: 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div style={lineStyle} />
      {hovered && <div style={pillStyle} />}
    </div>
  )
}

function DevicePropertiesPane({ data, onClose, embedded = false }) {
  if (!data) return null
  const [activeTab, setActiveTab] = useState('overview')
  const rows = data.tabs[activeTab] || []
  let currentSection = null

  return (
    <aside style={{
      width: embedded ? '100%' : (data.width ?? 336),
      flexShrink: 0,
      height: '100%',
      background: '#fff',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {!embedded && (
      <div style={{
        height: 48,
        padding: '0 14px 0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #f1efea',
        flexShrink: 0,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#1f1f1d', lineHeight: 1.2 }}>{data.title}</div>
          <div style={{ fontSize: 11, color: '#8a8a84', marginTop: 2 }}>{data.subtitle}</div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9a9892', width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          onMouseEnter={e => e.currentTarget.style.background = '#f3f0ea'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <CloseIcon />
        </button>
      </div>
      )}

      <div style={{
        height: 32,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 16,
        padding: '0 16px',
        borderBottom: '1px solid #f1efea',
        flexShrink: 0,
      }}>
        {[
          { id: 'overview', label: 'Device' },
          { id: 'interfaces', label: 'Interfaces' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              height: 31,
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid #2563eb' : '2px solid transparent',
              background: 'transparent',
              color: activeTab === tab.id ? '#2563eb' : '#5f6368',
              fontSize: 11.5,
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer',
              padding: 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0 16px' }}>
        <div>
          {rows.map((row, index) => {
            const showSection = row.section !== currentSection
            currentSection = row.section
            return (
              <div key={`${row.section}-${row.label}`}>
                {showSection && (
                  <div style={{
                    padding: index === 0 ? '10px 16px 6px' : '18px 16px 6px',
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: '#6a665f',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}>
                    {row.section}
                  </div>
                )}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '120px 1fr',
                  gap: 12,
                  padding: '7px 16px',
                  borderBottom: '1px solid #efede8',
                  alignItems: 'center',
                }}>
                  <div style={{ fontSize: 11.5, color: '#4f4b45' }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: '#111111', textAlign: 'right', fontWeight: 400 }}>{row.value || '—'}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

export { DevicePropertiesPane, buildDeviceProperties, buildConfigPaneState, ConfigWorkspacePane }

export function buildUSBOSR1Properties() {
  return {
    title: 'US-BOS-R1',
    subtitle: '10.8.1.51',
    tabs: {
      overview: [
        { section: 'Identity', label: 'Hostname',         value: 'US-BOS-R1' },
        { section: 'Identity', label: 'Mgmt IP',          value: '10.8.1.51' },
        { section: 'Identity', label: 'Mgmt Interface',   value: 'GigabitEthernet0/0/0' },
        { section: 'Identity', label: 'Device Type',      value: 'Cisco Router' },
        { section: 'Identity', label: 'Vendor',           value: 'Cisco' },
        { section: 'Identity', label: 'Model',            value: 'CGS-MGS-AGS' },
        { section: 'Identity', label: 'Software Version', value: 'IOS 15.7(3)M2' },
        { section: 'Identity', label: 'Serial Number',    value: '69230604' },
        { section: 'Identity', label: 'Site',             value: 'My Network\\NetBrain DC\\Boston' },
        { section: 'Identity', label: 'Location',         value: 'Boston' },
        { section: 'System',   label: 'System Memory',    value: '883,975,308' },
        { section: 'System',   label: 'Operating System', value: 'IOS' },
        { section: 'System',   label: 'Last Discovery',   value: 'Apr 8, 2026' },
        { section: 'Health',   label: 'Status',           value: 'Healthy' },
        { section: 'Health',   label: 'BGP',              value: 'Enabled (5 neighbors)' },
        { section: 'Health',   label: 'SD-WAN',           value: 'Disabled' },
        { section: 'Health',   label: 'Cluster',          value: 'Disabled' },
      ],
      interfaces: [
        { section: 'Interfaces', label: 'Total',          value: '30' },
        { section: 'Interfaces', label: 'Types',          value: 'Ethernet, Loopback, Tunnel' },
        { section: 'Interfaces', label: 'Active',         value: '28' },
        { section: 'Interfaces', label: 'Down',           value: '2' },
        { section: 'Interfaces', label: 'Primary Link',   value: 'GigabitEthernet0/0/0' },
        { section: 'Interfaces', label: 'Neighbours',     value: '5 BGP peers' },
      ],
      alerts: [
        { section: 'Alerts', label: 'Open Alerts',  value: '0' },
        { section: 'Alerts', label: 'Last Change',  value: 'No recent changes' },
        { section: 'Alerts', label: 'Health Signal','value': 'Within baseline' },
      ],
    },
    width: 336,
  }
}

// Natural size for topology map scaling (matches full-canvas render)
const TOPO_NATURAL_W = 640
const TOPO_NATURAL_H = 500

// Canvas smart-snap (FigJam style)
const GRID = 16 // used only for initial placement
const WIDGET_GAP = 8 // spacing between widgets on initial placement
const SNAP_THRESHOLD = 6 // px proximity to trigger alignment snap

function snapToGrid(v) { return Math.round(v / GRID) * GRID }

function computeSnap(candidate, others) {
  const { x, y, w, h } = candidate
  const xPoints = [
    { val: x,       offset: 0   },
    { val: x + w/2, offset: w/2 },
    { val: x + w,   offset: w   },
  ]
  const yPoints = [
    { val: y,       offset: 0   },
    { val: y + h/2, offset: h/2 },
    { val: y + h,   offset: h   },
  ]
  let snapX = null, snapY = null, snapXPos = null, snapYPos = null
  let minDX = SNAP_THRESHOLD, minDY = SNAP_THRESHOLD

  for (const b of others) {
    for (const { val, offset } of xPoints) {
      for (const bv of [b.x, b.x + b.w / 2, b.x + b.w]) {
        const d = Math.abs(val - bv)
        if (d < minDX) { minDX = d; snapX = bv - offset; snapXPos = bv }
      }
    }
    for (const { val, offset } of yPoints) {
      for (const bv of [b.y, b.y + b.h / 2, b.y + b.h]) {
        const d = Math.abs(val - bv)
        if (d < minDY) { minDY = d; snapY = bv - offset; snapYPos = bv }
      }
    }
  }

  const guides = []
  if (snapX !== null) guides.push({ axis: 'x', pos: snapXPos })
  if (snapY !== null) guides.push({ axis: 'y', pos: snapYPos })
  return { snapX, snapY, guides }
}

/* ── Report artifact — renders a data table ──────────────────────────────── */
const REPORT_COLS = ['Hostname', 'IP Address', 'Device Type', 'Vendor', 'Model', 'OS Version', 'Serial No', 'Site', 'Group', 'Last Updated']
const REPORT_ROWS = [
  ['CR-BOS-01',  '10.1.1.1',   'Core Router',         'Cisco',    'ASR 1002-X',     'IOS XE 17.9.3',   'FXS2211Q1KD', 'Boston Core',  'Core',         'Apr 10, 2026'],
  ['CR-BOS-02',  '10.1.1.2',   'Core Router',         'Cisco',    'ASR 1002-X',     'IOS XE 17.9.3',   'FXS2211Q1KE', 'Boston Core',  'Core',         'Apr 10, 2026'],
  ['FW-BOS-01',  '10.0.1.1',   'Firewall',            'Cisco',    'ASA 5525-X',     'ASA 9.18(4)',      'FCH2210V0TL', 'Boston Core',  'Security',     'Apr 9, 2026'],
  ['FW-BOS-02',  '10.0.1.2',   'Firewall',            'Palo Alto','PA-3260',        'PAN-OS 11.1.2',    'PA3260-0042', 'Boston DMZ',   'Security',     'Apr 8, 2026'],
  ['DS-BOS-01',  '10.2.1.1',   'Distribution Switch', 'Cisco',    'Catalyst 9300',  'IOS XE 17.6.5',   'FOC2248Y1AB', 'Boston North', 'North',        'Apr 11, 2026'],
  ['DS-BOS-02',  '10.2.1.2',   'Distribution Switch', 'Cisco',    'Catalyst 9300',  'IOS XE 17.6.5',   'FOC2248Y1AC', 'Boston Core',  'Core',         'Apr 11, 2026'],
  ['DS-BOS-03',  '10.2.1.3',   'Distribution Switch', 'Cisco',    'Catalyst 9500',  'IOS XE 17.9.1',   'FOC2301X0BD', 'Boston South', 'South',        'Apr 9, 2026'],
  ['DS-BOS-04',  '10.2.1.4',   'Distribution Switch', 'Cisco',    'Catalyst 9500',  'IOS XE 17.9.1',   'FOC2301X0BE', 'Boston East',  'East',         'Apr 9, 2026'],
  ['AS-BOS-01',  '10.3.1.1',   'Access Switch',       'Cisco',    'Catalyst 2960-X','IOS 15.2(7)E6',   'FOC2209Z3LL', 'Boston North', 'North',        'Apr 6, 2026'],
  ['AS-BOS-02',  '10.3.1.2',   'Access Switch',       'Cisco',    'Catalyst 2960-X','IOS 15.2(7)E6',   'FOC2209Z3LM', 'Boston North', 'North',        'Apr 6, 2026'],
  ['AS-BOS-03',  '10.3.1.3',   'Access Switch',       'Cisco',    'Catalyst 9200',  'IOS XE 17.6.5',   'FOC2251W2MN', 'Boston Core',  'Core',         'Apr 10, 2026'],
  ['AS-BOS-04',  '10.3.1.4',   'Access Switch',       'Cisco',    'Catalyst 9200',  'IOS XE 17.6.5',   'FOC2251W2MP', 'Boston South', 'South',        'Apr 10, 2026'],
  ['AS-BOS-05',  '10.3.1.5',   'Access Switch',       'Cisco',    'Catalyst 2960-X','IOS 15.2(7)E6',   'FOC2209Z3QR', 'Boston East',  'East',         'Apr 7, 2026'],
  ['WLC-BOS-01', '10.4.1.1',   'Wireless Controller', 'Cisco',    'Catalyst 9800',  'IOS XE 17.12.1',  'FCW2318A0VX', 'Boston Core',  'Wireless',     'Apr 12, 2026'],
  ['AP-BOS-01',  '10.4.2.1',   'Access Point',        'Cisco',    'Catalyst 9130',  'AP 17.12.1.0',    'KWC2304B1TZ', 'Boston North', 'Wireless',     'Apr 12, 2026'],
  ['AP-BOS-02',  '10.4.2.2',   'Access Point',        'Cisco',    'Catalyst 9130',  'AP 17.12.1.0',    'KWC2304B1UA', 'Boston South', 'Wireless',     'Apr 12, 2026'],
  ['VPN-BOS-01', '10.0.2.1',   'VPN Concentrator',    'Cisco',    'ISR 4451',       'IOS XE 17.9.3',   'FGL2219P0RC', 'Boston Core',  'Security',     'Apr 8, 2026'],
  ['NMS-BOS-01', '10.5.1.1',   'Network Management',  'Dell',     'PowerEdge R750', 'Ubuntu 22.04 LTS', 'BNDV023',    'Boston Core',  'Management',   'Apr 3, 2026'],
]

function ReportArtifact({ label }) {
  const [query, setQuery] = useState('')
  const filtered = query.trim()
    ? REPORT_ROWS.filter(row => row.some(cell => cell.toLowerCase().includes(query.toLowerCase())))
    : REPORT_ROWS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{
        height: 44, flexShrink: 0, borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px',
      }}>
        <span style={{ fontSize: 12, color: '#555' }}>{filtered.length} devices</span>
        {/* Search bar */}
        <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 8, pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              paddingLeft: 28, paddingRight: 10, height: 28,
              border: '1px solid #e0e0e0', borderRadius: 6,
              fontSize: 12, color: '#222', background: '#fafafa',
              outline: 'none', width: 200,
            }}
            onFocus={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.background = '#fff' }}
            onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#fafafa' }}
          />
        </div>
      </div>
      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto' }} className="scrollbar-thin">
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 860 }}>
          <thead>
            <tr style={{ background: '#fafafa', position: 'sticky', top: 0, zIndex: 1 }}>
              {REPORT_COLS.map(col => (
                <th key={col} style={{
                  padding: '8px 12px', textAlign: 'left',
                  fontSize: 11, fontWeight: 600, color: '#666', letterSpacing: '0.02em',
                  borderBottom: '1px solid #e8e8e8', whiteSpace: 'nowrap',
                }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f2f2f2' }}
                onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {row.map((cell, j) => (
                  <td key={j} style={{
                    padding: '8px 12px', fontSize: 12.5,
                    color: j === 0 ? '#111' : '#333',
                    fontWeight: j === 0 ? 500 : 400,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{cell}</td>
                ))}
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={REPORT_COLS.length} style={{ padding: '24px 16px', textAlign: 'center', color: '#999', fontSize: 12 }}>
                  No devices match "{query}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const MAP_TOOLS = [
  { id: 'page',    label: 'Note',      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-5-6z"/><polyline points="14 3 14 9 20 9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></svg> },
  { id: 'table',   label: 'Table',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg> },
  { id: 'rect',    label: 'Rectangle', icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/></svg> },
  { id: 'ellipse', label: 'Ellipse',   icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="12" rx="9" ry="7"/></svg> },
  { id: 'line',    label: 'Line',      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="20" x2="20" y2="4"/></svg> },
  { id: 'arrow',   label: 'Arrow',     icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="19" x2="19" y2="5"/><polyline points="9 5 19 5 19 15"/></svg> },
  { id: 'text',    label: 'Text',      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="12" y1="7" x2="12" y2="20"/><line x1="8" y1="20" x2="16" y2="20"/></svg> },
  { id: 'link',    label: 'Link',      icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 8H8a4 4 0 0 0 0 8h2"/><path d="M14 8h2a4 4 0 0 1 0 8h-2"/><line x1="9" y1="12" x2="15" y2="12"/></svg> },
  { id: 'pen',     label: 'Pen',       icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4L8 19l-5 1 1-5L17 3z"/><line x1="15" y1="5" x2="19" y2="9"/></svg> },
]

function TopologyWithToolbar({ highlight, onTopologyNodeAction, onClearOverlay }) {
  const [activeTool, setActiveTool] = useState('select')
  const [saveState, setSaveState]   = useState('idle')
  function handleSave() { setSaveState('saved'); setTimeout(() => setSaveState('idle'), 1600) }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ height: 34, flexShrink: 0, display: 'flex', alignItems: 'center', padding: '0 12px', borderBottom: '1px solid #ebebeb', background: '#fff', gap: 1 }}>
        {MAP_TOOLS.map(tool => (
          <button key={tool.id} title={tool.label} onClick={() => setActiveTool(tool.id)}
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, border: 'none', borderRadius: 6, background: activeTool === tool.id ? '#e8e8e8' : 'transparent', color: activeTool === tool.id ? '#111' : '#2e2c28', cursor: 'pointer', transition: 'background 0.08s, color 0.08s', flexShrink: 0 }}
            onMouseEnter={e => { if (activeTool !== tool.id) { e.currentTarget.style.background = '#f2f2f2'; e.currentTarget.style.color = '#111' } }}
            onMouseLeave={e => { if (activeTool !== tool.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2e2c28' } }}
          >{tool.icon}</button>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={handleSave}
          style={{ background: 'none', border: 'none', padding: '0 2px', fontSize: 13, fontWeight: 500, cursor: 'pointer', color: saveState === 'saved' ? '#1a7a3f' : '#2e2c28', transition: 'color 0.15s' }}
          onMouseEnter={e => { if (saveState === 'idle') e.currentTarget.style.color = '#111' }}
          onMouseLeave={e => { if (saveState === 'idle') e.currentTarget.style.color = '#2e2c28' }}
        >{saveState === 'saved' ? 'Saved' : 'Save'}</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <TopologyMap highlight={highlight} widgetMode={false} onNodeAction={onTopologyNodeAction} onClearOverlay={onClearOverlay} />
      </div>
    </div>
  )
}

function ArtifactContent({ artifact, highlight, widgetMode, onTopologyNodeAction, onClearOverlay, changesMapOverlay, overlayCollapsedPref, onOverlayToggle }) {
  if (!artifact) return null

  if (artifact.type === 'topology' && widgetMode) {
    // In widget mode, scale the map proportionally to fit the widget
    return (
      <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
        <ScaledTopology highlight={highlight} onTopologyNodeAction={onTopologyNodeAction} />
      </div>
    )
  }

  switch (artifact.type) {
    case 'topology':      return <TopologyWithToolbar highlight={highlight} onTopologyNodeAction={onTopologyNodeAction} onClearOverlay={onClearOverlay} />
    case 'chart':         return <TrafficChart />
    case 'table':         return <DeviceTable />
    case 'voicePath':     return <VoicePath widgetMode={widgetMode} onNodeAction={onTopologyNodeAction} />
    case 'changeAnalysis': return <ChangeAnalysis key={artifact.id} filter={artifact.dataKey} />
    case 'changesMap':    return <ChangesMap filter={artifact.dataKey} externalOverlay={changesMapOverlay} widgetMode={widgetMode} onNodeAction={onTopologyNodeAction} overlayCollapsedPref={overlayCollapsedPref} onOverlayToggle={onOverlayToggle} />
    case 'iosVersionTable':    return <div style={{ overflow: 'auto', height: '100%' }}><IOSVersionTable filter={artifact.dataKey} flushed={true} /></div>
    case 'qosTable':           return <div style={{ overflow: 'auto', height: '100%' }}><QoSTable flushed={true} /></div>
    case 'crcTable':           return <div style={{ overflow: 'auto', height: '100%' }}><CRCTable flushed={true} /></div>
    case 'deviceProperties':   return <DevicePropertiesPane data={buildUSBOSR1Properties()} onClose={null} embedded={true} />
    case 'report':             return <ReportArtifact label={artifact.label} />
    case 'networkMap':         return <NetworkMapArtifact label={artifact.label} />
    default: return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 12 }}>
        Unknown artifact
      </div>
    )
  }
}

// Topology rendered at natural size, scaled down to fill the widget container
function ScaledTopology({ highlight, onTopologyNodeAction }) {
  const outerRef = useRef(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const update = () => {
      const s = Math.min(el.offsetWidth / TOPO_NATURAL_W, el.offsetHeight / TOPO_NATURAL_H)
      setScale(s)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return (
    <div ref={outerRef} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', background: '#fff' }}>
      <div style={{
        width: TOPO_NATURAL_W, height: TOPO_NATURAL_H,
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        position: 'absolute', top: 0, left: 0,
      }}>
        <TopologyMap highlight={highlight} widgetMode={true} onNodeAction={onTopologyNodeAction} />
      </div>
    </div>
  )
}

function ResizeHandle({ onMouseDown }) {
  return (
    <div
      onMouseDown={onMouseDown}
      style={{ position: 'absolute', bottom: 3, right: 3, width: 16, height: 16, cursor: 'nwse-resize', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', zIndex: 5 }}
    >
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
        <line x1="9" y1="1" x2="1" y2="9" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round"/>
        <line x1="9" y1="4.5" x2="4.5" y2="9" stroke="#ccc" strokeWidth="1.3" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

function CanvasWidget({ item, onDragStart, onResizeStart, highlight, isFocused, onFocus, isNew, onEnlarge, onDelete, onTopologyNodeAction, onClearOverlay, changesMapOverlay, overlayCollapsedPref, onOverlayToggle }) {
  return (
    <div
      onMouseDown={() => onFocus(item.id)}
      style={{
        position: 'absolute',
        left: item.x, top: item.y, width: item.w, height: item.h,
        background: '#fff',
        border: '1px solid #e2e2e2',
        borderRadius: 8,
        boxShadow: isFocused ? '0 4px 20px rgba(0,0,0,0.13)' : '0 1px 6px rgba(0,0,0,0.07)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        zIndex: isFocused ? 10 : 1,
        animation: isNew ? 'widgetEnter 0.32s cubic-bezier(0.2,0,0,1) both' : undefined,
        transition: 'box-shadow 0.12s',
      }}
    >
      {/* Title bar / drag handle */}
      <div
        onMouseDown={(e) => { e.stopPropagation(); onFocus(item.id); onDragStart(e, item.id) }}
        style={{
          height: 30, padding: '0 8px 0 10px',
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#fafafa', borderBottom: '1px solid #f0f0f0',
          cursor: 'grab', flexShrink: 0, userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 500, color: '#444', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.label}
        </span>
        {/* Enlarge button */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onEnlarge(item.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#bbb', padding: '2px 3px', display: 'flex', alignItems: 'center',
            borderRadius: 3, flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#555'}
          onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
          title="Focus view"
        >
          <EnlargeIcon />
        </button>
        {/* Delete button */}
        <button
          onMouseDown={e => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#bbb', padding: '2px 3px', display: 'flex', alignItems: 'center',
            borderRadius: 3, flexShrink: 0,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#e53e3e'}
          onMouseLeave={e => e.currentTarget.style.color = '#bbb'}
          title="Remove from canvas"
        >
          <CloseIcon />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ArtifactContent
          artifact={item}
          highlight={item.isMain ? highlight : null}
          widgetMode={true}
          onTopologyNodeAction={onTopologyNodeAction}
          onClearOverlay={item.isMain ? onClearOverlay : undefined}
          changesMapOverlay={changesMapOverlay}
          overlayCollapsedPref={overlayCollapsedPref}
          onOverlayToggle={onOverlayToggle}
        />
      </div>

      <ResizeHandle onMouseDown={(e) => { e.stopPropagation(); onResizeStart(e, item.id) }} />
    </div>
  )
}

/* ── Network Map artifact — renders the full topology map ────────────────── */
function NetworkMapArtifact({ label }) {
  return <TopologyWithToolbar />
}

/* ── Artifact type icons for tab labels ─────────────────────────────────── */
function ArtifactTabIcon({ type }) {
  const s = { width: 12, height: 12, style: { flexShrink: 0, display: 'block' } }
  if (type === 'topology' || type === 'changesMap' || type === 'networkMap') {
    return (
      <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
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
  if (type === 'chart' || type === 'trafficChart') {
    return (
      <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6"  y1="20" x2="6"  y2="14"/>
        <line x1="2"  y1="20" x2="22" y2="20"/>
      </svg>
    )
  }
  if (type === 'table' || type === 'qosTable' || type === 'crcTable' || type === 'iosTable') {
    return (
      <svg {...s} viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <line x1="3" y1="9"  x2="21" y2="9"/>
        <line x1="3" y1="15" x2="21" y2="15"/>
        <line x1="9" y1="9"  x2="9"  y2="21"/>
      </svg>
    )
  }
  if (type === 'changeAnalysis' || type === 'compare') {
    return (
      <svg {...s} viewBox="0 0 32 32" fill="currentColor">
        <path d="m24,21v2h1.7483c-2.2363,3.1196-5.8357,5-9.7483,5-6.6169,0-12-5.3833-12-12h-2c0,7.7197,6.2803,14,14,14,4.355,0,8.3743-2.001,11-5.3452v1.3452h2v-5h-5Z"/>
        <path d="m16,2c-4.355,0-8.3743,2.001-11,5.3452v-1.3452h-2v5h5v-2h-1.7483c2.2363-3.1196,5.8357-5,9.7483-5,6.6169,0,12,5.3833,12,12h2c0-7.7197-6.2803-14-14-14Z"/>
        <line x1="13" y1="11.5" x2="19" y2="11.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="13" y1="16"   x2="19" y2="16"   stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <line x1="13" y1="20.5" x2="19" y2="20.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }
  if (type === 'report') {
    return (
      <svg {...s} viewBox="0 0 32 32" fill="currentColor">
        <path d="M25.7,9.3l-7-7C18.5,2.1,18.3,2,18,2H8C6.9,2,6,2.9,6,4v24c0,1.1,0.9,2,2,2h16c1.1,0,2-0.9,2-2V10C26,9.7,25.9,9.5,25.7,9.3z M18,4.4l5.6,5.6H18V4.4z M24,28H8V4h8v6c0,1.1,0.9,2,2,2h6V28z"/>
        <rect x="10" y="22" width="12" height="2"/>
        <rect x="10" y="16" width="12" height="2"/>
      </svg>
    )
  }
  return null
}

export default function ArtifactPane({ artifacts, activeArtifactId, onSetActive, onRemove, topologyHighlight, onClearTopologyOverlay, changesMapOverlay, widgets = [], onTopologyNodeAction, headerRight = null }) {
  const active = artifacts.find(a => a.id === activeArtifactId)
  const [modal, setModal] = useState(null)
  const [propertiesPane, setPropertiesPane] = useState(null)
  const [configPane, setConfigPane] = useState(null)
  // Persists user's manual overlay collapsed preference across widget↔focus mode switches
  // null = no override (use mode default), true/false = user's explicit choice
  const [overlayUserPref, setOverlayUserPref] = useState(null)
  const canvasRef = useRef(null)
  const [canvasItems, setCanvasItems] = useState([])
  const [focusedId, setFocusedId] = useState(null)
  const [newItemIds, setNewItemIds] = useState(new Set())
  const [expandedItemId, setExpandedItemId] = useState(null) // widget in focus view
  const [snapGuides, setSnapGuides] = useState([])
  const canvasItemsRef = useRef([])
  const savedCanvasLayouts = useRef({}) // persists widget layouts per artifact across tab switches
  const prevArtifactIdRef = useRef(null)
  const dragState = useRef(null)
  const resizeState = useRef(null)
  const configResizeState = useRef(null)
  const propsResizeState = useRef(null)
  const [splitMode, setSplitMode] = useState(false)
  const [rightArtifactIds, setRightArtifactIds] = useState([])
  const [activeRightId, setActiveRightId] = useState(null)
  const [splitDragOver, setSplitDragOver] = useState(null) // 'left' | 'right' | 'right-content' | null
  const [lastActivePane, setLastActivePane] = useState('left') // 'left' | 'right'
  const [splitLeftWidth, setSplitLeftWidth] = useState(null) // null = 50/50, else px
  const splitContainerRef = useRef(null)
  const splitResizeState = useRef(null)
  const dragTabId = useRef(null)
  // Tab reorder state
  const [tabOrder, setTabOrder] = useState(() => artifacts.map(a => a.id))
  const [reorderOverId, setReorderOverId] = useState(null)
  const [reorderSide, setReorderSide] = useState(null) // 'before' | 'after'
  const prevArtifactIdsRef = useRef(new Set())

  useEffect(() => { canvasItemsRef.current = canvasItems }, [canvasItems])

  useEffect(() => {
    setPropertiesPane(null)
    setConfigPane(null)
  }, [activeArtifactId])

  // Save/restore canvas layout when switching artifact tabs
  useEffect(() => {
    const prevId = prevArtifactIdRef.current

    // Save the outgoing artifact's layout (canvasItemsRef is up-to-date from the effect above)
    if (prevId) {
      savedCanvasLayouts.current[prevId] = canvasItemsRef.current
    }
    prevArtifactIdRef.current = activeArtifactId

    // Restore a previously saved layout for this artifact (e.g. switching back to a widget tab)
    const saved = savedCanvasLayouts.current[activeArtifactId]
    if (saved?.length > 0) {
      setCanvasItems(saved)
      setExpandedItemId(null)
      return
    }

    // First visit — fresh initialization
    if (!active) { setCanvasItems([]); return }
    const init = () => {
      const el = canvasRef.current
      if (!el) return
      const cw = el.offsetWidth || 600
      const ch = el.offsetHeight || 500
      const item = {
        id: `${active.id}__main`,
        type: active.type,
        label: active.label,
        dataKey: active.dataKey,
        isMain: true,
        x: 0, y: 0, w: cw, h: ch,
      }
      setCanvasItems([item])
      setNewItemIds(new Set())
      setExpandedItemId(null)
      setFocusedId(item.id)
    }
    const t = setTimeout(init, 0)
    return () => clearTimeout(t)
  }, [activeArtifactId]) // eslint-disable-line

  // Add new widgets — map goes full-width, new artifact below
  useEffect(() => {
    if (!widgets.length) return
    const el = canvasRef.current
    if (!el) return
    const cw = el.offsetWidth || 600
    const ch = el.offsetHeight || 500

    setCanvasItems(prev => {
      const next = [...prev]
      const existingWidgets = next.filter(i => !i.isMain)
      const isFirstWidget = existingWidgets.length === 0
      const addedIds = []

      for (const w of widgets) {
        const key = `${w.type}::${w.label}`
        if (next.some(i => `${i.type}::${i.label}` === key)) continue

        if (isFirstWidget) {
          // Shrink main to full-width top row
          const mainIdx = next.findIndex(i => i.isMain)
          if (mainIdx >= 0) {
            const mainH = Math.max(200, Math.round(ch * 0.50))
            next[mainIdx] = { ...next[mainIdx], x: 16, y: 16, w: cw - 32, h: mainH }
          }
        }

        // Place below the main artifact
        const mainItem = next.find(i => i.isMain)
        const belowY = mainItem ? mainItem.y + mainItem.h + 16 : 16

        // Secondary widgets: 50% width, placed side by side below main
        const rowWidgets = next.filter(i => !i.isMain)
        const widgetW = snapToGrid(Math.max(220, Math.round((cw - 48) / 2)))
        const widgetH = snapToGrid(Math.max(180, Math.round(ch * 0.40)))

        // Place this new widget after existing ones in the row
        const rowX = snapToGrid(GRID + rowWidgets.length * (widgetW + WIDGET_GAP))

        const newItem = {
          id: `widget-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          type: w.type,
          label: w.label,
          isMain: false,
          x: rowX, y: belowY, w: widgetW, h: widgetH,
        }
        next.push(newItem)
        addedIds.push(newItem.id)
        setFocusedId(newItem.id)
      }

      if (addedIds.length) {
        setNewItemIds(prev => { const s = new Set(prev); addedIds.forEach(id => s.add(id)); return s })
        setTimeout(() => {
          setNewItemIds(prev => { const s = new Set(prev); addedIds.forEach(id => s.delete(id)); return s })
        }, 500)
      }

      return next
    })
  }, [widgets]) // eslint-disable-line

  // Keep tabOrder in sync as artifacts are added / removed
  useEffect(() => {
    setTabOrder(prev => {
      const existingIds = new Set(artifacts.map(a => a.id))
      const newIds = artifacts.map(a => a.id).filter(id => !prev.includes(id))
      return [...prev.filter(id => existingIds.has(id)), ...newIds]
    })
  }, [artifacts])

  // Artifacts sorted by user's drag order
  const orderedArtifacts = tabOrder.map(id => artifacts.find(a => a.id === id)).filter(Boolean)

  const handleDragStart = useCallback((e, id) => {
    e.preventDefault()
    const item = canvasItemsRef.current.find(i => i.id === id)
    if (!item) return
    dragState.current = { id, startX: e.clientX, startY: e.clientY, origX: item.x, origY: item.y }
    document.body.style.cursor = 'grabbing'
  }, [])

  const handleResizeStart = useCallback((e, id) => {
    e.preventDefault()
    const item = canvasItemsRef.current.find(i => i.id === id)
    if (!item) return
    resizeState.current = { id, startX: e.clientX, startY: e.clientY, origW: item.w, origH: item.h }
    document.body.style.cursor = 'nwse-resize'
  }, [])

  useEffect(() => {
    function onMouseMove(e) {
      if (e.buttons === 0) {
        dragState.current = null
        resizeState.current = null
        configResizeState.current = null
        document.body.style.cursor = ''
        setSnapGuides([])
        return
      }
      if (dragState.current) {
        const { id, startX, startY, origX, origY } = dragState.current
        const rawX = Math.max(0, origX + (e.clientX - startX))
        const rawY = Math.max(0, origY + (e.clientY - startY))
        const items = canvasItemsRef.current
        const item = items.find(i => i.id === id)
        if (item) {
          const others = items.filter(i => i.id !== id)
          const { snapX, snapY, guides } = computeSnap({ ...item, x: rawX, y: rawY }, others)
          setSnapGuides(guides)
          setCanvasItems(prev => prev.map(i => i.id === id ? { ...i, x: snapX ?? rawX, y: snapY ?? rawY } : i))
        }
      }
      if (resizeState.current) {
        const { id, startX, startY, origW, origH } = resizeState.current
        const newW = Math.max(200, origW + (e.clientX - startX))
        const newH = Math.max(140, origH + (e.clientY - startY))
        setCanvasItems(prev => prev.map(i => i.id === id ? { ...i, w: newW, h: newH } : i))
      }
      if (configResizeState.current) {
        const { dock, startX, startY, startWidth, startHeight } = configResizeState.current
        if (dock === 'right') {
          const delta = startX - e.clientX
          const width = Math.max(320, Math.min(920, startWidth + delta))
          setConfigPane(prev => prev ? { ...prev, width } : prev)
        } else {
          const delta = startY - e.clientY
          const height = Math.max(220, Math.min(640, startHeight + delta))
          setConfigPane(prev => prev ? { ...prev, height } : prev)
        }
      }
      if (propsResizeState.current) {
        const { startX, startWidth } = propsResizeState.current
        const width = Math.max(240, Math.min(600, startWidth + (startX - e.clientX)))
        setPropertiesPane(prev => prev ? { ...prev, width } : prev)
      }
      if (splitResizeState.current) {
        const { startX, startWidth, containerWidth } = splitResizeState.current
        const newW = Math.max(180, Math.min(containerWidth - 180, startWidth + (e.clientX - startX)))
        setSplitLeftWidth(newW)
      }
    }
    function onMouseUp() {
      dragState.current = null
      resizeState.current = null
      configResizeState.current = null
      propsResizeState.current = null
      splitResizeState.current = null
      document.body.style.cursor = ''
      setSnapGuides([])
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => { document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', onMouseUp) }
  }, [])

  const isFocusMode = canvasItems.length === 1
  const expandedItem = expandedItemId ? canvasItems.find(i => i.id === expandedItemId) : null

  function updateConfigPaneFromNode(node, sourceAction = 'view-config') {
    if (!node) return

    setConfigPane(prev => {
      if (!prev) return buildConfigPaneState(node)

      if (prev.mode === 'single') {
        return {
          ...prev,
          leftDevice: node,
          statusMessage: sourceAction === 'select-node' ? 'Configuration updated from map selection.' : null,
          activeMatchIndex: 0,
        }
      }

      if (prev.pendingSelection === 'second') {
        return {
          ...prev,
          rightDevice: node,
          pendingSelection: null,
          statusMessage: null,
          activeMatchIndex: 0,
        }
      }

      if (!prev.rightDevice) {
        return {
          ...prev,
          rightDevice: node,
          pendingSelection: null,
          statusMessage: null,
          activeMatchIndex: 0,
        }
      }

      return {
        ...prev,
        statusMessage: 'Close one configuration to compare a different device.',
      }
    })
  }

  function handleNodeAction(action) {
    if (action?.actionId === 'select-node') {
      if (propertiesPane) setPropertiesPane(buildDeviceProperties(action.node))
      if (configPane?.mode === 'single') updateConfigPaneFromNode(action.node, 'select-node')
      return
    }
    if (action?.actionId === 'view-properties') {
      setConfigPane(null)
      setPropertiesPane(buildDeviceProperties(action.node))
      return
    }
    if (action?.actionId === 'view-config') {
      setPropertiesPane(null)
      updateConfigPaneFromNode(action.node, 'view-config')
      return
    }
    onTopologyNodeAction?.(action)
  }

  function handlePropertiesResizeStart(e) {
    if (!propertiesPane) return
    e.preventDefault()
    e.stopPropagation()
    propsResizeState.current = { startX: e.clientX, startWidth: propertiesPane.width ?? 336 }
    document.body.style.cursor = 'col-resize'
  }

  function handleConfigResizeStart(e) {
    if (!configPane) return
    e.preventDefault()
    e.stopPropagation()
    configResizeState.current = {
      dock: configPane.dock,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: configPane.width,
      startHeight: configPane.height,
    }
    document.body.style.cursor = configPane.dock === 'right' ? 'col-resize' : 'row-resize'
  }

  function handleCloseCompareSide(side) {
    setConfigPane(prev => {
      if (!prev) return prev
      if (prev.mode !== 'compare') return prev

      const remainingDevice = side === 'left' ? prev.rightDevice : prev.leftDevice
      if (!remainingDevice) return null

      return {
        ...prev,
        mode: 'single',
        leftDevice: remainingDevice,
        rightDevice: null,
        pendingSelection: null,
        activeMatchIndex: 0,
        statusMessage: null,
      }
    })
  }

  // Route newly opened tabs to the last active pane in split mode
  useEffect(() => {
    const currentIds = new Set(artifacts.map(a => a.id))
    if (splitMode && lastActivePane === 'right') {
      const newIds = artifacts.map(a => a.id).filter(id => !prevArtifactIdsRef.current.has(id))
      if (newIds.length > 0) {
        setRightArtifactIds(prev => [...prev, ...newIds.filter(id => !prev.includes(id))])
        setActiveRightId(newIds[newIds.length - 1])
      }
    }
    prevArtifactIdsRef.current = currentIds
  }, [artifacts]) // eslint-disable-line

  // Split screen computed values
  const leftArtifacts = splitMode ? orderedArtifacts.filter(a => !rightArtifactIds.includes(a.id)) : orderedArtifacts
  const rightArtifacts = splitMode ? orderedArtifacts.filter(a => rightArtifactIds.includes(a.id)) : []
  const activeLeft = leftArtifacts.find(a => a.id === activeArtifactId) ?? leftArtifacts[0] ?? null
  const activeRight = rightArtifacts.find(a => a.id === activeRightId) ?? rightArtifacts[0] ?? null

  function enterSplitMode() {
    setSplitMode(true)
    setRightArtifactIds([])
    setActiveRightId(null)
  }

  function exitSplitMode() {
    setSplitMode(false)
    setRightArtifactIds([])
    setActiveRightId(null)
    setSplitLeftWidth(null)
  }

  function moveTabToRight(tabId) {
    if (rightArtifactIds.includes(tabId)) return
    setRightArtifactIds(prev => [...prev, tabId])
    setActiveRightId(tabId)
    setLastActivePane('right')
    if (tabId === activeArtifactId) {
      const remaining = artifacts.filter(a => !rightArtifactIds.includes(a.id) && a.id !== tabId)
      if (remaining.length > 0) onSetActive(remaining[0].id)
    }
  }

  function moveTabToLeft(tabId) {
    setRightArtifactIds(prev => prev.filter(id => id !== tabId))
    onSetActive(tabId)
    setLastActivePane('left')
    if (tabId === activeRightId) {
      const remaining = rightArtifactIds.filter(id => id !== tabId)
      setActiveRightId(remaining.length > 0 ? remaining[0] : null)
    }
  }

  function removeFromRight(tabId) {
    const remaining = rightArtifactIds.filter(id => id !== tabId)
    setRightArtifactIds(remaining)
    if (remaining.length === 0) exitSplitMode()
    if (tabId === activeRightId) setActiveRightId(remaining.length > 0 ? remaining[0] : null)
    onRemove(tabId)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: isFocusMode ? '#fff' : '#f0f0f0' }}>
      {/* Header tabs — normal mode only; split mode has per-column tab bars below */}
      {splitMode ? (
        /* ── Split mode: two full-height columns, each owns its tab bar + content ── */
        <div ref={splitContainerRef} style={{ flex: 1, display: 'flex', minHeight: 0 }}>
          {/* Left column */}
          <div style={{ width: splitLeftWidth ?? '50%', flexShrink: 0, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {/* Left tab bar */}
            <div
              style={{ height: 40, background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 2, flexShrink: 0, overflow: 'hidden' }}
              onDragOver={e => { e.preventDefault(); setSplitDragOver('left') }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setSplitDragOver(null) }}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('tabId'); if (rightArtifactIds.includes(id)) moveTabToLeft(id); setSplitDragOver(null) }}
            >
              {/* Tabs — clip so they never bleed past the sash */}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 2 }}>
                {leftArtifacts.map(artifact => {
                  const isVisible = artifact.id === activeArtifactId
                  const isGlobal = isVisible && lastActivePane === 'left'
                  const bg = isGlobal ? '#f0f0f0' : isVisible ? '#f7f7f7' : 'transparent'
                  const col = isGlobal ? '#111' : isVisible ? '#555' : '#767676'
                  return (
                    <div key={artifact.id} draggable
                      onDragStart={e => { e.dataTransfer.setData('tabId', artifact.id); dragTabId.current = artifact.id }}
                      onClick={() => { onSetActive(artifact.id); setLastActivePane('left') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 6px 0 10px', height: 28, borderRadius: 6, background: bg, cursor: 'pointer', userSelect: 'none', flexShrink: 0, whiteSpace: 'nowrap', fontSize: 12, fontWeight: isGlobal ? 500 : 400, color: col, transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (!isVisible) e.currentTarget.style.background = '#f8f8f8' }}
                      onMouseLeave={e => { if (!isVisible) e.currentTarget.style.background = bg }}
                    >
                      <ArtifactTabIcon type={artifact.type} />
                      {artifact.label}
                      <button onClick={e => { e.stopPropagation(); onRemove(artifact.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: '2px 3px', display: 'flex', alignItems: 'center', borderRadius: 4, lineHeight: 1 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.color = '#555' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#bbb' }}
                      ><CloseIcon /></button>
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Left content */}
            <div
              style={{ flex: 1, position: 'relative', overflow: 'hidden', background: activeLeft ? '#fff' : '#fafafa' }}
              onDragOver={e => { e.preventDefault(); setSplitDragOver('left-content') }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setSplitDragOver(null) }}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('tabId'); if (rightArtifactIds.includes(id)) moveTabToLeft(id); setSplitDragOver(null) }}
              onClick={() => setLastActivePane('left')}
            >
              {activeLeft ? (
                <ArtifactContent artifact={{ id: `${activeLeft.id}__main`, type: activeLeft.type, label: activeLeft.label, dataKey: activeLeft.dataKey, isMain: true, x: 0, y: 0, w: 800, h: 600 }} highlight={topologyHighlight} widgetMode={false} onTopologyNodeAction={handleNodeAction} onClearOverlay={onClearTopologyOverlay} changesMapOverlay={changesMapOverlay} overlayCollapsedPref={overlayUserPref} onOverlayToggle={setOverlayUserPref} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', userSelect: 'none' }}>
                  <div style={{ fontSize: 13, color: '#aaa' }}>Move a tab to view side by side</div>
                </div>
              )}
            </div>
          </div>

          {/* Resize sash — 1px visible line, wider invisible hit area via absolute overlay */}
          <div
            style={{ flexShrink: 0, width: 1, background: '#e8e8e8', position: 'relative', zIndex: 10, transition: 'background 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#c8c8c8' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#e8e8e8' }}
            onMouseDown={e => {
              e.preventDefault()
              document.body.style.cursor = 'col-resize'
              splitResizeState.current = {
                startX: e.clientX,
                startWidth: splitContainerRef.current
                  ? (splitLeftWidth ?? splitContainerRef.current.offsetWidth / 2)
                  : splitLeftWidth ?? 400,
                containerWidth: splitContainerRef.current?.offsetWidth ?? 800,
              }
            }}
          >
            {/* Wider invisible hit area centred on the line */}
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: -4, right: -4, cursor: 'col-resize', zIndex: 11 }}
              onMouseEnter={e => { e.currentTarget.parentElement.style.background = '#c8c8c8' }}
              onMouseLeave={e => { e.currentTarget.parentElement.style.background = '#e8e8e8' }}
              onMouseDown={e => {
                e.preventDefault()
                document.body.style.cursor = 'col-resize'
                splitResizeState.current = {
                  startX: e.clientX,
                  startWidth: splitContainerRef.current
                    ? (splitLeftWidth ?? splitContainerRef.current.offsetWidth / 2)
                    : splitLeftWidth ?? 400,
                  containerWidth: splitContainerRef.current?.offsetWidth ?? 800,
                }
              }}
            />
          </div>

          {/* Right column */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Right tab bar + split icon */}
            <div
              style={{ height: 40, background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 2, flexShrink: 0, overflow: 'hidden' }}
              onDragOver={e => { e.preventDefault(); setSplitDragOver('right') }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setSplitDragOver(null) }}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('tabId'); if (!rightArtifactIds.includes(id)) moveTabToRight(id); setSplitDragOver(null) }}
            >
              {/* Tabs — clip here so they never bleed past the sash */}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 2 }}>
                {rightArtifacts.map(artifact => {
                  const isVisible = artifact.id === activeRightId
                  const isGlobal = isVisible && lastActivePane === 'right'
                  const bg = isGlobal ? '#f0f0f0' : isVisible ? '#f7f7f7' : 'transparent'
                  const col = isGlobal ? '#111' : isVisible ? '#555' : '#767676'
                  return (
                    <div key={artifact.id} draggable
                      onDragStart={e => { e.dataTransfer.setData('tabId', artifact.id); dragTabId.current = artifact.id }}
                      onClick={() => { setActiveRightId(artifact.id); setLastActivePane('right') }}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 6px 0 10px', height: 28, borderRadius: 6, background: bg, cursor: 'pointer', userSelect: 'none', flexShrink: 0, whiteSpace: 'nowrap', fontSize: 12, fontWeight: isGlobal ? 500 : 400, color: col, transition: 'background 0.1s' }}
                      onMouseEnter={e => { if (!isVisible) e.currentTarget.style.background = '#f8f8f8' }}
                      onMouseLeave={e => { if (!isVisible) e.currentTarget.style.background = bg }}
                    >
                      <ArtifactTabIcon type={artifact.type} />
                      {artifact.label}
                      <button onClick={e => { e.stopPropagation(); removeFromRight(artifact.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: '2px 3px', display: 'flex', alignItems: 'center', borderRadius: 4, lineHeight: 1 }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.color = '#555' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#bbb' }}
                      ><CloseIcon /></button>
                    </div>
                  )
                })}
              </div>
              {/* Split icon — always visible at far right, outside the overflow clip */}
              <button onClick={exitSplitMode} title="Exit split view"
                style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 5, cursor: 'pointer', background: '#f0f0f0', color: '#111', flexShrink: 0 }}
              >
                <SplitScreenIcon />
              </button>
            </div>
            {/* Right content */}
            <div
              style={{ flex: 1, position: 'relative', overflow: 'hidden', background: activeRight ? '#fff' : '#fafafa' }}
              onDragOver={e => { e.preventDefault(); setSplitDragOver('right-content') }}
              onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget)) setSplitDragOver(null) }}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('tabId'); moveTabToRight(id); setSplitDragOver(null) }}
              onClick={() => setLastActivePane('right')}
            >
              {activeRight ? (
                <ArtifactContent artifact={{ id: `${activeRight.id}__main`, type: activeRight.type, label: activeRight.label, dataKey: activeRight.dataKey, isMain: true, x: 0, y: 0, w: 800, h: 600 }} highlight={topologyHighlight} widgetMode={false} onTopologyNodeAction={handleNodeAction} onClearOverlay={onClearTopologyOverlay} changesMapOverlay={changesMapOverlay} overlayCollapsedPref={overlayUserPref} onOverlayToggle={setOverlayUserPref} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', userSelect: 'none' }}>
                  <div style={{ fontSize: 13, color: '#aaa' }}>Move a tab to view side by side</div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <>
        {/* Normal mode tab bar */}
        <div
          style={{ height: 40, background: '#fff', borderBottom: '1px solid #e8e8e8', display: 'flex', alignItems: 'center', padding: '0 8px', gap: 2, flexShrink: 0 }}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            // Drop onto empty space at end of tab bar → move tab to last position
            const id = e.dataTransfer.getData('tabId')
            if (id) setTabOrder(prev => [...prev.filter(x => x !== id), id])
            setReorderOverId(null); setReorderSide(null)
          }}
        >
          {orderedArtifacts.map(artifact => {
            const isActive = artifact.id === activeArtifactId
            const showBefore = reorderOverId === artifact.id && reorderSide === 'before'
            const showAfter  = reorderOverId === artifact.id && reorderSide === 'after'
            return (
              <div key={artifact.id} draggable
                onDragStart={e => { e.dataTransfer.setData('tabId', artifact.id); dragTabId.current = artifact.id }}
                onDragOver={e => {
                  e.preventDefault(); e.stopPropagation()
                  const rect = e.currentTarget.getBoundingClientRect()
                  setReorderOverId(artifact.id)
                  setReorderSide(e.clientX < rect.left + rect.width / 2 ? 'before' : 'after')
                }}
                onDragLeave={() => { setReorderOverId(null); setReorderSide(null) }}
                onDrop={e => {
                  e.preventDefault(); e.stopPropagation()
                  const draggedId = e.dataTransfer.getData('tabId')
                  if (draggedId && draggedId !== artifact.id) {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const side = e.clientX < rect.left + rect.width / 2 ? 'before' : 'after'
                    setTabOrder(prev => {
                      const without = prev.filter(id => id !== draggedId)
                      const idx = without.indexOf(artifact.id)
                      if (idx === -1) return prev
                      const next = [...without]
                      next.splice(side === 'after' ? idx + 1 : idx, 0, draggedId)
                      return next
                    })
                  }
                  setReorderOverId(null); setReorderSide(null)
                }}
                onClick={() => onSetActive(artifact.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '0 6px 0 10px', height: 28, borderRadius: 6,
                  background: isActive ? '#f0f0f0' : 'transparent',
                  cursor: 'grab', userSelect: 'none', flexShrink: 0, whiteSpace: 'nowrap',
                  fontSize: 12, fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#111' : '#767676', transition: 'background 0.1s',
                  boxShadow: showBefore ? 'inset 2px 0 0 0 #1a73e8' : showAfter ? 'inset -2px 0 0 0 #1a73e8' : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <ArtifactTabIcon type={artifact.type} />
                {artifact.label}
                <button onClick={e => { e.stopPropagation(); onRemove(artifact.id) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: '2px 3px', display: 'flex', alignItems: 'center', borderRadius: 4, lineHeight: 1 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#e0e0e0'; e.currentTarget.style.color = '#555' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#bbb' }}
                ><CloseIcon /></button>
              </div>
            )
          })}
          {artifacts.length === 0 && <span style={{ fontSize: 12, color: '#bbb', paddingLeft: 4 }}>No artifacts</span>}
          {/* Spacer pushes right-side controls to the end */}
          <div style={{ flex: 1 }} />
          {/* Split view — only when 2+ tabs are open */}
          {artifacts.length >= 2 && (
            <button onClick={enterSplitMode} title="Split view"
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', borderRadius: 5, cursor: 'pointer', background: 'transparent', color: '#2e2c28', flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#111' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2e2c28' }}
            >
              <SplitScreenIcon />
            </button>
          )}
          {/* Injected right controls (e.g. Share + AI toggle when free-floating) */}
          {headerRight}
        </div>
        {/* Normal mode content */}
        {(
        /* ── Normal mode: original content area ── */
        <div
          style={{
            flex: 1,
            display: 'flex',
            minHeight: 0,
            flexDirection: configPane?.dock === 'bottom' ? 'column' : 'row',
          }}
        >
        <div ref={canvasRef} style={{ flex: 1, position: 'relative', overflow: (isFocusMode || expandedItem) ? 'hidden' : 'auto' }}>
          {/* Expanded widget focus view */}
          {expandedItem ? (
            <div style={{ position: 'absolute', inset: 0, background: '#fff', zIndex: 20, display: 'flex', flexDirection: 'column' }}>
              {/* Mini toolbar */}
              <div style={{ height: 36, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8, borderBottom: '1px solid #f0f0f0', flexShrink: 0 }}>
                <button
                  onClick={() => setExpandedItemId(null)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: '#555', fontSize: 11, fontWeight: 500, padding: '2px 6px', borderRadius: 4 }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f0f0f0'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <BackArrowIcon /> Back to canvas
                </button>
              </div>
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <ArtifactContent artifact={expandedItem} highlight={expandedItem.isMain ? topologyHighlight : null} widgetMode={false} onTopologyNodeAction={handleNodeAction} onClearOverlay={expandedItem.isMain ? onClearTopologyOverlay : undefined} changesMapOverlay={changesMapOverlay} overlayCollapsedPref={overlayUserPref} onOverlayToggle={setOverlayUserPref} />
              </div>
            </div>
          ) : isFocusMode ? (
            /* Focus mode: single artifact fills the pane, no widget chrome */
            canvasItems.length === 1 ? (
              <div style={{ position: 'absolute', inset: 0 }}>
                <ArtifactContent artifact={canvasItems[0]} highlight={topologyHighlight} widgetMode={false} onTopologyNodeAction={handleNodeAction} onClearOverlay={canvasItems[0]?.isMain ? onClearTopologyOverlay : undefined} changesMapOverlay={changesMapOverlay} overlayCollapsedPref={overlayUserPref} onOverlayToggle={setOverlayUserPref} />
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 12 }}>
                No artifact selected
              </div>
            )
          ) : (
            /* Canvas mode: dot grid + widget cards */
            (() => {
              const minW = canvasItems.length ? Math.max(...canvasItems.map(i => i.x + i.w + 32)) : 0
              const minH = canvasItems.length ? Math.max(...canvasItems.map(i => i.y + i.h + 32)) : 0
              return (
                <div
                  style={{ position: 'relative', minWidth: minW, minHeight: minH, width: '100%', height: '100%' }}
                  onMouseDown={() => setFocusedId(null)}
                >
                  <div style={{
                    position: 'absolute', inset: 0, pointerEvents: 'none',
                    backgroundImage: 'radial-gradient(circle, #d0d0d0 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                  }} />
                  {snapGuides.map((g, i) => g.axis === 'x' ? (
                    <div key={i} style={{ position: 'absolute', left: g.pos, top: 0, bottom: 0, width: 1, background: '#5C9BFF', opacity: 0.6, pointerEvents: 'none', zIndex: 100 }} />
                  ) : (
                    <div key={i} style={{ position: 'absolute', top: g.pos, left: 0, right: 0, height: 1, background: '#5C9BFF', opacity: 0.6, pointerEvents: 'none', zIndex: 100 }} />
                  ))}
                  {canvasItems.map(item => (
                    <CanvasWidget
                      key={item.id}
                      item={item}
                      onDragStart={handleDragStart}
                      onResizeStart={handleResizeStart}
                      highlight={topologyHighlight}
                      isFocused={focusedId === item.id}
                      onFocus={setFocusedId}
                      isNew={newItemIds.has(item.id)}
                      onEnlarge={setExpandedItemId}
                      onDelete={id => setCanvasItems(prev => prev.filter(i => i.id !== id))}
                      onTopologyNodeAction={handleNodeAction}
                      onClearOverlay={onClearTopologyOverlay}
                      changesMapOverlay={changesMapOverlay}
                      overlayCollapsedPref={overlayUserPref}
                      onOverlayToggle={setOverlayUserPref}
                    />
                  ))}
                </div>
              )
            })()
          )}
        </div>
        {configPane && (
          <ResizeSash
            onMouseDown={handleConfigResizeStart}
            orientation={configPane.dock === 'bottom' ? 'row' : 'col'}
          />
        )}
        {configPane && (
          <ConfigWorkspacePane
            state={configPane}
            onClose={() => setConfigPane(null)}
            onEnterCompare={() => setConfigPane(prev => {
              if (!prev?.leftDevice) return prev
              return {
                ...prev,
                mode: 'compare',
                rightDevice: null,
                pendingSelection: 'second',
                activeMatchIndex: 0,
                statusMessage: null,
                width: Math.max(prev.width, 680),
                height: Math.max(prev.height, 320),
              }
            })}
            onSetDock={(dock) => setConfigPane(prev => prev ? { ...prev, dock } : prev)}
            onSearchChange={(searchQuery) => setConfigPane(prev => prev ? { ...prev, searchQuery, activeMatchIndex: 0 } : prev)}
            onPrevMatch={() => setConfigPane(prev => {
              if (!prev) return prev
              const paneKeys = prev.mode === 'compare' ? ['left', 'right'] : ['left']
              const matchCount = paneKeys.reduce((count, key) => {
                const lines = getDeviceConfig(key === 'left' ? prev.leftDevice?.label : prev.rightDevice?.label).split('\n')
                if (!prev.searchQuery.trim()) return count
                return count + lines.reduce((lineCount, line) => {
                  const matches = line.match(new RegExp(escapeRegExp(prev.searchQuery.trim()), 'ig'))
                  return lineCount + (matches ? matches.length : 0)
                }, 0)
              }, 0)
              if (!matchCount) return prev
              return { ...prev, activeMatchIndex: (prev.activeMatchIndex - 1 + matchCount) % matchCount }
            })}
            onNextMatch={() => setConfigPane(prev => {
              if (!prev) return prev
              const paneKeys = prev.mode === 'compare' ? ['left', 'right'] : ['left']
              const matchCount = paneKeys.reduce((count, key) => {
                const lines = getDeviceConfig(key === 'left' ? prev.leftDevice?.label : prev.rightDevice?.label).split('\n')
                if (!prev.searchQuery.trim()) return count
                return count + lines.reduce((lineCount, line) => {
                  const matches = line.match(new RegExp(escapeRegExp(prev.searchQuery.trim()), 'ig'))
                  return lineCount + (matches ? matches.length : 0)
                }, 0)
              }, 0)
              if (!matchCount) return prev
              return { ...prev, activeMatchIndex: (prev.activeMatchIndex + 1) % matchCount }
            })}
            onCloseCompareSide={handleCloseCompareSide}
          />
        )}
        {propertiesPane && (
          <ResizeSash onMouseDown={handlePropertiesResizeStart} orientation="col" />
        )}
        {propertiesPane && (
          <DevicePropertiesPane
            data={propertiesPane}
            onClose={() => setPropertiesPane(null)}
          />
        )}
        </div>
      )}
        </>
      )}

      {modal === 'share' && <ShareModal onClose={() => setModal(null)} />}
    </div>
  )
}
