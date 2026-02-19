'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function RapportenPage() {
  const [emailReports, setEmailReports] = useState(true)
  const [reportEmail, setReportEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [notification, setNotification] = useState('')
  const [reports, setReports] = useState<Array<{
    id: string;
    sent_at: string;
    email: string;
    status: string;
  }>>([])

  useEffect(() => {
    const business = localStorage.getItem('gc_business')
    if (business) {
      const b = JSON.parse(business)
      setEmailReports(b.email_reports !== false)
      setReportEmail(b.report_email || b.email || '')
    }
  }, [])

  const saveSettings = async () => {
    const businessId = localStorage.getItem('gc_business_id')
    if (!businessId) return
    setSaving(true)
    try {
      const res = await fetch('/api/businesses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: businessId,
          email_reports: emailReports,
          report_email: reportEmail,
        }),
      })
      const data = await res.json()
      if (data.business) {
        localStorage.setItem('gc_business', JSON.stringify(data.business))
        setNotification('Instellingen opgeslagen!')
        setTimeout(() => setNotification(''), 3000)
      }
    } finally {
      setSaving(false)
    }
  }

  const sendTestReport = async () => {
    const businessId = localStorage.getItem('gc_business_id')
    const scanId = localStorage.getItem('gc_latest_scan_id')
    if (!businessId || !scanId) {
      setNotification('Voer eerst een scan uit op het dashboard')
      setTimeout(() => setNotification(''), 4000)
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_id: businessId, scan_id: scanId }),
      })
      const data = await res.json()
      if (data.success) {
        setNotification(`Testrapport verstuurd naar ${reportEmail}`)
        setTimeout(() => setNotification(''), 4000)
      } else {
        setNotification(data.error || 'Versturen mislukt')
        setTimeout(() => setNotification(''), 4000)
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#06060f' }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="orb absolute w-64 h-64 opacity-10" style={{ background: '#3b82f6', bottom: '20%', left: '15%' }} />
      </div>

      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 z-40 flex flex-col" style={{ background: 'rgba(6,6,15,0.95)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="p-6 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <Link href="/" className="text-xl font-black gradient-text">GeoCheck.nl</Link>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[
            { href: '/dashboard', label: 'Dashboard', icon: '📊' },
            { href: '/dashboard/scan', label: 'Nieuwe scan', icon: '🔍' },
            { href: '/benchmark', label: 'Benchmark', icon: '⚔️' },
            { href: '/rapporten', label: 'Rapporten', icon: '📧', active: true },
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
      </div>

      <div className="ml-64 relative z-10">
        <div className="border-b px-8 py-4" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <h1 className="text-xl font-bold">E-mailrapporten</h1>
          <p className="text-gray-400 text-sm">Wekelijkse GEO-rapporten in je inbox</p>
        </div>

        {notification && (
          <div className="mx-8 mt-4 p-4 rounded-xl text-sm" style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}>
            {notification}
          </div>
        )}

        <div className="p-8 space-y-6">
          {/* Settings */}
          <div className="glass p-6">
            <h3 className="font-bold mb-6">Rapport instellingen</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Wekelijkse e-mailrapporten</div>
                  <div className="text-sm text-gray-400 mt-1">Elke maandag om 08:00 een rapport in je inbox</div>
                </div>
                <button
                  onClick={() => setEmailReports(!emailReports)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${emailReports ? 'bg-violet-600' : 'bg-gray-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${emailReports ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Rapport e-mailadres</label>
                <input
                  type="email"
                  value={reportEmail}
                  onChange={(e) => setReportEmail(e.target.value)}
                  placeholder="rapport@jouwbedrijf.nl"
                  className="w-full max-w-sm px-4 py-3 rounded-xl text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
              
              <div className="flex gap-3">
                <button onClick={saveSettings} disabled={saving} className="btn-primary px-6 py-2.5 text-sm">
                  {saving ? 'Opslaan...' : 'Opslaan'}
                </button>
                <button onClick={sendTestReport} disabled={sending} className="px-6 py-2.5 text-sm rounded-xl transition-all text-gray-300 hover:text-white" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  {sending ? 'Versturen...' : '📧 Stuur testrapport'}
                </button>
              </div>
            </div>
          </div>

          {/* What's in the report */}
          <div className="glass p-6">
            <h3 className="font-bold mb-4">Wat staat er in het rapport?</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: '📊', title: 'GEO Score', desc: 'Jouw score van deze week vergeleken met vorige week' },
                { icon: '📈', title: 'Trend', desc: 'Is jouw zichtbaarheid gestegen of gedaald?' },
                { icon: '💡', title: 'Actiepunten', desc: 'Top 3 concrete tips om je score te verbeteren' },
                { icon: '⚔️', title: 'Concurrentie', desc: 'Hoe scoor jij versus de concurrentie? (MKB+)' },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)' }}>
                  <div className="text-2xl">{item.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-gray-400 text-xs">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="glass p-8 text-center" style={{ background: 'rgba(124,58,237,0.05)', borderColor: 'rgba(124,58,237,0.2)' }}>
            <div className="text-2xl mb-3">📧</div>
            <h3 className="font-bold mb-2">E-mailrapporten zijn beschikbaar vanaf MKB plan</h3>
            <p className="text-gray-400 text-sm mb-4">Automatische wekelijkse rapporten + white-label voor bureaus (Bureau plan).</p>
            <Link href="/prijzen" className="btn-primary px-6 py-2.5 inline-block">Upgrade naar MKB — €39/m</Link>
          </div>

          {/* Recent reports */}
          {reports.length > 0 && (
            <div className="glass p-6">
              <h3 className="font-bold mb-4">Verstuurde rapporten</h3>
              <div className="space-y-2">
                {reports.map(r => (
                  <div key={r.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    <div className="text-sm">
                      {new Date(r.sent_at).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">{r.email}</span>
                      <span className="text-xs text-green-400">✓ Verzonden</span>
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
