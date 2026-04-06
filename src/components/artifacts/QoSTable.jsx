import { useState } from 'react'

const THRESHOLD = 4096000

const QOS_DEVICES = [
  {
    device: 'ER-BOS-07',
    role: 'Edge Router',
    iface: 'Gi0/0',
    cir: 2048000,
    config: `policy-map WAN-QOS
 class VOICE
  police rate 2048000 bps
   conform-action transmit
   exceed-action drop
 class class-default
  fair-queue`,
  },
  {
    device: 'DS-BOS-03',
    role: 'Distribution',
    iface: 'Gi0/1/0',
    cir: 1536000,
    config: `policy-map DIST-QOS
 class VOICE-TRAFFIC
  bandwidth 1536
  queue-limit 64 packets
 class class-default
  bandwidth remaining percent 80`,
  },
  {
    device: 'AS-BOS-03',
    role: 'Access',
    iface: 'Gi0/1',
    cir: 768000,
    config: `policy-map ACCESS-VOICE
 class VOICE
  police cir 768000
   conform-action set-dscp-transmit ef
   exceed-action drop`,
  },
]

function ChevronIcon({ open }) {
  return (
    <svg
      width="10" height="10" viewBox="0 0 10 10" fill="none"
      style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', flexShrink: 0 }}
    >
      <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function QoSTable({ flushed = false }) {
  const [expanded, setExpanded] = useState(new Set())

  function toggle(id) {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const cols = { grid: '28px 1fr 100px 90px 110px' }

  return (
    <div style={{ border: flushed ? 'none' : '1px solid #e8e6e2', borderRadius: flushed ? 0 : 8, overflow: 'hidden', fontSize: 12, marginTop: flushed ? 0 : 2 }}>
      {/* Table header */}
      <div style={{
        display: 'grid', gridTemplateColumns: cols.grid,
        padding: '6px 12px',
        background: '#f7f6f3', borderBottom: '1px solid #e8e6e2',
        color: '#8a8680', fontWeight: 600, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        <div />
        <div>Device</div>
        <div>Role</div>
        <div>Interface</div>
        <div>Voice CIR</div>
      </div>

      {QOS_DEVICES.map((d, idx) => {
        const isOpen = expanded.has(d.device)
        const isLast = idx === QOS_DEVICES.length - 1
        return (
          <div key={d.device} style={{ borderBottom: isLast ? 'none' : '1px solid #f0ede8' }}>
            {/* Row */}
            <div
              onClick={() => toggle(d.device)}
              style={{
                display: 'grid', gridTemplateColumns: cols.grid, alignItems: 'center',
                padding: '8px 12px', cursor: 'pointer', userSelect: 'none',
                background: 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#faf9f7' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{ color: '#b0ada8', display: 'flex', alignItems: 'center' }}>
                <ChevronIcon open={isOpen} />
              </div>
              <div style={{ fontWeight: 500, color: '#1a1a1a', fontSize: 12 }}>{d.device}</div>
              <div style={{ color: '#706d68', fontSize: 12 }}>{d.role}</div>
              <div style={{ fontFamily: 'Menlo, monospace', fontSize: 11, color: '#555' }}>{d.iface}</div>
              <div style={{ fontFamily: 'Menlo, monospace', fontSize: 11, color: d.cir < THRESHOLD ? '#c2620a' : '#15803d', fontWeight: 500 }}>
                {d.cir.toLocaleString()}
              </div>
            </div>

            {/* Expanded config */}
            {isOpen && (
              <div style={{ padding: '0 12px 12px 40px', background: 'transparent', borderTop: '1px solid #f0ede8' }}>
                <div style={{
                  fontSize: 10, color: '#a09d98', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6, marginTop: 8,
                }}>
                  Relevant config
                </div>
                <pre style={{
                  margin: 0, padding: '9px 12px',
                  background: '#f7f6f3', border: '1px solid #e8e6e2', borderRadius: 6,
                  fontSize: 11, fontFamily: 'Menlo, monospace', color: '#2d2d2d',
                  overflowX: 'auto', lineHeight: 1.6,
                }}>
                  {d.config}
                </pre>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
