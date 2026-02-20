'use client'

import { useState, useEffect, Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Business, Scan } from '@/types'

// Deterministic star positions (avoids hydration mismatch)
const STARS = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  x: ((i * 17.3 + 13.7) % 100),
  y: ((i * 23.7 + 7.3) % 100),
  size: (i % 3) + 1,
  delay: (i * 0.31) % 5,
  duration: 2.5 + (i % 4) * 0.8,
}))

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'Uitstekend' : score >= 50 ? 'Goed' : score >= 30 ? 'Matig' : 'Laag'

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Glow behind ring */}
      <div style={{
        position: 'absolute',
        width: size * 0.7,
        height: size * 0.7,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        filter: 'blur(8px)',
      }} />
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-black" style={{ fontSize: size / 4, color }}>{score}</div>
        <div className="text-gray-400" style={{ fontSize: size / 10 }}>{label}</div>
      </div>
    </div>
  )
}

function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    let start = 0
    const step = value / 40
    const timer = setInterval(() => {
      start += step
      if (start >= value) {
        setDisplayed(value)
        clearInterval(timer)
      } else {
        setDisplayed(Math.floor(start))
      }
    }, 30)
    return () => clearInterval(timer)
  }, [value])
  return <>{displayed}{suffix}</>
}

function Sidebar({ business }: { business: Business | null }) {
  return (
    <div className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col" style={{
      background: 'rgba(3,8,16,0.97)',
      borderRight: '1px solid rgba(124,58,237,0.15)',
      boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
    }}>
      {/* Logo with subtle glow */}
      <div className="p-6 border-b" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
        <Link href="/" className="text-xl font-black gradient-text" style={{ filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.4))' }}>
          GeoCheck.nl
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {[
          { href: '/dashboard', label: 'Dashboard', icon: '📊', active: true },
          { href: '/dashboard/scan', label: 'Nieuwe scan', icon: '🔍' },
          { href: '/benchmark', label: 'Benchmark', icon: '⚔️' },
          { href: '/rapporten', label: 'Rapporten', icon: '📧' },
          { href: '/prijzen', label: 'Upgraden', icon: '⚡' },
        ].map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${item.active
              ? 'text-white'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            style={item.active ? {
              background: 'linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.15))',
              border: '1px solid rgba(124,58,237,0.35)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            } : {}}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
      {business && (
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div style={{
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '12px',
            padding: '12px',
          }}>
            <div className="text-xs text-gray-500 mb-1">Actief bedrijf</div>
            <div className="font-semibold text-sm">{business.name}</div>
            <div className="text-xs" style={{ color: '#a78bfa' }}>{business.plan.toUpperCase()} plan</div>
          </div>
        </div>
      )}
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
    isNew ? 'Welkom bij GeoCheck! Start je eerste scan hieronder.' :
    isUpgraded ? 'Upgrade geslaagd! Je hebt nu toegang tot alle features.' : ''
  )

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

  const platformData = latestScan?.platforms as Record<string, {
    score: number; mention_rate: number; sentiment: string;
    questions_asked: number; questions_mentioned: number
  }> | undefined

  return (
    <div className="min-h-screen" style={{ background: '#030810' }}>

      {/* ── STAR PARTICLES ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {STARS.map(s => (
          <div
            key={s.id}
            className="star"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: `${s.size}px`,
              height: `${s.size}px`,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
            }}
          />
        ))}
      </div>

      {/* ── ORB GLOWS ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb absolute" style={{
          width: '500px', height: '500px', opacity: 0.12,
          background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
          top: '-15%', left: '-10%',
        }} />
        <div className="orb-2 orb absolute" style={{
          width: '350px', height: '350px', opacity: 0.1,
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          top: '50%', right: '-8%',
        }} />
        <div className="orb-3 absolute" style={{
          width: '280px', height: '280px', opacity: 0.08,
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
          bottom: '10%', left: '30%',
          borderRadius: '50%', filter: 'blur(60px)',
        }} />
      </div>

      {/* ── PLANET ARC GLOW (top of page) ── */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-0 planet-arc" style={{
        height: '320px',
        background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(124,58,237,0.18) 0%, rgba(59,130,246,0.08) 50%, transparent 100%)',
      }} />

      {/* ── SIDEBAR ── */}
      <Sidebar business={business} />

      {/* ── MAIN CONTENT ── */}
      <div className="ml-64 relative z-10">

        {/* Top bar */}
        <div className="px-8 py-4 flex items-center justify-between" style={{
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          background: 'rgba(3,8,16,0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <div>
            <h1 className="text-xl font-bold text-white">{business?.name || 'Dashboard'}</h1>
            <p className="text-gray-400 text-sm">GEO-zichtbaarheid · AI-platformen</p>
          </div>
          <button
            onClick={startScan}
            disabled={scanning}
            className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
          >
            {scanning ? (
              <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⟳</span> Scannen...</>
            ) : (
              <>🔍 Nieuwe scan</>
            )}
          </button>
        </div>

        {/* Notification */}
        <AnimatePresence>
          {notification && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mx-8 mt-4 p-4 rounded-xl text-sm"
              style={{
                background: 'rgba(124,58,237,0.12)',
                border: '1px solid rgba(124,58,237,0.35)',
                color: '#c4b5fd',
                boxShadow: '0 4px 20px rgba(124,58,237,0.15)',
              }}
            >
              ✨ {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8">

          {/* ── SCANNING ANIMATION ── */}
          {scanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-12 text-center rounded-2xl"
              style={{
                background: 'rgba(124,58,237,0.06)',
                border: '1px solid rgba(124,58,237,0.25)',
                boxShadow: '0 0 40px rgba(124,58,237,0.1)',
              }}
            >
              <div className="text-5xl mb-4" style={{ filter: 'drop-shadow(0 0 12px rgba(124,58,237,0.6))' }}>🤖</div>
              <h2 className="text-xl font-bold mb-2 text-white">Scan in uitvoering...</h2>
              <p className="text-gray-400 mb-6">Wij vragen ChatGPT en Perplexity naar jouw bedrijf. Dit duurt 30–60 seconden.</p>
              <div className="flex justify-center gap-1.5">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    style={{
                      width: '6px',
                      height: '32px',
                      borderRadius: '3px',
                      background: 'linear-gradient(180deg, #7c3aed, #3b82f6)',
                      animation: `wave 1s ease-in-out ${i * 0.15}s infinite`,
                    }}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* ── LATEST SCAN RESULTS ── */}
          {latestScan && latestScan.status === 'completed' && (
            <>
              {/* Score overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">

                {/* GEO Score card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="glass-deep p-6 flex items-center gap-6 glow-card"
                  style={{ background: 'rgba(124,58,237,0.06)' }}
                >
                  <ScoreRing score={latestScan.geo_score || 0} />
                  <div>
                    <div className="text-sm text-gray-400 mb-1">GEO Score</div>
                    <div className="text-2xl font-black text-white">
                      <AnimatedCounter value={latestScan.geo_score || 0} />/100
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(latestScan.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </motion.div>

                {/* Mention rate card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="glass-deep p-6"
                >
                  <div className="text-sm text-gray-400 mb-3">Vermeldingsrate</div>
                  <div className="text-3xl font-black" style={{ color: '#60a5fa' }}>
                    <AnimatedCounter value={Math.round((latestScan.mention_rate || 0) * 100)} suffix="%" />
                  </div>
                  <div className="score-bar mt-3">
                    <div className="score-bar-fill" style={{ width: `${Math.round((latestScan.mention_rate || 0) * 100)}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{latestScan.questions_mentioned} / {latestScan.questions_asked} vragen</div>
                </motion.div>

                {/* Sentiment card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="glass-deep p-6"
                >
                  <div className="text-sm text-gray-400 mb-3">Sentiment</div>
                  <div className="text-4xl" style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))' }}>
                    {(latestScan.sentiment_score || 0) > 0.2 ? '😊' : (latestScan.sentiment_score || 0) < -0.2 ? '😟' : '😐'}
                  </div>
                  <div className="text-lg font-bold mt-2 text-white">
                    {(latestScan.sentiment_score || 0) > 0.2 ? 'Positief' : (latestScan.sentiment_score || 0) < -0.2 ? 'Negatief' : 'Neutraal'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Toon van vermeldingen</div>
                </motion.div>
              </div>

              {/* Platform breakdown */}
              {platformData && Object.keys(platformData).length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="glass-deep p-6 mb-6"
                >
                  <h3 className="font-bold mb-4 text-white">Platform breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(platformData).map(([platform, data]) => (
                      <div key={platform}>
                        <div className="flex justify-between items-center mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize text-white">{platform}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${data.sentiment === 'positief' ? 'bg-green-900/50 text-green-400' : data.sentiment === 'negatief' ? 'bg-red-900/50 text-red-400' : 'bg-gray-800 text-gray-400'}`}>
                              {data.sentiment}
                            </span>
                          </div>
                          <div className="text-sm font-bold" style={{ color: data.score >= 70 ? '#22c55e' : data.score >= 40 ? '#f59e0b' : '#ef4444' }}>
                            {data.score}/100
                          </div>
                        </div>
                        <div className="score-bar">
                          <div className="score-bar-fill" style={{ width: `${data.score}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{data.questions_mentioned}/{data.questions_asked} vermeld</div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* AI Tips */}
              {latestScan.suggestions && latestScan.suggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="glass-deep p-6 mb-6"
                  style={{ borderColor: 'rgba(124,58,237,0.2)' }}
                >
                  <h3 className="font-bold mb-4 text-white">💡 AI-verbeteringstips</h3>
                  <div className="space-y-3">
                    {latestScan.suggestions.slice(0, 5).map((s, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-xl transition-all hover:border-violet-500/20" style={{
                        background: 'rgba(124,58,237,0.05)',
                        border: '1px solid rgba(124,58,237,0.12)',
                      }}>
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{
                          background: 'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(59,130,246,0.2))',
                          color: '#a78bfa',
                        }}>
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1 text-white">{s.title}</div>
                          <div className="text-gray-400 text-xs">{s.description}</div>
                          <div className="flex gap-3 mt-2">
                            <span className="text-violet-400 text-xs font-semibold">↑ +{s.impact} punten</span>
                            <span className="text-gray-500 text-xs">Inspanning: {s.effort}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </>
          )}

          {/* ── EMPTY STATE ── */}
          {!latestScan && !scanning && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center py-20 px-8 rounded-2xl relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, rgba(59,130,246,0.05) 50%, rgba(3,8,16,0.8) 100%)',
                border: '1px solid rgba(124,58,237,0.2)',
                boxShadow: '0 0 60px rgba(124,58,237,0.08), inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Background glow for empty state */}
              <div style={{
                position: 'absolute', inset: 0,
                background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(124,58,237,0.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }} />

              {/* Planet arc decoration */}
              <div style={{
                position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                width: '400px', height: '400px',
                borderRadius: '50%',
                background: 'transparent',
                border: '1px solid rgba(124,58,237,0.15)',
                boxShadow: '0 0 40px rgba(124,58,237,0.1), inset 0 0 40px rgba(124,58,237,0.05)',
                pointerEvents: 'none',
              }} />

              {/* Icon */}
              <motion.div
                animate={{ y: [-6, 6, -6] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="relative z-10 text-6xl mb-6 inline-block"
                style={{ filter: 'drop-shadow(0 0 20px rgba(124,58,237,0.6))' }}
              >
                🔍
              </motion.div>

              <h2 className="relative z-10 text-3xl font-black mb-3 text-white">
                Start je eerste <span className="gradient-text">GEO-scan</span>
              </h2>
              <p className="relative z-10 text-gray-400 mb-8 max-w-md mx-auto leading-relaxed">
                Ontdek hoe ChatGPT en andere AI-platforms jouw bedrijf beoordelen.
                Eerste scan duurt <strong className="text-white">30–60 seconden</strong>.
              </p>

              {/* Feature pills */}
              <div className="relative z-10 flex flex-wrap gap-2 justify-center mb-8">
                {['🤖 ChatGPT', '🔵 Perplexity', '🟢 Gemini', '📊 GEO Score', '💡 Actiepunten'].map(tag => (
                  <span key={tag} className="text-xs px-3 py-1.5 rounded-full" style={{
                    background: 'rgba(124,58,237,0.12)',
                    border: '1px solid rgba(124,58,237,0.25)',
                    color: '#c4b5fd',
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              <motion.button
                onClick={startScan}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                className="relative z-10 btn-primary px-10 py-4 text-lg font-bold"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #3b82f6)',
                  boxShadow: '0 8px 40px rgba(124,58,237,0.4), 0 0 0 1px rgba(255,255,255,0.08)',
                  borderRadius: '14px',
                }}
              >
                🚀 Start GEO-scan
              </motion.button>

              <p className="relative z-10 text-gray-600 text-xs mt-4">Gratis te gebruiken · Geen creditcard nodig</p>
            </motion.div>
          )}

          {/* ── SCAN HISTORY ── */}
          {scans.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-deep p-6 mt-6"
            >
              <h3 className="font-bold mb-4 text-white">Scan geschiedenis</h3>
              <div className="space-y-2">
                {scans.slice(1, 6).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg" style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    transition: 'background 0.2s',
                  }}>
                    <div className="text-sm text-gray-400">
                      {new Date(scan.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">{scan.questions_asked} vragen</span>
                      <span className="font-bold text-sm" style={{ color: (scan.geo_score || 0) >= 70 ? '#22c55e' : (scan.geo_score || 0) >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {scan.geo_score}/100
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#030810' }}>
        <div className="text-center">
          <div className="text-2xl mb-3" style={{ animation: 'pulse 2s ease-in-out infinite' }}>⚡</div>
          <div className="text-gray-400">Laden...</div>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}
