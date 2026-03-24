// Mock AI response registry — keyword-matched responses for demo scenarios

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

export const responseRegistry = [
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
      prefillNext: 'Show me the recent traffic trend for the uplink interfaces on the core switch',
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

export function matchResponse(inputText) {
  const lower = inputText.toLowerCase()
  const candidates = responseRegistry.filter(entry =>
    entry.keywords.length > 0 && entry.keywords.every(kw => lower.includes(kw))
  )
  if (candidates.length === 0) return fallbackResponse
  return candidates.reduce((best, c) => c.priority > best.priority ? c : best)
}
