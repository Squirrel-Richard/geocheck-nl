import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { runGeoScan, generateSuggestions } from '@/lib/geo-scanner'
import { PLAN_LIMITS } from '@/types'

export async function POST(req: NextRequest) {
  try {
    const { business_id } = await req.json()
    
    if (!business_id) {
      return NextResponse.json({ error: 'business_id is verplicht' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    // Get business details
    const { data: business, error: bizError } = await supabase
      .from('gc_businesses')
      .select('*')
      .eq('id', business_id)
      .single()
    
    if (bizError || !business) {
      return NextResponse.json({ error: 'Bedrijf niet gevonden' }, { status: 404 })
    }
    
    const plan = business.plan as keyof typeof PLAN_LIMITS
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.gratis
    
    // Check daily scan limit
    const today = new Date().toISOString().split('T')[0]
    const { count } = await supabase
      .from('gc_scans')
      .select('id', { count: 'exact' })
      .eq('business_id', business_id)
      .gte('created_at', `${today}T00:00:00Z`)
      .not('status', 'eq', 'failed')
    
    if ((count || 0) >= limits.scans_per_day) {
      return NextResponse.json({ 
        error: `Daglimiet bereikt (${limits.scans_per_day} scans/dag voor ${plan} plan)` 
      }, { status: 429 })
    }
    
    // Create scan record
    const { data: scan, error: scanError } = await supabase
      .from('gc_scans')
      .insert({
        business_id,
        status: 'running',
      })
      .select()
      .single()
    
    if (scanError || !scan) {
      return NextResponse.json({ error: 'Scan aanmaken mislukt' }, { status: 500 })
    }
    
    // Determine platforms based on plan
    const platforms: ('claude' | 'perplexity')[] = ['claude']
    if (plan !== 'gratis' && process.env.PERPLEXITY_API_KEY) {
      platforms.push('perplexity')
    }
    
    // Run the scan
    const results = await runGeoScan(
      business.name,
      business.category,
      business.city,
      limits.queries_per_scan,
      platforms
    )
    
    // Generate suggestions
    const suggestions = await generateSuggestions(
      business.name,
      business.category,
      results.geo_score,
      results.mention_rate,
      results.raw_results
    )
    
    // Update scan with results
    const { data: updatedScan, error: updateError } = await supabase
      .from('gc_scans')
      .update({
        status: 'completed',
        geo_score: results.geo_score,
        mention_rate: results.mention_rate,
        sentiment_score: results.sentiment_score,
        questions_asked: results.questions_asked,
        questions_mentioned: results.questions_mentioned,
        platforms: results.platforms,
        raw_results: results.raw_results,
        suggestions,
        completed_at: new Date().toISOString(),
      })
      .eq('id', scan.id)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json({ error: 'Scan opslaan mislukt' }, { status: 500 })
    }
    
    return NextResponse.json({ scan: updatedScan })
  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const business_id = searchParams.get('business_id')
    
    if (!business_id) {
      return NextResponse.json({ error: 'business_id is verplicht' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data: scans, error } = await supabase
      .from('gc_scans')
      .select('*')
      .eq('business_id', business_id)
      .order('created_at', { ascending: false })
      .limit(30)
    
    if (error) {
      return NextResponse.json({ error: 'Scans ophalen mislukt' }, { status: 500 })
    }
    
    return NextResponse.json({ scans: scans || [] })
  } catch (error) {
    console.error('Get scans error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
