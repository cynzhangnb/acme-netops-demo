import { useState, useEffect, useRef } from 'react'

const KNOWN_DEVICES = [
  'CR-BOS-01', 'CR-BOS-02', 'FW-BOS-01',
  'DS-BOS-01', 'DS-BOS-02', 'DS-BOS-03', 'DS-BOS-04',
  'AS-BOS-01', 'AS-BOS-02', 'AS-BOS-03', 'AS-BOS-04', 'AS-BOS-05',
  'VLAN 100', 'VLAN 200', 'VLAN 300', 'VLAN 400',
  'Boston', 'NYC', 'Chicago',
]

export function useDeviceDetection(inputValue) {
  const [detectedChips, setDetectedChips] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      const upper = inputValue.toUpperCase()
      const found = KNOWN_DEVICES.filter(d => upper.includes(d.toUpperCase()))
      setDetectedChips(found)
    }, 300)
    return () => clearTimeout(timerRef.current)
  }, [inputValue])

  return detectedChips
}
