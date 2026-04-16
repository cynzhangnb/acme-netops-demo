import { useState, useCallback } from 'react'
import { seedSessions } from '../data/sessionsData'

function loadSessions() {
  try {
    const raw = localStorage.getItem('netops_sessions')
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Purge placeholder sessions that were saved before the two-phase commit
        const meaningful = parsed.filter(s => s.name && s.name !== 'New Session')
        if (meaningful.length > 0) {
          saveSessions(meaningful)   // rewrite storage without the junk entries
          return meaningful
        }
      }
    }
  } catch {}
  return seedSessions
}

function saveSessions(sessions) {
  try {
    localStorage.setItem('netops_sessions', JSON.stringify(sessions))
  } catch {}
}

let idCounter = Date.now()
function genId() { return `session-${++idCounter}` }

export function useSessionManager() {
  const [sessions, setSessions] = useState(loadSessions)
  const [activeSessionId, setActiveSessionId] = useState(null)

  // Legacy: immediately creates + persists (used for seed / restored sessions)
  const createSession = useCallback((name = 'New Session') => {
    const id = genId()
    const newSession = {
      id,
      name,
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      preview: '',
      messageCount: 0,
      artifactCount: 0,
      messages: [],
      artifacts: [],
    }
    setSessions(prev => {
      const next = [newSession, ...prev]
      saveSessions(next)
      return next
    })
    setActiveSessionId(id)
    return id
  }, [])

  // Phase-1: reserves an ID in memory only — nothing written to localStorage.
  // The session will NOT appear in the history list until commitSession is called.
  const startSession = useCallback(() => {
    const id = genId()
    setActiveSessionId(id)
    return id
  }, [])

  // Phase-2: called once there is real content (first AI reply / artifact opened).
  // Adds the session to the list and persists it. Idempotent — safe to call again.
  const commitSession = useCallback((id, name) => {
    setSessions(prev => {
      if (prev.some(s => s.id === id)) return prev   // already committed
      const newSession = {
        id,
        name,
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        preview: '',
        messageCount: 0,
        artifactCount: 0,
        messages: [],
        artifacts: [],
      }
      const next = [newSession, ...prev]
      saveSessions(next)
      return next
    })
  }, [])

  const deleteSession = useCallback((id) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id)
      saveSessions(next)
      return next
    })
    setActiveSessionId(prev => {
      if (prev === id) return null
      return prev
    })
  }, [])

  const selectSession = useCallback((id) => {
    setActiveSessionId(id)
  }, [])

  const updateSession = useCallback((id, updates) => {
    setSessions(prev => {
      const next = prev.map(s => s.id === id ? { ...s, ...updates, lastActivity: new Date().toISOString() } : s)
      saveSessions(next)
      return next
    })
  }, [])

  const activeSession = sessions.find(s => s.id === activeSessionId) || null

  return { sessions, activeSessionId, activeSession, createSession, startSession, commitSession, deleteSession, selectSession, updateSession }
}
