import { Network, Zap, Search, AlertCircle } from 'lucide-react'

const SHORTCUTS = [
  { icon: Network, label: 'Explore Network', prompt: 'Explore Boston data center network' },
  { icon: Zap, label: 'Create intent', prompt: 'Create a routing intent for the Boston DC' },
  { icon: Search, label: 'Discover devices', prompt: 'Discover all devices in the Boston network' },
  { icon: AlertCircle, label: 'Troubleshoot issue', prompt: 'Troubleshoot connectivity issue between AS-BOS-04 and DS-BOS-03' },
]

export default function ShortcutChips({ onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {SHORTCUTS.map(({ icon: Icon, label, prompt }) => (
        <button
          key={label}
          onClick={() => onSelect(prompt)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-surface-base border border-surface-border rounded-full text-xs text-ink-secondary hover:text-ink-primary hover:border-brand-200 hover:bg-brand-50 shadow-card transition-all duration-150"
        >
          <Icon size={13} className="text-ink-tertiary" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  )
}
