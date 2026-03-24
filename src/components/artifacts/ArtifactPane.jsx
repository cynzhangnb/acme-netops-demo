import { useState } from 'react'
import TopologyMap from './TopologyMap'
import TrafficChart from './TrafficChart'
import DeviceTable from './DeviceTable'
import ShareModal from '../modals/ShareModal'
import DocumentModal from '../modals/DocumentModal'

function CloseIcon() {
  return <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><line x1="2" y1="2" x2="8" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><line x1="8" y1="2" x2="2" y2="8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
}
function ShareIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="9" cy="2" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="2" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/><circle cx="9" cy="9" r="1.5" stroke="currentColor" strokeWidth="1.1"/><line x1="3.5" y1="4.7" x2="7.5" y2="2.8" stroke="currentColor" strokeWidth="1.1"/><line x1="3.5" y1="6.3" x2="7.5" y2="8.2" stroke="currentColor" strokeWidth="1.1"/></svg>
}
function DocIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="1.5" y="1" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.1"/><line x1="3.5" y1="3.5" x2="7.5" y2="3.5" stroke="currentColor" strokeWidth="1"/><line x1="3.5" y1="5.5" x2="7.5" y2="5.5" stroke="currentColor" strokeWidth="1"/><line x1="3.5" y1="7.5" x2="6" y2="7.5" stroke="currentColor" strokeWidth="1"/></svg>
}
function SaveIcon() {
  return <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M2 1h5.5L10 3.5V10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.1"/><rect x="3" y="6.5" width="5" height="3.5" rx="0.5" stroke="currentColor" strokeWidth="1"/><rect x="3.5" y="1" width="4" height="2.5" rx="0.5" stroke="currentColor" strokeWidth="1"/></svg>
}

function ArtifactContent({ artifact, highlight }) {
  if (!artifact) return null
  switch (artifact.type) {
    case 'topology': return <TopologyMap highlight={highlight} />
    case 'chart':    return <TrafficChart />
    case 'table':    return <DeviceTable />
    default:         return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 12 }}>Unknown artifact</div>
  }
}

const TYPE_LABELS = { topology: 'Map', chart: 'Chart', table: 'Table' }

export default function ArtifactPane({ artifacts, activeArtifactId, onSetActive, onRemove, topologyHighlight }) {
  const active = artifacts.find(a => a.id === activeArtifactId)
  const [modal, setModal] = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f8f8f8' }}>
      {/* Header */}
      <div style={{
        height: 44, background: '#fff', borderBottom: '1px solid #e8e8e8',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8, flexShrink: 0,
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, overflow: 'hidden' }}>
          {artifacts.map(artifact => {
            const isActive = artifact.id === activeArtifactId
            return (
              <div
                key={artifact.id}
                onClick={() => onSetActive(artifact.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 5, cursor: 'pointer',
                  fontSize: 12, fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#111' : '#888',
                  background: isActive ? '#f5f5f5' : 'transparent',
                  flexShrink: 0, whiteSpace: 'nowrap',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {artifact.label}
                <button
                  onClick={e => { e.stopPropagation(); onRemove(artifact.id) }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#ccc', padding: 1, display: 'flex', alignItems: 'center',
                    borderRadius: 3, lineHeight: 1,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#888'}
                  onMouseLeave={e => e.currentTarget.style.color = '#ccc'}
                >
                  <CloseIcon />
                </button>
              </div>
            )
          })}
          {artifacts.length === 0 && (
            <span style={{ fontSize: 12, color: '#bbb' }}>No artifacts</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <button
            style={{ padding: '4px 10px', border: '1px solid #d0d0d0', borderRadius: 5, fontSize: 12, fontWeight: 500, color: '#333', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
  Save
          </button>
          <button
            onClick={() => setModal('share')}
            style={{ padding: '4px 10px', border: '1px solid #d0d0d0', borderRadius: 5, fontSize: 12, fontWeight: 500, color: '#333', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <ShareIcon /> Share
          </button>
          <button
            onClick={() => setModal('doc')}
            style={{ padding: '4px 10px', border: '1px solid #d0d0d0', borderRadius: 5, fontSize: 12, fontWeight: 500, color: '#333', cursor: 'pointer', background: '#fff', display: 'flex', alignItems: 'center', gap: 5 }}
            onMouseEnter={e => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <DocIcon /> Document
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {active ? (
          <ArtifactContent artifact={active} highlight={topologyHighlight} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#bbb', fontSize: 12 }}>
            No artifact selected
          </div>
        )}
      </div>

      {modal === 'share' && <ShareModal onClose={() => setModal(null)} />}
      {modal === 'doc'   && <DocumentModal onClose={() => setModal(null)} />}
    </div>
  )
}
