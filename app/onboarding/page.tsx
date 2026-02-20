'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { getSupabase } from '@/lib/supabase'

const CATEGORIES = [
  'Marketing bureau', 'Bouwbedrijf', 'Horecagelegenheid', 'Webshop', 'Advocatenkantoor',
  'Accountantskantoor', 'Tandartspraktijk', 'Fysiotherapeut', 'Makelaar', 'Schoonmaakbedrijf',
  'IT bedrijf', 'Grafisch ontwerp', 'Fotografie', 'Consultancy', 'Transportbedrijf',
  'Dakdekker', 'Schilder', 'Loodgieter', 'Kapper', 'Sportschool', 'Anders'
]

// Deterministic star positions
const STARS = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  x: ((i * 19.1 + 11.3) % 100),
  y: ((i * 29.7 + 5.9) % 100),
  size: (i % 3) + 1,
  delay: (i * 0.27) % 5,
  duration: 2.5 + (i % 4) * 0.7,
}))

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '12px',
  color: 'white',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  outline: 'none',
  fontSize: '14px',
  transition: 'border-color 0.2s, box-shadow 0.2s',
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialEmail = searchParams.get('email') || ''
  const initialPlan = searchParams.get('plan') || 'gratis'

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: initialEmail,
    password: '',
    name: '',
    category: '',
    city: '',
    website: '',
    plan: initialPlan,
  })

  const totalSteps = 3

  const handleNext = () => {
    if (step === 1 && (!form.email || !form.password)) {
      setError('E-mail en wachtwoord zijn verplicht')
      return
    }
    if (step === 2 && (!form.name || !form.category || !form.city)) {
      setError('Bedrijfsnaam, categorie en stad zijn verplicht')
      return
    }
    setError('')
    setStep(s => s + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    try {
      const supabase = getSupabase()
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { emailRedirectTo: 'https://geochecks.nl/dashboard' },
      })

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: form.email, password: form.password,
          })
          if (signInError) {
            setError('E-mailadres al in gebruik. Controleer je wachtwoord.')
            return
          }
          authData && Object.assign(authData, signInData)
        } else {
          setError(authError.message || 'Account aanmaken mislukt')
          return
        }
      }

      const userId = authData?.user?.id
      if (!userId) {
        setError('Account aanmaken mislukt. Probeer opnieuw.')
        return
      }

      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          name: form.name,
          category: form.category,
          city: form.city,
          website: form.website,
          email: form.email,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Bedrijf aanmaken mislukt')
        return
      }

      localStorage.setItem('gc_user_id', userId)
      localStorage.setItem('gc_business_id', data.business.id)
      localStorage.setItem('gc_business', JSON.stringify(data.business))

      if (form.plan !== 'gratis') {
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: form.plan, business_id: data.business.id, email: form.email }),
        })
        const checkoutData = await checkoutRes.json()
        if (checkoutData.url) {
          window.location.href = checkoutData.url
          return
        }
      }
      router.push('/dashboard?new=1')
    } catch {
      setError('Er ging iets mis. Probeer opnieuw.')
    } finally {
      setLoading(false)
    }
  }

  const stepTitles = ['Account', 'Bedrijf', 'Plan']
  const stepIcons = ['👤', '🏢', '⚡']

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12" style={{ background: '#030810' }}>

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
          width: '500px', height: '500px', opacity: 0.14,
          background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
          top: '-15%', right: '-12%',
        }} />
        <div className="orb-2 orb absolute" style={{
          width: '350px', height: '350px', opacity: 0.1,
          background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          bottom: '-12%', left: '-8%',
        }} />
        <div className="orb-3 absolute" style={{
          width: '250px', height: '250px', opacity: 0.07,
          background: 'radial-gradient(circle, #06b6d4 0%, transparent 70%)',
          top: '50%', left: '10%',
          borderRadius: '50%', filter: 'blur(60px)',
        }} />
      </div>

      {/* ── PLANET ARC at top ── */}
      <div className="fixed top-0 left-0 right-0 pointer-events-none z-0 planet-arc" style={{
        height: '300px',
        background: 'radial-gradient(ellipse 70% 50% at 50% -15%, rgba(124,58,237,0.15) 0%, rgba(59,130,246,0.07) 50%, transparent 100%)',
      }} />

      <div className="relative z-10 w-full max-w-lg">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-2xl font-black gradient-text mb-2" style={{
            filter: 'drop-shadow(0 0 10px rgba(124,58,237,0.4))',
          }}>
            GeoCheck.nl
          </div>
          <div className="text-gray-400 text-sm">Maak je account aan — gratis in 60 seconden</div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex gap-3 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 flex flex-col items-center gap-2">
              <div
                className="w-full h-1 rounded-full transition-all duration-500"
                style={{ background: s <= step ? 'linear-gradient(90deg, #7c3aed, #3b82f6)' : 'rgba(255,255,255,0.08)' }}
              />
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: '12px', opacity: s <= step ? 1 : 0.4 }}>{stepIcons[s - 1]}</span>
                <span className="text-xs" style={{ color: s <= step ? '#a78bfa' : 'rgba(255,255,255,0.25)' }}>
                  {stepTitles[s - 1]}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '0 0 60px rgba(124,58,237,0.08), 0 20px 60px rgba(0,0,0,0.4)',
          }}
        >
          <AnimatePresence mode="wait">

            {/* Step 1: Account */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-1 text-white">Maak je account aan</h2>
                <p className="text-gray-400 text-sm mb-6">Stap 1 van {totalSteps} · Je gegevens zijn veilig</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">E-mailadres</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jouw@bedrijf.nl"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Wachtwoord</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Minimaal 8 tekens"
                      style={inputStyle}
                    />
                  </div>
                </div>
                <div className="mt-4 p-3 rounded-xl text-xs text-gray-500" style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}>
                  🔒 Veilig versleuteld · Je gegevens worden nooit gedeeld
                </div>
              </motion.div>
            )}

            {/* Step 2: Business */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-1 text-white">Jouw bedrijf</h2>
                <p className="text-gray-400 text-sm mb-6">Stap 2 van {totalSteps} · We scannen op basis van deze gegevens</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Bedrijfsnaam</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Bijv. Bakkerij de Korrel"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Categorie</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                      style={{ ...inputStyle, cursor: 'pointer' }}
                    >
                      <option value="" style={{ background: '#0a0f1e' }}>Selecteer categorie...</option>
                      {CATEGORIES.map(c => <option key={c} value={c} style={{ background: '#0a0f1e' }}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Stad</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Bijv. Amsterdam"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Website <span className="text-gray-600">(optioneel)</span></label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="https://jouwbedrijf.nl"
                      style={inputStyle}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Plan */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-1 text-white">Kies je plan</h2>
                <p className="text-gray-400 text-sm mb-6">Stap 3 van {totalSteps} · Altijd maandelijks opzegbaar</p>

                <div className="space-y-3 mb-6">
                  {[
                    { id: 'gratis', name: 'Gratis', price: '€0/m', desc: '1 scan/dag • 5 vragen • ChatGPT', icon: '🌱' },
                    { id: 'mkb', name: 'MKB', price: '€39/m', desc: '3 scans/dag • 50 vragen • Tips + Benchmark', popular: true, icon: '🚀' },
                    { id: 'bureau', name: 'Bureau', price: '€99/m', desc: '20 klanten • White-label • API', icon: '🏢' },
                  ].map(plan => (
                    <motion.div
                      key={plan.id}
                      onClick={() => setForm(f => ({ ...f, plan: plan.id }))}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      style={{
                        padding: '14px 16px',
                        borderRadius: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        border: form.plan === plan.id
                          ? '1px solid rgba(124,58,237,0.6)'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: form.plan === plan.id
                          ? 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(59,130,246,0.06))'
                          : 'rgba(255,255,255,0.02)',
                        boxShadow: form.plan === plan.id
                          ? '0 0 20px rgba(124,58,237,0.15), inset 0 1px 0 rgba(255,255,255,0.05)'
                          : 'none',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div style={{
                            width: '18px', height: '18px',
                            borderRadius: '50%',
                            border: `2px solid ${form.plan === plan.id ? '#7c3aed' : 'rgba(255,255,255,0.25)'}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                          }}>
                            {form.plan === plan.id && (
                              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#7c3aed' }} />
                            )}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span className="font-semibold text-white text-sm">{plan.icon} {plan.name}</span>
                              {plan.popular && (
                                <span style={{
                                  fontSize: '10px',
                                  padding: '2px 8px',
                                  borderRadius: '99px',
                                  background: 'rgba(124,58,237,0.25)',
                                  color: '#a78bfa',
                                  border: '1px solid rgba(124,58,237,0.35)',
                                }}>populair</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">{plan.desc}</div>
                          </div>
                        </div>
                        <div className="font-bold text-white text-sm text-right">
                          {plan.price}
                          {plan.id !== 'gratis' && <div className="text-xs text-gray-500">iDEAL</div>}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Summary */}
                <div style={{
                  padding: '14px 16px',
                  borderRadius: '12px',
                  background: 'rgba(124,58,237,0.06)',
                  border: '1px solid rgba(124,58,237,0.15)',
                }}>
                  <div className="text-sm font-semibold text-white mb-1">{form.name || 'Jouw bedrijf'}</div>
                  <div className="text-xs text-gray-400">{form.category || '—'} · {form.city || '—'}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl text-sm"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
            >
              ⚠️ {error}
            </motion.div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                style={{
                  flex: 1, padding: '12px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  transition: 'color 0.2s',
                  fontSize: '14px',
                }}
              >
                ← Terug
              </button>
            )}
            <button
              onClick={step < totalSteps ? handleNext : handleSubmit}
              disabled={loading}
              className="btn-primary"
              style={{ flex: 1, padding: '12px' }}
            >
              {loading ? 'Aanmaken...' : step < totalSteps
                ? 'Volgende →'
                : form.plan === 'gratis'
                  ? 'Account aanmaken →'
                  : 'Doorgaan naar betaling →'
              }
            </button>
          </div>
        </motion.div>

        {/* Footer link */}
        <p className="text-center text-gray-600 text-xs mt-6">
          Al een account?{' '}
          <a href="/dashboard" style={{ color: '#a78bfa', textDecoration: 'none' }}>Inloggen →</a>
        </p>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#030810' }}>
        <div className="text-gray-400">Laden...</div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
