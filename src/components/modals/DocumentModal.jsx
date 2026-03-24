import { useState, useEffect } from 'react'

function CloseIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function DownloadIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="6" y1="1" x2="6" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><polyline points="3,5.5 6,8.5 9,5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><line x1="1" y1="11" x2="11" y2="11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}

const DOC_SECTIONS = [
  {
    heading: 'Executive Summary',
    lines: [
      'This document summarizes the current state of the Boston data center network as analyzed through the ACME NetOps AI Workspace.',
      'The network consists of 2 core routers, 6 distribution switches, and 45 access switches organized in a three-tier hierarchy.',
    ],
  },
  {
    heading: 'Network Topology',
    lines: [
      '127 active devices across 3 tiers (Core, Distribution, Access)',
      '18 network segments with 42 VLANs configured',
      '2 core routers (CR-BOS-01, CR-BOS-02) provide redundant uplinks',
    ],
  },
  {
    heading: 'Issues & Recommendations',
    lines: [
      '⚠ DS-BOS-03 — OSPF adjacency instability detected (32 min ago)',
      '🔴 AS-BOS-04 — Device offline, all 24 ports unavailable',
      '14 unused ports identified for cleanup across 8 devices',
    ],
  },
  {
    heading: 'Traffic Analysis',
    lines: [
      'Core switch uplink interfaces showing steady traffic increase over the past 12 days, trending from 18 Mbps to 50 Mbps.',
      'Recommend capacity review if trend continues through Q2.',
    ],
  },
]

export default function DocumentModal({ onClose }) {
  const [loading, setLoading] = useState(true)
  const [downloaded, setDownloaded] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />

      {/* Modal */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 560,
        background: '#fff', border: '1px solid #e4e4e4',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '80vh',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #ebebeb' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1 }}>Generate Document</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 3, borderRadius: 4, display: 'flex' }}
            onMouseEnter={e=>e.currentTarget.style.color='#555'} onMouseLeave={e=>e.currentTarget.style.color='#bbb'}>
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ fontSize: 12, color: '#999', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span style={{ marginLeft: 4 }}>Generating document…</span>
              </div>
              {/* Skeleton lines */}
              {[100, 80, 90, 60, 75, 85, 55].map((w, i) => (
                <div key={i} style={{ height: 10, background: '#f0f0f0', borderRadius: 3, width: `${w}%`, animation: `pulse 1.5s ease-in-out ${i*0.08}s infinite` }} />
              ))}
              <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }`}</style>
            </div>
          ) : (
            <div>
              {/* Mock document preview */}
              <div style={{ fontSize: 11, color: '#999', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4caf50' }} />
                Document ready — Boston DC Network Analysis · March 2026
              </div>

              {/* Embedded map preview */}
              <div style={{ height: 100, background: '#f8f8f8', border: '1px solid #e8e8e8', borderRadius: 6, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontSize: 11, color: '#ccc' }}>[ Network topology map ]</div>
              </div>

              {DOC_SECTIONS.map((section, si) => (
                <div key={si} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#333', marginBottom: 6, paddingBottom: 4, borderBottom: '1px solid #f0f0f0' }}>
                    {section.heading}
                  </div>
                  {section.lines.map((line, li) => (
                    <div key={li} style={{ fontSize: 12, color: '#555', marginBottom: 4, lineHeight: 1.6 }}>
                      {line}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid #ebebeb', display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => setDownloaded(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', border: '1px solid #d0d0d0', borderRadius: 5,
                fontSize: 12, fontWeight: 500, color: downloaded ? '#4caf50' : '#111',
                cursor: 'pointer', background: '#fff',
                borderColor: downloaded ? '#4caf50' : '#d0d0d0',
              }}
              onMouseEnter={e => { if (!downloaded) e.currentTarget.style.background = '#f5f5f5' }}
              onMouseLeave={e => { if (!downloaded) e.currentTarget.style.background = '#fff' }}
            >
              <DownloadIcon />
              {downloaded ? 'Downloaded ✓' : 'Export PDF'}
            </button>
            <button
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', border: '1px solid #d0d0d0', borderRadius: 5, fontSize: 12, fontWeight: 500, color: '#111', cursor: 'pointer', background: '#fff' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}
            >
              Export Markdown
            </button>
            <button onClick={onClose} style={{ marginLeft: 'auto', padding: '7px 16px', border: '1px solid #e4e4e4', borderRadius: 5, fontSize: 12, color: '#888', cursor: 'pointer', background: '#fff' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
