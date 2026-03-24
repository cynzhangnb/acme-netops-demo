import { useState } from 'react'

function CloseIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
}
function CopyIcon() {
  return <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M8 4V2.5A1.5 1.5 0 0 0 6.5 1H2.5A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H4" stroke="currentColor" strokeWidth="1.2"/></svg>
}

const SHARE_OPTIONS = [
  { id: 'both',      label: 'Chat + Artifacts', description: 'Share the full session' },
  { id: 'chat',      label: 'Chat only',         description: 'Share conversation without artifacts' },
  { id: 'artifacts', label: 'Artifacts only',    description: 'Share topology, charts, tables' },
]

export default function ShareModal({ onClose }) {
  const [selected, setSelected] = useState('both')
  const [copied, setCopied] = useState(false)

  const mockLink = `https://netops.acme.com/share/s_${Math.random().toString(36).slice(2, 10)}`

  function handleCopy() {
    navigator.clipboard.writeText(mockLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)' }} />

      {/* Modal */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: 440,
        background: '#fff', border: '1px solid #e4e4e4',
        borderRadius: 10, overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid #ebebeb' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111', flex: 1 }}>Share Session</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#bbb', padding: 3, borderRadius: 4, display: 'flex' }}
            onMouseEnter={e=>e.currentTarget.style.color='#555'} onMouseLeave={e=>e.currentTarget.style.color='#bbb'}>
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Options */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 8 }}>Include in share</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SHARE_OPTIONS.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => setSelected(opt.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 6, cursor: 'pointer',
                    border: `1px solid ${selected === opt.id ? '#378ADD' : '#e4e4e4'}`,
                    background: selected === opt.id ? '#f0f7ff' : '#fff',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <div style={{
                    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${selected === opt.id ? '#378ADD' : '#ccc'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selected === opt.id && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#378ADD' }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#222' }}>{opt.label}</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>{opt.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiry */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 8 }}>Link expires</p>
            <select style={{ width: '100%', padding: '7px 10px', fontSize: 12, color: '#333', background: '#f8f8f8', border: '1px solid #e4e4e4', borderRadius: 5, outline: 'none' }}>
              <option>7 days</option>
              <option>30 days</option>
              <option>Never</option>
            </select>
          </div>

          {/* Link */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#888', marginBottom: 8 }}>Share link</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, padding: '7px 10px', background: '#f8f8f8', border: '1px solid #e4e4e4', borderRadius: 5, fontSize: 11, color: '#666', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {mockLink}
              </div>
              <button
                onClick={handleCopy}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 5, fontSize: 12, fontWeight: 500,
                  cursor: 'pointer', border: `1px solid ${copied ? '#4caf50' : '#378ADD'}`,
                  background: copied ? '#f0faf0' : '#378ADD',
                  color: copied ? '#4caf50' : '#fff',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >
                <CopyIcon /> {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
