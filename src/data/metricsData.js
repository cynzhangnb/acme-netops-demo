export const metricsData = {
  totalDevices: 148,
  devicesUp: 141,
  devicesDown: 4,
  devicesDegraded: 3,
  uptimePercent: 99.7,
  openAlerts: 7,
  criticalAlerts: 1,
  configChanges24h: 12,
  routeChanges24h: 3,
  macChanges24h: 47,
}

export const deviceTypeBreakdown = [
  { type: 'Routers',          count: 8,  icon: 'router'   },
  { type: 'Core Switches',    count: 6,  icon: 'switch'   },
  { type: 'Access Switches',  count: 45, icon: 'switch'   },
  { type: 'Firewalls',        count: 4,  icon: 'firewall' },
  { type: 'Load Balancers',   count: 3,  icon: 'lb'       },
  { type: 'Servers / VMs',    count: 82, icon: 'server'   },
]

export const siteSummary = [
  {
    region: 'North America',
    sites: [
      { name: 'Boston DC (Primary)', devices: 74, online: 71 },
      { name: 'New York DC',         devices: 38, online: 36 },
      { name: 'Chicago PoP',         devices: 22, online: 22 },
      { name: 'Dallas Edge',         devices: 14, online: 12 },
    ],
  },
  {
    region: 'Europe',
    sites: [
      { name: 'London PoP',          devices: 18, online: 18 },
      { name: 'Frankfurt DC',        devices: 26, online: 25 },
    ],
  },
]

export const lastDiscovery = {
  timestamp: '2025-12-21T14:30:00Z',   // ~90 days ago from 2026-03-20
  nextScan:  '2026-03-21T02:00:00Z',
  devicesSeen: 148,
  devicesNew: 2,
  devicesGone: 0,
  durationSec: 43,
  triggeredBy: 'Scheduled (daily)',
}

export const networkChanges = [
  { id: 'c1', device: 'CR-BOS-01', type: 'config',      description: 'BGP route-map policy updated on Gi0/0/1',     time: '14 min ago' },
  { id: 'c2', device: 'FW-BOS-01', type: 'config',      description: 'ACL rule 47 added by admin@acme.com',          time: '1 hr ago'   },
  { id: 'c3', device: 'CR-BOS-02', type: 'route-table', description: 'Route Table: 4 prefixes added via eBGP',       time: '2 hr ago'   },
  { id: 'c4', device: 'AS-BOS-04', type: 'config',      description: 'Interface Gi0/1 description & speed changed',  time: '3 hr ago'   },
  { id: 'c5', device: 'DS-BOS-01', type: 'mac-table',   description: 'MAC Table: 18 entries aged out on Gi0/2',      time: '5 hr ago'   },
  { id: 'c6', device: 'CS-BOS-02', type: 'arp-table',   description: 'ARP Table: 6 stale entries flushed',           time: '6 hr ago'   },
]

export const aiSessionHistory = [
  { id: 'h1', name: 'Boston DC topology & routing paths',   ago: '2h ago',   artifacts: 3 },
  { id: 'h2', name: 'VLAN 100 segment analysis',           ago: '5h ago',   artifacts: 2 },
  { id: 'h3', name: 'Uplink traffic trend — core switch',  ago: 'Yesterday', artifacts: 1 },
  { id: 'h4', name: 'Unused port audit — access layer',    ago: '2d ago',   artifacts: 2 },
  { id: 'h5', name: 'BGP peer state troubleshooting',      ago: '3d ago',   artifacts: 1 },
]
