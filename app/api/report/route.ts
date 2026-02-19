import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getSentimentEmoji(score: number): string {
  if (score > 0.2) return '😊'
  if (score < -0.2) return '😟'
  return '😐'
}

function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#f59e0b'
  return '#ef4444'
}

function getScoreLabel(score: number): string {
  if (score >= 70) return 'Uitstekend'
  if (score >= 50) return 'Goed'
  if (score >= 30) return 'Matig'
  return 'Laag'
}

function buildEmailHtml(business: Record<string, unknown>, scan: Record<string, unknown>): string {
  const name = String(business.name)
  const geoScore = Number(scan.geo_score)
  const mentionRate = Number(scan.mention_rate)
  const sentimentScore = Number(scan.sentiment_score)
  const suggestions = (scan.suggestions as Array<{ title: string; description: string; impact: number }>) || []
  const scoreColor = getScoreColor(geoScore)
  const scoreLabel = getScoreLabel(geoScore)
  
  return `
<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>GEO Rapport — ${name}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a1a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    
    <!-- Header -->
    <div style="text-align:center;margin-bottom:40px;">
      <div style="font-size:28px;font-weight:800;background:linear-gradient(135deg,#7c3aed,#3b82f6);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:8px;">
        GeoCheck.nl
      </div>
      <div style="color:#6b7280;font-size:14px;">Wekelijks GEO Rapport</div>
    </div>
    
    <!-- Score Card -->
    <div style="background:linear-gradient(135deg,rgba(124,58,237,0.15),rgba(59,130,246,0.15));border:1px solid rgba(124,58,237,0.3);border-radius:16px;padding:32px;text-align:center;margin-bottom:24px;">
      <div style="font-size:14px;color:#9ca3af;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px;">GEO Score — ${name}</div>
      <div style="font-size:72px;font-weight:900;color:${scoreColor};line-height:1;">${geoScore}</div>
      <div style="font-size:18px;color:${scoreColor};margin-bottom:16px;">${scoreLabel}</div>
      <div style="display:flex;justify-content:center;gap:24px;flex-wrap:wrap;">
        <div>
          <div style="font-size:24px;color:#e5e7eb;font-weight:700;">${Math.round(mentionRate * 100)}%</div>
          <div style="font-size:12px;color:#9ca3af;">Vermeldingsrate</div>
        </div>
        <div>
          <div style="font-size:24px;">${getSentimentEmoji(sentimentScore)}</div>
          <div style="font-size:12px;color:#9ca3af;">Sentiment</div>
        </div>
        <div>
          <div style="font-size:24px;color:#e5e7eb;font-weight:700;">${scan.questions_asked}</div>
          <div style="font-size:12px;color:#9ca3af;">Vragen gesteld</div>
        </div>
      </div>
    </div>
    
    <!-- Top Suggestions -->
    ${suggestions.length > 0 ? `
    <div style="margin-bottom:24px;">
      <div style="font-size:18px;font-weight:700;color:#e5e7eb;margin-bottom:16px;">⚡ Top actiepunten</div>
      ${suggestions.slice(0, 3).map((s: { title: string; description: string; impact: number }, i: number) => `
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;margin-bottom:12px;">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="background:#7c3aed;color:white;width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0;">${i + 1}</div>
          <div>
            <div style="color:#e5e7eb;font-weight:600;margin-bottom:4px;">${s.title}</div>
            <div style="color:#9ca3af;font-size:13px;">${s.description}</div>
            <div style="color:#7c3aed;font-size:12px;margin-top:8px;">↑ +${s.impact} punten verwacht</div>
          </div>
        </div>
      </div>
      `).join('')}
    </div>
    ` : ''}
    
    <!-- CTA -->
    <div style="text-align:center;margin-top:32px;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#3b82f6);color:white;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600;font-size:16px;">
        Bekijk volledig dashboard →
      </a>
    </div>
    
    <!-- Footer -->
    <div style="text-align:center;margin-top:40px;color:#4b5563;font-size:12px;">
      <p>Je ontvangt dit rapport wekelijks van GeoCheck.nl</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/instellingen" style="color:#7c3aed;">Rapport uitschakelen</a></p>
    </div>
  </div>
</body>
</html>
  `
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const { business_id, scan_id } = await req.json()
    
    if (!business_id || !scan_id) {
      return NextResponse.json({ error: 'business_id en scan_id zijn verplicht' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data: business } = await supabase
      .from('gc_businesses')
      .select('*')
      .eq('id', business_id)
      .single()
    
    if (!business) {
      return NextResponse.json({ error: 'Bedrijf niet gevonden' }, { status: 404 })
    }
    
    if (!business.email_reports || !business.report_email) {
      return NextResponse.json({ error: 'E-mailrapporten zijn uitgeschakeld voor dit bedrijf' }, { status: 400 })
    }
    
    const { data: scan } = await supabase
      .from('gc_scans')
      .select('*')
      .eq('id', scan_id)
      .single()
    
    if (!scan) {
      return NextResponse.json({ error: 'Scan niet gevonden' }, { status: 404 })
    }
    
    const html = buildEmailHtml(business, scan)
    
    const { error: emailError } = await resend.emails.send({
      from: process.env.RESEND_FROM || 'rapport@geocheck.nl',
      to: business.report_email,
      subject: `📊 GEO Rapport — ${business.name} — Score: ${scan.geo_score}/100`,
      html,
    })
    
    if (emailError) {
      console.error('Email send error:', emailError)
      return NextResponse.json({ error: 'E-mail versturen mislukt' }, { status: 500 })
    }
    
    await supabase
      .from('gc_reports')
      .insert({
        business_id,
        scan_id,
        email: business.report_email,
        status: 'sent',
      })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
