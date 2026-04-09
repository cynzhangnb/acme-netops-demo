export const NETWORK_TEMPLATE = `Help me explore my network.\nScope: [e.g. a site, a specific device]\nFocus on:\n- routing design and path selection\n- network segmentation\n- policies and access control\n- logical connectivity between devices`

export const HOME_COMMANDS = [
  {
    id: 'network',
    name: '/network',
    label: 'Explore network',
    prompt: NETWORK_TEMPLATE,
  },
  {
    id: 'change',
    name: '/change',
    label: 'Show recent changes',
    prompt: 'Show recent configuration changes in my network',
  },
  {
    id: 'qos',
    name: '/qos',
    label: 'QoS compliance',
    prompt: 'Which devices have voice CIR < 4096000?',
  },
  {
    id: 'troubleshoot',
    name: '/troubleshoot',
    label: 'Troubleshoot a voice issue',
    prompt: 'I have a voice issue from 10.8.1.4 to 10.8.3.134. Can you help?',
  },
]

export const NETWORK_COMMANDS = [
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

export const SLASH_COMMANDS = [
  ...NETWORK_COMMANDS,
  {
    id: 'qos',
    name: '/qos',
    label: 'QoS compliance',
    prompt: 'Which devices have voice CIR < 4096000?',
  },
]

export const CHANGES_COMMANDS = [
  {
    id: 'inquiry',
    name: '/inquiry',
    label: 'show bgp related change',
    prompt: 'which devices have BGP policy change',
  },
  {
    id: 'map',
    name: '/map',
    label: 'show devices on map',
    prompt: 'show devices on map',
  },
]

export default function SlashCommandMenu({ query, activeIndex, onSelect, commands = SLASH_COMMANDS }) {
  const filtered = commands.filter(cmd =>
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
