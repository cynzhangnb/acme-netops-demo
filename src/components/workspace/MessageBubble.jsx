import { useState } from 'react'
import TrafficChart from '../artifacts/TrafficChart'

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
// Hub-spoke network topology icon — center hub + 4 radiating nodes
function MapIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round">
      {/* Center hub */}
      <circle cx="6" cy="6" r="1.6" strokeWidth="1.2"/>
      {/* 4 outer nodes: top, right, bottom, left */}
      <circle cx="6"  cy="1.2" r="0.9" strokeWidth="1.1"/>
      <circle cx="10.8" cy="6" r="0.9" strokeWidth="1.1"/>
      <circle cx="6"  cy="10.8" r="0.9" strokeWidth="1.1"/>
      <circle cx="1.2" cy="6" r="0.9" strokeWidth="1.1"/>
      {/* Spokes from hub edge to node edge */}
      <line x1="6"   y1="2.1"  x2="6"   y2="4.4"  strokeWidth="1.1"/>
      <line x1="9.9" y1="6"    x2="7.6" y2="6"    strokeWidth="1.1"/>
      <line x1="6"   y1="9.9"  x2="6"   y2="7.6"  strokeWidth="1.1"/>
      <line x1="2.1" y1="6"    x2="4.4" y2="6"    strokeWidth="1.1"/>
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

// Minimal markdown: bold, code, lists, headers, tables
function renderAIContent(text, onOpenArtifact, artifactRef, onSaveArtifact, saved, onSave) {
  const lines = text.split('\n')
  const out = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      out.push(<div key={i} style={{ fontWeight: 600, color: '#111', fontSize: 13, marginTop: 8, marginBottom: 2 }}>{inlineFormat(line.slice(3))}</div>)
      i++; continue
    }
    if (line.startsWith('### ')) {
      out.push(<div key={i} style={{ fontWeight: 600, color: '#333', fontSize: 12, marginTop: 6, marginBottom: 2 }}>{inlineFormat(line.slice(4))}</div>)
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
            <li key={j} style={{ margin: '4px 0', fontSize: 12, color: '#555' }}>
              {inlineFormat(it.main)}
              {it.sub && <div style={{ fontSize: 12, color: '#555', marginTop: 1 }}>{inlineFormat(it.sub)}</div>}
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
          {items.map((it,j)=><li key={j} style={{margin:'2px 0',fontSize:12,color:'#555'}}>{inlineFormat(it)}</li>)}
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

    out.push(<div key={i} className="ai-text" style={{ marginBottom: 4 }}>{inlineFormat(line)}</div>)
    i++
  }

  // Chart artifact — render chart inline, with Add to canvas button in footer
  if (artifactRef && artifactRef.type === 'chart') {
    out.push(
      <div key="atile-chart" className="atile-chart">
        <div style={{ height: 180 }}>
          <TrafficChart />
        </div>
        <div className="atile-chart-footer">
          <div className="atile-hdr">
            <span style={{ color: '#aaa' }}><ChartIcon /></span>
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
      </div>
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

  // Topology artifact — single row: label left, Save button right
  if (artifactRef && artifactRef.type === 'topology') {
    out.push(
      <div key="atile-map" className="atile" style={{ gap: 0 }}>
        <div className="atile-hdr" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#aaa' }}><MapIcon /></span>
            {artifactRef.label}
          </div>
          {!saved ? (
            <button className="atile-btn accent" onClick={onSave} style={{ padding: '3px 10px', fontSize: 11 }}>
              Save
            </button>
          ) : (
            <button
              className="atile-btn"
              onClick={() => onOpenArtifact && onOpenArtifact(artifactRef)}
              style={{ color: '#555', padding: '3px 10px', fontSize: 11 }}
            >
              View →
            </button>
          )}
        </div>
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

export default function MessageBubble({ message, onOpenArtifact, onSaveArtifact }) {
  const [feedback, setFeedback] = useState(null)
  const [saved, setSaved] = useState(false)

  const isUser = message.role === 'user'

  function handleSave() {
    setSaved(true)
    onSaveArtifact?.(message.artifactRef)
  }

  if (isUser) {
    return (
      <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'flex-end' }}>
        <div className="u-bubble">{message.content}</div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', padding: '0 24px' }}>
      <div className="arow msg-fade-in">
        <div className="ai-text">
          {renderAIContent(message.content, onOpenArtifact, message.artifactRef, onSaveArtifact, saved, handleSave)}
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
