import { useState, useCallback, useRef } from 'react'
import { matchResponse } from '../data/mockResponses'

let msgCounter = 0
function genMsgId() { return `msg-${++msgCounter}` }

export function useAIResponse({ onAddArtifact, onTriggerSplit, onSetTopologyHighlight, onPrefillInput, initialMessages = [] }) {
  const [messages, setMessages] = useState(initialMessages)
  const [isStreaming, setIsStreaming] = useState(false)
  const timerRef = useRef(null)

  const sendMessage = useCallback((inputText) => {
    if (!inputText.trim() || isStreaming) return

    const userMsg = {
      id: genMsgId(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)

    const delay = 900 + Math.random() * 500

    timerRef.current = setTimeout(() => {
      const matched = matchResponse(inputText)
      const { response, sideEffects } = matched

      // Process side effects
      if (sideEffects) {
        sideEffects.forEach(effect => {
          if (effect.type === 'setTopologyHighlight') onSetTopologyHighlight(effect.value)
          if (effect.type === 'triggerSplitView') onTriggerSplit()
        })
      }

      // Handle artifact
      let artifactRef = null
      if (response.artifactType) {
        artifactRef = {
          type: response.artifactType,
          label: response.artifactLabel,
          dataKey: response.artifactDataKey,
        }
        if (response.artifactType === 'topology') {
          onAddArtifact(artifactRef)
        }
        // chart/table stay inline until user saves them
      }

      const aiMsg = {
        id: genMsgId(),
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        artifactRef,
      }

      setMessages(prev => [...prev, aiMsg])
      setIsStreaming(false)

      // Pre-fill the next suggested prompt if defined
      if (response.prefillNext && onPrefillInput) {
        onPrefillInput(response.prefillNext)
      }
    }, delay)
  }, [isStreaming, onAddArtifact, onTriggerSplit, onSetTopologyHighlight, onPrefillInput])

  const clearMessages = useCallback(() => {
    clearTimeout(timerRef.current)
    setMessages([])
    setIsStreaming(false)
  }, [])

  return { messages, isStreaming, sendMessage, clearMessages }
}
