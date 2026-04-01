// Collapsed 44 px sidebar — variant-aware with icon tooltips
import { useState } from 'react'

function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

const IC = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: '#555', strokeWidth: '1.6', strokeLinecap: 'round', strokeLinejoin: 'round' }

function HomeIcon()      { return <svg {...IC}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg> }
function HistoryIcon()   { return <svg {...IC}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 15"/><polyline points="3.5 9.5 5.5 7.5 3.5 5.5"/><path d="M3.5 7.5 A9 9 0 0 1 12 3"/></svg> }
function NetworkIcon()   { return <svg {...IC}><circle cx="11" cy="11" r="8.5"/><line x1="2.5" y1="11" x2="19.5" y2="11"/><path d="M11 2.5 C8 5.5 8 16.5 11 19.5"/><path d="M11 2.5 C14 5.5 14 16.5 11 19.5"/><circle cx="19" cy="19" r="2.5" fill="#555" stroke="none"/></svg> }
function InventoryIcon() {
  return (
    <svg {...IC}>
      <rect x="2" y="2"  width="20" height="6" rx="1.5"/>
      <rect x="2" y="9"  width="20" height="6" rx="1.5"/>
      <rect x="2" y="16" width="20" height="6" rx="1.5"/>
      <circle cx="6.5" cy="5"  r="1" fill="#555" stroke="none"/>
      <circle cx="6.5" cy="12" r="1" fill="#555" stroke="none"/>
      <circle cx="6.5" cy="19" r="1" fill="#555" stroke="none"/>
    </svg>
  )
}
function DevicesIcon()   { return <svg {...IC}><path d="M8.5 7.5 a5 5 0 0 1 7 0"/><path d="M6 5 a8.5 8.5 0 0 1 12 0"/><rect x="5" y="11" width="14" height="7" rx="1.5"/><circle cx="8.5" cy="14.5" r="1" fill="#555" stroke="none"/></svg> }
function MapsIcon()      { return <svg {...IC}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg> }
function NoteIcon()      { return <svg {...IC}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> }
function RectangleIcon() { return <svg {...IC}><rect x="3" y="5" width="18" height="14" rx="1.5"/></svg> }
function CircleIcon()    { return <svg {...IC}><circle cx="12" cy="12" r="9"/></svg> }
function LineIcon()      { return <svg {...IC}><line x1="4" y1="12" x2="20" y2="12"/></svg> }
function ArrowIcon()     { return <svg {...IC}><line x1="5" y1="19" x2="19" y2="5"/><polyline points="10 5 19 5 19 14"/></svg> }

const ICON_MAP = {
  home: HomeIcon, history: HistoryIcon, network: NetworkIcon,
  inventory: InventoryIcon, devices: DevicesIcon, maps: MapsIcon,
  note: NoteIcon, rectangle: RectangleIcon, circle: CircleIcon,
  line: LineIcon, arrow: ArrowIcon,
}

const WORKSPACE_SLOTS = [
  { type: 'icon', id: 'home',    tooltip: 'Home',    icon: 'home'    },
  { type: 'icon', id: 'history', tooltip: 'History', icon: 'history' },
  { type: 'placeholder' },
  { type: 'divider' },
  { type: 'placeholder' },
  { type: 'placeholder' },
  { type: 'placeholder' },
]

const HOME_SLOTS = [
  { type: 'icon', id: 'home',      tooltip: 'Home',      icon: 'home'      },
  { type: 'icon', id: 'history',   tooltip: 'History',   icon: 'history'   },
  { type: 'divider' },
  { type: 'placeholder' },
  { type: 'placeholder' },
  { type: 'icon', id: 'inventory', tooltip: 'Inventory', icon: 'inventory' },
]

const NETWORK_SLOTS = [
  { type: 'icon', tooltip: 'Devices',   icon: 'devices'   },
  { type: 'icon', tooltip: 'Maps',      icon: 'maps'      },
  { type: 'divider' },
  { type: 'icon', tooltip: 'Note',      icon: 'note'      },
  { type: 'icon', tooltip: 'Rectangle', icon: 'rectangle' },
  { type: 'icon', tooltip: 'Circle',    icon: 'circle'    },
  { type: 'icon', tooltip: 'Line',      icon: 'line'      },
  { type: 'icon', tooltip: 'Arrow',     icon: 'arrow'     },
]

function SidebarIcon({ tooltip, iconName, active, onClick }) {
  const Icon = ICON_MAP[iconName]
  const [hovered, setHovered] = useState(false)
  const bg = active ? (hovered ? '#e8e8e8' : '#fff') : 'transparent'
  return (
    <div
      className={`sbi-wrap${active ? ' sbi-wrap--active' : ''}`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sbi-icon" style={{ background: bg, width: active ? 32 : 24, height: active ? 32 : 24, borderRadius: 8 }}>
        {Icon && <Icon />}
      </div>
      <div className="sbi-tooltip">{tooltip}</div>
    </div>
  )
}

// variant: 'home' | 'workspace' | 'network'
export default function Sidebar({ variant = 'workspace', activePanel, activeView, onIconClick }) {
  const slots = variant === 'network' ? NETWORK_SLOTS : variant === 'home' ? HOME_SLOTS : WORKSPACE_SLOTS
  return (
    <aside style={{
      width: 44, flexShrink: 0, height: '100%',
      background: '#fafafa', borderRight: '1px solid #ebebeb',
      display: 'flex', flexDirection: 'column',
    }}>
      <nav style={{ flex: 1, padding: '10px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {slots.map((slot, i) => {
          if (slot.type === 'divider') {
            return <div key="div" style={{ height: 1, background: '#e8e8e8', margin: '6px 10px' }} />
          }
          if (slot.type === 'icon') {
            const isActive = slot.id === 'home'
              ? activeView === 'home'
              : activePanel === (slot.id || slot.tooltip)
            return (
              <SidebarIcon
                key={slot.id || slot.tooltip}
                tooltip={slot.tooltip}
                iconName={slot.icon}
                active={isActive}
                onClick={() => onIconClick && onIconClick(slot.id || slot.tooltip)}
              />
            )
          }
          return (
            <div key={i} style={{
              width: 44, height: 36,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 3, background: '#d8d8d8' }} />
            </div>
          )
        })}
      </nav>
      <div style={{ padding: '8px 0', borderTop: '1px solid #ebebeb' }}>
        <div style={{
          width: 44, height: 34,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'default',
        }}>
          <UserIcon />
        </div>
      </div>
    </aside>
  )
}
