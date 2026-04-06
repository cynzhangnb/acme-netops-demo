const CRC_ERRORS = [
  {
    id: 'crc-1',
    deviceA: 'CR-BOS-02', ifaceA: 'Gi0/1',
    deviceB: 'DS-BOS-01', ifaceB: 'Gi1/0/24',
    errors: 120,
  },
  {
    id: 'crc-2',
    deviceA: 'DS-BOS-03', ifaceA: 'Gi1/0/2',
    deviceB: 'CR-BOS-02', ifaceB: 'Gi0/2',
    errors: 45,
  },
]

export default function CRCTable({ flushed = false }) {
  return (
    <div style={{
      border: flushed ? 'none' : '1px solid #e8e6e2',
      borderRadius: flushed ? 0 : 8,
      overflow: 'hidden',
      fontSize: 12,
      marginTop: flushed ? 0 : 2,
    }}>
      {/* Header */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        padding: '6px 12px',
        background: '#f7f6f3',
        borderBottom: '1px solid #e8e6e2',
        color: '#8a8680', fontWeight: 600, fontSize: 10,
        textTransform: 'uppercase', letterSpacing: '0.06em',
      }}>
        <div>Device A</div>
        <div>Intf A</div>
        <div>Device B</div>
        <div>Intf B</div>
        <div>CRC Errors</div>
      </div>

      {CRC_ERRORS.map((row, idx) => {
        const isLast = idx === CRC_ERRORS.length - 1
        return (
          <div
            key={row.id}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              alignItems: 'center',
              padding: '9px 12px',
              borderBottom: isLast ? 'none' : '1px solid #f0ede8',
              background: 'transparent',
            }}
          >
            <div style={{ fontSize: 12, color: '#1a1a1a' }}>{row.deviceA}</div>
            <div style={{ fontSize: 12, color: '#1a1a1a' }}>{row.ifaceA}</div>
            <div style={{ fontSize: 12, color: '#1a1a1a' }}>{row.deviceB}</div>
            <div style={{ fontSize: 12, color: '#1a1a1a' }}>{row.ifaceB}</div>
            <div style={{ fontSize: 12, color: '#1a1a1a' }}>{row.errors}</div>
          </div>
        )
      })}
    </div>
  )
}
