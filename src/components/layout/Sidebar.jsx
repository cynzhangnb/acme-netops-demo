import { useState } from 'react'

// Collapsed 44 px sidebar — variant-aware with icon tooltips
function UserIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}

const IC = { width: 18, height: 18, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '1.85', strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' }

function HomeIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true" shapeRendering="geometricPrecision">
      <g transform="scale(0.75)">
        <path
          d="M16.6123,2.2138a1.01,1.01,0,0,0-1.2427,0L1,13.4194l1.2427,1.5717L4,13.6209V26a2.0041,2.0041,0,0,0,2,2H26a2.0037,2.0037,0,0,0,2-2V13.63L29.7573,15,31,13.4282ZM18,26H14V18h4Zm2,0V18a2.0023,2.0023,0,0,0-2-2H14a2.002,2.002,0,0,0-2,2v8H6V12.0615l10-7.79,10,7.8005V26Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
function HistoryIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true" shapeRendering="geometricPrecision">
      <g transform="scale(0.75)">
        <path
          d="M16,30A14,14,0,1,1,30,16,14,14,0,0,1,16,30ZM16,4A12,12,0,1,0,28,16,12,12,0,0,0,16,4Z"
          fill="currentColor"
        />
        <path
          d="M20.59 22L15 16.41V7H17V15.58L22 20.59L20.59 22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
function NetworkIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true" shapeRendering="geometricPrecision">
      <g transform="scale(0.75)">
        <path
          d="M16,26c1.1,0,2,.9,2,2s-.9,2-2,2-2-.9-2-2,.9-2,2-2ZM5,26c1.1,0,2,.9,2,2s-.9,2-2,2-2-.9-2-2,.9-2,2-2ZM27,26c1.1,0,2,.9,2,2s-.9,2-2,2-2-.9-2-2,.9-2,2-2ZM6,24v-3h9v3h2v-3h9v3h2v-3c0-1.1-.9-2-2-2h-9v-3h-2v3H6c-1.1,0-2,.9-2,2v3h2ZM21.7,6.1c-.8-2.4-3.1-4.1-5.7-4.1s-4.9,1.7-5.7,4.1c-1.9.3-3.3,1.9-3.3,3.9s1.8,4,4,4h10c2.2,0,4-1.8,4-4s-1.4-3.6-3.3-3.9ZM21,12h-10c-1.1,0-2-.9-2-2s.9-2,2-2h1c0-2.2,1.8-4,4-4s4,1.8,4,4h1c1.1,0,2,.9,2,2s-.9,2-2,2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
function InventoryIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden="true" shapeRendering="geometricPrecision">
      <g transform="translate(-0.8 -0.8) scale(0.8)">
        <path
          d="M24,25h-3v-3h3v3ZM29,22h-3v3h3v-3ZM24,27h-3v3h3v-3ZM29,27h-3v3h3v-3ZM20,8h-8v2h8v-2ZM17,28H6v-4h2v-2h-2v-5h2v-2h-2v-5h2v-2h-2v-4h18v15h2V4c0-1.1-.9-2-2-2H6c-1.1,0-2,.9-2,2v4h-2v2h2v5h-2v2h2v5h-2v2h2v4c0,1.1.9,2,2,2h11v-2ZM20,15h-8v2h8v-2Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}
function ChangeAnalysisIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <rect x="6" y="17" width="8" height="2"/>
      <circle cx="3" cy="18" r="1"/>
      <circle cx="13" cy="14" r="1"/>
      <rect x="2" y="13" width="8" height="2"/>
      <rect x="6" y="9" width="8" height="2"/>
      <circle cx="3" cy="10" r="1"/>
      <path d="M30,28.6l-7.4-7.4c1.5-2,2.4-4.5,2.4-7.2c0-6.6-5.4-12-12-12C9.7,2,6.6,3.3,4.3,5.8l1.5,1.4C7.6,5.1,10.2,4,13,4c5.5,0,10,4.5,10,10s-4.5,10-10,10c-3,0-5.8-1.3-7.7-3.6l-1.5,1.3C6,24.4,9.4,26,13,26c3.2,0,6.1-1.3,8.3-3.3l7.3,7.3L30,28.6z"/>
    </svg>
  )
}
function DevicesIcon()   { return <svg {...IC}><path d="M8.5 7.5 a5 5 0 0 1 7 0"/><path d="M6 5 a8.5 8.5 0 0 1 12 0"/><rect x="5" y="11" width="14" height="7" rx="1.5"/><circle cx="8.5" cy="14.5" r="1" fill="currentColor" stroke="none"/></svg> }
function MapsIcon()      { return <svg {...IC}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="13" y2="17"/></svg> }
function NoteIcon()      { return <svg {...IC}><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> }
function RectangleIcon() { return <svg {...IC}><rect x="3" y="5" width="18" height="14" rx="1.5"/></svg> }
function CircleIcon()    { return <svg {...IC}><circle cx="12" cy="12" r="9"/></svg> }
function LineIcon()      { return <svg {...IC}><line x1="4" y1="12" x2="20" y2="12"/></svg> }
function ArrowIcon()     { return <svg {...IC}><line x1="5" y1="19" x2="19" y2="5"/><polyline points="10 5 19 5 19 14"/></svg> }

const ICON_MAP = {
  home: HomeIcon, history: HistoryIcon, network: NetworkIcon,
  'change-analysis': ChangeAnalysisIcon,
  inventory: InventoryIcon, devices: DevicesIcon, maps: MapsIcon,
  note: NoteIcon, rectangle: RectangleIcon, circle: CircleIcon,
  line: LineIcon, arrow: ArrowIcon,
}

const WORKSPACE_SLOTS = [
  { type: 'icon', id: 'home',    tooltip: 'Home',    icon: 'home'    },
  { type: 'icon', id: 'history', tooltip: 'History', icon: 'history' },
  { type: 'icon', id: 'network', tooltip: 'Network', icon: 'network' },
  { type: 'divider' },
  { type: 'placeholder' },
  { type: 'placeholder' },
  { type: 'placeholder' },
]

const HOME_SLOTS = [
  { type: 'icon', id: 'home',            tooltip: 'Home',            icon: 'home'            },
  { type: 'icon', id: 'history',         tooltip: 'History',         icon: 'history'         },
  { type: 'divider' },
  { type: 'icon', id: 'network',         tooltip: 'Network',         icon: 'network'         },
  { type: 'icon', id: 'change-analysis', tooltip: 'Change Analysis', icon: 'change-analysis' },
  { type: 'icon', id: 'inventory',       tooltip: 'Inventory',       icon: 'inventory'       },
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
  const iconBg = active ? '#ece9e2' : hovered ? '#f0ede7' : 'transparent'
  const iconColor = '#514f49'

  return (
    <div
      className="sbi-wrap"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="sbi-icon" style={{ background: iconBg, color: iconColor }}>
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
            return <div key="div" style={{ height: 1, background: '#dddddd', margin: '6px 10px' }} />
          }
          if (slot.type === 'icon') {
            const isActive = slot.id === 'home'
              ? activeView === 'home' && !activePanel
              : slot.id === 'inventory' || slot.id === 'change-analysis'
                ? activeView === slot.id
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
