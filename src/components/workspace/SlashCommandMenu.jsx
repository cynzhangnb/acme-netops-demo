export const NETWORK_TEMPLATE = `Help me explore my network.\nScope: [e.g. a site, a specific device]\nFocus on:\n- routing design and path selection\n- network segmentation\n- policies and access control\n- logical connectivity between devices`

/* ── "/" quick-action commands ────────────────────────────────────────────── */
export const COMMAND_MENU_ITEMS = [
  { id: 'new-map',        label: 'New map',        hoverPrompt: 'Create a new map to visualize your network' },
  { id: 'open-map',       label: 'Open Map',       hoverPrompt: 'Open an existing network map' },
  { id: 'show-inventory', label: 'Show Inventory', hoverPrompt: 'Browse and search your device inventory' },
  { id: 'review-change',  label: 'Review Change',  hoverPrompt: 'Review recent configuration changes' },
  { id: 'device-lookup',  label: 'Device lookup',  hoverPrompt: 'Look up a device by hostname or IP address' },
]

/* ── Review Changes sub-menu items ───────────────────────────────────────── */
export const REVIEW_CHANGES_ITEMS = [
  { id: 'changes-24h',      label: 'Changes in the last 24 hours',  prompt: 'What configuration changes happened in the last 24 hours?' },
  { id: 'changes-baseline', label: 'Changes since last baseline',    prompt: 'Show configuration changes since the last baseline snapshot' },
  { id: 'changes-by-type',  label: 'Changes by type',               prompt: 'Group configuration changes by type across the Boston network' },
]

/** Sub-menu shown when user selects "Review Change" from the "/" command menu. */
export function ReviewChangesSubmenu({ activeIndex = 0, onSelect, onBack, onHoverChange }) {
  return (
    <div className="slash-menu" onMouseLeave={() => onHoverChange?.(null)}>
      {/* Back header */}
      <div
        className="slash-item"
        style={{ color: '#888', paddingTop: 8, paddingBottom: 8 }}
        onMouseDown={e => { e.preventDefault(); onBack?.() }}
      >
        <span style={{ fontSize: 11, color: '#aaa', marginRight: 6 }}>‹</span>
        <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>Review Changes</span>
      </div>
      <div style={{ height: 1, background: '#f0f0f0', margin: '0 10px 2px' }} />
      {REVIEW_CHANGES_ITEMS.map((item, i) => (
        <div
          key={item.id}
          className={`slash-item${i === activeIndex ? ' active' : ''}`}
          onMouseEnter={() => onHoverChange?.(item.prompt)}
          onMouseDown={e => { e.preventDefault(); onSelect(item.prompt) }}
        >
          <span className="slash-item-name">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/** Menu triggered by "/" – shows quick action commands. */
export function CommandMenu({ activeIndex, onSelect, onHoverChange }) {
  return (
    <div className="slash-menu" onMouseLeave={() => onHoverChange?.(null)}>
      {COMMAND_MENU_ITEMS.map((item, i) => (
        <div
          key={item.id}
          className={`slash-item${i === activeIndex ? ' active' : ''}`}
          onMouseEnter={() => onHoverChange?.(item.hoverPrompt)}
          onMouseDown={(e) => { e.preventDefault(); onSelect(item.id) }}
        >
          <span className="slash-item-name">{item.label}</span>
        </div>
      ))}
    </div>
  )
}

/* ── "#" hash commands (formerly slash commands) ──────────────────────────── */
export const HOME_COMMANDS = [
  { id: 'network',     name: '#network',     label: 'Explore network',           prompt: NETWORK_TEMPLATE },
  { id: 'change',      name: '#change',      label: 'Show recent changes',       prompt: 'Show recent configuration changes in my network' },
  { id: 'qos',         name: '#qos',         label: 'QoS compliance',            prompt: 'Which devices have voice CIR < 4096000?' },
  { id: 'troubleshoot',name: '#troubleshoot',label: 'Troubleshoot a voice issue', prompt: 'I have a voice issue from 10.8.1.4 to 10.8.3.134. Can you help?' },
  { id: 'device',      name: '#device',      label: 'Get device info',           prompt: 'Show me device details for US-BOS-R1' },
]

export const NETWORK_COMMANDS = [
  { id: 'routing',      name: '#routing',      label: 'Understand the routing design', prompt: 'Explain how routing is designed in this network, including protocols, path selection, and how traffic moves between layers.' },
  { id: 'segmentation', name: '#segmentation', label: 'Understand segmentation',       prompt: 'Show me how this network is segmented. Highlight all trunk links carrying VLAN 100' },
  { id: 'traffic',      name: '#traffic',      label: 'View traffic trend',            prompt: 'Show me the recent traffic trend for the uplink interfaces on the core switch' },
]

export const SLASH_COMMANDS = [
  ...NETWORK_COMMANDS,
  { id: 'qos', name: '#qos', label: 'QoS compliance', prompt: 'Which devices have voice CIR < 4096000?' },
]

export const CHANGES_COMMANDS = [
  { id: 'map',    name: '#map',    label: 'Show devices on map', prompt: 'show devices on map' },
  { id: 'bgp',    name: '#bgp',    label: 'Show BGP design',     prompt: 'show bgp design' },
  { id: 'ios',    name: '#ios',    label: 'Show IOS version',    prompt: 'what are the ios versions of these devices' },
  { id: 'serial', name: '#serial', label: 'Show serial numbers', prompt: 'what are the serial number?' },
  { id: 'ospf',   name: '#ospf',   label: 'Show OSPF design',    prompt: 'show ospf design' },
  { id: 'crc',    name: '#crc',    label: 'Show CRC errors',     prompt: 'any crc errors?' },
]

export const CHANGE_ANALYSIS_COMMANDS = [
  { id: 'inquiry',   name: '#inquiry',   label: 'show bgp related change', prompt: 'which devices have BGP policy change' },
  { id: 'inquiry-2', name: '#inquiry 2', label: 'BGP changes in Toronto',  prompt: 'Which devices in Toronto have BGP policy change' },
  { id: 'map',       name: '#map',       label: 'show devices on map',     prompt: 'show devices on map' },
]

/** Menu triggered by "#" – shows contextual hash commands. */
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
          onMouseDown={(e) => { e.preventDefault(); onSelect(cmd.prompt) }}
        >
          <span className="slash-item-name">{cmd.name}</span>
          <span style={{ fontSize: 11, color: '#ccc', margin: '0 6px' }}>—</span>
          <span style={{ fontSize: 11, color: '#555' }}>{cmd.label}</span>
        </div>
      ))}
    </div>
  )
}
