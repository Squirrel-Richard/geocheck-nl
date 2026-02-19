import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { runGeoScan } from '@/lib/geo-scanner'

export async function POST(req: NextRequest) {
  try {
    const { scan_id, business_id } = await req.json()
    
    if (!scan_id || !business_id) {
      return NextResponse.json({ error: 'scan_id en business_id zijn verplicht' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    // Get business and its competitors
    const { data: business } = await supabase
      .from('gc_businesses')
      .select('*')
      .eq('id', business_id)
      .single()
    
    if (!business) {
      return NextResponse.json({ error: 'Bedrijf niet gevonden' }, { status: 404 })
    }
    
    if (business.plan === 'gratis') {
      return NextResponse.json({ error: 'Concurrentie-benchmark is beschikbaar vanaf het MKB plan' }, { status: 403 })
    }
    
    const { data: competitors } = await supabase
      .from('gc_competitors')
      .select('*')
      .eq('business_id', business_id)
    
    if (!competitors || competitors.length === 0) {
      return NextResponse.json({ error: 'Geen concurrenten gevonden. Voeg ze toe via de instellingen.' }, { status: 404 })
    }
    
    // Scan each competitor
    const competitorScans = await Promise.all(
      competitors.slice(0, 3).map(async (competitor) => {
        const results = await runGeoScan(
          competitor.name,
          competitor.category || business.category,
          competitor.city || business.city,
          5, // Limited queries for competitors
          ['claude']
        )
        
        const { data: compScan } = await supabase
          .from('gc_competitor_scans')
          .insert({
            scan_id,
            competitor_id: competitor.id,
            geo_score: results.geo_score,
            mention_rate: results.mention_rate,
            sentiment_score: results.sentiment_score,
            platforms: results.platforms,
          })
          .select()
          .single()
        
        return { ...compScan, competitor }
      })
    )
    
    return NextResponse.json({ competitor_scans: competitorScans })
  } catch (error) {
    console.error('Benchmark error:', error)
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
    
    const { data: competitors } = await supabase
      .from('gc_competitors')
      .select('*')
      .eq('business_id', business_id)
    
    return NextResponse.json({ competitors: competitors || [] })
  } catch (error) {
    console.error('Get competitors error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { business_id, name, category, city, website } = await req.json()
    
    if (!business_id || !name) {
      return NextResponse.json({ error: 'business_id en name zijn verplicht' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data: business } = await supabase
      .from('gc_businesses')
      .select('plan')
      .eq('id', business_id)
      .single()
    
    if (business?.plan === 'gratis') {
      return NextResponse.json({ error: 'Concurrenten toevoegen is beschikbaar vanaf het MKB plan' }, { status: 403 })
    }
    
    const { count } = await supabase
      .from('gc_competitors')
      .select('id', { count: 'exact' })
      .eq('business_id', business_id)
    
    const limit = business?.plan === 'bureau' ? 10 : 3
    if ((count || 0) >= limit) {
      return NextResponse.json({ error: `Maximum ${limit} concurrenten bereikt voor jouw plan` }, { status: 429 })
    }
    
    const { data: competitor, error } = await supabase
      .from('gc_competitors')
      .insert({ business_id, name, category, city, website })
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: 'Concurrent toevoegen mislukt' }, { status: 500 })
    }
    
    return NextResponse.json({ competitor })
  } catch (error) {
    console.error('Add competitor error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
