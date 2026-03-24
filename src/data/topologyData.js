export const bostonTopology = {
  nodes: [
    // WAN
    { id: 'wan-cloud', label: 'Internet / WAN', type: 'cloud', x: 500, y: 60, status: 'up' },
    // Firewall
    { id: 'fw-bos-01', label: 'FW-BOS-01', type: 'firewall', x: 500, y: 155, status: 'up', ip: '10.0.1.1', site: 'boston-core', model: 'ASA 5585' },
    // Core Routers
    { id: 'cr-bos-01', label: 'CR-BOS-01', type: 'core-router', x: 330, y: 265, status: 'up', ip: '10.1.1.1', site: 'boston-core', model: 'ASR 9001' },
    { id: 'cr-bos-02', label: 'CR-BOS-02', type: 'core-router', x: 670, y: 265, status: 'up', ip: '10.1.1.2', site: 'boston-core', model: 'ASR 9001' },
    // Distribution Switches
    { id: 'ds-bos-01', label: 'DS-BOS-01', type: 'distribution-switch', x: 160, y: 385, status: 'up', ip: '10.2.1.1', site: 'boston-north', model: 'Catalyst 9300' },
    { id: 'ds-bos-02', label: 'DS-BOS-02', type: 'distribution-switch', x: 380, y: 385, status: 'up', ip: '10.2.1.2', site: 'boston-core', model: 'Catalyst 9300' },
    { id: 'ds-bos-03', label: 'DS-BOS-03', type: 'distribution-switch', x: 620, y: 385, status: 'degraded', ip: '10.2.1.3', site: 'boston-south', model: 'Catalyst 9300' },
    { id: 'ds-bos-04', label: 'DS-BOS-04', type: 'distribution-switch', x: 840, y: 385, status: 'up', ip: '10.2.1.4', site: 'boston-east', model: 'Catalyst 9300' },
    // Access Switches
    { id: 'as-bos-01', label: 'AS-BOS-01', type: 'access-switch', x: 100, y: 500, status: 'up', ip: '10.3.1.1', site: 'boston-north', model: 'Catalyst 2960', vlans: [100, 200] },
    { id: 'as-bos-02', label: 'AS-BOS-02', type: 'access-switch', x: 240, y: 500, status: 'up', ip: '10.3.1.2', site: 'boston-north', model: 'Catalyst 2960', vlans: [100, 300] },
    { id: 'as-bos-03', label: 'AS-BOS-03', type: 'access-switch', x: 380, y: 500, status: 'up', ip: '10.3.1.3', site: 'boston-core', model: 'Catalyst 2960', vlans: [200, 400] },
    { id: 'as-bos-04', label: 'AS-BOS-04', type: 'access-switch', x: 620, y: 500, status: 'down', ip: '10.3.1.4', site: 'boston-south', model: 'Catalyst 2960', vlans: [100] },
    { id: 'as-bos-05', label: 'AS-BOS-05', type: 'access-switch', x: 840, y: 500, status: 'up', ip: '10.3.1.5', site: 'boston-east', model: 'Catalyst 2960', vlans: [300, 400] },
  ],

  edges: [
    { id: 'e-wan-fw', source: 'wan-cloud', target: 'fw-bos-01', bandwidth: '10G', utilization: 0.45, type: 'wan' },
    { id: 'e-fw-cr1', source: 'fw-bos-01', target: 'cr-bos-01', bandwidth: '10G', utilization: 0.30, type: 'core' },
    { id: 'e-fw-cr2', source: 'fw-bos-01', target: 'cr-bos-02', bandwidth: '10G', utilization: 0.35, type: 'core' },
    { id: 'e-cr1-cr2', source: 'cr-bos-01', target: 'cr-bos-02', bandwidth: '10G', utilization: 0.20, type: 'core' },
    { id: 'e-cr1-ds1', source: 'cr-bos-01', target: 'ds-bos-01', bandwidth: '10G', utilization: 0.22, type: 'core' },
    { id: 'e-cr1-ds2', source: 'cr-bos-01', target: 'ds-bos-02', bandwidth: '10G', utilization: 0.55, type: 'core' },
    { id: 'e-cr2-ds3', source: 'cr-bos-02', target: 'ds-bos-03', bandwidth: '10G', utilization: 0.78, type: 'core' },
    { id: 'e-cr2-ds4', source: 'cr-bos-02', target: 'ds-bos-04', bandwidth: '10G', utilization: 0.40, type: 'core' },
    { id: 'e-ds1-as1', source: 'ds-bos-01', target: 'as-bos-01', bandwidth: '1G', utilization: 0.15, type: 'access' },
    { id: 'e-ds1-as2', source: 'ds-bos-01', target: 'as-bos-02', bandwidth: '1G', utilization: 0.22, type: 'access' },
    { id: 'e-ds2-as3', source: 'ds-bos-02', target: 'as-bos-03', bandwidth: '1G', utilization: 0.60, type: 'access' },
    { id: 'e-ds3-as4', source: 'ds-bos-03', target: 'as-bos-04', bandwidth: '1G', utilization: 0.0, type: 'access' },
    { id: 'e-ds4-as5', source: 'ds-bos-04', target: 'as-bos-05', bandwidth: '1G', utilization: 0.33, type: 'access' },
  ],

  highlightGroups: {
    vlan100: {
      nodes: ['as-bos-01', 'as-bos-02', 'as-bos-04'],
      edges: ['e-ds1-as1', 'e-ds1-as2', 'e-ds3-as4'],
      color: '#8b5cf6',
      label: 'VLAN 100 — Management',
    },
    routing: {
      nodes: ['cr-bos-01', 'cr-bos-02', 'ds-bos-02', 'ds-bos-03', 'fw-bos-01'],
      edges: ['e-fw-cr1', 'e-fw-cr2', 'e-cr1-cr2', 'e-cr1-ds2', 'e-cr2-ds3'],
      color: '#2563eb',
      label: 'OSPF Area 0 — Backbone',
    },
  },
}
