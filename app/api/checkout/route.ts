import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })

  const PRICE_IDS: Record<string, string> = {
    mkb: process.env.STRIPE_PRICE_MKB || '',
    bureau: process.env.STRIPE_PRICE_BUREAU || '',
  }

  try {
    const { plan, business_id, email } = await req.json()
    
    if (!plan || !business_id || !email) {
      return NextResponse.json({ error: 'plan, business_id en email zijn verplicht' }, { status: 400 })
    }
    
    if (!PRICE_IDS[plan]) {
      return NextResponse.json({ error: 'Ongeldig plan' }, { status: 400 })
    }
    
    const supabase = createServerClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://geocheck-nl.vercel.app'
    
    // Get or create Stripe customer
    const { data: business } = await supabase
      .from('gc_businesses')
      .select('stripe_customer_id, name')
      .eq('id', business_id)
      .single()
    
    let customerId = business?.stripe_customer_id
    
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name: business?.name,
        metadata: { business_id },
      })
      customerId = customer.id
      
      await supabase
        .from('gc_businesses')
        .update({ stripe_customer_id: customerId })
        .eq('id', business_id)
    }
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['ideal', 'card'],
      mode: 'subscription',
      line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
      success_url: `${appUrl}/dashboard?upgraded=1&plan=${plan}`,
      cancel_url: `${appUrl}/prijzen?cancelled=1`,
      metadata: { business_id, plan },
      subscription_data: {
        metadata: { business_id, plan },
      },
      payment_method_options: {
        ideal: {},
      },
      locale: 'nl',
    })
    
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Betaling aanmaken mislukt' }, { status: 500 })
  }
}
