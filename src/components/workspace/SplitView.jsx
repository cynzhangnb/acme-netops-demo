import { useRef, useEffect } from 'react'
import ChatPane from './ChatPane'
import ArtifactPane from '../artifacts/ArtifactPane'

export default function SplitView({
  messages, isStreaming, onSend, onSaveArtifact, onOpenArtifact, inputPrefill,
  artifacts, activeArtifactId, onSetActiveArtifact, onRemoveArtifact, topologyHighlight,
}) {
  const artifactRef = useRef(null)
  const isResizing = useRef(false)
  const startData = useRef({})

  function startResize(e) {
    const chatEl = artifactRef.current?.previousSibling?.previousSibling
    if (!chatEl || !artifactRef.current) return
    isResizing.current = true
    startData.current = {
      startX: e.clientX,
      chatW: chatEl.offsetWidth,
      artifactW: artifactRef.current.offsetWidth,
    }
    if (artifactRef.current) artifactRef.current.style.transition = 'none'
    e.preventDefault()
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!isResizing.current || !artifactRef.current) return
      const { startX, chatW, artifactW } = startData.current
      const dx = e.clientX - startX
      const total = chatW + artifactW
      const newW = Math.max(260, Math.min(total - 300, artifactW - dx))
      artifactRef.current.style.flexBasis = newW + 'px'
      artifactRef.current.style.flex = `0 0 ${newW}px`
    }
    function onMouseUp() {
      if (!isResizing.current) return
      isResizing.current = false
      if (artifactRef.current) artifactRef.current.style.transition = ''
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Chat */}
      <div style={{ flex: 1, minWidth: 300, overflow: 'hidden' }}>
        <ChatPane
          messages={messages}
          isStreaming={isStreaming}
          onSend={onSend}
          onSaveArtifact={onSaveArtifact}
          onOpenArtifact={onOpenArtifact}
          inputPrefill={inputPrefill}
        />
      </div>

      {/* Drag handle */}
      <div
        onMouseDown={startResize}
        style={{ width: 4, flexShrink: 0, cursor: 'col-resize', background: 'transparent', position: 'relative', zIndex: 10 }}
        onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 1, width: 1, background: '#e4e4e4' }} />
      </div>

      {/* Artifact pane */}
      <div
        ref={artifactRef}
        style={{ flex: '0 0 50%', minWidth: 260, overflow: 'hidden', transition: 'flex-basis 0.3s cubic-bezier(0.4,0,0.2,1)' }}
      >
        <ArtifactPane
          artifacts={artifacts}
          activeArtifactId={activeArtifactId}
          onSetActive={onSetActiveArtifact}
          onRemove={onRemoveArtifact}
          topologyHighlight={topologyHighlight}
        />
      </div>
    </div>
  )
}
