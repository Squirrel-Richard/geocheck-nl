import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { runGeoScan, generateSuggestions } from '@/lib/geo-scanner'
import { PLAN_LIMITS } from '@/types'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const supabase = createServerClient()
  
  try {
    // Get all paid businesses with email reports enabled
    const { data: businesses } = await supabase
      .from('gc_businesses')
      .select('*')
      .in('plan', ['mkb', 'bureau'])
      .eq('email_reports', true)
      .not('report_email', 'is', null)
    
    if (!businesses || businesses.length === 0) {
      return NextResponse.json({ message: 'Geen bedrijven om te scannen', count: 0 })
    }
    
    let scanned = 0
    let failed = 0
    
    for (const business of businesses) {
      try {
        const plan = business.plan as keyof typeof PLAN_LIMITS
        const limits = PLAN_LIMITS[plan]
        
        // Create scan
        const { data: scan } = await supabase
          .from('gc_scans')
          .insert({ business_id: business.id, status: 'running' })
          .select()
          .single()
        
        if (!scan) continue
        
        const platforms: ('claude' | 'perplexity')[] = ['claude']
        if (process.env.PERPLEXITY_API_KEY) platforms.push('perplexity')
        
        const results = await runGeoScan(
          business.name,
          business.category,
          business.city,
          Math.min(limits.queries_per_scan, 20), // Limit for cron
          platforms
        )
        
        const suggestions = await generateSuggestions(
          business.name,
          business.category,
          results.geo_score,
          results.mention_rate,
          results.raw_results
        )
        
        await supabase
          .from('gc_scans')
          .update({
            status: 'completed',
            ...results,
            suggestions,
            completed_at: new Date().toISOString(),
          })
          .eq('id', scan.id)
        
        // Send email report
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/report`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ business_id: business.id, scan_id: scan.id }),
        })
        
        scanned++
      } catch (err) {
        console.error(`Scan failed for business ${business.id}:`, err)
        failed++
      }
    }
    
    return NextResponse.json({ 
      message: 'Wekelijkse scans voltooid',
      scanned,
      failed,
      total: businesses.length,
    })
  } catch (error) {
    console.error('Cron error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
