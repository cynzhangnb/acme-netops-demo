import { useCallback, useState, useEffect, useRef } from 'react'
import { useAIResponse } from '../../hooks/useAIResponse'
import { useArtifactManager } from '../../hooks/useArtifactManager'
import AIEntryView from './AIEntryView'
import ChatView from './ChatView'
import SplitView from './SplitView'
import { deriveSessionName } from './ChatPane'

const CHANGES_PROMPT_KEYWORDS = ['recent configuration changes', 'recent device changes']
const NETWORK_PROMPT_KEYWORDS = ['boston data center', 'help me understand my network']

export default function AIWorkspace({ initialPrompt = '', onSessionNameChange, onNew, restoredSession, currentSessionName = 'New Session' }) {
  const promptLower = initialPrompt.toLowerCase()
  const commandSet =
    CHANGES_PROMPT_KEYWORDS.some(kw => promptLower.includes(kw)) ? 'changes' :
    NETWORK_PROMPT_KEYWORDS.some(kw => promptLower.includes(kw)) ? 'network' :
    'default'
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

  // Widgets stored per-artifact so switching tabs preserves each tab's widget layout
  const [widgetsByArtifact, setWidgetsByArtifact] = useState({})

  const handleAddWidget = useCallback((artifactRef) => {
    setWidgetsByArtifact(prev => ({
      ...prev,
      [activeArtifactId]: [...(prev[activeArtifactId] || []), artifactRef],
    }))
    setLocalViewMode('split')
  }, [activeArtifactId])

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
    commandSet,
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
        widgets={widgetsByArtifact[activeArtifactId] || []}
        inputPrefill={inputPrefill}
        onTopologyNodeAction={handleTopologyNodeAction}
      />
    )
  }

  return <ChatView {...sharedProps} inputPrefill={inputPrefill} />
}
