export default function SkeletonMessage() {
  return (
    <div style={{ maxWidth: 680, width: '100%', margin: '0 auto', padding: '0 24px' }}>
      <div className="arow" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ height: 11, background: '#f0f0f0', borderRadius: 4, width: '90%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ height: 11, background: '#f0f0f0', borderRadius: 4, width: '70%', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.1s' }} />
        <div style={{ height: 11, background: '#f0f0f0', borderRadius: 4, width: '80%', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: '0.2s' }} />
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:0.4} 50%{opacity:0.9} }`}</style>
    </div>
  )
}
