import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { name, category, city, website, email, user_id } = await req.json()
    
    if (!name || !category || !city || !user_id) {
      return NextResponse.json({ error: 'name, category, city en user_id zijn verplicht' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data: business, error } = await supabase
      .from('gc_businesses')
      .insert({
        user_id,
        name,
        category,
        city,
        website,
        report_email: email,
        plan: 'gratis',
      })
      .select()
      .single()
    
    if (error) {
      console.error('Create business error:', error)
      return NextResponse.json({ error: 'Bedrijf aanmaken mislukt' }, { status: 500 })
    }
    
    return NextResponse.json({ business })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const user_id = searchParams.get('user_id')
    
    if (!user_id) {
      return NextResponse.json({ error: 'user_id is verplicht' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data: businesses, error } = await supabase
      .from('gc_businesses')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
    
    if (error) {
      return NextResponse.json({ error: 'Bedrijven ophalen mislukt' }, { status: 500 })
    }
    
    return NextResponse.json({ businesses: businesses || [] })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json()
    
    if (!id) {
      return NextResponse.json({ error: 'id is verplicht' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    
    const { data: business, error } = await supabase
      .from('gc_businesses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: 'Update mislukt' }, { status: 500 })
    }
    
    return NextResponse.json({ business })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Interne serverfout' }, { status: 500 })
  }
}
