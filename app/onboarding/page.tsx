'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

const CATEGORIES = [
  'Marketing bureau', 'Bouwbedrijf', 'Horecagelegenheid', 'Webshop', 'Advocatenkantoor',
  'Accountantskantoor', 'Tandartspraktijk', 'Fysiotherapeut', 'Makelaar', 'Schoonmaakbedrijf',
  'IT bedrijf', 'Grafisch ontwerp', 'Fotografie', 'Consultancy', 'Transportbedrijf',
  'Dakdekker', 'Schilder', 'Loodgieter', 'Kapper', 'Sportschool', 'Anders'
]

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
      // For demo: create a mock user_id and redirect to dashboard
      const mockUserId = crypto.randomUUID()
      
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: mockUserId,
          name: form.name,
          category: form.category,
          city: form.city,
          website: form.website,
          email: form.email,
        }),
      })
      
      const data = await res.json()
      
      if (!res.ok) {
        setError(data.error || 'Er ging iets mis')
        return
      }
      
      // Store in localStorage for demo
      localStorage.setItem('gc_user_id', mockUserId)
      localStorage.setItem('gc_business_id', data.business.id)
      localStorage.setItem('gc_business', JSON.stringify(data.business))
      
      if (form.plan !== 'gratis') {
        // Redirect to checkout
        const checkoutRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: form.plan,
            business_id: data.business.id,
            email: form.email,
          }),
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

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#06060f' }}>
      {/* Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="orb absolute w-96 h-96 opacity-20" style={{ background: '#7c3aed', top: '-10%', right: '-10%' }} />
        <div className="orb-2 orb absolute w-64 h-64 opacity-15" style={{ background: '#3b82f6', bottom: '-10%', left: '-5%' }} />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-2xl font-black gradient-text mb-2">GeoCheck.nl</div>
          <div className="text-gray-400 text-sm">Maak je account aan — gratis in 60 seconden</div>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1,2,3].map(s => (
            <div
              key={s}
              className="flex-1 h-1 rounded-full transition-all duration-500"
              style={{ background: s <= step ? 'linear-gradient(90deg, #7c3aed, #3b82f6)' : 'rgba(255,255,255,0.1)' }}
            />
          ))}
        </div>

        <div className="glass p-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-2">Maak je account aan</h2>
                <p className="text-gray-400 text-sm mb-6">Stap 1 van {totalSteps}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">E-mailadres</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jouw@bedrijf.nl"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Wachtwoord</label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Minimaal 8 tekens"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-2">Jouw bedrijf</h2>
                <p className="text-gray-400 text-sm mb-6">Stap 2 van {totalSteps}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bedrijfsnaam</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Bijv. Bakkerij de Korrel"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Categorie</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-violet-500"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <option value="">Selecteer categorie...</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Stad</label>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Bijv. Amsterdam"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Website (optioneel)</label>
                    <input
                      type="url"
                      value={form.website}
                      onChange={(e) => setForm(f => ({ ...f, website: e.target.value }))}
                      placeholder="https://jouwbedrijf.nl"
                      className="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h2 className="text-2xl font-bold mb-2">Kies je plan</h2>
                <p className="text-gray-400 text-sm mb-6">Stap 3 van {totalSteps}</p>
                
                <div className="space-y-3">
                  {[
                    { id: 'gratis', name: 'Gratis', price: '€0/m', desc: '1 scan/dag, 5 vragen, ChatGPT' },
                    { id: 'mkb', name: 'MKB', price: '€39/m', desc: '3 scans/dag, 50 vragen, tips, benchmark', popular: true },
                    { id: 'bureau', name: 'Bureau', price: '€99/m', desc: '20 klanten, white-label, API' },
                  ].map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => setForm(f => ({ ...f, plan: plan.id }))}
                      className={`p-4 rounded-xl cursor-pointer transition-all ${form.plan === plan.id ? 'border-violet-500' : 'hover:border-white/20'}`}
                      style={{ 
                        border: `1px solid ${form.plan === plan.id ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`,
                        background: form.plan === plan.id ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                            style={{ borderColor: form.plan === plan.id ? '#7c3aed' : 'rgba(255,255,255,0.3)' }}
                          >
                            {form.plan === plan.id && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                          </div>
                          <div>
                            <div className="font-semibold">{plan.name} {plan.popular && <span className="text-xs text-violet-400 ml-1">populair</span>}</div>
                            <div className="text-xs text-gray-400">{plan.desc}</div>
                          </div>
                        </div>
                        <div className="font-bold text-right">
                          <div>{plan.price}</div>
                          {plan.id !== 'gratis' && <div className="text-xs text-gray-500">iDEAL</div>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-sm font-semibold mb-1">{form.name || 'Jouw bedrijf'}</div>
                  <div className="text-xs text-gray-400">{form.category} · {form.city}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 rounded-lg text-red-400 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <button
                onClick={() => setStep(s => s - 1)}
                className="flex-1 py-3 rounded-xl transition-colors text-gray-400 hover:text-white"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                ← Terug
              </button>
            )}
            <button
              onClick={step < totalSteps ? handleNext : handleSubmit}
              disabled={loading}
              className="flex-1 btn-primary py-3"
            >
              {loading ? 'Aanmaken...' : step < totalSteps ? 'Volgende →' : form.plan === 'gratis' ? 'Account aanmaken →' : 'Doorgaan naar betaling →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center" style={{ background: '#06060f' }}>
      <div className="text-gray-400">Laden...</div>
    </div>}>
      <OnboardingContent />
    </Suspense>
  )
}
