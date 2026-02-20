'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Business, Scan } from '@/types'

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100)
    return () => clearTimeout(t)
  }, [])

  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'Uitstekend' : score >= 50 ? 'Goed' : score >= 30 ? 'Matig' : 'Laag'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        style={{ filter: `drop-shadow(0 0 12px ${color}66)` }}
      >
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={animated ? offset : circumference}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-black" style={{ fontSize: size / 4, color }}>{score}</div>
        <div className="text-gray-400" style={{ fontSize: size / 10 }}>{label}</div>
      </div>
    </div>
  )
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const isNew = searchParams.get('new') === '1'
  const isUpgraded = searchParams.get('upgraded') === '1'

  const [business, setBusiness] = useState<Business | null>(null)
  const [scans, setScans] = useState<Scan[]>([])
  const [scanning, setScanning] = useState(false)
  const [latestScan, setLatestScan] = useState<Scan | null>(null)
  const [notification, setNotification] = useState(
    isNew
      ? 'Welkom bij GeoCheck! Start je eerste scan hieronder.'
      : isUpgraded
      ? 'Upgrade geslaagd! Je hebt nu toegang tot alle features.'
      : ''
  )
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const storedBusiness = localStorage.getItem('gc_business')
    const businessId = localStorage.getItem('gc_business_id')
    if (storedBusiness) setBusiness(JSON.parse(storedBusiness))
    if (businessId) loadScans(businessId)
    if (notification) setTimeout(() => setNotification(''), 5000)
  }, [])

  const loadScans = async (businessId: string) => {
    const res = await fetch(`/api/scan?business_id=${businessId}`)
    const data = await res.json()
    if (data.scans) {
      setScans(data.scans)
      setLatestScan(data.scans[0] || null)
    }
  }

  const startScan = async () => {
    const businessId = localStorage.getItem('gc_business_id')
    if (!businessId) return
    setScanning(true)
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId }),
      })
      const data = await res.json()
      if (data.scan) {
        setLatestScan(data.scan)
        setScans(prev => [data.scan, ...prev])
        setNotification('Scan voltooid! Jouw GEO-score is bijgewerkt.')
        setTimeout(() => setNotification(''), 4000)
      } else {
        setNotification(data.error || 'Scan mislukt. Probeer opnieuw.')
        setTimeout(() => setNotification(''), 4000)
      }
    } catch {
      setNotification('Er ging iets mis. Controleer je verbinding.')
      setTimeout(() => setNotification(''), 4000)
    } finally {
      setScanning(false)
    }
  }

  const platformData = latestScan?.platforms as
    | Record<string, { score: number; mention_rate: number; sentiment: string; questions_asked: number; questions_mentioned: number }>
    | undefined

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊', active: true },
    { href: '/dashboard/scan', label: 'Nieuwe scan', icon: '🔍', active: false },
    { href: '/dashboard/benchmark', label: 'Benchmark', icon: '⚔️', active: false },
    { href: '/dashboard/rapporten', label: 'Rapporten', icon: '📧', active: false },
    { href: '/prijzen', label: 'Upgraden', icon: '⚡', active: false },
  ]

  const quickStats = [
    {
      icon: '📊',
      label: 'GEO Score',
      value: latestScan?.geo_score ? `${latestScan.geo_score}/100` : '—',
      color: '#7c3aed',
    },
    {
      icon: '🎯',
      label: 'Vermeld',
      value: latestScan ? `${Math.round((latestScan.mention_rate || 0) * 100)}%` : '—',
      color: '#3b82f6',
    },
    {
      icon: '📈',
      label: 'Scans totaal',
      value: scans.length.toString(),
      color: '#10b981',
    },
    {
      icon: '🏆',
      label: 'Plan',
      value: business?.plan?.toUpperCase() || 'GRATIS',
      color: '#f59e0b',
    },
  ]

  const sidebarWidth = 256

  return (
    <div style={{ minHeight: '100vh', background: '#06060f', position: 'relative' }}>

      {/* ── Animated orbs background ── */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        <div
          className="orb"
          style={{
            position: 'absolute',
            background: 'radial-gradient(circle, #7c3aed, transparent)',
            width: 500,
            height: 500,
            top: '-8%',
            left: '-8%',
            opacity: 0.12,
          }}
        />
        <div
          className="orb orb-2"
          style={{
            position: 'absolute',
            background: 'radial-gradient(circle, #3b82f6, transparent)',
            width: 700,
            height: 700,
            top: '25%',
            right: '-15%',
            opacity: 0.08,
          }}
        />
        <div
          className="orb"
          style={{
            position: 'absolute',
            background: 'radial-gradient(circle, #7c3aed, transparent)',
            width: 350,
            height: 350,
            bottom: '8%',
            left: '18%',
            opacity: 0.07,
          }}
        />
      </div>

      {/* ── Mobile hamburger ── */}
      {isMobile && (
        <button
          onClick={() => setSidebarOpen(o => !o)}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 60,
            background: 'rgba(124,58,237,0.15)',
            border: '1px solid rgba(124,58,237,0.3)',
            borderRadius: 10,
            width: 40,
            height: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: '#a78bfa',
          }}
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
      )}

      {/* ── Mobile backdrop ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 38,
            backdropFilter: 'blur(4px)',
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <div
        style={{
          position: 'fixed',
          left: isMobile ? (sidebarOpen ? 0 : -sidebarWidth) : 0,
          top: 0,
          height: '100%',
          width: sidebarWidth,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(6,6,15,0.97)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          transition: 'left 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Logo */}
        <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="gradient-text"
              style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px' }}
            >
              GeoCheck.nl
            </span>
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                animation: 'pulse 2s ease-in-out infinite',
                display: 'inline-block',
              }}
            />
          </Link>
          <div style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: 4, letterSpacing: '0.05em' }}>
            AI ZICHTBAARHEIDSMONITOR
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => isMobile && setSidebarOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                borderRadius: 12,
                fontSize: '0.875rem',
                fontWeight: item.active ? 600 : 400,
                textDecoration: 'none',
                color: item.active ? '#fff' : '#6b7280',
                background: item.active
                  ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(59,130,246,0.1))'
                  : 'transparent',
                border: item.active
                  ? '1px solid rgba(124,58,237,0.3)'
                  : '1px solid transparent',
                boxShadow: item.active ? '0 0 20px rgba(124,58,237,0.1)' : 'none',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={e => {
                if (!item.active) {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#e5e7eb'
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.04)'
                }
              }}
              onMouseLeave={e => {
                if (!item.active) {
                  ;(e.currentTarget as HTMLAnchorElement).style.color = '#6b7280'
                  ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '1rem' }}>{item.icon}</span>
              {item.label}
              {item.active && (
                <div
                  style={{
                    marginLeft: 'auto',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#7c3aed',
                    boxShadow: '0 0 8px #7c3aed',
                  }}
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Business card */}
        {business && (
          <div style={{ padding: '12px 12px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div
              className="glass"
              style={{ padding: '14px 16px', position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, #7c3aed, #3b82f6, transparent)',
                }}
              />
              <div style={{ fontSize: '0.7rem', color: '#4b5563', marginBottom: 4 }}>ACTIEF BEDRIJF</div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#e5e7eb', marginBottom: 4 }}>
                {business.name}
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 20,
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  background: 'rgba(124,58,237,0.2)',
                  border: '1px solid rgba(124,58,237,0.35)',
                  color: '#a78bfa',
                }}
              >
                {business.plan?.toUpperCase() || 'GRATIS'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <div
        style={{
          marginLeft: isMobile ? 0 : sidebarWidth,
          position: 'relative',
          zIndex: 10,
          minHeight: '100vh',
          paddingTop: isMobile ? 64 : 0,
        }}
      >
        {/* Hero header */}
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.08) 50%, transparent 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: isMobile ? '24px 20px 20px' : '32px 36px 28px',
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#4b5563', marginBottom: 8, letterSpacing: '0.05em' }}>
            GEOCHECK.NL / DASHBOARD
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: isMobile ? 'flex-start' : 'center',
              justifyContent: 'space-between',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 16 : 0,
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: isMobile ? '1.5rem' : '1.875rem',
                  fontWeight: 800,
                  color: '#f3f4f6',
                  letterSpacing: '-0.5px',
                  lineHeight: 1.2,
                }}
              >
                {business ? (
                  <>
                    Welkom terug,{' '}
                    <span className="gradient-text">{business.name.split(' ')[0]}</span>
                  </>
                ) : (
                  'Dashboard'
                )}
              </h1>
              <p style={{ color: '#6b7280', marginTop: 6, fontSize: '0.9rem' }}>
                {business?.name || 'Jouw GEO-zichtbaarheid'}
              </p>
            </div>
            <button
              onClick={startScan}
              disabled={scanning}
              className="btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.875rem',
                padding: '12px 22px',
                whiteSpace: 'nowrap',
              }}
            >
              {scanning ? (
                <>
                  <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span>
                  Scannen...
                </>
              ) : (
                <>🔍 Nieuwe scan</>
              )}
            </button>
          </div>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                margin: '16px 24px 0',
                padding: '14px 18px',
                borderRadius: 12,
                fontSize: '0.875rem',
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.3)',
                color: '#a78bfa',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span>✨</span> {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={{ padding: isMobile ? '20px 16px' : '28px 36px' }}>

          {/* Quick stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: 14,
              marginBottom: 24,
            }}
          >
            {quickStats.map(stat => (
              <div
                key={stat.label}
                className="glass"
                style={{ padding: '20px 18px', position: 'relative', overflow: 'hidden' }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                  }}
                />
                <div style={{ fontSize: '1.5rem', marginBottom: 10 }}>{stat.icon}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: stat.color }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Scanning state */}
          {scanning && (
            <div
              className="glass"
              style={{ padding: '56px 32px', textAlign: 'center', marginBottom: 24, position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(124,58,237,0.3), rgba(59,130,246,0.1))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  margin: '0 auto 24px',
                  animation: 'pulse 2s ease-in-out infinite',
                  border: '1px solid rgba(124,58,237,0.4)',
                  boxShadow: '0 0 40px rgba(124,58,237,0.3)',
                }}
              >
                🤖
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Scan in uitvoering...</h2>
              <p style={{ color: '#6b7280', marginBottom: 28, fontSize: '0.9rem' }}>
                Wij vragen ChatGPT en Perplexity naar jouw bedrijf
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    style={{
                      width: 6,
                      height: 32,
                      borderRadius: 3,
                      background: 'linear-gradient(to top, #7c3aed, #3b82f6)',
                      animation: `pulse 1s ease-in-out ${i * 0.15}s infinite`,
                      opacity: 0.8,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Latest scan results */}
          {latestScan && latestScan.status === 'completed' && (
            <>
              {/* Score overview */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: 16,
                  marginBottom: 20,
                }}
              >
                {/* GEO Score ring card */}
                <div
                  className="glass"
                  style={{
                    padding: '28px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, #7c3aed, #3b82f6, transparent)',
                    }}
                  />
                  <ScoreRing score={latestScan.geo_score || 0} />
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 4 }}>GEO Score</div>
                    <div style={{ fontSize: '2rem', fontWeight: 900, color: '#f3f4f6' }}>
                      {latestScan.geo_score}/
                      <span style={{ fontSize: '1rem', color: '#6b7280', fontWeight: 400 }}>100</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                      {new Date(latestScan.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                      })}
                    </div>
                  </div>
                </div>

                {/* Mention rate */}
                <div
                  className="glass"
                  style={{ padding: '28px 24px', position: 'relative', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, #3b82f6, transparent)',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Vermeldingsrate</div>
                  <div
                    style={{
                      fontSize: '2.5rem',
                      fontWeight: 900,
                      color: '#3b82f6',
                      textShadow: '0 0 20px rgba(59,130,246,0.4)',
                    }}
                  >
                    {Math.round((latestScan.mention_rate || 0) * 100)}%
                  </div>
                  <div className="score-bar" style={{ marginTop: 14 }}>
                    <div
                      className="score-bar-fill"
                      style={{ width: `${Math.round((latestScan.mention_rate || 0) * 100)}%` }}
                    />
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 8 }}>
                    {latestScan.questions_mentioned} / {latestScan.questions_asked} vragen
                  </div>
                </div>

                {/* Sentiment */}
                <div
                  className="glass"
                  style={{ padding: '28px 24px', position: 'relative', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, #10b981, transparent)',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: 12 }}>Sentiment</div>
                  <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>
                    {(latestScan.sentiment_score || 0) > 0.2
                      ? '😊'
                      : (latestScan.sentiment_score || 0) < -0.2
                      ? '😟'
                      : '😐'}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f3f4f6' }}>
                    {(latestScan.sentiment_score || 0) > 0.2
                      ? 'Positief'
                      : (latestScan.sentiment_score || 0) < -0.2
                      ? 'Negatief'
                      : 'Neutraal'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 4 }}>
                    Toon van vermeldingen
                  </div>
                </div>
              </div>

              {/* Platform breakdown */}
              {platformData && Object.keys(platformData).length > 0 && (
                <div
                  className="glass"
                  style={{ padding: '24px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, #7c3aed, #3b82f6, transparent)',
                    }}
                  />
                  <h3
                    style={{
                      fontWeight: 700,
                      marginBottom: 20,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>🌐</span> Platform breakdown
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                    {Object.entries(platformData).map(([platform, data]) => (
                      <div key={platform}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'capitalize' }}>
                              {platform}
                            </span>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: 20,
                                fontWeight: 600,
                                background:
                                  data.sentiment === 'positief'
                                    ? 'rgba(34,197,94,0.12)'
                                    : data.sentiment === 'negatief'
                                    ? 'rgba(239,68,68,0.12)'
                                    : 'rgba(107,114,128,0.15)',
                                color:
                                  data.sentiment === 'positief'
                                    ? '#22c55e'
                                    : data.sentiment === 'negatief'
                                    ? '#ef4444'
                                    : '#9ca3af',
                                border: `1px solid ${
                                  data.sentiment === 'positief'
                                    ? 'rgba(34,197,94,0.25)'
                                    : data.sentiment === 'negatief'
                                    ? 'rgba(239,68,68,0.25)'
                                    : 'rgba(107,114,128,0.2)'
                                }`,
                              }}
                            >
                              {data.sentiment}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '0.875rem',
                              fontWeight: 800,
                              color:
                                data.score >= 70 ? '#22c55e' : data.score >= 40 ? '#f59e0b' : '#ef4444',
                            }}
                          >
                            {data.score}/100
                          </div>
                        </div>
                        <div className="score-bar">
                          <div className="score-bar-fill" style={{ width: `${data.score}%` }} />
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#6b7280', marginTop: 6 }}>
                          {data.questions_mentioned}/{data.questions_asked} vermeld
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI suggestions */}
              {latestScan.suggestions && latestScan.suggestions.length > 0 && (
                <div
                  className="glass"
                  style={{ padding: '24px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden' }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 2,
                      background: 'linear-gradient(90deg, #f59e0b, #ef4444, transparent)',
                    }}
                  />
                  <h3
                    style={{
                      fontWeight: 700,
                      marginBottom: 20,
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span>💡</span> AI-verbeteringstips
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {latestScan.suggestions.slice(0, 5).map((s, i) => (
                      <div
                        key={i}
                        style={{
                          display: 'flex',
                          gap: 16,
                          padding: '16px 18px',
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.025)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          transition: 'border-color 0.2s ease',
                          cursor: 'default',
                        }}
                        onMouseEnter={e =>
                          ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(124,58,237,0.3)')
                        }
                        onMouseLeave={e =>
                          ((e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.06)')
                        }
                      >
                        {/* Number badge */}
                        <div
                          style={{
                            flexShrink: 0,
                            width: 32,
                            height: 32,
                            borderRadius: 10,
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.15))',
                            border: '1px solid rgba(124,58,237,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.8rem',
                            fontWeight: 800,
                            color: '#a78bfa',
                          }}
                        >
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4, color: '#e5e7eb' }}>
                            {s.title}
                          </div>
                          <div style={{ color: '#6b7280', fontSize: '0.8rem', lineHeight: 1.5 }}>
                            {s.description}
                          </div>
                          <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
                            <span
                              style={{
                                padding: '2px 10px',
                                borderRadius: 20,
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'rgba(16,185,129,0.12)',
                                border: '1px solid rgba(16,185,129,0.25)',
                                color: '#10b981',
                              }}
                            >
                              ↑ +{s.impact} punten
                            </span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: '#6b7280' }}>
                              <span
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background:
                                    s.effort === 'laag'
                                      ? '#22c55e'
                                      : s.effort === 'hoog'
                                      ? '#ef4444'
                                      : '#f59e0b',
                                  display: 'inline-block',
                                }}
                              />
                              Inspanning: {s.effort}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Empty state */}
          {!latestScan && !scanning && (
            <div
              className="glass"
              style={{
                padding: isMobile ? '48px 24px' : '80px 40px',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.08) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }}
              />
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'rgba(124,58,237,0.15)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem',
                  margin: '0 auto 24px',
                  animation: 'pulse-glow 3s ease-in-out infinite',
                  boxShadow: '0 0 30px rgba(124,58,237,0.2)',
                }}
              >
                🔍
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12, color: '#f3f4f6' }}>
                Start je eerste GEO-scan
              </h2>
              <p
                style={{
                  color: '#6b7280',
                  maxWidth: 420,
                  margin: '0 auto 28px',
                  lineHeight: 1.65,
                  fontSize: '0.9rem',
                }}
              >
                Ontdek hoe ChatGPT, Perplexity en Gemini over jouw bedrijf praten.
                Eerste scan duurt 30–60 seconden.
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  justifyContent: 'center',
                  flexWrap: 'wrap',
                  marginBottom: 32,
                }}
              >
                {['ChatGPT', 'Perplexity', 'Gemini', '50 vragen', 'AI-tips'].map(tag => (
                  <span
                    key={tag}
                    style={{
                      padding: '4px 14px',
                      borderRadius: 20,
                      background: 'rgba(124,58,237,0.1)',
                      border: '1px solid rgba(124,58,237,0.25)',
                      color: '#a78bfa',
                      fontSize: '0.75rem',
                      fontWeight: 500,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                onClick={startScan}
                className="btn-primary"
                style={{ padding: '14px 36px', fontSize: '1rem', position: 'relative', zIndex: 1 }}
              >
                🚀 Start gratis scan
              </button>
            </div>
          )}

          {/* Scan history */}
          {scans.length > 1 && (
            <div
              className="glass"
              style={{ padding: '24px 28px', marginTop: 20, position: 'relative', overflow: 'hidden' }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: 'linear-gradient(90deg, #6b7280, transparent)',
                }}
              />
              <h3
                style={{
                  fontWeight: 700,
                  marginBottom: 16,
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>🕒</span> Scan geschiedenis
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {scans.slice(1, 6).map((scan, idx) => (
                  <div
                    key={scan.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 0',
                      borderBottom:
                        idx < Math.min(scans.length - 2, 4)
                          ? '1px solid rgba(255,255,255,0.04)'
                          : 'none',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      {new Date(scan.created_at).toLocaleDateString('nl-NL', {
                        day: 'numeric',
                        month: 'long',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{scan.questions_asked} vragen</span>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.875rem',
                          color:
                            (scan.geo_score || 0) >= 70
                              ? '#22c55e'
                              : (scan.geo_score || 0) >= 40
                              ? '#f59e0b'
                              : '#ef4444',
                        }}
                      >
                        {scan.geo_score}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spin keyframe */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#06060f',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                border: '3px solid rgba(124,58,237,0.3)',
                borderTopColor: '#7c3aed',
                animation: 'spin 0.8s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Laden...</div>
          </div>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}
