const CONFIGS = {
  'AS-BOS-01': `hostname AS-BOS-01
!
interface Ethernet0/3
 description User access uplink
 switchport access vlan 110
 spanning-tree portfast
 storm-control broadcast level 5.00
!
interface Ethernet0/4
 description Voice endpoint segment
 switchport access vlan 210
 auto qos voip cisco-phone
 spanning-tree portfast
!
ip default-gateway 10.8.1.254
snmp-server community netbrain ro
logging host 10.20.10.15
ntp server 10.20.1.1 prefer
!
line vty 0 4
 transport input ssh
 login local
!`,
  'AS-BOS-03': `hostname AS-BOS-03
!
interface Ethernet0/3
 description Uplink to DS-BOS-03
 switchport trunk allowed vlan 120,220
 spanning-tree guard root
!
interface Ethernet0/11
 description Conference room phone block
 switchport access vlan 220
 auto qos voip trust
 spanning-tree portfast
!
ip default-gateway 10.8.3.254
snmp-server community netbrain ro
logging host 10.20.10.15
ntp server 10.20.1.1 prefer
!
line vty 0 4
 transport input ssh
 login local
!`,
  'DS-BOS-01': `hostname DS-BOS-01
!
interface Ethernet0/1
 description To CR-BOS-01
 ip address 10.1.1.1 255.255.255.252
 ip ospf network point-to-point
!
interface Ethernet0/3
 description Downlink to AS-BOS-01
 switchport trunk allowed vlan 110,210
 spanning-tree guard root
!
router bgp 65100
 bgp log-neighbor-changes
 neighbor 10.0.0.1 remote-as 65200
 neighbor 10.0.0.1 description CR-BOS-01
 address-family ipv4
  redistribute connected
 exit-address-family
!
router ospf 10
 passive-interface default
 no passive-interface Ethernet0/1
 network 10.1.1.0 0.0.0.3 area 0
!
snmp-server location Boston DC / Distribution Row A
!`,
  'DS-BOS-03': `hostname DS-BOS-03
!
interface Ethernet0/1
 description To CR-BOS-02
 ip address 10.1.3.1 255.255.255.252
 ip ospf network point-to-point
!
interface Ethernet0/3
 description Downlink to AS-BOS-03
 switchport trunk allowed vlan 120,220
 spanning-tree guard root
!
router bgp 65300
 bgp log-neighbor-changes
 neighbor 10.0.0.2 remote-as 65200
 neighbor 10.0.0.2 description CR-BOS-02
 address-family ipv4
  redistribute connected
 exit-address-family
!
logging buffered 128000 warnings
snmp-server location Boston DC / Distribution Row C
!`,
  'CR-BOS-01': `hostname CR-BOS-01
!
interface GigabitEthernet0/0/0
 description Core link to DS-BOS-01
 ip address 10.0.0.1 255.255.255.252
!
interface GigabitEthernet0/0/1
 description Backbone peer to CR-BOS-02
 ip address 10.255.255.1 255.255.255.252
!
router bgp 65200
 bgp log-neighbor-changes
 neighbor 10.255.255.2 remote-as 65200
 neighbor 10.255.255.2 description Core peer
 neighbor 10.1.1.1 remote-as 65100
 neighbor 10.1.3.1 remote-as 65300
 address-family ipv4
  maximum-paths 2
  network 10.0.0.0 mask 255.255.255.0
 exit-address-family
!
ip route 0.0.0.0 0.0.0.0 10.255.255.2
logging host 10.20.10.20
archive
 path flash:archive
!`,
  'CR-BOS-02': `hostname CR-BOS-02
!
interface GigabitEthernet0/0/0
 description Core link to DS-BOS-03
 ip address 10.0.0.2 255.255.255.252
!
interface GigabitEthernet0/0/2
 description Route-policy voice path
 ip address 10.255.255.5 255.255.255.252
!
route-map VOICE-PREFER permit 10
 match ip address prefix-list VOICE-SUBNETS
 set local-preference 250
!
router bgp 65200
 bgp log-neighbor-changes
 neighbor 10.255.255.1 remote-as 65200
 neighbor 10.1.3.1 remote-as 65300
 address-family ipv4
  neighbor 10.1.3.1 route-map VOICE-PREFER in
  maximum-paths 2
 exit-address-family
!
ip prefix-list VOICE-SUBNETS seq 5 permit 10.8.3.0/24
logging host 10.20.10.20
archive
 path flash:archive
!`,
  'ER-BOS-07': `hostname ER-BOS-07
!
interface GigabitEthernet0/0
 description WAN edge circuit
 ip address 10.2.7.1 255.255.255.252
 service-policy output WAN-QOS
!
policy-map WAN-QOS
 class VOICE
  priority percent 30
 class class-default
  fair-queue
!
router bgp 65450
 neighbor 10.0.0.2 remote-as 65200
 timers bgp 5 15
!
ip sla 10
 icmp-echo 10.8.3.134 source-interface GigabitEthernet0/0
 frequency 30
!
track 10 ip sla 10 reachability
logging host 10.20.10.22
!`,
}

export function getDeviceConfig(deviceName) {
  return CONFIGS[deviceName] || `hostname ${deviceName}
!
! Configuration snapshot not available for this mock device yet.
!`
}
