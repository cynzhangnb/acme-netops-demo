import { useState, useCallback } from 'react'

let artifactCounter = 0
function genArtifactId() { return `artifact-${++artifactCounter}` }

export function useArtifactManager() {
  const [artifacts, setArtifacts] = useState([])
  const [activeArtifactId, setActiveArtifactId] = useState(null)

  const addArtifact = useCallback((artifact) => {
    const id = genArtifactId()
    const newArtifact = { id, ...artifact, savedToWorkspace: true }
    setArtifacts(prev => {
      // If a topology artifact already exists, update it rather than adding a new one
      if (artifact.type === 'topology') {
        const existingIdx = prev.findIndex(a => a.type === 'topology')
        if (existingIdx >= 0) {
          const next = [...prev]
          next[existingIdx] = { ...next[existingIdx], ...newArtifact }
          setActiveArtifactId(next[existingIdx].id)
          return next
        }
      }
      setActiveArtifactId(id)
      return [...prev, newArtifact]
    })
    return id
  }, [])

  const removeArtifact = useCallback((id) => {
    setArtifacts(prev => {
      const next = prev.filter(a => a.id !== id)
      if (next.length > 0) {
        setActiveArtifactId(next[next.length - 1].id)
      } else {
        setActiveArtifactId(null)
      }
      return next
    })
  }, [])

  const hasTopology = artifacts.some(a => a.type === 'topology')

  return { artifacts, activeArtifactId, setActiveArtifactId, addArtifact, removeArtifact, hasTopology }
}
