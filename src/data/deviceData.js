export const allDevices = [
  // Core Routers
  { id: 'd1',  hostname: 'CR-BOS-01',  ip: '10.1.1.1',   type: 'Core Router',          site: 'Boston Core',  status: 'up',       model: 'ASR 9001',      lastSeen: '1 min ago',  ports: 24, portsUsed: 18 },
  { id: 'd2',  hostname: 'CR-BOS-02',  ip: '10.1.1.2',   type: 'Core Router',          site: 'Boston Core',  status: 'up',       model: 'ASR 9001',      lastSeen: '1 min ago',  ports: 24, portsUsed: 16 },
  { id: 'd3',  hostname: 'CR-BOS-03',  ip: '10.1.1.3',   type: 'Core Router',          site: 'Boston West',  status: 'up',       model: 'ASR 9006',      lastSeen: '2 min ago',  ports: 32, portsUsed: 20 },
  // WAN Routers
  { id: 'd4',  hostname: 'WR-BOS-01',  ip: '10.1.2.1',   type: 'WAN Router',           site: 'Boston Core',  status: 'up',       model: 'ISR 4451',      lastSeen: '1 min ago',  ports: 12, portsUsed: 8  },
  { id: 'd5',  hostname: 'WR-BOS-02',  ip: '10.1.2.2',   type: 'WAN Router',           site: 'Boston DR',    status: 'up',       model: 'ISR 4451',      lastSeen: '3 min ago',  ports: 12, portsUsed: 7  },
  // Firewalls
  { id: 'd6',  hostname: 'FW-BOS-01',  ip: '10.0.1.1',   type: 'Firewall',             site: 'Boston Core',  status: 'up',       model: 'ASA 5585',      lastSeen: '1 min ago',  ports: 8,  portsUsed: 6  },
  { id: 'd7',  hostname: 'FW-BOS-02',  ip: '10.0.1.2',   type: 'Firewall',             site: 'Boston Core',  status: 'up',       model: 'Firepower 4110', lastSeen: '1 min ago', ports: 8,  portsUsed: 5  },
  // Load Balancers
  { id: 'd8',  hostname: 'LB-BOS-01',  ip: '10.0.2.1',   type: 'Load Balancer',        site: 'Boston Core',  status: 'up',       model: 'F5 BIG-IP 2200', lastSeen: '2 min ago', ports: 8,  portsUsed: 6  },
  { id: 'd9',  hostname: 'LB-BOS-02',  ip: '10.0.2.2',   type: 'Load Balancer',        site: 'Boston Core',  status: 'degraded', model: 'F5 BIG-IP 2200', lastSeen: '8 min ago', ports: 8,  portsUsed: 6  },
  // Distribution Switches
  { id: 'd10', hostname: 'DS-BOS-01',  ip: '10.2.1.1',   type: 'Distribution Switch',  site: 'Boston North', status: 'up',       model: 'Catalyst 9300', lastSeen: '2 min ago',  ports: 48, portsUsed: 31 },
  { id: 'd11', hostname: 'DS-BOS-02',  ip: '10.2.1.2',   type: 'Distribution Switch',  site: 'Boston Core',  status: 'up',       model: 'Catalyst 9300', lastSeen: '2 min ago',  ports: 48, portsUsed: 44 },
  { id: 'd12', hostname: 'DS-BOS-03',  ip: '10.2.1.3',   type: 'Distribution Switch',  site: 'Boston South', status: 'degraded', model: 'Catalyst 9300', lastSeen: '3 min ago',  ports: 48, portsUsed: 29 },
  { id: 'd13', hostname: 'DS-BOS-04',  ip: '10.2.1.4',   type: 'Distribution Switch',  site: 'Boston East',  status: 'up',       model: 'Catalyst 9300', lastSeen: '2 min ago',  ports: 48, portsUsed: 22 },
  { id: 'd14', hostname: 'DS-BOS-05',  ip: '10.2.1.5',   type: 'Distribution Switch',  site: 'Boston West',  status: 'up',       model: 'Catalyst 9500', lastSeen: '2 min ago',  ports: 48, portsUsed: 38 },
  { id: 'd15', hostname: 'DS-BOS-06',  ip: '10.2.1.6',   type: 'Distribution Switch',  site: 'Boston DR',    status: 'up',       model: 'Catalyst 9500', lastSeen: '4 min ago',  ports: 48, portsUsed: 17 },
  // Access Switches
  { id: 'd16', hostname: 'AS-BOS-01',  ip: '10.3.1.1',   type: 'Access Switch',        site: 'Boston North', status: 'up',       model: 'Catalyst 2960', lastSeen: '4 min ago',  ports: 24, portsUsed: 19 },
  { id: 'd17', hostname: 'AS-BOS-02',  ip: '10.3.1.2',   type: 'Access Switch',        site: 'Boston North', status: 'up',       model: 'Catalyst 2960', lastSeen: '4 min ago',  ports: 24, portsUsed: 14 },
  { id: 'd18', hostname: 'AS-BOS-03',  ip: '10.3.1.3',   type: 'Access Switch',        site: 'Boston Core',  status: 'up',       model: 'Catalyst 2960', lastSeen: '5 min ago',  ports: 24, portsUsed: 21 },
  { id: 'd19', hostname: 'AS-BOS-04',  ip: '10.3.1.4',   type: 'Access Switch',        site: 'Boston South', status: 'down',     model: 'Catalyst 2960', lastSeen: '47 min ago', ports: 24, portsUsed: 0  },
  { id: 'd20', hostname: 'AS-BOS-05',  ip: '10.3.1.5',   type: 'Access Switch',        site: 'Boston East',  status: 'up',       model: 'Catalyst 2960', lastSeen: '5 min ago',  ports: 24, portsUsed: 17 },
  { id: 'd21', hostname: 'AS-BOS-06',  ip: '10.3.1.6',   type: 'Access Switch',        site: 'Boston West',  status: 'up',       model: 'Catalyst 3850', lastSeen: '3 min ago',  ports: 48, portsUsed: 33 },
  { id: 'd22', hostname: 'AS-BOS-07',  ip: '10.3.1.7',   type: 'Access Switch',        site: 'Boston West',  status: 'up',       model: 'Catalyst 3850', lastSeen: '3 min ago',  ports: 48, portsUsed: 27 },
  { id: 'd23', hostname: 'AS-BOS-08',  ip: '10.3.1.8',   type: 'Access Switch',        site: 'Boston South', status: 'up',       model: 'Catalyst 2960', lastSeen: '6 min ago',  ports: 24, portsUsed: 20 },
  { id: 'd24', hostname: 'AS-BOS-09',  ip: '10.3.1.9',   type: 'Access Switch',        site: 'Boston North', status: 'degraded', model: 'Catalyst 2960', lastSeen: '12 min ago', ports: 24, portsUsed: 11 },
  { id: 'd25', hostname: 'AS-BOS-10',  ip: '10.3.1.10',  type: 'Access Switch',        site: 'Boston DR',    status: 'up',       model: 'Catalyst 3850', lastSeen: '4 min ago',  ports: 48, portsUsed: 9  },
  { id: 'd26', hostname: 'AS-BOS-11',  ip: '10.3.1.11',  type: 'Access Switch',        site: 'Boston East',  status: 'up',       model: 'Catalyst 2960', lastSeen: '5 min ago',  ports: 24, portsUsed: 22 },
  { id: 'd27', hostname: 'AS-BOS-12',  ip: '10.3.1.12',  type: 'Access Switch',        site: 'Boston Core',  status: 'up',       model: 'Catalyst 2960', lastSeen: '7 min ago',  ports: 24, portsUsed: 16 },
]

export const unusedPorts = [
  { id: 'p1',  device: 'DS-BOS-01', port: 'Gi0/0/35',  lastActive: '47 days ago', vlan: '—',   description: 'unused',             speed: '1G'   },
  { id: 'p2',  device: 'DS-BOS-01', port: 'Gi0/0/36',  lastActive: '47 days ago', vlan: '—',   description: 'unused',             speed: '1G'   },
  { id: 'p3',  device: 'DS-BOS-02', port: 'Gi0/0/12',  lastActive: '62 days ago', vlan: '100', description: 'old-server-rack-B',  speed: '1G'   },
  { id: 'p4',  device: 'DS-BOS-02', port: 'Gi0/0/13',  lastActive: '62 days ago', vlan: '100', description: 'old-server-rack-B',  speed: '1G'   },
  { id: 'p5',  device: 'DS-BOS-04', port: 'Gi0/0/28',  lastActive: '31 days ago', vlan: '200', description: 'printer-floor-3',   speed: '1G'   },
  { id: 'p6',  device: 'AS-BOS-01', port: 'Fa0/18',    lastActive: '88 days ago', vlan: '100', description: 'workstation-B18',   speed: '100M' },
  { id: 'p7',  device: 'AS-BOS-01', port: 'Fa0/19',    lastActive: '91 days ago', vlan: '100', description: 'workstation-B19',   speed: '100M' },
  { id: 'p8',  device: 'AS-BOS-02', port: 'Fa0/22',    lastActive: '35 days ago', vlan: '300', description: 'voip-desk-22',      speed: '100M' },
  { id: 'p9',  device: 'AS-BOS-03', port: 'Gi0/5',     lastActive: '40 days ago', vlan: '200', description: 'storage-node-5',   speed: '1G'   },
  { id: 'p10', device: 'AS-BOS-03', port: 'Gi0/6',     lastActive: '40 days ago', vlan: '200', description: 'storage-node-6',   speed: '1G'   },
  { id: 'p11', device: 'AS-BOS-05', port: 'Gi0/11',    lastActive: '55 days ago', vlan: '400', description: 'lab-device-11',    speed: '1G'   },
  { id: 'p12', device: 'AS-BOS-05', port: 'Gi0/12',    lastActive: '55 days ago', vlan: '400', description: 'lab-device-12',    speed: '1G'   },
  { id: 'p13', device: 'CR-BOS-01', port: 'Te0/3/0',   lastActive: '90 days ago', vlan: '—',   description: 'reserved-uplink',  speed: '10G'  },
  { id: 'p14', device: 'CR-BOS-02', port: 'Te0/3/0',   lastActive: '90 days ago', vlan: '—',   description: 'reserved-uplink',  speed: '10G'  },
]
