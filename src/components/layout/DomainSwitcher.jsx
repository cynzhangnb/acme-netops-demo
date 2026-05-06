import { useEffect, useMemo, useState } from 'react'

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="21" y2="21" />
    </svg>
  )
}


function TenantChevron({ open }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.14s', flexShrink: 0 }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

export default function DomainSwitcher({
  tenants = [],
  activeTenantId,
  activeDomainId,
  anchorRect,
  onSelect,
  onClose,
}) {
  const [query, setQuery] = useState('')
  const [collapsedTenants, setCollapsedTenants] = useState({})
  const totalDomains = tenants.reduce((sum, tenant) => sum + tenant.domains.length, 0)
  const showSearch = totalDomains > 5
  const multipleTenants = tenants.length > 1

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const filteredTenants = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return tenants
    return tenants
      .map(tenant => ({
        ...tenant,
        domains: tenant.domains.filter(domain => domain.name.toLowerCase().includes(normalized)),
      }))
      .filter(tenant => tenant.domains.length > 0)
  }, [query, tenants])

  const top = anchorRect ? anchorRect.bottom + 4 : 44
  const left = anchorRect ? anchorRect.left : 8

  function handleSelect(tenantId, domainId) {
    if (tenantId !== activeTenantId || domainId !== activeDomainId) {
      onSelect?.(tenantId, domainId)
    }
    onClose?.()
  }

  function toggleTenant(tenantId) {
    setCollapsedTenants(prev => ({ ...prev, [tenantId]: !prev[tenantId] }))
  }


  return (
    <div
      style={{
        position: 'fixed',
        top,
        left,
        width: 252,
        maxHeight: 400,
        zIndex: 1200,
        background: '#fff',
        border: '1px solid #e5e5e5',
        borderRadius: 10,
        boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 1.5px 6px rgba(0,0,0,0.07)',
        overflow: 'hidden',
        fontFamily: 'Arial, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#1a1a1a',
      }}
    >
      {/* Menu title */}
      <div style={{ padding: '9px 12px 6px', fontSize: 10, fontWeight: 550, color: '#aaa', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
        Switch Domain
      </div>

      {showSearch && (
        <>
          <div style={{ padding: '7px 8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: 28, padding: '0 8px', border: '1px solid #e6e2dc', borderRadius: 7, background: '#fafafa', color: '#8a8a8a' }}>
              <SearchIcon />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search domains..."
                autoFocus
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 12, color: '#1a1a1a', fontFamily: 'inherit' }}
              />
            </div>
          </div>
          <div style={{ height: 1, background: '#f0f0f0' }} />
        </>
      )}

      <div style={{ maxHeight: 340, overflowY: 'auto', padding: '4px 0' }} className="scrollbar-thin">
        {filteredTenants.length === 0 ? (
          <div style={{ padding: '18px 14px', fontSize: 12.5, color: '#8a8a8a', textAlign: 'center' }}>
            No domains match
          </div>
        ) : (
          filteredTenants.map((tenant, tenantIndex) => (
            <div key={tenant.id}>
              {tenantIndex > 0 && <div style={{ height: 1, background: '#f0f0f0', margin: '3px 0' }} />}
              {multipleTenants && (
                <button
                  onClick={() => toggleTenant(tenant.id)}
                  style={{
                    width: '100%',
                    height: 25,
                    padding: '0 10px 0 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    border: 'none',
                    background: 'transparent',
                    color: '#8a8a8a',
                    fontSize: 11,
                    fontWeight: 550,
                    letterSpacing: '0.02em',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#f8f7f4' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                >
                  <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tenant.name}
                  </span>
                  <TenantChevron open={!collapsedTenants[tenant.id]} />
                </button>
              )}
              {!collapsedTenants[tenant.id] && tenant.domains.map(domain => {
                const active = tenant.id === activeTenantId && domain.id === activeDomainId
                return (
                  <button
                    key={domain.id}
                    onClick={() => handleSelect(tenant.id, domain.id)}
                    style={{
                      width: '100%',
                      height: 28,
                      margin: '1px 0',
                      padding: '0 12px 0 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      border: 'none',
                      borderRadius: 0,
                      background: 'transparent',
                      color: '#1a1a1a',
                      fontSize: 12.5,
                      fontWeight: active ? 500 : 400,
                      fontFamily: 'inherit',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f0ede7' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Blue dot on the left for active domain */}
                    <span style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: active ? '#378ADD' : 'transparent' }} />
                    <span style={{ minWidth: 0, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {domain.name}
                    </span>
                  </button>
                )
              })}
            </div>
          ))
        )}
      </div>

    </div>
  )
}
