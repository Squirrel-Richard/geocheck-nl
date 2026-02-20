'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Competitor } from '@/types'

export default function BenchmarkPage() {
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState<Array<{
    competitor: Competitor;
    geo_score: number;
    mention_rate: number;
    sentiment_score: number;
  }>>([])
  const [form, setForm] = useState({ name: '', city: '', website: '' })
  const [adding, setAdding] = useState(false)
  const [notification, setNotification] = useState('')

  useEffect(() => {
    loadCompetitors()
  }, [])

  const loadCompetitors = async () => {
    const businessId = localStorage.getItem('gc_business_id')
    if (!businessId) return
    const res = await fetch(`/api/benchmark?business_id=${businessId}`)
    const data = await res.json()
    if (data.competitors) setCompetitors(data.competitors)
  }

  const addCompetitor = async () => {
    const businessId = localStorage.getItem('gc_business_id')
    if (!businessId || !form.name) return
    setAdding(true)
    try {
      const res = await fetch('/api/benchmark', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, ...form }),
      })
      const data = await res.json()
      if (data.competitor) {
        setCompetitors(prev => [...prev, data.competitor])
        setForm({ name: '', city: '', website: '' })
        setNotification('Concurrent toegevoegd!')
        setTimeout(() => setNotification(''), 3000)
      } else {
        setNotification(data.error || 'Toevoegen mislukt')
        setTimeout(() => setNotification(''), 3000)
      }
    } finally {
      setAdding(false)
    }
  }

  const runBenchmark = async () => {
    const businessId = localStorage.getItem('gc_business_id')
    const scanId = localStorage.getItem('gc_latest_scan_id')
    if (!businessId || !scanId) {
      setNotification('Voer eerst een bedrijfsscan uit op het dashboard')
      setTimeout(() => setNotification(''), 4000)
      return
    }
    setRunning(true)
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, scan_id: scanId }),
      })
      const data = await res.json()
      if (data.competitor_scans) {
        setResults(data.competitor_scans.map((cs: {
          competitor: Competitor;
          geo_score: number;
          mention_rate: number;
          sentiment_score: number;
        }) => ({
          competitor: cs.competitor,
          geo_score: cs.geo_score,
          mention_rate: cs.mention_rate,
          sentiment_score: cs.sentiment_score,
        })))
        setNotification('Benchmark voltooid!')
        setTimeout(() => setNotification(''), 3000)
      } else {
        setNotification(data.error || 'Benchmark mislukt')
        setTimeout(() => setNotification(''), 4000)
      }
    } finally {
      setRunning(false)
    }
  }

  const STARS = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: ((i * 22.1 + 7.9) % 100),
    y: ((i * 33.3 + 11.1) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.35) % 5,
    duration: 2.5 + (i % 4) * 0.8,
  }))

  return (
    <div className="min-h-screen" style={{ background: '#030810' }}>
      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {STARS.map(s => (
          <div key={s.id} className="star" style={{
            left: `${s.x}%`, top: `${s.y}%`,
            width: `${s.size}px`, height: `${s.size}px`,
            animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s`,
          }} />
        ))}
      </div>
      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb absolute" style={{ width: '400px', height: '400px', opacity: 0.11, background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', top: '20%', right: '10%' }} />
        <div className="orb-2 orb absolute" style={{ width: '300px', height: '300px', opacity: 0.09, background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', bottom: '-8%', left: '-5%' }} />
        <div className="orb-3 absolute" style={{ width: '260px', height: '260px', opacity: 0.07, background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', top: '-8%', left: '35%', borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>
      {/* Planet arc */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-0 planet-arc" style={{
        height: '270px',
        background: 'radial-gradient(ellipse 75% 52% at 50% -16%, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.07) 50%, transparent 100%)',
      }} />

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col" style={{
        background: 'rgba(3,8,16,0.97)',
        borderRight: '1px solid rgba(124,58,237,0.15)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)',
      }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
          <Link href="/" className="text-xl font-black gradient-text" style={{ filter: 'drop-shadow(0 0 8px rgba(124,58,237,0.4))' }}>
            GeoCheck.nl
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/dashboard', label: 'Dashboard', icon: '📊' },
            { href: '/dashboard/scan', label: 'Nieuwe scan', icon: '🔍' },
            { href: '/benchmark', label: 'Benchmark', icon: '⚔️', active: true },
            { href: '/rapporten', label: 'Rapporten', icon: '📧' },
            { href: '/prijzen', label: 'Upgraden', icon: '⚡' },
          ].map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${item.active ? 'text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
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
      </div>

      <div className="ml-64 relative z-10">
        <div className="px-8 py-4" style={{
          borderBottom: '1px solid rgba(124,58,237,0.15)',
          background: 'rgba(3,8,16,0.8)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 30,
        }}>
          <h1 className="text-xl font-bold text-white">Concurrentie-benchmark</h1>
          <p className="text-gray-400 text-sm">Vergelijk jouw GEO-score met concurrenten</p>
        </div>

        {notification && (
          <div className="mx-8 mt-4 p-4 rounded-xl text-sm" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
            {notification}
          </div>
        )}

        <div className="p-8 space-y-6">
          {/* Add competitor */}
          <div className="glass p-6">
            <h3 className="font-bold mb-4">Concurrent toevoegen</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <input
                type="text"
                placeholder="Naam concurrent"
                value={form.name}
                onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                className="px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <input
                type="text"
                placeholder="Stad"
                value={form.city}
                onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                className="px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <button onClick={addCompetitor} disabled={adding || !form.name} className="btn-primary">
                {adding ? 'Toevoegen...' : '+ Toevoegen'}
              </button>
            </div>
            
            {competitors.length > 0 && (
              <div className="space-y-2">
                {competitors.map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <div>
                      <div className="font-medium text-sm">{c.name}</div>
                      {c.city && <div className="text-xs text-gray-500">{c.city}</div>}
                    </div>
                    <span className="text-green-400 text-xs">✓ Toegevoegd</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Run benchmark */}
          {competitors.length > 0 && (
            <div className="glass p-6 text-center">
              <p className="text-gray-400 mb-4">{competitors.length} concurrent{competitors.length > 1 ? 'en' : ''} klaar voor vergelijking</p>
              <button onClick={runBenchmark} disabled={running} className="btn-primary px-8 py-3">
                {running ? '⟳ Scannen...' : '⚔️ Benchmark starten'}
              </button>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && (
            <div className="glass p-6">
              <h3 className="font-bold mb-6">Resultaten</h3>
              <div className="space-y-4">
                {results.sort((a, b) => (b.geo_score || 0) - (a.geo_score || 0)).map((r, i) => (
                  <motion.div
                    key={r.competitor.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{ background: i === 0 ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.03)', border: `1px solid ${i === 0 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.06)'}` }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: i === 0 ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)', color: i === 0 ? '#22c55e' : '#9ca3af' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{r.competitor.name}</div>
                      <div className="text-xs text-gray-500">{r.competitor.city}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg" style={{ color: (r.geo_score || 0) >= 70 ? '#22c55e' : (r.geo_score || 0) >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {r.geo_score}/100
                      </div>
                      <div className="text-xs text-gray-500">{Math.round((r.mention_rate || 0) * 100)}% vermeld</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade CTA for gratis users */}
          <div className="glass p-8 text-center" style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.2)' }}>
            <div className="text-2xl mb-3">⚔️</div>
            <h3 className="font-bold mb-2">Beschikbaar vanaf MKB plan</h3>
            <p className="text-gray-400 text-sm mb-4">Vergelijk met tot 3 concurrenten en zie wie AI-modellen vaker aanbeveelt.</p>
            <Link href="/prijzen" className="btn-primary px-6 py-2.5 inline-block">Upgrade naar MKB — €39/m</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
