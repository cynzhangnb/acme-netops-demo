import { useState, useRef } from 'react'
import TrafficChart from '../artifacts/TrafficChart'
import QoSTable from '../artifacts/QoSTable'
import IOSVersionTable from '../artifacts/IOSVersionTable'
import CRCTable from '../artifacts/CRCTable'

function ThumbUpIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M2 11V5.5H3.5L5 2.5C5.5 2.5 6.5 2.8 6.5 4V5.5H9.5L9 11H2Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  )
}
function ThumbDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M10 1v5.5H8.5L7 9.5C6.5 9.5 5.5 9.2 5.5 8V6.5H2.5L3 1H10Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round"/>
    </svg>
  )
}
// Hub-spoke network topology icon — small (12px for other uses)
function MapIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="1.6" strokeWidth="1.2"/>
      <circle cx="6"  cy="1.2" r="0.9" strokeWidth="1.1"/>
      <circle cx="10.8" cy="6" r="0.9" strokeWidth="1.1"/>
      <circle cx="6"  cy="10.8" r="0.9" strokeWidth="1.1"/>
      <circle cx="1.2" cy="6" r="0.9" strokeWidth="1.1"/>
      <line x1="6"   y1="2.1"  x2="6"   y2="4.4"  strokeWidth="1.1"/>
      <line x1="9.9" y1="6"    x2="7.6" y2="6"    strokeWidth="1.1"/>
      <line x1="6"   y1="9.9"  x2="6"   y2="7.6"  strokeWidth="1.1"/>
      <line x1="2.1" y1="6"    x2="4.4" y2="6"    strokeWidth="1.1"/>
    </svg>
  )
}
// Larger topology icon for the artifact tile (20px, blue)
function MapIconLg() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="2.6" strokeWidth="1.4"/>
      <circle cx="10" cy="2"  r="1.4" strokeWidth="1.2"/>
      <circle cx="18" cy="10" r="1.4" strokeWidth="1.2"/>
      <circle cx="10" cy="18" r="1.4" strokeWidth="1.2"/>
      <circle cx="2"  cy="10" r="1.4" strokeWidth="1.2"/>
      <line x1="10" y1="3.4"  x2="10" y2="7.4"  strokeWidth="1.2"/>
      <line x1="16.6" y1="10" x2="12.6" y2="10" strokeWidth="1.2"/>
      <line x1="10" y1="16.6" x2="10" y2="12.6" strokeWidth="1.2"/>
      <line x1="3.4" y1="10"  x2="7.4" y2="10"  strokeWidth="1.2"/>
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <polyline points="1,9 4,5 7,7 10,2" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}
function TableIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.1"/>
      <line x1="1" y1="4.5" x2="11" y2="4.5" stroke="currentColor" strokeWidth="1"/>
      <line x1="5" y1="4.5" x2="5" y2="11" stroke="currentColor" strokeWidth="1"/>
    </svg>
  )
}

function TableWithControls({ artifactRef, onOpenArtifact, onAddWidget, canAddToCanvas, children }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
      {hovered && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          display: 'flex', gap: 2,
          background: '#fff', border: '1px solid #e4e4e4', borderRadius: 6,
          padding: 2, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', zIndex: 5,
        }}>
          <button
            onClick={() => canAddToCanvas && onAddWidget?.(artifactRef)}
            title={canAddToCanvas ? 'Add to canvas' : 'No canvas open'}
            style={{
              background: 'none', border: 'none', padding: 4, borderRadius: 4,
              cursor: canAddToCanvas ? 'pointer' : 'not-allowed',
              color: canAddToCanvas ? '#888' : '#ccc',
              display: 'flex', alignItems: 'center', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { if (canAddToCanvas) { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = canAddToCanvas ? '#888' : '#ccc' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          </button>
          <button
            onClick={() => onOpenArtifact?.(artifactRef)}
            title="Open in new tab"
            style={{
              background: 'none', border: 'none', padding: 4, borderRadius: 4,
              cursor: 'pointer', color: '#888',
              display: 'flex', alignItems: 'center', transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>
          </button>
        </div>
      )}
    </div>
  )
}

// Minimal markdown: bold, code, lists, headers, tables
function renderAIContent(text, onOpenArtifact, artifactRef, onSaveArtifact, saved, onSave, onAddWidget, canAddToCanvas) {
  const lines = text.split('\n')
  const out = []
  let i = 0
  let artifactPlaced = false

  while (i < lines.length) {
    const line = lines[i]

    // Inline artifact placeholder — place tile here instead of at the end
    if (line.trim() === '[ARTIFACT]') {
      if (artifactRef && artifactRef.type === 'voicePath') {
        artifactPlaced = true
        out.push(
          <div key={`va-${i}`} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            border: '1px solid #e4e4e4', borderRadius: 8,
            background: '#fff', overflow: 'hidden',
            marginTop: 10, marginBottom: 10,
          }}
          >
            <div
              onClick={() => onOpenArtifact && onOpenArtifact(artifactRef)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, padding: '11px 14px', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f7f7f7'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: '#888', display: 'flex' }}><MapIconLg /></span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#222' }}>{artifactRef.label}</span>
            </div>
            <button
              onClick={onSave}
              style={{ background: 'none', border: 'none', borderLeft: '1px solid #e4e4e4', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#333', padding: '11px 16px', flexShrink: 0, transition: 'background 0.1s, color 0.1s' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f7'; e.currentTarget.style.color = '#111' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#333' }}
            >Save</button>
          </div>
        )
      }
      i++; continue
    }

    // Inline link: → Link text
    if (line.startsWith('→ ')) {
      const linkText = line.slice(2)
      const IMPLEMENTED_LINKS = ['View Change Analysis']
      const isActive = IMPLEMENTED_LINKS.includes(linkText)
      out.push(
        <div key={i} style={{ fontSize: 13, fontWeight: 500, color: '#1a4fba', marginTop: 6, marginBottom: 2, cursor: isActive ? 'pointer' : 'default', display: 'inline-block' }}
          onMouseEnter={e => { if (isActive) e.currentTarget.style.textDecoration = 'underline' }}
          onMouseLeave={e => { if (isActive) e.currentTarget.style.textDecoration = 'none' }}
          onClick={() => {
            if (linkText === 'View Change Analysis' && onOpenArtifact) {
              const dataKey = artifactRef?.dataKey ?? null
              onOpenArtifact({ type: 'changeAnalysis', label: dataKey === 'last-24h' ? 'Recent Changes · Last 24h' : 'Recent Changes · Last 7 days', dataKey })
            }
          }}
        >→ {linkText}</div>
      )
      i++; continue
    }

    if (line.startsWith('## ')) {
      out.push(<div key={i} style={{ fontWeight: 600, color: '#111', fontSize: 14, marginTop: 16, marginBottom: 4, letterSpacing: '-0.01em' }}>{inlineFormat(line.slice(3))}</div>)
      i++; continue
    }
    if (line.startsWith('### ')) {
      out.push(<div key={i} style={{ fontWeight: 600, color: '#111', fontSize: 13, marginTop: 12, marginBottom: 3 }}>{inlineFormat(line.slice(4))}</div>)
      i++; continue
    }

    // Table
    if (line.startsWith('|')) {
      const rows = []
      while (i < lines.length && lines[i].startsWith('|')) {
        if (!lines[i].includes('---')) rows.push(lines[i].split('|').slice(1,-1).map(c=>c.trim()))
        i++
      }
      if (rows.length > 0) {
        out.push(
          <table key={`t${i}`} style={{ borderCollapse: 'collapse', fontSize: 11, margin: '6px 0', width: '100%' }}>
            <thead>
              <tr>{rows[0].map((h,j)=><th key={j} style={{textAlign:'left',padding:'4px 8px',borderBottom:'1px solid #e8e8e8',color:'#555',fontWeight:500,background:'#fafafa'}}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {rows.slice(1).map((r,ri)=>(
                <tr key={ri} style={{ borderBottom: '1px solid #f5f5f5' }}>
                  {r.map((c,ci)=><td key={ci} style={{padding:'4px 8px',color:'#333'}}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
      continue
    }

    // Unordered list — supports indented continuation lines (2-space indent = sub-text)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      const items = []
      while (i < lines.length) {
        const l = lines[i]
        if (l.startsWith('- ') || l.startsWith('* ')) {
          items.push({ main: l.slice(2), sub: null }); i++
        } else if (l.startsWith('  ') && l.trim() !== '' && items.length > 0) {
          items[items.length - 1].sub = l.trim(); i++
        } else {
          break
        }
      }
      out.push(
        <ul key={`ul${i}`} style={{ paddingLeft: 16, margin: '4px 0 2px' }}>
          {items.map((it, j) => (
            <li key={j} style={{ margin: '4px 0', fontSize: 13, color: '#222' }}>
              {inlineFormat(it.main)}
              {it.sub && <div style={{ fontSize: 13, color: '#222', marginTop: 1 }}>{inlineFormat(it.sub)}</div>}
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const items = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /,'')); i++ }
      out.push(
        <ol key={`ol${i}`} style={{ paddingLeft: 18, margin: '4px 0 2px' }}>
          {items.map((it,j)=><li key={j} style={{margin:'3px 0',fontSize:13,color:'#222'}}>{inlineFormat(it)}</li>)}
        </ol>
      )
      continue
    }

    // Code block
    if (line.startsWith('```')) {
      const code = []; i++
      while (i < lines.length && !lines[i].startsWith('```')) { code.push(lines[i]); i++ }
      out.push(
        <pre key={`code${i}`} style={{ margin: '6px 0', padding: '10px 12px', background: '#f8f8f8', border: '1px solid #ebebeb', borderRadius: 6, fontSize: 11, fontFamily: 'Menlo, monospace', overflowX: 'auto', color: '#333' }}>
          {code.join('\n')}
        </pre>
      )
      i++; continue
    }

    if (line.trim() === '') { i++; continue }

    out.push(<div key={i} className="ai-text" style={{ marginBottom: 4, fontSize: 13, color: '#222' }}>{inlineFormat(line)}</div>)
    i++
  }

  // Chart artifact — header with title + icon buttons top-right, chart below
  if (artifactRef && artifactRef.type === 'chart') {
    out.push(
      <div key="atile-chart" className="atile-chart" style={{ marginTop: 10 }}>
        {/* Header row */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '9px 14px', borderBottom: '1px solid #f0f0f0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 500, color: '#444' }}>
            <span style={{ color: '#888', display: 'flex' }}><ChartIcon /></span>
            {artifactRef.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div className="tip tip-down" data-tip="Add to canvas">
              <button
                onClick={() => onAddWidget && onAddWidget(artifactRef)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 5, color: '#888', display: 'flex', alignItems: 'center', transition: 'background 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
              </button>
            </div>
            <div className="tip" data-tip="Open in new tab">
              <button
                onClick={() => onOpenArtifact && onOpenArtifact(artifactRef)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 5, color: '#888', display: 'flex', alignItems: 'center', transition: 'background 0.1s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#888' }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6"/><path d="M10 14L21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
        {/* Chart */}
        <div className="atile-chart-body" style={{ height: 180 }}>
          <TrafficChart />
        </div>
      </div>
    )
  }

  // QoS expandable table — hover controls in top-right
  if (artifactRef && artifactRef.type === 'qosTable') {
    out.push(
      <TableWithControls key="qos-table" artifactRef={artifactRef} onOpenArtifact={onOpenArtifact} onAddWidget={onAddWidget} canAddToCanvas={canAddToCanvas}>
        <QoSTable />
      </TableWithControls>
    )
  }

  // CRC error table
  if (artifactRef && artifactRef.type === 'crcTable') {
    out.push(
      <TableWithControls key="crc-table" artifactRef={artifactRef} onOpenArtifact={onOpenArtifact} onAddWidget={onAddWidget} canAddToCanvas={canAddToCanvas}>
        <CRCTable />
      </TableWithControls>
    )
  }

  // IOS version table — hover controls in top-right
  if (artifactRef && artifactRef.type === 'iosVersionTable') {
    out.push(
      <TableWithControls key="ios-table" artifactRef={artifactRef} onOpenArtifact={onOpenArtifact} onAddWidget={onAddWidget} canAddToCanvas={canAddToCanvas}>
        <IOSVersionTable filter={artifactRef.dataKey} />
      </TableWithControls>
    )
  }

  // Table artifact — small tile with Add to canvas button
  if (artifactRef && artifactRef.type === 'table') {
    out.push(
      <div key="atile" className="atile">
        <div className="atile-hdr">
          <span style={{ color: '#aaa' }}><TableIcon /></span>
          {artifactRef.label}
        </div>
        {!saved ? (
          <button className="atile-btn accent" onClick={onSave}>
            + Add to canvas
          </button>
        ) : (
          <button
            className="atile-btn"
            onClick={() => onOpenArtifact && onOpenArtifact(artifactRef)}
            style={{ color: '#555' }}
          >
            View in canvas →
          </button>
        )}
      </div>
    )
  }

  // Topology / map artifact — wide tile: clickable label + Save button
  if (!artifactPlaced && artifactRef && (artifactRef.type === 'topology' || artifactRef.type === 'changesMap')) {
    out.push(
      <div key="atile-map" style={{
        display: 'flex', alignItems: 'center',
        border: '1px solid #e4e4e4', borderRadius: 10,
        marginTop: 10, background: '#fff',
        width: '100%', maxWidth: 560, overflow: 'hidden',
      }}>
        <div
          onClick={() => onOpenArtifact && onOpenArtifact(artifactRef)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, cursor: 'pointer', minWidth: 0, padding: '11px 16px' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f7' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          <span style={{ color: '#888', flexShrink: 0 }}><MapIconLg /></span>
          <span style={{ fontSize: 13, fontWeight: 500, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {artifactRef.label}
          </span>
        </div>
        {!saved ? (
          <button
            onClick={onSave}
            style={{
              background: 'none', border: 'none', borderLeft: '1px solid #e4e4e4', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: '#333', padding: '11px 16px', flexShrink: 0, transition: 'background 0.1s, color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f7f7f7'; e.currentTarget.style.color = '#111' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#333' }}
          >Save</button>
        ) : (
          <button
            onClick={() => onOpenArtifact && onOpenArtifact(artifactRef)}
            style={{
              background: 'none', border: 'none', borderLeft: '1px solid #e4e4e4', cursor: 'pointer',
              fontSize: 13, fontWeight: 500, color: '#888', padding: '11px 16px', flexShrink: 0,
            }}
          >Saved ✓</button>
        )}
      </div>
    )
  }

  return out
}

function inlineFormat(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2,-2)}</strong>
    if (p.startsWith('`')  && p.endsWith('`'))  return <code key={i} style={{ padding: '1px 4px', background: '#f0f0f0', borderRadius: 3, fontSize: '0.9em', fontFamily: 'Menlo, monospace' }}>{p.slice(1,-1)}</code>
    return p
  })
}

function DeviceChip({ name, onClick }) {
  const [hovered, setHovered] = useState(false)
  return (
    <span
      onClick={() => onClick(name)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-block',
        fontFamily: 'Menlo, monospace', fontSize: 12, fontWeight: 400,
        color: hovered ? '#1e3a8a' : '#1d4ed8',
        background: hovered ? '#dbeafe' : '#eff6ff',
        border: `1px solid ${hovered ? '#93c5fd' : '#bfdbfe'}`,
        borderRadius: 5, padding: '1px 6px',
        cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s, border-color 0.12s',
        userSelect: 'none',
      }}
      title={`Filter table by ${name}`}
    >
      {name}
    </span>
  )
}

function QueryResultCard({ structured, onDeviceClick }) {
  const { answer, matches } = structured

  return (
    <div>
      <div className="ai-text" style={{ marginBottom: 6, fontSize: 13, color: '#222' }}>{inlineFormat(answer)}</div>
      {matches.length > 0 && (
        <ul style={{ paddingLeft: 18, margin: '4px 0 8px', listStyleType: 'disc' }}>
          {matches.map((m, i) => (
            <li key={i} style={{ margin: '4px 0', fontSize: 13, color: '#222', lineHeight: 1.5, display: 'list-item' }}>
              <DeviceChip name={m.device} onClick={onDeviceClick} /> — {m.detail}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function MessageBubble({ message, onOpenArtifact, onSaveArtifact, onAddWidget, canAddToCanvas = false, onAction, onDeviceClick }) {
  const [feedback, setFeedback] = useState(null)
  const [saved, setSaved] = useState(false)
  const [chartModal, setChartModal] = useState(false)

  const isUser = message.role === 'user'

  function handleSave() {
    setSaved(true)
    onSaveArtifact?.(message.artifactRef)
  }

  function handleAction(action) {
    onAction?.({ ...action, messageId: message.id })
  }

  if (isUser) {
    return (
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'flex-end' }}>
        <div className="u-bubble">{message.content}</div>
      </div>
    )
  }

  // Structured response (e.g. query result card)
  if (message.structured) {
    return (
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', padding: '0 24px' }}>
        <div className="arow msg-fade-in">
          <QueryResultCard structured={message.structured} onAction={handleAction} onDeviceClick={onDeviceClick} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <button onClick={() => setFeedback(f => f === 'up' ? null : 'up')} style={{ color: feedback === 'up' ? '#378ADD' : '#ccc', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}><ThumbUpIcon /></button>
            <button onClick={() => setFeedback(f => f === 'down' ? null : 'down')} style={{ color: feedback === 'down' ? '#ef4444' : '#ccc', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}><ThumbDownIcon /></button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', padding: '0 24px' }}>
      {/* Chart pop-out modal */}
      {chartModal && (
        <div
          onClick={() => setChartModal(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 12, width: 680, maxWidth: '90vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', overflow: 'hidden' }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, fontWeight: 500, color: '#333' }}>
                <span style={{ color: '#888', display: 'flex' }}><ChartIcon /></span>
                {message.artifactRef?.label}
              </div>
              <button
                onClick={() => setChartModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', display: 'flex', padding: 4, borderRadius: 4 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#555' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#aaa' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            {/* Chart — larger in modal */}
            <div style={{ height: 320, padding: '8px 0' }}>
              <TrafficChart />
            </div>
          </div>
        </div>
      )}
      <div className="arow msg-fade-in">
        <div className="ai-text">
          {renderAIContent(message.content, onOpenArtifact, message.artifactRef, onSaveArtifact, saved, handleSave, onAddWidget, canAddToCanvas)}
        </div>
        {/* Feedback */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <button
            onClick={() => setFeedback(f => f === 'up' ? null : 'up')}
            style={{ color: feedback === 'up' ? '#378ADD' : '#ccc', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
          >
            <ThumbUpIcon />
          </button>
          <button
            onClick={() => setFeedback(f => f === 'down' ? null : 'down')}
            style={{ color: feedback === 'down' ? '#ef4444' : '#ccc', background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', alignItems: 'center' }}
          >
            <ThumbDownIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
