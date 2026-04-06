import { useCallback, useState, useEffect, useRef } from 'react'
import { useAIResponse } from '../../hooks/useAIResponse'
import { useArtifactManager } from '../../hooks/useArtifactManager'
import AIEntryView from './AIEntryView'
import ChatView from './ChatView'
import SplitView from './SplitView'
import { deriveSessionName } from './ChatPane'

export default function AIWorkspace({ initialPrompt = '', onSessionNameChange, onNew, restoredSession, currentSessionName = 'New Session' }) {
  const [localViewMode, setLocalViewMode] = useState(restoredSession ? 'split' : 'entry')
  const didAutoSend = useRef(false)
  const [topologyHighlight, setTopologyHighlight] = useState(null)
  const [changesMapOverlay, setChangesMapOverlay] = useState(null)
  const [inputPrefill, setInputPrefill] = useState('')
  const [sessionNameOverride, setSessionNameOverride] = useState(null)

  const {
    artifacts, activeArtifactId, setActiveArtifactId,
    addArtifact, removeArtifact,
  } = useArtifactManager(
    restoredSession?.artifacts || [],
    restoredSession?.activeArtifactId || null,
  )

  const [widgets, setWidgets] = useState([])

  // Clear widgets when active artifact changes
  const prevActiveRef = useRef(null)
  useEffect(() => {
    if (prevActiveRef.current !== null && prevActiveRef.current !== activeArtifactId) {
      setWidgets([])
    }
    prevActiveRef.current = activeArtifactId
  }, [activeArtifactId])

  const handleAddWidget = useCallback((artifactRef) => {
    setWidgets(prev => [...prev, artifactRef])
    setLocalViewMode('split')
  }, [])

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
    onSetChangesMapOverlay: setChangesMapOverlay,
    onPrefillInput: setInputPrefill,
    initialMessages: restoredSession?.messages || [],
  })

  useEffect(() => {
    if (initialPrompt && !didAutoSend.current) {
      didAutoSend.current = true
      setLocalViewMode('chat')
      sendMessage(initialPrompt)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sessionNameOverride) return // user renamed manually — don't overwrite
    if (onSessionNameChange) {
      onSessionNameChange(deriveSessionName(messages, currentSessionName))
    }
  }, [messages, currentSessionName]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleRenameSession(name) {
    setSessionNameOverride(name)
    onSessionNameChange?.(name)
  }

  function handleSend(text) {
    if (localViewMode === 'entry') setLocalViewMode('chat')
    setInputPrefill('')
    sendMessage(text)
  }

  function handleTopologyNodeAction({ prompt }) {
    if (!prompt) return
    setInputPrefill(prompt)
    if (localViewMode === 'entry') setLocalViewMode('chat')
  }

  const sharedProps = {
    messages, isStreaming, onSend: handleSend,
    onSaveArtifact: handleSaveArtifact,
    onOpenArtifact: handleOpenArtifact,
    onAddWidget: handleAddWidget,
    onNew,
    currentSessionName,
    nameOverride: sessionNameOverride,
    onRenameSession: handleRenameSession,
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
        onClearTopologyOverlay={() => setTopologyHighlight(null)}
        changesMapOverlay={changesMapOverlay}
        widgets={widgets}
        inputPrefill={inputPrefill}
        onTopologyNodeAction={handleTopologyNodeAction}
      />
    )
  }

  return <ChatView {...sharedProps} inputPrefill={inputPrefill} />
}
