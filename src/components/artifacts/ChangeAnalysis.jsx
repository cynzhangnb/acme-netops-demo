import { useState, useRef, useEffect } from 'react'

const CHANGES = [
  {
    id: 1,
    device: 'CR-BOS-01',
    type: 'NTP',
    description: 'NTP server list updated; added 10.20.1.2 as secondary peer',
    timestamp: '2026-03-31 09:14 UTC',
    before: `ntp server 10.20.1.1 prefer`,
    after: `ntp server 10.20.1.1 prefer
ntp server 10.20.1.2`,
    changedLines: { before: [], after: [2] },
  },
  {
    id: 2,
    device: 'AS-BOS-01',
    type: 'VLAN',
    description: 'Interface Ethernet0/4 moved from VLAN 210 to VLAN 220',
    timestamp: '2026-04-01 14:22 UTC',
    before: `interface Ethernet0/4
 description Voice endpoint segment
 switchport access vlan 210
 auto qos voip cisco-phone
 spanning-tree portfast`,
    after: `interface Ethernet0/4
 description Voice endpoint segment
 switchport access vlan 220
 auto qos voip cisco-phone
 spanning-tree portfast`,
    changedLines: { before: [3], after: [3] },
  },
  {
    id: 3,
    device: 'DS-BOS-03',
    type: 'Logging',
    description: 'Logging buffer size increased from 64000 to 128000',
    timestamp: '2026-04-03 11:05 UTC',
    before: `logging buffered 64000 warnings
snmp-server location Boston DC / Distribution Row C`,
    after: `logging buffered 128000 warnings
snmp-server location Boston DC / Distribution Row C`,
    changedLines: { before: [1], after: [1] },
  },
  {
    id: 5,
    device: 'CR-BOS-02',
    type: 'BGP Policy',
    description: 'BGP route-policy updated; voice traffic local-preference lowered from 150 → 100',
    timestamp: '2026-04-05 23:47 UTC',
    before: `router bgp 65001
 address-family ipv4 unicast
  neighbor 10.0.0.1 route-policy VOICE-IN in
  neighbor 10.0.0.1 route-policy DEFAULT-OUT out
  neighbor 10.0.0.2 route-policy VOICE-IN in
  neighbor 10.0.0.2 route-policy DEFAULT-OUT out
 !
!
route-policy VOICE-IN
 set local-preference 150
 set community 65001:100
 pass
end-policy`,
    after: `router bgp 65001
 address-family ipv4 unicast
  neighbor 10.0.0.1 route-policy VOICE-IN-V2 in
  neighbor 10.0.0.1 route-policy DEFAULT-OUT out
  neighbor 10.0.0.2 route-policy VOICE-IN-V2 in
  neighbor 10.0.0.2 route-policy DEFAULT-OUT out
 !
!
route-policy VOICE-IN-V2
 set local-preference 100
 set community 65001:200
 pass
end-policy`,
    changedLines: { before: [3, 5, 9, 10], after: [3, 5, 9, 10] },
  },
  {
    id: 6,
    device: 'CR-BOS-02',
    type: 'Static Route',
    description: 'Static route for 10.8.3.0/24 next-hop changed to 10.0.2.1',
    timestamp: '2026-04-05 23:52 UTC',
    before: `ip route 10.8.3.0/24 10.0.1.1
ip route 10.8.3.0/24 10.0.1.2 backup`,
    after: `ip route 10.8.3.0/24 10.0.2.1
ip route 10.8.3.0/24 10.0.2.2 backup`,
    changedLines: { before: [1, 2], after: [1, 2] },
  },
  {
    id: 7,
    device: 'DS-BOS-01',
    type: 'ACL',
    description: 'ACL MGMT-ACCESS modified; new permit entry added for 10.20.5.0/24',
    timestamp: '2026-04-06 01:14 UTC',
    before: `ip access-list extended MGMT-ACCESS
 10 permit ip 10.20.1.0 0.0.0.255 any
 20 permit ip 10.20.2.0 0.0.0.255 any
 30 deny   ip any any log`,
    after: `ip access-list extended MGMT-ACCESS
 10 permit ip 10.20.1.0 0.0.0.255 any
 20 permit ip 10.20.2.0 0.0.0.255 any
 25 permit ip 10.20.5.0 0.0.0.255 any
 30 deny   ip any any log`,
    changedLines: { before: [4], after: [4, 5] },
  },
  {
    id: 8,
    device: 'DS-BOS-03',
    type: 'OSPF',
    description: 'OSPF hello interval changed from 10s → 5s on Ethernet0/1',
    timestamp: '2026-04-06 03:28 UTC',
    before: `interface Ethernet0/1
 description To CR-BOS-02
 ip address 10.1.3.1 255.255.255.252
 ip ospf hello-interval 10
 ip ospf dead-interval 40
 ip ospf network point-to-point`,
    after: `interface Ethernet0/1
 description To CR-BOS-02
 ip address 10.1.3.1 255.255.255.252
 ip ospf hello-interval 5
 ip ospf dead-interval 20
 ip ospf network point-to-point`,
    changedLines: { before: [4, 5], after: [4, 5] },
  },
  {
    id: 9,
    device: 'ER-BOS-07',
    type: 'QoS Policy',
    description: 'QoS policy WAN-QOS updated; voice class CIR reduced from 4096000 to 2048000',
    timestamp: '2026-04-06 08:41 UTC',
    before: `policy-map WAN-QOS
 class VOICE
  police rate 4096000 bps
   conform-action transmit
   exceed-action drop
 class class-default
  fair-queue`,
    after: `policy-map WAN-QOS
 class VOICE
  police rate 2048000 bps
   conform-action transmit
   exceed-action drop
 class class-default
  fair-queue`,
    changedLines: { before: [3], after: [3] },
  },
]

function DiffPanel({ change }) {
  const beforeLines = change.before.split('\n')
  const afterLines = change.after.split('\n')
  const maxLen = Math.max(beforeLines.length, afterLines.length)

  const isChanged = (lineIdx, side) => {
    const set = side === 'before' ? change.changedLines.before : change.changedLines.after
    return set.includes(lineIdx + 1)
  }

  const added = change.changedLines.after.length
  const removed = change.changedLines.before.length
  const unchanged = beforeLines.length - removed

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fffdf9' }}>
      {/* Diff header */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid #f1efea', display: 'flex', alignItems: 'center', gap: 16, background: '#fcfbf9', flexShrink: 0 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#111' }}>{change.device} — {change.type}</span>
        <span style={{ fontSize: 11, color: '#888' }}>{change.timestamp}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <span style={{ fontSize: 11, color: '#666' }}>Unchanged <strong style={{ color: '#333' }}>{unchanged}</strong></span>
          <span style={{ fontSize: 11, color: '#1a7a3f' }}>Added <strong>{added}</strong></span>
          <span style={{ fontSize: 11, color: '#c0392b' }}>Removed <strong>{removed}</strong></span>
        </div>
      </div>

      {/* Side-by-side diff */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#fffdf9' }}>
        {/* Before */}
        <div style={{ flex: 1, borderRight: '1px solid #ece9e3', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fffdf9' }}>
          <div style={{ padding: '6px 12px', background: '#fdf2f2', borderBottom: '1px solid #f0e0e0', fontSize: 11, fontWeight: 600, color: '#c0392b', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span>Before</span>
            <span style={{ color: '#888', fontWeight: 400 }}>2026-03-22</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, background: '#fffdf9' }}>
            {Array.from({ length: maxLen }, (_, i) => {
              const text = beforeLines[i] ?? ''
              const changed = isChanged(i, 'before')
              return (
                <div key={i} style={{ display: 'flex', background: changed ? '#fde8e8' : 'transparent' }}>
                  <span style={{ width: 28, paddingLeft: 8, color: '#ccc', flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>
                  <span style={{ padding: '0 10px', color: changed ? '#c0392b' : '#333', whiteSpace: 'pre' }}>{changed && text ? '- ' : '  '}{text}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* After */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fffdf9' }}>
          <div style={{ padding: '6px 12px', background: '#f0fdf4', borderBottom: '1px solid #d0f0de', fontSize: 11, fontWeight: 600, color: '#1a7a3f', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
            <span>After</span>
            <span style={{ color: '#888', fontWeight: 400 }}>2026-03-29</span>
          </div>
          <div style={{ flex: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: 11, lineHeight: 1.7, background: '#fffdf9' }}>
            {Array.from({ length: maxLen }, (_, i) => {
              const text = (change.after.split('\n'))[i] ?? ''
              const changed = isChanged(i, 'after')
              return (
                <div key={i} style={{ display: 'flex', background: changed ? '#e6f9ee' : 'transparent' }}>
                  <span style={{ width: 28, paddingLeft: 8, color: '#ccc', flexShrink: 0, userSelect: 'none' }}>{i + 1}</span>
                  <span style={{ padding: '0 10px', color: changed ? '#1a7a3f' : '#333', whiteSpace: 'pre' }}>{changed && text ? '+ ' : '  '}{text}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

const COLS = '130px 100px 1fr 160px'

function SkeletonRow() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: COLS, alignItems: 'center', padding: '7px 20px', borderBottom: '1px solid #f5f5f5' }}>
      <div style={{ height: 10, width: '70%', borderRadius: 4, background: '#ececec', animation: 'skeleton-pulse 1.4s ease-in-out infinite' }} />
      <div style={{ height: 9, width: '60%', borderRadius: 4, background: '#f0f0f0', animation: 'skeleton-pulse 1.4s ease-in-out infinite 0.08s' }} />
      <div style={{ height: 9, width: '85%', borderRadius: 4, background: '#ececec', animation: 'skeleton-pulse 1.4s ease-in-out infinite 0.05s', marginRight: 24 }} />
      <div style={{ height: 9, width: '70%', borderRadius: 4, background: '#ececec', animation: 'skeleton-pulse 1.4s ease-in-out infinite 0.15s' }} />
    </div>
  )
}

function SortIcon({ active, dir }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: active ? 1 : 0.3 }}>
      <path d="M5 1.5L5 8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
      {dir === 'asc' || !active
        ? <path d="M2.5 4L5 1.5L7.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        : <path d="M2.5 6L5 8.5L7.5 6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      }
    </svg>
  )
}

const RAW_CHANGES = [
  // ── Last 24h (>= 2026-04-05) ──────────────────────────────────────────────
  {
    id: 101, device: 'CR-BOS-01', type: 'Route Table',
    description: '2 entries added via BGP; 1 withdrawn route removed',
    timestamp: '2026-04-05 07:12 UTC',
    before: `10.8.0.0/16  via 10.0.0.1  [20/0]  BGP
10.8.3.0/24  via 10.0.1.1  [20/0]  BGP
10.9.0.0/16  via 10.0.0.2  [20/0]  BGP`,
    after: `10.8.0.0/16  via 10.0.0.1  [20/0]  BGP
10.8.3.0/24  via 10.0.2.1  [20/0]  BGP
10.9.0.0/16  via 10.0.0.2  [20/0]  BGP
10.20.99.0/24  via 10.0.0.1  [20/100]  BGP
192.168.50.0/24  via 10.0.0.3  [20/0]  BGP`,
    changedLines: { before: [2], after: [2, 4, 5] },
  },
  {
    id: 102, device: 'AS-BOS-01', type: 'ARP Table',
    description: '3 new ARP entries learned; 1 stale entry aged out',
    timestamp: '2026-04-05 08:43 UTC',
    before: `10.10.1.1   00:1a:2b:3c:4d:5e   Ethernet0/1   DYNAMIC
10.10.1.5   00:1a:2b:3c:4d:62   Ethernet0/1   DYNAMIC
10.10.2.1   00:aa:bb:cc:dd:01   Ethernet0/2   DYNAMIC
10.10.2.10  00:aa:bb:cc:dd:10   Ethernet0/2   DYNAMIC`,
    after: `10.10.1.1   00:1a:2b:3c:4d:5e   Ethernet0/1   DYNAMIC
10.10.1.5   00:1a:2b:3c:4d:62   Ethernet0/1   DYNAMIC
10.10.1.20  00:1a:2b:3c:4d:88   Ethernet0/1   DYNAMIC
10.10.2.1   00:aa:bb:cc:dd:01   Ethernet0/2   DYNAMIC
10.10.2.15  00:aa:bb:cc:dd:15   Ethernet0/2   DYNAMIC
10.10.2.30  00:aa:bb:cc:dd:30   Ethernet0/2   DYNAMIC`,
    changedLines: { before: [4], after: [3, 5, 6] },
  },
  {
    id: 103, device: 'DS-BOS-02', type: 'MAC Table',
    description: 'MAC addresses learned on Gi0/3 after port came up',
    timestamp: '2026-04-05 09:22 UTC',
    before: `VLAN  MAC Address        Type     Ports
----  -----------------  -------  ---------
10    00:11:22:33:44:55  DYNAMIC  Gi0/1
10    00:11:22:33:44:66  DYNAMIC  Gi0/2
20    00:aa:bb:cc:11:22  DYNAMIC  Gi0/2`,
    after: `VLAN  MAC Address        Type     Ports
----  -----------------  -------  ---------
10    00:11:22:33:44:55  DYNAMIC  Gi0/1
10    00:11:22:33:44:66  DYNAMIC  Gi0/2
10    00:11:22:33:44:77  DYNAMIC  Gi0/3
10    00:11:22:33:44:88  DYNAMIC  Gi0/3
20    00:aa:bb:cc:11:22  DYNAMIC  Gi0/2
20    00:aa:bb:cc:11:33  DYNAMIC  Gi0/3`,
    changedLines: { before: [], after: [5, 6, 8] },
  },
  {
    id: 104, device: 'CR-BOS-02', type: 'Route Table',
    description: 'BGP next-hop changed for 10.8.3.0/24 after policy update',
    timestamp: '2026-04-05 11:15 UTC',
    before: `10.0.0.0/8   via 10.0.0.1  [20/0]  BGP
10.8.3.0/24  via 10.0.1.1  [20/0]  BGP
172.16.0.0/12  via 10.0.0.1  [1/0]  STATIC`,
    after: `10.0.0.0/8   via 10.0.0.1  [20/0]  BGP
10.8.3.0/24  via 10.0.2.1  [20/0]  BGP
172.16.0.0/12  via 10.0.0.1  [1/0]  STATIC`,
    changedLines: { before: [2], after: [2] },
  },
  {
    id: 105, device: 'DS-BOS-01', type: 'STP Table',
    description: 'Gi0/2 transitioned from Designated to Root port (VLAN 10)',
    timestamp: '2026-04-05 13:30 UTC',
    before: `VLAN0010
 Root ID  Priority 4106  Address 00aa.bbcc.dd01  Cost 4  Port Gi0/1
 Bridge ID Priority 8202  Address 00aa.bbcc.dd02
 Interface  Role  Sts  Cost  Prio.Nbr  Type
 ---------  ----  ---  ----  --------  -------
 Gi0/1      Root  FWD  4     128.1     P2p
 Gi0/2      Desg  FWD  4     128.2     P2p
 Gi0/3      Desg  FWD  4     128.3     P2p`,
    after: `VLAN0010
 Root ID  Priority 4106  Address 00aa.bbcc.dd01  Cost 4  Port Gi0/2
 Bridge ID Priority 8202  Address 00aa.bbcc.dd02
 Interface  Role  Sts  Cost  Prio.Nbr  Type
 ---------  ----  ---  ----  --------  -------
 Gi0/1      Altn  BLK  4     128.1     P2p
 Gi0/2      Root  FWD  4     128.2     P2p
 Gi0/3      Desg  FWD  4     128.3     P2p`,
    changedLines: { before: [2, 6, 7], after: [2, 6, 7] },
  },
  {
    id: 106, device: 'ER-BOS-07', type: 'Configuration File',
    description: 'WAN interface QoS policy attachment changed',
    timestamp: '2026-04-05 14:05 UTC',
    before: `interface GigabitEthernet0/0
 description WAN-Uplink-Primary
 ip address 203.0.113.2 255.255.255.252
 service-policy output LAN-QOS
 no shutdown`,
    after: `interface GigabitEthernet0/0
 description WAN-Uplink-Primary
 ip address 203.0.113.2 255.255.255.252
 service-policy output WAN-QOS
 no shutdown`,
    changedLines: { before: [4], after: [4] },
  },
  {
    id: 107, device: 'DS-BOS-03', type: 'NDP Table',
    description: 'IPv6 neighbor entries refreshed; 2 new hosts discovered',
    timestamp: '2026-04-05 16:22 UTC',
    before: `IPv6 Address                  Age  Link-layer Addr   State  Interface
fe80::1a2b:3c4d:5e6f:7a8b    12   00:1a:2b:3c:4d:5e  REACH  Eth0/1
2001:db8:1::10               45   00:aa:bb:cc:dd:10  REACH  Eth0/2`,
    after: `IPv6 Address                  Age  Link-layer Addr   State  Interface
fe80::1a2b:3c4d:5e6f:7a8b    0    00:1a:2b:3c:4d:5e  REACH  Eth0/1
2001:db8:1::10               0    00:aa:bb:cc:dd:10  REACH  Eth0/2
2001:db8:1::20               0    00:aa:bb:cc:dd:20  REACH  Eth0/2
fe80::2b3c:4d5e:6f7a:8b9c    0    00:2b:3c:4d:5e:6f  REACH  Eth0/3`,
    changedLines: { before: [2, 3], after: [2, 3, 4, 5] },
  },
  {
    id: 108, device: 'CR-BOS-02', type: 'Access Policy',
    description: 'MGMT-ACCESS ACL: permit entry added for 10.20.5.0/24',
    timestamp: '2026-04-05 18:44 UTC',
    before: `ip access-list extended MGMT-ACCESS
 10 permit ip 10.20.1.0 0.0.0.255 any
 20 permit ip 10.20.2.0 0.0.0.255 any
 30 deny   ip any any log`,
    after: `ip access-list extended MGMT-ACCESS
 10 permit ip 10.20.1.0 0.0.0.255 any
 20 permit ip 10.20.2.0 0.0.0.255 any
 25 permit ip 10.20.5.0 0.0.0.255 any
 30 deny   ip any any log`,
    changedLines: { before: [], after: [4] },
  },
  {
    id: 109, device: 'AS-BOS-02', type: 'MAC Table',
    description: 'Stale MAC entries aged out after idle timeout on Gi0/5',
    timestamp: '2026-04-05 20:11 UTC',
    before: `VLAN  MAC Address        Type     Ports
----  -----------------  -------  ---------
30    00:de:ad:be:ef:01  DYNAMIC  Gi0/5
30    00:de:ad:be:ef:02  DYNAMIC  Gi0/5
30    00:de:ad:be:ef:03  DYNAMIC  Gi0/5
40    00:fe:ed:fa:ce:01  DYNAMIC  Gi0/6`,
    after: `VLAN  MAC Address        Type     Ports
----  -----------------  -------  ---------
30    00:de:ad:be:ef:01  DYNAMIC  Gi0/5
40    00:fe:ed:fa:ce:01  DYNAMIC  Gi0/6`,
    changedLines: { before: [3, 4, 5], after: [] },
  },
  {
    id: 110, device: 'CR-BOS-01', type: 'NCT Table',
    description: 'OSPF adjacency to DS-BOS-03 flapped; re-established',
    timestamp: '2026-04-05 22:58 UTC',
    before: `Neighbor ID    Pri  State       Dead Time  Address     Interface
10.1.1.2       1    FULL/DR     00:00:38   10.1.1.2    Eth0/0
10.1.3.1       1    FULL/DR     00:00:35   10.1.3.1    Eth0/2
10.1.2.1       1    FULL/BDR    00:00:39   10.1.2.1    Eth0/1`,
    after: `Neighbor ID    Pri  State       Dead Time  Address     Interface
10.1.1.2       1    FULL/DR     00:00:38   10.1.1.2    Eth0/0
10.1.3.1       1    FULL/DR     00:00:10   10.1.3.1    Eth0/2
10.1.2.1       1    FULL/BDR    00:00:39   10.1.2.1    Eth0/1`,
    changedLines: { before: [3], after: [3] },
  },
  // ── Last 7d (2026-03-31 – 2026-04-04) ─────────────────────────────────────
  {
    id: 111, device: 'DS-BOS-01', type: 'ARP Table',
    description: 'Stale ARP entry for 10.10.3.99 removed after host decommission',
    timestamp: '2026-04-02 09:15 UTC',
    before: `10.10.3.1   00:cc:dd:ee:ff:01   Ethernet0/3   DYNAMIC
10.10.3.50  00:cc:dd:ee:ff:50   Ethernet0/3   DYNAMIC
10.10.3.99  00:cc:dd:ee:ff:99   Ethernet0/3   DYNAMIC`,
    after: `10.10.3.1   00:cc:dd:ee:ff:01   Ethernet0/3   DYNAMIC
10.10.3.50  00:cc:dd:ee:ff:50   Ethernet0/3   DYNAMIC`,
    changedLines: { before: [3], after: [] },
  },
  {
    id: 112, device: 'CR-BOS-02', type: 'Configuration File',
    description: 'BGP neighbor 10.0.0.3 added for peering with new upstream',
    timestamp: '2026-04-03 10:30 UTC',
    before: `router bgp 65001
 neighbor 10.0.0.1 remote-as 65100
 neighbor 10.0.0.2 remote-as 65200
 !
 address-family ipv4
  neighbor 10.0.0.1 activate
  neighbor 10.0.0.2 activate`,
    after: `router bgp 65001
 neighbor 10.0.0.1 remote-as 65100
 neighbor 10.0.0.2 remote-as 65200
 neighbor 10.0.0.3 remote-as 65300
 !
 address-family ipv4
  neighbor 10.0.0.1 activate
  neighbor 10.0.0.2 activate
  neighbor 10.0.0.3 activate`,
    changedLines: { before: [], after: [4, 9] },
  },
  {
    id: 113, device: 'AS-BOS-01', type: 'STP Table',
    description: 'Topology change detected; Gi0/4 moved to blocking state (VLAN 20)',
    timestamp: '2026-04-03 14:22 UTC',
    before: `VLAN0020
 Root ID  Priority 4116  Address 00aa.bbcc.dd11  Cost 4  Port Gi0/1
 Interface  Role  Sts  Cost  Prio.Nbr
 Gi0/1      Root  FWD  4     128.1
 Gi0/4      Desg  FWD  4     128.4`,
    after: `VLAN0020
 Root ID  Priority 4116  Address 00aa.bbcc.dd11  Cost 4  Port Gi0/1
 Interface  Role  Sts  Cost  Prio.Nbr
 Gi0/1      Root  FWD  4     128.1
 Gi0/4      Altn  BLK  4     128.4`,
    changedLines: { before: [5], after: [5] },
  },
  {
    id: 114, device: 'DS-BOS-03', type: 'Access Policy',
    description: 'GUEST-RESTRICT ACL tightened; HTTP permit changed to deny',
    timestamp: '2026-04-04 11:05 UTC',
    before: `ip access-list extended GUEST-RESTRICT
 10 permit tcp 192.168.100.0 0.0.0.255 any eq 80
 20 permit tcp 192.168.100.0 0.0.0.255 any eq 443
 30 deny   ip any any`,
    after: `ip access-list extended GUEST-RESTRICT
 10 deny   tcp 192.168.100.0 0.0.0.255 any eq 80
 20 permit tcp 192.168.100.0 0.0.0.255 any eq 443
 30 deny   ip any any`,
    changedLines: { before: [2], after: [2] },
  },
  {
    id: 115, device: 'ER-BOS-07', type: 'Route Table',
    description: 'Static route for 10.99.0.0/16 added for new branch office',
    timestamp: '2026-04-04 16:48 UTC',
    before: `10.0.0.0/8    via 10.0.0.1  [20/0]  BGP
172.16.0.0/12  via 10.0.0.1  [1/0]  STATIC`,
    after: `10.0.0.0/8    via 10.0.0.1  [20/0]  BGP
10.99.0.0/16  via 203.0.113.1  [1/0]  STATIC
172.16.0.0/12  via 10.0.0.1  [1/0]  STATIC`,
    changedLines: { before: [], after: [2] },
  },
  // ── Last 30d (2026-03-01 – 2026-03-30) ────────────────────────────────────
  {
    id: 116, device: 'CR-BOS-01', type: 'Configuration File',
    description: 'NTP server list updated; secondary peer added',
    timestamp: '2026-03-15 08:12 UTC',
    before: `ntp server 10.20.1.1 prefer`,
    after: `ntp server 10.20.1.1 prefer
ntp server 10.20.1.2`,
    changedLines: { before: [], after: [2] },
  },
  {
    id: 117, device: 'DS-BOS-02', type: 'NDP Table',
    description: 'New IPv6 host 2001:db8:2::50 discovered on Eth0/3',
    timestamp: '2026-03-18 11:44 UTC',
    before: `IPv6 Address                  Age  Link-layer Addr   State  Interface
2001:db8:2::10               30   00:bb:cc:dd:ee:10  REACH  Eth0/3`,
    after: `IPv6 Address                  Age  Link-layer Addr   State  Interface
2001:db8:2::10               0    00:bb:cc:dd:ee:10  REACH  Eth0/3
2001:db8:2::50               0    00:bb:cc:dd:ee:50  REACH  Eth0/3`,
    changedLines: { before: [2], after: [2, 3] },
  },
  {
    id: 118, device: 'AS-BOS-01', type: 'NCT Table',
    description: 'LLDP neighbor on Gi0/2 changed from DS-BOS-01 to DS-BOS-04',
    timestamp: '2026-03-22 09:33 UTC',
    before: `Local Intf  Capability  Platform      Neighbor ID
Gi0/1       R S         WS-C3750    CR-BOS-01
Gi0/2       S           WS-C3560    DS-BOS-01
Gi0/3       S           WS-C3560    DS-BOS-02`,
    after: `Local Intf  Capability  Platform      Neighbor ID
Gi0/1       R S         WS-C3750    CR-BOS-01
Gi0/2       S           WS-C3560    DS-BOS-04
Gi0/3       S           WS-C3560    DS-BOS-02`,
    changedLines: { before: [3], after: [3] },
  },
  {
    id: 119, device: 'CR-BOS-02', type: 'MAC Table',
    description: 'MAC table flushed on VLAN 30 after trunk reconfiguration',
    timestamp: '2026-03-25 15:20 UTC',
    before: `VLAN  MAC Address        Type     Ports
----  -----------------  -------  ---------
30    00:11:22:33:44:01  DYNAMIC  Gi0/8
30    00:11:22:33:44:02  DYNAMIC  Gi0/8
30    00:11:22:33:44:03  DYNAMIC  Gi0/8`,
    after: `VLAN  MAC Address        Type     Ports
----  -----------------  -------  ---------`,
    changedLines: { before: [3, 4, 5], after: [] },
  },
  {
    id: 120, device: 'DS-BOS-01', type: 'Access Policy',
    description: 'SERVER-PROTECT policy applied to Eth0/5 inbound',
    timestamp: '2026-03-28 10:05 UTC',
    before: `interface Ethernet0/5
 description Server-Segment-A
 ip address 10.30.5.1 255.255.255.0
 no shutdown`,
    after: `interface Ethernet0/5
 description Server-Segment-A
 ip address 10.30.5.1 255.255.255.0
 ip access-group SERVER-PROTECT in
 no shutdown`,
    changedLines: { before: [], after: [4] },
  },
]

const RAW_CHANGE_TYPES = ['All', 'Configuration File', 'Route Table', 'ARP Table', 'MAC Table', 'NDP Table', 'STP Table', 'NCT Table', 'Access Policy']

const TIME_OPTIONS = [
  { value: 'last-24h', label: 'Last 24 hours' },
  { value: 'last-7d', label: 'Last 7 days' },
  { value: 'last-30d', label: 'Last 30 days' },
]

const CHANGE_TYPES = ['All', 'NTP', 'VLAN', 'Logging', 'BGP Policy', 'Static Route', 'ACL', 'OSPF', 'QoS Policy']

export default function ChangeAnalysis({ filter }) {
  const isSidebar = filter === 'sidebar'
  const sourceChanges = isSidebar ? RAW_CHANGES : CHANGES
  const sourceTypes = isSidebar ? RAW_CHANGE_TYPES : CHANGE_TYPES

  const [selected, setSelected] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [diffH, setDiffH] = useState(null)
  const [sortKey, setSortKey] = useState('timestamp')
  const [sortDir, setSortDir] = useState('asc')
  const [query, setQuery] = useState('')
  const [timeFilter, setTimeFilter] = useState('last-24h')
  const [changeTypeFilter, setChangeTypeFilter] = useState('all')

  const filteredChanges = (() => {
    let result = sourceChanges
    if (timeFilter === 'last-24h') result = result.filter(c => c.timestamp >= '2026-04-05')
    else if (timeFilter === 'last-7d') result = result.filter(c => c.timestamp >= '2026-03-31')
    if (changeTypeFilter !== 'all') result = result.filter(c => c.type === changeTypeFilter)
    return result
  })()

  const isResizing = useRef(false)
  const startData = useRef({})
  const containerRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 1400)
    return () => clearTimeout(t)
  }, [])

  // Set default diffH to 70% of container height after mount
  useEffect(() => {
    if (containerRef.current && diffH === null) {
      setDiffH(Math.round(containerRef.current.offsetHeight * 0.70))
    }
  }, [diffH])

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const q = query.trim().toLowerCase()
  const queriedChanges = q
    ? filteredChanges.filter(c =>
        c.device.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.timestamp.toLowerCase().includes(q)
      )
    : filteredChanges

  const sortedChanges = [...queriedChanges].sort((a, b) => {
    const va = a[sortKey] ?? '', vb = b[sortKey] ?? ''
    return sortDir === 'asc' ? String(va).localeCompare(String(vb)) : String(vb).localeCompare(String(va))
  })

  function startResize(e) {
    isResizing.current = true
    startData.current = { startY: e.clientY, startH: diffH }
    e.preventDefault()
  }

  useEffect(() => {
    function onMouseMove(e) {
      if (!isResizing.current) return
      const { startY, startH } = startData.current
      const dy = startY - e.clientY
      const containerH = containerRef.current?.offsetHeight || 600
      const newH = Math.max(120, Math.min(containerH - 100, startH + dy))
      setDiffH(newH)
    }
    function onMouseUp() { isResizing.current = false }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* Table — fills remaining space */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {/* Filter bar */}
        <div style={{ padding: '9px 16px 9px 20px', borderBottom: '1px solid #e8e8e8', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Event count — left anchor */}
          <div style={{ fontSize: 12, color: '#444', fontWeight: 500, flexShrink: 0 }}>
            {queriedChanges.length} event{queriedChanges.length !== 1 ? 's' : ''}
          </div>
          {/* Spacer */}
          <div style={{ flex: 1 }} />
          {/* Time dropdown */}
          <select
            value={timeFilter}
            onChange={e => { setTimeFilter(e.target.value); setSelected(null) }}
            style={{ height: 28, padding: '0 24px 0 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, color: '#222', background: '#fafafa', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            {TIME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {/* Change Type dropdown */}
          <select
            value={changeTypeFilter}
            onChange={e => { setChangeTypeFilter(e.target.value); setSelected(null) }}
            style={{ height: 28, padding: '0 24px 0 8px', border: '1px solid #e0e0e0', borderRadius: 6, fontSize: 12, color: '#222', background: '#fafafa', outline: 'none', cursor: 'pointer', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center' }}
          >
            {sourceTypes.map(t => <option key={t} value={t === 'All' ? 'all' : t}>{t === 'All' ? 'All Change Types' : t}</option>)}
          </select>
          {/* Search bar */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ position: 'absolute', left: 8, pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Search…"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelected(null) }}
              style={{
                paddingLeft: 28, paddingRight: 10, height: 28,
                border: '1px solid #e0e0e0', borderRadius: 6,
                fontSize: 12, color: '#222', background: '#fafafa',
                outline: 'none', width: 180,
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#378ADD'; e.currentTarget.style.background = '#fff' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#e0e0e0'; e.currentTarget.style.background = '#fafafa' }}
            />
          </div>
        </div>

        {/* Column headers */}
        <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '6px 20px', borderBottom: '1px solid #f0f0f0', background: '#fafafa', flexShrink: 0 }}>
          {[
            { key: 'device', label: 'DEVICE' },
            { key: 'type', label: 'CHANGE TYPE' },
            { key: 'description', label: 'DESCRIPTION' },
            { key: 'timestamp', label: 'TIMESTAMP' },
          ].map(col => (
            <div
              key={col.key}
              onClick={() => handleSort(col.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none', paddingRight: col.key === 'description' ? 24 : 0 }}
            >
              <span style={{ fontSize: 11.5, fontWeight: 500, color: sortKey === col.key ? '#333' : '#888' }}>{col.label}</span>
              <SortIcon active={sortKey === col.key} dir={sortDir} />
            </div>
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <>
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
              <SkeletonRow /><SkeletonRow /><SkeletonRow />
              <SkeletonRow /><SkeletonRow />
            </>
          ) : sortedChanges.map(change => {
            const isActive = selected?.id === change.id
            return (
              <div
                key={change.id}
                onClick={() => setSelected(isActive ? null : change)}
                style={{
                  display: 'grid', gridTemplateColumns: COLS, alignItems: 'center',
                  padding: '7px 20px',
                  borderBottom: '1px solid #f5f5f5', cursor: 'pointer', transition: 'background 0.1s',
                  background: isActive ? '#f0f5ff' : 'transparent',
                  borderLeft: isActive ? '2px solid #2563eb' : '2px solid transparent',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8f8f8' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                <div style={{ fontSize: 12, fontWeight: 400, color: '#111', paddingRight: 12 }}>{change.device}</div>
                <div style={{ fontSize: 12, color: '#555', paddingRight: 12 }}>{change.type}</div>
                <div style={{ fontSize: 12, color: '#333', paddingRight: 24 }}>{change.description}</div>
                <div style={{ fontSize: 12, color: '#666' }}>{change.timestamp}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Drag handle + diff pane — only shown when a row is selected and dimensions are ready */}
      {selected && diffH !== null && (
        <>
          {/* Horizontal resize handle */}
          <div
            onMouseDown={startResize}
            style={{ height: 4, flexShrink: 0, cursor: 'row-resize', background: 'transparent', position: 'relative', zIndex: 10 }}
            onMouseEnter={e => e.currentTarget.style.background = '#e0e0e0'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ position: 'absolute', left: 0, right: 0, top: 1, height: 1, background: '#e4e4e4' }} />
          </div>

          {/* Diff pane */}
          <div style={{ height: diffH, flexShrink: 0, borderTop: '1px solid #e8e8e8', overflow: 'hidden' }}>
            <DiffPanel change={selected} />
          </div>
        </>
      )}
    </div>
  )
}
