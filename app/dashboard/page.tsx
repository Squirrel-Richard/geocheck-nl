'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Business, Scan } from '@/types'

function ScoreRing({ score, size = 120 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 70 ? 'Uitstekend' : score >= 50 ? 'Goed' : score >= 30 ? 'Matig' : 'Laag'
  
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
        <circle
          cx={size/2} cy={size/2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000"
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
  const [notification, setNotification] = useState(isNew ? 'Welkom bij GeoCheck! Start je eerste scan hieronder.' : isUpgraded ? 'Upgrade geslaagd! Je hebt nu toegang tot alle features.' : '')

  useEffect(() => {
    // Load from localStorage
    const storedBusiness = localStorage.getItem('gc_business')
    const businessId = localStorage.getItem('gc_business_id')
    
    if (storedBusiness) {
      setBusiness(JSON.parse(storedBusiness))
    }
    
    if (businessId) {
      loadScans(businessId)
    }
    
    if (notification) {
      setTimeout(() => setNotification(''), 5000)
    }
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

  const platformData = latestScan?.platforms as Record<string, { score: number; mention_rate: number; sentiment: string; questions_asked: number; questions_mentioned: number }> | undefined

  return (
    <div className="min-h-screen" style={{ background: '#06060f' }}>
      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb absolute w-64 h-64 opacity-10" style={{ background: '#7c3aed', top: '20%', right: '10%' }} />
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col" style={{ background: 'rgba(6,6,15,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link href="/" className="text-xl font-black gradient-text">GeoCheck.nl</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/dashboard', label: 'Dashboard', icon: '📊', active: true },
            { href: '/dashboard/scan', label: 'Nieuwe scan', icon: '🔍' },
            { href: '/dashboard/benchmark', label: 'Benchmark', icon: '⚔️' },
            { href: '/dashboard/rapporten', label: 'Rapporten', icon: '📧' },
            { href: '/prijzen', label: 'Upgraden', icon: '⚡' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${item.active ? 'bg-violet-600/20 text-white border border-violet-500/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        {business && (
          <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="glass p-3">
              <div className="text-xs text-gray-500 mb-1">Actief bedrijf</div>
              <div className="font-semibold text-sm">{business.name}</div>
              <div className="text-xs text-gray-400">{business.plan.toUpperCase()} plan</div>
            </div>
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="ml-64 relative z-10">
        {/* Top bar */}
        <div className="border-b px-8 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div>
            <h1 className="text-xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm">{business?.name || 'Jouw GEO-zichtbaarheid'}</p>
          </div>
          <button
            onClick={startScan}
            disabled={scanning}
            className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2"
          >
            {scanning ? (
              <>
                <span className="animate-spin">⟳</span>
                Scannen...
              </>
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
              style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
            >
              {notification}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-8">
          {/* Scanning animation */}
          {scanning && (
            <div className="glass p-12 text-center mb-6">
              <div className="text-4xl mb-4 animate-pulse">🤖</div>
              <h2 className="text-xl font-bold mb-2">Scan in uitvoering...</h2>
              <p className="text-gray-400">Wij vragen ChatGPT en Perplexity naar jouw bedrijf. Dit duurt 30–60 seconden.</p>
              <div className="mt-6 flex justify-center gap-1">
                {[0,1,2,3,4].map(i => (
                  <div key={i} className="w-2 h-8 rounded-full bg-violet-500 opacity-60" style={{ animation: `pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}

          {/* Latest scan results */}
          {latestScan && latestScan.status === 'completed' && (
            <>
              {/* Score overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="glass p-6 flex items-center gap-6">
                  <ScoreRing score={latestScan.geo_score || 0} />
                  <div>
                    <div className="text-sm text-gray-400 mb-1">GEO Score</div>
                    <div className="text-2xl font-black">{latestScan.geo_score}/100</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(latestScan.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                </div>
                
                <div className="glass p-6">
                  <div className="text-sm text-gray-400 mb-3">Vermeldingsrate</div>
                  <div className="text-3xl font-black text-blue-400">{Math.round((latestScan.mention_rate || 0) * 100)}%</div>
                  <div className="score-bar mt-3">
                    <div className="score-bar-fill" style={{ width: `${Math.round((latestScan.mention_rate || 0) * 100)}%` }} />
                  </div>
                  <div className="text-xs text-gray-500 mt-2">{latestScan.questions_mentioned} / {latestScan.questions_asked} vragen</div>
                </div>
                
                <div className="glass p-6">
                  <div className="text-sm text-gray-400 mb-3">Sentiment</div>
                  <div className="text-3xl">
                    {(latestScan.sentiment_score || 0) > 0.2 ? '😊' : (latestScan.sentiment_score || 0) < -0.2 ? '😟' : '😐'}
                  </div>
                  <div className="text-lg font-bold mt-2">
                    {(latestScan.sentiment_score || 0) > 0.2 ? 'Positief' : (latestScan.sentiment_score || 0) < -0.2 ? 'Negatief' : 'Neutraal'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Toon van vermeldingen</div>
                </div>
              </div>

              {/* Platform breakdown */}
              {platformData && Object.keys(platformData).length > 0 && (
                <div className="glass p-6 mb-6">
                  <h3 className="font-bold mb-4">Platform breakdown</h3>
                  <div className="space-y-4">
                    {Object.entries(platformData).map(([platform, data]) => (
                      <div key={platform}>
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium capitalize">{platform}</span>
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
                </div>
              )}

              {/* Suggestions */}
              {latestScan.suggestions && latestScan.suggestions.length > 0 && (
                <div className="glass p-6 mb-6">
                  <h3 className="font-bold mb-4">💡 AI-verbeteringstips</h3>
                  <div className="space-y-3">
                    {latestScan.suggestions.slice(0, 5).map((s, i) => (
                      <div key={i} className="flex gap-4 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold bg-violet-600/20 text-violet-400">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm mb-1">{s.title}</div>
                          <div className="text-gray-400 text-xs">{s.description}</div>
                          <div className="flex gap-3 mt-2">
                            <span className="text-violet-400 text-xs">↑ +{s.impact} punten</span>
                            <span className="text-gray-500 text-xs">Inspanning: {s.effort}</span>
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
            <div className="glass p-16 text-center">
              <div className="text-5xl mb-6">🔍</div>
              <h2 className="text-2xl font-bold mb-3">Start je eerste GEO-scan</h2>
              <p className="text-gray-400 mb-8 max-w-md mx-auto">
                Ontdek hoe ChatGPT en andere AI-platforms jouw bedrijf beoordelen. 
                Eerste scan duurt 30–60 seconden.
              </p>
              <button onClick={startScan} className="btn-primary px-8 py-4 text-lg">
                🚀 Start scan
              </button>
            </div>
          )}

          {/* Scan history */}
          {scans.length > 1 && (
            <div className="glass p-6 mt-6">
              <h3 className="font-bold mb-4">Scan geschiedenis</h3>
              <div className="space-y-2">
                {scans.slice(1, 6).map((scan) => (
                  <div key={scan.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="text-sm text-gray-400">
                      {new Date(scan.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm">{scan.questions_asked} vragen</span>
                      <span className="font-bold" style={{ color: (scan.geo_score || 0) >= 70 ? '#22c55e' : (scan.geo_score || 0) >= 40 ? '#f59e0b' : '#ef4444' }}>
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
    </div>
  )
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#06060f' }}>
      <div className="text-gray-400">Laden...</div>
    </div>}>
      <DashboardContent />
    </Suspense>
  )
}
