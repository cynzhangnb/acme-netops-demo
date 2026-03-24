import { useState } from 'react'
import { allDevices } from '../../data/deviceData'
import InputArea from '../workspace/InputArea'

/* ── Icons ───────────────────────────────────────────────────────────────── */
function CloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  )
}

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
    </svg>
  )
}

/* ── AI Pane ─────────────────────────────────────────────────────────────── */
function AIPane({ onClose, onAsk }) {
  return (
    <div style={{
      width: 320, flexShrink: 0,
      borderLeft: '1px solid #e4e4e4',
      background: '#fff',
      display: 'flex', flexDirection: 'column',
      height: '100%',
    }}>
      <div style={{
        height: 44, borderBottom: '1px solid #f0f0f0',
        padding: '0 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#f0f4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4f86e8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"/>
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>AI Assistant</span>
        </div>
        <button
          onClick={onClose}
          style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'transparent', cursor: 'pointer', color: '#888' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f0f0f0'; e.currentTarget.style.color = '#333' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#888' }}
        >
          <CloseIcon />
        </button>
      </div>
      <div style={{ flex: 1, padding: '20px 14px 16px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }} />
        <InputArea
          onSend={onAsk}
          isStreaming={false}
          placeholder="Ask about your device inventory…"
          maxExpandHeight={100}
        />
      </div>
    </div>
  )
}

/* ── Type label helper ───────────────────────────────────────────────────── */
function shortType(type) {
  if (type === 'Distribution Switch') return 'Switch'
  if (type === 'Access Switch') return 'Switch'
  if (type === 'Core Router') return 'Router'
  return type
}

/* ── Status dot ──────────────────────────────────────────────────────────── */
const STATUS_COLOR = { up: '#22c55e', degraded: '#f59e0b', down: '#ef4444' }

/* ── InventoryPage ───────────────────────────────────────────────────────── */
export default function InventoryPage({ onStartAI }) {
  const [aiPaneOpen, setAiPaneOpen] = useState(false)

  function handleAsk(text) {
    setAiPaneOpen(false)
    onStartAI(text)
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>
      {/* Main content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '28px 32px', background: '#f5f5f5', position: 'relative' }}>
        {/* Table card */}
        <div style={{ background: '#fff', border: '1px solid #e4e4e4', borderRadius: 10, overflow: 'hidden', maxWidth: 900 }}>
          {/* Card title */}
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>Device Inventory</span>
          </div>

          {/* Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa' }}>
                <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.04em', borderBottom: '1px solid #f0f0f0', width: '45%' }}>Hostname</th>
                <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.04em', borderBottom: '1px solid #f0f0f0', width: '30%' }}>Type</th>
                <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.04em', borderBottom: '1px solid #f0f0f0' }}>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {allDevices.map((device, i) => (
                <tr
                  key={device.id}
                  style={{ borderBottom: i < allDevices.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '13px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: STATUS_COLOR[device.status] || '#ccc', flexShrink: 0 }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{device.hostname.toLowerCase()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: '#555' }}>{shortType(device.type)}</td>
                  <td style={{ padding: '13px 20px', fontSize: 13, color: '#555', fontVariantNumeric: 'tabular-nums' }}>{device.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Floating AI button */}
        {!aiPaneOpen && (
          <button
            onClick={() => setAiPaneOpen(true)}
            title="Open AI Assistant"
            style={{
              position: 'fixed', bottom: 28, right: 28,
              width: 46, height: 46, borderRadius: '50%',
              background: '#378ADD', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 12px rgba(55,138,221,0.35)',
              transition: 'background 0.15s, transform 0.15s',
              zIndex: 50,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#2b6fb5'; e.currentTarget.style.transform = 'scale(1.06)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#378ADD'; e.currentTarget.style.transform = 'scale(1)' }}
          >
            <SparkleIcon />
          </button>
        )}
      </div>

      {/* Docked AI pane */}
      {aiPaneOpen && (
        <AIPane onClose={() => setAiPaneOpen(false)} onAsk={handleAsk} />
      )}
    </div>
  )
}
