'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'

export default function PrijzenPage() {
  const [loading, setLoading] = useState<string | null>(null)

  const handleUpgrade = async (plan: string) => {
    const businessId = localStorage.getItem('gc_business_id')
    const business = localStorage.getItem('gc_business')
    
    if (!businessId) {
      window.location.href = `/onboarding?plan=${plan}`
      return
    }
    
    if (plan === 'gratis') {
      window.location.href = '/dashboard'
      return
    }
    
    setLoading(plan)
    try {
      const b = business ? JSON.parse(business) : {}
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          business_id: businessId,
          email: b.report_email || 'klant@geocheck.nl',
        }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      id: 'gratis',
      name: 'Gratis',
      price: 0,
      desc: 'Voor wie eens wil kijken',
      features: [
        '1 bedrijf',
        '5 vragen per scan',
        '1 scan per dag',
        'ChatGPT only',
        'Basis GEO-dashboard',
        'Score geschiedenis',
      ],
      missing: ['Perplexity & Gemini', 'AI-verbeteringstips', 'Concurrentie-benchmark', 'E-mailrapporten'],
      highlight: false,
    },
    {
      id: 'mkb',
      name: 'MKB',
      price: 39,
      desc: 'Voor actieve Nederlandse ondernemers',
      features: [
        '1 bedrijf',
        '50 vragen per scan',
        '3 scans per dag',
        'ChatGPT + Perplexity',
        'Volledige GEO-score',
        'AI-verbeteringstips',
        '3 concurrenten benchmark',
        'Wekelijks e-mailrapport',
        'Score trend & geschiedenis',
      ],
      missing: [],
      highlight: true,
    },
    {
      id: 'bureau',
      name: 'Bureau',
      price: 99,
      desc: 'Voor marketingbureaus & resellers',
      features: [
        '20 klantbedrijven',
        '50 vragen per scan',
        'Onbeperkt scans per dag',
        'Alle AI-platforms',
        '10 concurrenten per klant',
        'White-label PDF rapport',
        'Wekelijks rapport per klant',
        'API toegang',
        'Priority support',
        'Reseller dashboard',
      ],
      missing: [],
      highlight: false,
    },
  ]

  const faqs = [
    {
      q: 'Welke AI-platforms worden gescand?',
      a: 'Op het Gratis plan scannen we ChatGPT (GPT-4o-mini). Op MKB en Bureau scannen we ook Perplexity. Gemini-integratie volgt in Q2 2026.',
    },
    {
      q: 'Hoe betrouwbaar is de GEO-score?',
      a: 'Wij stellen 5–50 unieke Nederlandse vragen per scan en analyseren de antwoorden op vermelding, sentiment en consistentie. Hoe meer vragen, hoe betrouwbaarder de score.',
    },
    {
      q: 'Kan ik maandelijks opzeggen?',
      a: 'Ja. Alle plannen zijn maandelijks opzegbaar. Geen jaarcontract, geen opzeggingskosten.',
    },
    {
      q: 'Hoe werkt het Bureau white-label rapport?',
      a: 'Als Bureau-klant kun je automatische PDF-rapporten versturen met jouw logo en branding naar je klanten. Elke klant krijgt wekelijks een eigen rapport.',
    },
    {
      q: 'Accepteren jullie iDEAL?',
      a: 'Ja! We accepteren iDEAL, creditcard (Visa/Mastercard) en Bancontact via Stripe. Betaling via SEPA overschrijving is ook mogelijk voor Bureau-klanten.',
    },
  ]

  // Deterministic stars
  const STARS = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: ((i * 21.3 + 9.7) % 100),
    y: ((i * 31.1 + 13.3) % 100),
    size: (i % 3) + 1,
    delay: (i * 0.33) % 5,
    duration: 2.5 + (i % 4) * 0.75,
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
        <div className="orb absolute" style={{ width: '480px', height: '480px', opacity: 0.13, background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', top: '-12%', right: '-12%' }} />
        <div className="orb-2 orb absolute" style={{ width: '320px', height: '320px', opacity: 0.09, background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', bottom: '-8%', left: '-6%' }} />
        <div className="orb-3 absolute" style={{ width: '240px', height: '240px', opacity: 0.07, background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', top: '50%', left: '20%', borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>
      {/* Planet arc */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-0 planet-arc" style={{
        height: '280px',
        background: 'radial-gradient(ellipse 80% 55% at 50% -18%, rgba(124,58,237,0.16) 0%, rgba(59,130,246,0.07) 50%, transparent 100%)',
      }} />

      {/* Nav */}
      <nav className="relative z-50 border-b" style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(3,8,16,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-black gradient-text">GeoCheck.nl</Link>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Dashboard</Link>
            <Link href="/onboarding" className="btn-primary text-sm py-2 px-4">Start gratis →</Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-black mb-4"
          >
            Eenvoudige, transparante prijzen
          </motion.h1>
          <p className="text-gray-400 text-xl">Start gratis. Betaal alleen als je groeit. Opzegbaar per maand.</p>
          <div className="mt-4 text-sm text-gray-500">
            Betaling via <span className="text-white">iDEAL</span>, creditcard of Bancontact via Stripe
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass p-8 relative flex flex-col ${plan.highlight ? 'border-violet-500/40' : ''}`}
              style={plan.highlight ? { borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.05)' } : {}}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  ⭐ Meest gekozen
                </div>
              )}
              
              <div className="mb-6">
                <div className="text-xl font-bold mb-1">{plan.name}</div>
                <div className="text-gray-400 text-sm mb-4">{plan.desc}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black">{plan.price === 0 ? 'Gratis' : `€${plan.price}`}</span>
                  {plan.price > 0 && <span className="text-gray-400 text-sm">/maand</span>}
                </div>
                {plan.price > 0 && <div className="text-xs text-gray-500 mt-1">excl. BTW • maandelijks opzegbaar</div>}
              </div>
              
              <ul className="space-y-3 mb-6 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-start gap-2 text-sm">
                    <span className="text-green-400 flex-shrink-0 mt-0.5">✓</span>
                    <span className="text-gray-200">{f}</span>
                  </li>
                ))}
                {plan.missing.map((f, j) => (
                  <li key={`m-${j}`} className="flex items-start gap-2 text-sm">
                    <span className="text-gray-600 flex-shrink-0 mt-0.5">✗</span>
                    <span className="text-gray-600">{f}</span>
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl font-semibold transition-all text-center ${plan.highlight ? 'btn-primary' : 'border hover:border-violet-500/50 text-gray-300 hover:text-white'}`}
                style={!plan.highlight ? { borderColor: 'rgba(255,255,255,0.1)' } : {}}
              >
                {loading === plan.id ? 'Doorsturen...' : plan.price === 0 ? 'Start gratis' : `Kies ${plan.name} →`}
              </button>
            </motion.div>
          ))}
        </div>

        {/* ROI Calculator */}
        <div className="glass p-8 mb-20 text-center" style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.2)' }}>
          <h2 className="text-2xl font-bold mb-2">Bureaus: bereken je ROI</h2>
          <p className="text-gray-400 mb-6">€99/m voor 20 klanten = €4,95 per klant per maand. Factureer €100–€300/m per klant voor GEO-management.</p>
          <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
            {[
              { clients: 5, revenue: '€500–€1.500/m', cost: '€99/m', margin: '80–93%' },
              { clients: 10, revenue: '€1.000–€3.000/m', cost: '€99/m', margin: '90–97%' },
              { clients: 20, revenue: '€2.000–€6.000/m', cost: '€99/m', margin: '95–98%' },
            ].map((row, i) => (
              <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="text-2xl font-black gradient-text">{row.clients} klanten</div>
                <div className="text-green-400 font-semibold text-sm mt-1">{row.revenue} omzet</div>
                <div className="text-gray-500 text-xs mt-1">Kosten: {row.cost}</div>
                <div className="text-violet-400 text-xs mt-1">Marge: {row.margin}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-10">Veelgestelde vragen</h2>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="glass p-6"
              >
                <div className="font-semibold mb-2">{faq.q}</div>
                <div className="text-gray-400 text-sm">{faq.a}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t mt-20" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="gradient-text font-black text-xl">GeoCheck.nl</div>
          <div className="text-gray-600 text-sm">© 2026 GeoCheck.nl — AIOW BV — Alle prijzen excl. 21% BTW</div>
        </div>
      </footer>
    </div>
  )
}
