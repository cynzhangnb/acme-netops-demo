// Mock AI response registry — keyword-matched responses for demo scenarios

const TROUBLESHOOT_VOICE_CONTENT = `## Diagnosis Summary
Voice traffic degradation is most likely caused by a recent BGP policy change on Core-Router-2, which altered route selection and introduced asymmetric routing.

[ARTIFACT]

## Key Findings

### Recent network change
- BGP policy updated on Core-Router-2 (~2 hours ago), modifying route preference for voice traffic
- Static route updated for 10.8.3.0/24, changing next-hop selection

→ View Change Analysis

### Routing inconsistency
- Route to 10.8.3.0/24 differs from baseline snapshot
- Next-hop selection has changed

→ Compare Route Table

### Path analysis
- Traffic path shows asymmetry between forward and return routes
- Latency spike observed at Core-Router-2 → Edge-Router-7

### Performance impact
- Traffic increased from 18 Mbps to 50 Mbps over the past 12 days
- Peak utilization reached 78%, approaching threshold

→ View Traffic Trend`

// Shared explore response content — used by both 'explore' and 'boston' keyword matches
const EXPLORE_RESPONSE_CONTENT = `Here's a high-level view of the Boston data center. It follows a standard 3-tier architecture with clear separation between core, distribution, and access layers.

**Scope:**
- 127 devices · 3 tiers · 18 segments (42 VLANs)

**Structure:**
- Core layer (top): 2 routers providing backbone connectivity
- Distribution layer (middle): 6 switches aggregating traffic
- Access layer (bottom): 45 switches connecting end systems

Each access switch connects upstream through distribution to the core, forming a hierarchical structure.

**Key Insight:**
Traffic is aggregated at the distribution layer, making it a critical point for performance and troubleshooting.

**You can explore further:**
- how routing is handled across layers
- how the network is segmented
- connections for a specific device or switch`

const DRAW_CHANGES_MAP_CONTENT = `Generated a map with the **6 devices** that had configuration changes in the last 7 days.`

const DRAW_CHANGES_MAP_24H_CONTENT = `Generated a map with the **4 devices** that had configuration changes in the last 24 hours.`

const RECENT_CHANGES_CONTENT = `**8 configuration changes detected** in the last 7 days across the Boston network.

- **CR-BOS-01** — NTP server list updated; added 10.20.1.2 as secondary peer
- **AS-BOS-01** — Interface Ethernet0/4 moved from VLAN 210 to VLAN 220
- **DS-BOS-03** — Logging buffer size increased from 64000 to 128000
- **CR-BOS-02** — BGP route-policy updated; voice traffic local-preference lowered from 150 → 100
- **CR-BOS-02** — Static route for 10.8.3.0/24 next-hop changed to 10.0.2.1
- **DS-BOS-01** — ACL \`MGMT-ACCESS\` modified; new permit entry added for 10.20.5.0/24
- **DS-BOS-03** — OSPF hello interval changed from 10s → 5s on Ethernet0/1
- **ER-BOS-07** — QoS policy \`WAN-QOS\` updated; voice class CIR reduced from 4096000 to 2048000

→ View Change Analysis`

const CHANGES_24H_CONTENT = `Filtered to last 24 hours — **5 configuration changes** detected.

- **CR-BOS-02** — BGP route-policy updated; voice traffic local-preference lowered from 150 → 100
- **CR-BOS-02** — Static route for 10.8.3.0/24 next-hop changed to 10.0.2.1
- **DS-BOS-01** — ACL \`MGMT-ACCESS\` modified; new permit entry added for 10.20.5.0/24
- **DS-BOS-03** — OSPF hello interval changed from 10s → 5s on Ethernet0/1
- **ER-BOS-07** — QoS policy \`WAN-QOS\` updated; voice class CIR reduced from 4096000 to 2048000

→ View Change Analysis`

const QOS_CIR_CONTENT = `**ER-BOS-07**, **DS-BOS-03**, and **AS-BOS-03** have voice CIR below 4,096,000. Expand any row to see the relevant configuration.`

const SERIAL_7D_CONTENT = `Added serial numbers to the **6 devices** with configuration changes in the **last 7 days**.`

const SERIAL_24H_CONTENT = `Added serial numbers to the **4 devices** with configuration changes in the **last 24 hours**.`

const IOS_VERSION_7D_CONTENT = `Showing OS versions for the **6 devices** with changes in the **last 7 days**.

- 2 devices are running outdated OS versions — **CR-BOS-01** (21.2R3-S2) and **DS-BOS-03** (17.06.03)
- Recommend scheduling upgrades during the next maintenance window`

const IOS_VERSION_24H_CONTENT = `Showing OS versions for the **4 devices** with changes in the **last 24 hours**.

- 1 device is running an outdated OS version — **DS-BOS-03** (17.06.03)
- Recommend scheduling an upgrade during the next maintenance window`

const TORONTO_BGP_CONTENT = `**2 BGP policy changes detected** in Toronto in the last 7 days.

- **TR-TOR-CR-01** — BGP route-policy updated; local-preference lowered from 200 → 150 on peer 172.16.4.2
- **TR-TOR-CR-02** — BGP neighbor policy modified; inbound route filter updated for AS65001

→ View Change Analysis`

const BGP_DESIGN_CONTENT = `Displaying BGP topology for the current network

- 3 devices are participating in BGP
- **CR-BOS-01** and **CR-BOS-02** form an iBGP relationship
- **ER-BOS-07** connects via eBGP`

const CRC_ERRORS_CONTENT = `CRC errors detected on 2 links within the current view. CRC errors on CR-BOS-02 ↔ DS-BOS-01 may impact BGP connectivity observed in this topology.`

const OSPF_DESIGN_CONTENT = `Highlighting OSPF topology on the current map.

- OSPF handles local routing between distribution and access switches
- **DS-BOS-01** peers with **AS-BOS-01** via OSPF (Area 0)
- Note: **DS-BOS-03** recently changed its OSPF hello interval from 10s → 5s on Ethernet0/1`

const DEVICE_INFO_CONTENT = `**US-BOS-R1** · Cisco Router

**Overview**
- Management IP: 10.8.1.51
- Model: CGS-MGS-AGS
- OS: IOS 15.7(3)M2
- Location: Boston

**Network Status**
- BGP: Enabled (5 neighbors)
- SD-WAN: Disabled
- Cluster: Disabled

**System**
- Serial Number: 69230604
- Memory: 883,975,308
- Last Discovery: Apr 8, 2026

**Interfaces**
- 30 interfaces (Ethernet, Loopback, Tunnel)`

export const responseRegistry = [
  {
    id: 'device-info',
    keywords: ['device details', 'us-bos-r1'],
    priority: 20,
    response: {
      content: DEVICE_INFO_CONTENT,
      artifactType: 'deviceInfo',
      artifactLabel: 'US-BOS-R1 Properties',
      artifactDataKey: 'us-bos-r1',
    },
    sideEffects: [],
  },
  {
    id: 'draw-changes-map',
    keywords: [],
    priority: 16,
    response: {
      content: DRAW_CHANGES_MAP_CONTENT,
      artifactType: 'changesMap',
      artifactLabel: 'Changed Devices — Last 7 days',
      artifactDataKey: null,
    },
    sideEffects: [],
  },
  {
    id: 'draw-changes-map-24h',
    keywords: [],
    priority: 16,
    response: {
      content: DRAW_CHANGES_MAP_24H_CONTENT,
      artifactType: 'changesMap',
      artifactLabel: 'Changed Devices — Last 24h',
      artifactDataKey: 'last-24h',
    },
    sideEffects: [],
  },
  {
    id: 'changes-24h',
    keywords: ['last 24'],
    priority: 15,
    response: {
      content: CHANGES_24H_CONTENT,
      artifactType: 'changeAnalysis',
      artifactLabel: 'Recent Changes · Last 24h',
      artifactDataKey: 'last-24h',
    },
    sideEffects: [],
  },
  {
    id: 'recent-changes',
    keywords: ['configuration changes'],
    priority: 14,
    response: {
      content: RECENT_CHANGES_CONTENT,
      artifactType: null,
      artifactLabel: null,
      artifactDataKey: null,
    },
    sideEffects: [],
  },
  {
    id: 'qos-cir',
    keywords: ['cir'],
    priority: 14,
    response: {
      content: QOS_CIR_CONTENT,
      artifactType: 'qosTable',
      artifactLabel: 'Voice CIR Report',
      artifactDataKey: null,
    },
    sideEffects: [],
  },
  {
    id: 'serial-7d',
    keywords: [],
    priority: 17,
    response: {
      content: SERIAL_7D_CONTENT,
      artifactType: 'iosVersionTable',
      artifactLabel: 'OS Versions',
      artifactDataKey: 'serial',
    },
    sideEffects: [],
  },
  {
    id: 'serial-24h',
    keywords: [],
    priority: 17,
    response: {
      content: SERIAL_24H_CONTENT,
      artifactType: 'iosVersionTable',
      artifactLabel: 'OS Versions',
      artifactDataKey: 'last-24h-serial',
    },
    sideEffects: [],
  },
  {
    id: 'ios-version-7d',
    keywords: [],
    priority: 16,
    response: {
      content: IOS_VERSION_7D_CONTENT,
      artifactType: 'iosVersionTable',
      artifactLabel: 'IOS Versions',
      artifactDataKey: null,
    },
    sideEffects: [],
  },
  {
    id: 'ios-version-24h',
    keywords: [],
    priority: 16,
    response: {
      content: IOS_VERSION_24H_CONTENT,
      artifactType: 'iosVersionTable',
      artifactLabel: 'IOS Versions',
      artifactDataKey: 'last-24h',
    },
    sideEffects: [],
  },
  {
    id: 'toronto-bgp',
    keywords: ['toronto', 'bgp'],
    priority: 18,
    response: {
      content: TORONTO_BGP_CONTENT,
      artifactType: 'changeAnalysis',
      artifactLabel: 'Toronto BGP Changes',
      artifactDataKey: null,
    },
    sideEffects: [],
  },
  {
    id: 'bgp-design',
    keywords: ['bgp'],
    priority: 16,
    response: {
      content: BGP_DESIGN_CONTENT,
      artifactType: null,
      artifactLabel: null,
      artifactDataKey: null,
    },
    sideEffects: [
      { type: 'setChangesMapOverlay', value: 'bgp' },
    ],
  },
  {
    id: 'crc-errors',
    keywords: ['crc'],
    priority: 17,
    response: {
      content: CRC_ERRORS_CONTENT,
      artifactType: 'crcTable',
      artifactLabel: 'CRC Error Report',
      artifactDataKey: null,
    },
    sideEffects: [
      { type: 'setChangesMapOverlay', value: 'crc' },
    ],
  },
  {
    id: 'ospf-design',
    keywords: ['ospf'],
    priority: 16,
    response: {
      content: OSPF_DESIGN_CONTENT,
      artifactType: null,
      artifactLabel: null,
      artifactDataKey: null,
    },
    sideEffects: [
      { type: 'setChangesMapOverlay', value: 'ospf' },
    ],
  },
  {
    id: 'troubleshoot-voice',
    keywords: ['voice issue', 'voice', '10.8.1'],
    priority: 15,
    response: {
      content: TROUBLESHOOT_VOICE_CONTENT,
      artifactType: 'voicePath',
      artifactLabel: 'Voice Path Analysis',
      artifactDataKey: 'voice-path-boston',
    },
    sideEffects: [],
  },
  {
    id: 'explore-network',
    keywords: ['explore'],
    priority: 12,
    response: {
      content: EXPLORE_RESPONSE_CONTENT,
      artifactType: 'topology',
      artifactLabel: 'Boston data center map',
      artifactDataKey: 'boston-full',
    },
    sideEffects: [
      { type: 'triggerSplitView' },
      { type: 'setTopologyHighlight', value: null },
    ],
  },
  {
    id: 'boston-topology',
    keywords: ['boston'],
    priority: 10,
    response: {
      content: EXPLORE_RESPONSE_CONTENT,
      artifactType: 'topology',
      artifactLabel: 'Boston data center map',
      artifactDataKey: 'boston-full',
    },
    sideEffects: [
      { type: 'triggerSplitView' },
      { type: 'setTopologyHighlight', value: null },
    ],
  },
  {
    id: 'traffic-chart',
    keywords: ['traffic', 'trend'],
    priority: 9,
    response: {
      content: `The core switch uplink interfaces show **steady increasing traffic** over the past 12 days, trending from **18 Mbps to 50 Mbps**.

Peak utilization is occurring between 09:00–17:00, consistent with business-hours workloads. The DS-BOS-03 → CR-BOS-02 link sustained **78% utilization** during yesterday's peak — approaching the 80% planning threshold.

**Recommendation:** Consider load balancing the DS-BOS-03 uplink with a secondary path through DS-BOS-04.`,
      artifactType: 'chart',
      artifactLabel: 'Core Switch Uplink Traffic Trend',
      artifactDataKey: 'boston-traffic-24h',
    },
    sideEffects: [],
  },
  {
    id: 'routing-design',
    keywords: ['routing'],
    priority: 11,
    response: {
      content: `The Boston data center uses BGP as the primary routing protocol across core and distribution layers, with OSPF and EIGRP used in specific segments.

**How routing is structured:**
- Core layer:
  BGP (AS200) is used between core routers for backbone routing
- Distribution layer:
  BGP is extended to distribution switches (AS100 / AS300 / AS65502), forming multiple routing domains
- Access layer:
  OSPF is used for local routing between distribution and end systems
- Local segments:
  EIGRP is used between certain distribution switches for internal connectivity

**Key insights:**
- BGP acts as the backbone protocol across the network
- Routing protocol transitions occur at distribution switches, indicating possible redistribution points

**You can explore further:**
- how routes are redistributed between protocols
- path selection and failover behavior`,
      artifactType: null,
      artifactLabel: null,
      artifactDataKey: null,
    },
    sideEffects: [
      { type: 'setTopologyHighlight', value: 'routing' },
    ],
  },
  {
    id: 'vlan-highlight',
    keywords: ['vlan'],
    priority: 8,
    response: {
      content: `The VLAN 100 paths are highlighted on the map.

**VLAN 100 — Management network**

VLAN 100 traffic flows from access systems through distribution switches (DS-BOS-01, DS-BOS-02) to the core (CR-BOS-01).

| Switch | Ports | Subnet |
|--------|-------|--------|
| DS-BOS-01 | Gi0/0/1–8 | 10.100.1.0/24 |
| DS-BOS-02 | Gi0/0/1–8 | 10.100.2.0/24 |
| ES-1 | All access ports | 10.100.3.0/24 |

**Key insight:**
VLAN 100 is scoped to specific distribution switches rather than the entire network, indicating controlled management segmentation.`,
      artifactType: null,
      artifactLabel: null,
      artifactDataKey: null,
    },
    sideEffects: [
      { type: 'setTopologyHighlight', value: 'vlan100' },
    ],
  },
  {
    id: 'unused-ports',
    keywords: ['unused'],
    priority: 8,
    response: {
      content: `I found **14 ports** that have been inactive for 30+ days across the Boston network.

**Summary**
- 14 unused ports across 8 devices
- Oldest inactive: 90 days (CR-BOS-01 and CR-BOS-02 reserved uplinks)
- 6 ports on VLAN 100 — safe to shut down
- 2 × 10G core ports are reserved for future capacity — keep

**Recommended actions**
1. Shut down the 8 access switch ports inactive for 60+ days
2. Retain and document the 2 core router reserved uplinks
3. Review 4 DS-BOS-02 ports with "old-server-rack-B" description`,
      artifactType: 'table',
      artifactLabel: 'Unused Ports Report',
      artifactDataKey: 'unused-ports',
    },
    sideEffects: [],
  },
  {
    id: 'troubleshoot',
    keywords: ['troubleshoot'],
    priority: 7,
    response: {
      content: `**Troubleshooting — connectivity issue**

**Findings**

1. **ES-2 is currently down** — last seen 47 minutes ago, all ports offline
2. **DS-BOS-04 is degraded** — OSPF adjacency flap logged at 09:32 AM
3. The DS-BOS-04 → ES-2 link shows **0% utilization**, confirming no traffic

**Probable root cause**
ES-2 appears to have lost power or experienced a hardware failure. DS-BOS-04 degradation may be a downstream effect of the same event.

**Recommended next steps**
1. Check physical power and uplink on ES-2
2. Review DS-BOS-04 interface logs for port Gi0/0/4
3. Verify OSPF neighbor state on CR-BOS-02 after ES-2 is restored

Affected path highlighted on the map →`,
      artifactType: null,
      artifactLabel: null,
      artifactDataKey: null,
    },
    sideEffects: [
      { type: 'setTopologyHighlight', value: 'routing' },
    ],
  },
  {
    id: 'discover-devices',
    keywords: ['discover'],
    priority: 6,
    response: {
      content: `**Device discovery — Boston DC**

Running discovery scan across Boston IP ranges…

**Discovered: 11 devices**

| Type | Count | Status |
|------|-------|--------|
| Core Routers | 2 | ✅ All up |
| Distribution Switches | 6 | ⚠ 1 degraded |
| End Systems | 3 | 🔴 1 down |

**New since last scan:** 0 devices
**Missing since last scan:** 0 devices
**State changes:** DS-BOS-04 moved to degraded (32 min ago)`,
      artifactType: 'topology',
      artifactLabel: 'Boston data center map',
      artifactDataKey: 'boston-full',
    },
    sideEffects: [
      { type: 'triggerSplitView' },
      { type: 'setTopologyHighlight', value: null },
    ],
  },
  {
    id: 'intent',
    keywords: ['intent'],
    priority: 6,
    response: {
      content: `**Routing intent — Boston DC**

\`\`\`
intent: boston-dc-routing-v1
scope: site=boston-core
protocol: ospf
area: 0 (backbone)
---
- All inter-DC traffic MUST traverse CR-BOS-01 or CR-BOS-02
- Distribution switches MAY participate in OSPF Area 0
- Access switches MUST NOT run OSPF (passive interfaces only)
- Default route MUST be advertised from FW-BOS-01
- Max 3 hops between any two access switches
\`\`\`

**Validation**
- ✅ CR-BOS-01, CR-BOS-02: compliant
- ⚠ DS-BOS-03: OSPF adjacency unstable (see earlier alert)
- ✅ All access switches: passive interfaces configured`,
      artifactType: null,
      artifactLabel: null,
      artifactDataKey: null,
    },
    sideEffects: [],
  },
]

export const fallbackResponse = {
  id: 'fallback',
  response: {
    content: `I can help you explore your network. Try asking about a location ("Show me Boston data center"), a protocol ("Explain the routing design"), a VLAN, or a problem.

You can also type **/** for a list of available commands.`,
    artifactType: null,
    artifactLabel: null,
    artifactDataKey: null,
  },
  sideEffects: [],
}

export function matchResponse(inputText, messages = []) {
  const lower = inputText.toLowerCase()

  // Context-aware: "serial number" — pick 24h or 7d based on prior IOS table context
  if (lower.includes('serial')) {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant')
    const lastContent = lastAI?.content?.toLowerCase() ?? ''
    const is24h = lastContent.includes('24 hour') || lastContent.includes('last 24') || lastContent.includes('24h')
    const id = is24h ? 'serial-24h' : 'serial-7d'
    return responseRegistry.find(r => r.id === id) ?? fallbackResponse
  }

  // Context-aware: "ios version" — pick 24h or 7d based on prior context
  if (lower.includes('ios') && (lower.includes('version') || lower.includes('versions'))) {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant')
    const lastContent = lastAI?.content?.toLowerCase() ?? ''
    const is24h = lastContent.includes('24 hour') || lastContent.includes('last 24') || lastContent.includes('24h')
    const id = is24h ? 'ios-version-24h' : 'ios-version-7d'
    return responseRegistry.find(r => r.id === id) ?? fallbackResponse
  }

  // Context-aware: "draw ... map" — check the last AI message to pick the right device set
  if ((lower.includes('draw') || lower.includes('show')) && lower.includes('map')) {
    const lastAI = [...messages].reverse().find(m => m.role === 'assistant')
    const lastContent = lastAI?.content?.toLowerCase() ?? ''
    const is24h = lastContent.includes('24 hour') || lastContent.includes('last 24')
    const id = is24h ? 'draw-changes-map-24h' : 'draw-changes-map'
    return responseRegistry.find(r => r.id === id) ?? fallbackResponse
  }

  const candidates = responseRegistry.filter(entry =>
    entry.keywords.length > 0 && entry.keywords.every(kw => lower.includes(kw))
  )
  if (candidates.length === 0) return fallbackResponse
  return candidates.reduce((best, c) => c.priority > best.priority ? c : best)
}
