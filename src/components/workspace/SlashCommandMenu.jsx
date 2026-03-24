export const SLASH_COMMANDS = [
  {
    id: 'network',
    name: '/network',
    label: 'Explore this network',
    prompt: 'Help me understand this network at a high level.',
  },
  {
    id: 'routing',
    name: '/routing',
    label: 'Understand the routing design',
    prompt: 'Explain how routing is designed in this network, including protocols, path selection, and how traffic moves between layers.',
  },
  {
    id: 'segmentation',
    name: '/segmentation',
    label: 'Understand segmentation',
    prompt: 'Show me how this network is segmented. Highlight all trunk links carrying VLAN 100',
  },
{
    id: 'traffic',
    name: '/traffic',
    label: 'View traffic trend',
    prompt: 'Show me the recent traffic trend for the uplink interfaces on the core switch',
  },
]

export default function SlashCommandMenu({ query, activeIndex, onSelect }) {
  const filtered = SLASH_COMMANDS.filter(cmd =>
    !query || cmd.name.includes(query.toLowerCase()) || cmd.label.toLowerCase().includes(query.toLowerCase())
  )
  if (filtered.length === 0) return null

  return (
    <div className="slash-menu">
      {filtered.map((cmd, i) => (
        <div
          key={cmd.id}
          className={`slash-item${i === activeIndex ? ' active' : ''}`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(cmd.prompt); }}
        >
          <span className="slash-item-name">{cmd.name}</span>
          <span style={{ fontSize: 11, color: '#ccc', margin: '0 6px' }}>—</span>
          <span style={{ fontSize: 11, color: '#555' }}>{cmd.label}</span>
        </div>
      ))}
    </div>
  )
}
