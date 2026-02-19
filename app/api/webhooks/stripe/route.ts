import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerClient } from '@/lib/supabase'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-01-28.clover' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')!
  
  let event: Stripe.Event
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }
  
  const supabase = createServerClient()
  
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const business_id = session.metadata?.business_id
        const plan = session.metadata?.plan
        
        if (business_id && plan) {
          await supabase
            .from('gc_businesses')
            .update({
              plan,
              stripe_subscription_id: session.subscription as string,
            })
            .eq('id', business_id)
          
          await supabase
            .from('gc_subscriptions')
            .upsert({
              business_id,
              stripe_subscription_id: session.subscription as string,
              stripe_customer_id: session.customer as string,
              plan,
              status: 'active',
            })
        }
        break
      }
      
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const business_id = sub.metadata?.business_id
        const plan = sub.metadata?.plan
        
        if (business_id) {
          const status = sub.status === 'active' ? 'active' : 'inactive'
          
          await supabase
            .from('gc_subscriptions')
            .update({
              status,
              current_period_end: new Date(((sub as unknown as { current_period_end: number }).current_period_end || 0) * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', sub.id)
          
          if (sub.status !== 'active' && business_id) {
            await supabase
              .from('gc_businesses')
              .update({ plan: 'gratis' })
              .eq('id', business_id)
          } else if (plan) {
            await supabase
              .from('gc_businesses')
              .update({ plan })
              .eq('id', business_id)
          }
        }
        break
      }
      
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const business_id = sub.metadata?.business_id
        
        if (business_id) {
          await supabase
            .from('gc_businesses')
            .update({ plan: 'gratis', stripe_subscription_id: null })
            .eq('id', business_id)
          
          await supabase
            .from('gc_subscriptions')
            .update({ status: 'cancelled', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', sub.id)
        }
        break
      }
    }
    
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook verwerking mislukt' }, { status: 500 })
  }
}
