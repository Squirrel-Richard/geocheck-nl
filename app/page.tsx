'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'framer-motion'

const STARS = Array.from({ length: 65 }, (_, i) => ({
  id: i,
  x: ((i * 16.9 + 11.1) % 100),
  y: ((i * 25.3 + 6.7) % 100),
  size: (i % 3) + 1,
  delay: (i * 0.31) % 5,
  duration: 2.5 + (i % 4) * 0.8,
}))

export default function HomePage() {
  const [email, setEmail] = useState('')

  const features = [
    {
      icon: '🔍',
      title: 'Bedrijf-scan',
      desc: 'Wij stellen 50 relevante Nederlandse vragen aan ChatGPT, Perplexity en Gemini en kijken of jouw merk wordt aanbevolen.',
    },
    {
      icon: '📊',
      title: 'GEO Score Dashboard',
      desc: 'Jouw GEO-rank van 0–100, vermeldingsrate per platform, sentiment analyse en historische trend.',
    },
    {
      icon: '⚔️',
      title: 'Concurrentie-benchmark',
      desc: 'Voeg 3 concurrenten toe en zie wie AI-modellen vaker aanbeveelt — en waarom.',
    },
    {
      icon: '💡',
      title: 'AI-verbeteringstips',
      desc: 'Concrete content-adviezen: "Publiceer dit artikel → score stijgt +12 punten." Direct actioneerbaar.',
    },
    {
      icon: '📧',
      title: 'Wekelijks e-mailrapport',
      desc: 'Automatische samenvatting + actiepunten in je inbox. White-label beschikbaar voor bureaus.',
    },
  ]

  const stats = [
    { value: '3', label: 'AI-platforms', sub: 'ChatGPT, Perplexity, Gemini' },
    { value: '50', label: 'vragen per scan', sub: 'relevant & lokaal NL' },
    { value: '60s', label: 'eerste resultaat', sub: 'geen wachttijden' },
    { value: '€0', label: 'om te starten', sub: 'gratis basis scan' },
  ]

  const pricing = [
    {
      name: 'Gratis',
      price: 0,
      desc: 'Probeer de scan gratis',
      features: ['1 bedrijf', '5 vragen per scan', '1 scan per dag', 'ChatGPT only', 'Basis dashboard'],
      cta: 'Start gratis',
      href: '/onboarding',
      highlight: false,
    },
    {
      name: 'MKB',
      price: 39,
      desc: 'Voor actieve Nederlandse ondernemers',
      features: ['1 bedrijf', '50 vragen per scan', '3 scans per dag', 'ChatGPT + Perplexity', 'AI-verbeteringstips', '3 concurrenten', 'Wekelijks e-mailrapport'],
      cta: 'Start MKB — €39/m',
      href: '/onboarding?plan=mkb',
      highlight: true,
    },
    {
      name: 'Bureau',
      price: 99,
      desc: 'Voor marketingbureaus & resellers',
      features: ['20 klanten', '50 vragen per scan', 'Onbeperkt scans', 'Alle AI-platforms', 'White-label rapport', '10 concurrenten', 'API toegang', 'Wekelijks rapport per klant'],
      cta: 'Start Bureau — €99/m',
      href: '/onboarding?plan=bureau',
      highlight: false,
    },
  ]

  const testimonials = [
    {
      name: 'Martijn de Vries',
      role: 'Eigenaar, Schoonmaakbedrijf Utrecht',
      text: 'Na 3 weken GeoCheck weet ik precies waarom klanten mij niet via ChatGPT vinden. De actiepunten zijn concreet en werkbaar.',
      score: 72,
    },
    {
      name: 'Sandra Koopman',
      role: 'Marketing Manager, B2B SaaS',
      text: 'Wij dachten goed te scoren in AI-zoekopdrachten. GeoCheck liet zien dat onze concurrent ons op elk platform versloeg. Nu weten we waarom.',
      score: 85,
    },
    {
      name: 'Jeroen van Breda',
      role: 'Directeur, KGOM Marketing Bureau',
      text: 'White-label rapport stuurt zichzelf wekelijks naar 18 klanten. Indrukwekkend product, ideale meerwaarde voor ons bureau.',
      score: 91,
    },
  ]

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
        <div className="orb absolute w-96 h-96 opacity-20" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', top: '-10%', left: '-10%' }} />
        <div className="orb-2 orb absolute w-64 h-64 opacity-15" style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', top: '40%', right: '-5%' }} />
        <div className="orb absolute w-80 h-80 opacity-10" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)', bottom: '-10%', left: '40%' }} />
        <div className="orb-3 absolute" style={{ width: '260px', height: '260px', opacity: 0.07, background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)', top: '60%', left: '60%', borderRadius: '50%', filter: 'blur(60px)' }} />
      </div>
      {/* Planet arc */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-0 planet-arc" style={{
        height: '350px',
        background: 'radial-gradient(ellipse 90% 65% at 50% -20%, rgba(124,58,237,0.2) 0%, rgba(59,130,246,0.08) 55%, transparent 100%)',
      }} />

      {/* Nav */}
      <nav className="relative z-50 border-b" style={{ borderColor: 'rgba(124,58,237,0.15)', background: 'rgba(3,8,16,0.85)', backdropFilter: 'blur(12px)' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="text-xl font-black gradient-text">GeoCheck.nl</div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</Link>
            <Link href="#hoe-werkt-het" className="text-sm text-gray-400 hover:text-white transition-colors">Hoe werkt het</Link>
            <Link href="#prijzen" className="text-sm text-gray-400 hover:text-white transition-colors">Prijzen</Link>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">Inloggen</Link>
            <Link href="/onboarding" className="btn-primary text-sm py-2 px-4">Start gratis →</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
              🚀 GEO = de nieuwe SEO — weet jij hoe je scoort?
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight">
              Is jouw bedrijf<br />
              <span className="gradient-text">zichtbaar in ChatGPT?</span>
            </h1>
            
            <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              In 2026 zoeken mensen via AI. Weet jij of ChatGPT, Perplexity en Gemini jouw bedrijf aanbevelen? 
              GeoCheck scant het in 60 seconden en geeft je concrete verbeteringstips.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/onboarding" className="btn-primary text-lg px-8 py-4">
                Scan mijn bedrijf gratis →
              </Link>
              <Link href="#hoe-werkt-het" className="px-8 py-4 rounded-xl text-gray-400 hover:text-white transition-colors border" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                Hoe werkt het?
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                className="glass p-6 text-center"
              >
                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-white font-semibold text-sm">{stat.label}</div>
                <div className="text-gray-500 text-xs mt-1">{stat.sub}</div>
              </motion.div>
            ))}
          </div>

          {/* Mock Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="glass p-8 max-w-2xl mx-auto"
            style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.2)' }}
          >
            <div className="text-sm text-gray-500 mb-4">Voorbeeld GEO Rapport — Bakkerij de Korrel, Amsterdam</div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
              <div className="text-center">
                <div className="text-6xl font-black text-green-400">73</div>
                <div className="text-sm text-gray-400 mt-1">GEO Score</div>
              </div>
              <div className="flex flex-col gap-3 flex-1 max-w-xs">
                {[
                  { label: 'ChatGPT', val: 80, color: '#22c55e' },
                  { label: 'Perplexity', val: 65, color: '#f59e0b' },
                  { label: 'Gemini', val: 58, color: '#ef4444' },
                ].map(p => (
                  <div key={p.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">{p.label}</span>
                      <span style={{ color: p.color }}>{p.val}/100</span>
                    </div>
                    <div className="score-bar">
                      <div className="score-bar-fill" style={{ width: `${p.val}%`, background: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <div className="text-sm text-gray-400 mb-3">💡 Top actiepunt</div>
              <div className="text-left p-3 rounded-lg" style={{ background: 'rgba(124,58,237,0.1)' }}>
                <div className="text-white font-medium text-sm">Publiceer &quot;Beste brood in Amsterdam&quot; gids</div>
                <div className="text-gray-500 text-xs mt-1">Verwachte score verbetering: +12 punten • Inspanning: Medium</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Alles wat je nodig hebt</h2>
            <p className="text-gray-400 text-lg">Van eerste scan tot wekelijks rapport — volledig automatisch</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass p-6 hover:border-violet-500/30 transition-colors"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="hoe-werkt-het" className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Hoe werkt het?</h2>
            <p className="text-gray-400">Van aanmelding tot eerste GEO-score in 3 stappen</p>
          </div>
          <div className="space-y-6">
            {[
              { step: '01', title: 'Vul je bedrijfsgegevens in', desc: 'Naam, categorie en stad. Dat is alles. Geen technische kennis nodig.' },
              { step: '02', title: 'Wij scannen ChatGPT, Perplexity en Gemini', desc: 'Ons platform stelt 50 relevante Nederlandse vragen aan elk AI-platform en analyseert of jouw merk wordt aanbevolen.' },
              { step: '03', title: 'Ontvang jouw GEO-score + actiepunten', desc: 'Score van 0–100, sentiment analyse, concurrentie-vergelijking en concrete tips om je score te verbeteren.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="glass p-6 flex gap-6 items-start"
              >
                <div className="text-3xl font-black gradient-text flex-shrink-0 w-12">{step.step}</div>
                <div>
                  <h3 className="text-lg font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-400">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Wat zeggen onze gebruikers?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="glass p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex gap-1">
                    {[1,2,3,4,5].map(s => (
                      <span key={s} className="text-yellow-400">★</span>
                    ))}
                  </div>
                  <div className="text-green-400 font-bold">{t.score}/100</div>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4">&quot;{t.text}&quot;</p>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="prijzen" className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">Transparante prijzen</h2>
            <p className="text-gray-400">Start gratis, betaal alleen als je groeit. Betaling via iDEAL.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className={`glass p-8 relative ${plan.highlight ? 'border-violet-500/40' : ''}`}
                style={plan.highlight ? { borderColor: 'rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.05)' } : {}}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                    Meest gekozen
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-lg font-bold mb-1">{plan.name}</div>
                  <div className="text-gray-400 text-sm mb-4">{plan.desc}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{plan.price === 0 ? 'Gratis' : `€${plan.price}`}</span>
                    {plan.price > 0 && <span className="text-gray-400 text-sm">/maand</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <span className="text-green-400">✓</span>
                      <span className="text-gray-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-3 rounded-xl font-semibold transition-all ${plan.highlight ? 'btn-primary' : 'border hover:border-violet-500/50 text-gray-300 hover:text-white'}`}
                  style={!plan.highlight ? { borderColor: 'rgba(255,255,255,0.1)' } : {}}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-8 text-gray-500 text-sm">
            Betaling via iDEAL, creditcard of Bancontact. Maandelijks opzegbaar.
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass p-12" style={{ background: 'rgba(124,58,237,0.08)', borderColor: 'rgba(124,58,237,0.3)' }}>
            <h2 className="text-4xl font-black mb-4">Start vandaag gratis</h2>
            <p className="text-gray-400 mb-8">Ontdek in 60 seconden hoe ChatGPT jouw bedrijf beoordeelt. Geen creditcard nodig.</p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="jouw@email.nl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <Link href={`/onboarding${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="btn-primary px-6 py-3 whitespace-nowrap">
                Scan starten →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t" style={{ borderColor: 'rgba(124,58,237,0.15)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="gradient-text font-black text-xl">GeoCheck.nl</div>
          <div className="flex gap-8">
            <Link href="/prijzen" className="text-gray-500 hover:text-white text-sm transition-colors">Prijzen</Link>
            <Link href="/onboarding" className="text-gray-500 hover:text-white text-sm transition-colors">Aanmelden</Link>
            <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm transition-colors">Inloggen</Link>
          </div>
          <div className="text-gray-600 text-sm">© 2026 GeoCheck.nl — AIOW BV</div>
        </div>
      </footer>
    </div>
  )
}
