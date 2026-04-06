const DEVICES_7D = [
  { device: 'ER-BOS-07', vendor: 'Cisco ISR 4451',        version: '17.09.04',      released: '2023-07-22', serial: 'FGL2248L0GK' },
  { device: 'CR-BOS-01', vendor: 'Juniper MX204',          version: '21.2R3-S2',     released: '2022-10-11', serial: 'BT0217AF0123' },
  { device: 'CR-BOS-02', vendor: 'Cisco ASR 1001-X',       version: '17.09.04',      released: '2023-07-22', serial: 'FOX2241P3TK' },
  { device: 'DS-BOS-01', vendor: 'Arista 7050CX3-32S',     version: '4.28.3M',       released: '2023-07-22', serial: 'JPE21430089' },
  { device: 'DS-BOS-03', vendor: 'Cisco Catalyst 9300',    version: '17.06.03',      released: '2022-07-14', serial: 'FCW2318G0BN' },
  { device: 'AS-BOS-01', vendor: 'HP Aruba 2930F',         version: 'WC.16.11.0010', released: '2023-07-22', serial: 'SG93FLXZ14' },
]

const DEVICES_24H = [
  { device: 'ER-BOS-07', vendor: 'Cisco ISR 4451',        version: '17.09.04',      released: '2023-07-22', serial: 'FGL2248L0GK' },
  { device: 'CR-BOS-02', vendor: 'Cisco ASR 1001-X',       version: '17.09.04',      released: '2023-07-22', serial: 'FOX2241P3TK' },
  { device: 'DS-BOS-01', vendor: 'Arista 7050CX3-32S',     version: '4.28.3M',       released: '2023-07-22', serial: 'JPE21430089' },
  { device: 'DS-BOS-03', vendor: 'Cisco Catalyst 9300',    version: '17.06.03',      released: '2022-07-14', serial: 'FCW2318G0BN' },
]

// Versions older than this release date are flagged
const LATEST_RELEASE_DATE = '2023-07-22'

// dataKey format: null | 'last-24h' | 'serial' | 'last-24h-serial'
export default function IOSVersionTable({ filter, flushed = false }) {
  const is24h = filter === 'last-24h' || filter === 'last-24h-serial'
  const showSerial = filter === 'serial' || filter === 'last-24h-serial'
  const devices = is24h ? DEVICES_24H : DEVICES_7D
  const cols = showSerial ? { grid: '1fr 1fr 1fr 1fr' } : { grid: '1fr 1fr 1fr' }

  return (
    <div style={{ border: flushed ? 'none' : '1px solid #e8e6e2', borderRadius: flushed ? 0 : 8, overflow: 'hidden', fontSize: 11, marginTop: flushed ? 0 : 10 }}>
      {/* Header */}
      <div style={{
        display: 'grid', gridTemplateColumns: cols.grid,
        padding: '6px 12px',
        background: '#f7f6f3', borderBottom: '1px solid #e8e6e2',
        color: '#4a4a4a', fontWeight: 600, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        <div>Device</div>
        <div>Vendor &amp; Model</div>
        <div>OS Version</div>
        {showSerial && <div>Serial Number</div>}
      </div>

      {devices.map((d, idx) => {
        const isOutdated = d.released < LATEST_RELEASE_DATE
        const isLast = idx === devices.length - 1
        return (
          <div
            key={d.device}
            style={{
              display: 'grid', gridTemplateColumns: cols.grid, alignItems: 'center',
              padding: '8px 12px',
              borderBottom: isLast ? 'none' : '1px solid #f0ede8',
              background: 'transparent',
            }}
          >
            <div style={{ fontWeight: 500, color: '#1a1a1a', fontSize: 11 }}>{d.device}</div>
            <div style={{ color: '#1a1a1a', fontSize: 11 }}>{d.vendor}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontFamily: 'Menlo, monospace', fontSize: 11, color: isOutdated ? '#c2620a' : '#15803d', fontWeight: 500 }}>
                {d.version}
              </span>
              {isOutdated && (
                <span style={{
                  fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 3,
                  background: '#fff7ed', color: '#c2620a', whiteSpace: 'nowrap',
                }}>outdated</span>
              )}
            </div>
            {showSerial && (
              <div style={{ color: '#1a1a1a', fontSize: 11 }}>{d.serial}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}
