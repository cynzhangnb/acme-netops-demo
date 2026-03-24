import { useCallback, useState, useEffect, useRef } from 'react'
import { useAIResponse } from '../../hooks/useAIResponse'
import { useArtifactManager } from '../../hooks/useArtifactManager'
import AIEntryView from './AIEntryView'
import ChatView from './ChatView'
import SplitView from './SplitView'
import { deriveSessionName } from './ChatPane'

export default function AIWorkspace({ initialPrompt = '', onSessionNameChange }) {
  const [localViewMode, setLocalViewMode] = useState('entry')
  const didAutoSend = useRef(false)
  const [topologyHighlight, setTopologyHighlight] = useState(null)
  const [inputPrefill, setInputPrefill] = useState('')

  const {
    artifacts, activeArtifactId, setActiveArtifactId,
    addArtifact, removeArtifact,
  } = useArtifactManager()

  const handleTriggerSplit = useCallback(() => {
    setLocalViewMode('split')
  }, [])

  const handleSetHighlight = useCallback((val) => {
    setTopologyHighlight(val)
  }, [])

  const handleAddArtifact = useCallback((artifactRef) => {
    addArtifact(artifactRef)
    setLocalViewMode('split')
  }, [addArtifact])

  const handleSaveArtifact = useCallback((artifactRef) => {
    if (!artifactRef) return
    addArtifact(artifactRef)
    // If we were in chat-only mode, switch to split
    setLocalViewMode(prev => prev === 'entry' ? 'split' : 'split')
  }, [addArtifact])

  const handleOpenArtifact = useCallback((artifactRef) => {
    // If artifact already exists, switch to it; otherwise add it
    const existing = artifacts.find(a => a.type === artifactRef.type && a.label === artifactRef.label)
    if (existing) {
      setActiveArtifactId(existing.id)
    } else {
      addArtifact(artifactRef)
    }
    // Reset topology highlight when re-opening the map tile so it shows the base view
    if (artifactRef.type === 'topology') {
      setTopologyHighlight(null)
    }
    setLocalViewMode('split')
  }, [artifacts, addArtifact, setActiveArtifactId, setTopologyHighlight])

  const handleRemoveArtifact = useCallback((id) => {
    removeArtifact(id)
    if (artifacts.length <= 1) setLocalViewMode('chat')
  }, [removeArtifact, artifacts.length])

  const { messages, isStreaming, sendMessage } = useAIResponse({
    onAddArtifact: handleAddArtifact,
    onTriggerSplit: handleTriggerSplit,
    onSetTopologyHighlight: handleSetHighlight,
    onPrefillInput: setInputPrefill,
  })

  useEffect(() => {
    if (initialPrompt && !didAutoSend.current) {
      didAutoSend.current = true
      setLocalViewMode('chat')
      sendMessage(initialPrompt)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (onSessionNameChange) {
      onSessionNameChange(deriveSessionName(messages))
    }
  }, [messages]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSend(text) {
    if (localViewMode === 'entry') setLocalViewMode('chat')
    setInputPrefill('')
    sendMessage(text)
  }

  const sharedProps = {
    messages, isStreaming, onSend: handleSend,
    onSaveArtifact: handleSaveArtifact,
    onOpenArtifact: handleOpenArtifact,
  }

  if (localViewMode === 'entry') {
    return <AIEntryView onSend={handleSend} isStreaming={isStreaming} />
  }

  if (localViewMode === 'split' && artifacts.length > 0) {
    return (
      <SplitView
        {...sharedProps}
        artifacts={artifacts}
        activeArtifactId={activeArtifactId}
        onSetActiveArtifact={setActiveArtifactId}
        onRemoveArtifact={handleRemoveArtifact}
        topologyHighlight={topologyHighlight}
        inputPrefill={inputPrefill}
      />
    )
  }

  return <ChatView {...sharedProps} inputPrefill={inputPrefill} />
}
