export interface Business {
  id: string
  user_id: string
  name: string
  category: string
  city: string
  website?: string
  plan: 'gratis' | 'mkb' | 'bureau'
  stripe_customer_id?: string
  stripe_subscription_id?: string
  email_reports: boolean
  report_email?: string
  created_at: string
  updated_at: string
}

export interface Scan {
  id: string
  business_id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  geo_score: number | null
  mention_rate: number | null
  sentiment_score: number | null
  questions_asked: number
  questions_mentioned: number
  platforms: PlatformResults
  raw_results: RawResult[]
  suggestions: Suggestion[]
  created_at: string
  completed_at: string | null
}

export interface PlatformResults {
  claude?: PlatformData
  chatgpt?: PlatformData  // legacy
  perplexity?: PlatformData
  gemini?: PlatformData
}

export interface PlatformData {
  score: number
  mention_rate: number
  sentiment: 'positief' | 'neutraal' | 'negatief'
  questions_asked: number
  questions_mentioned: number
}

export interface RawResult {
  platform: string
  question: string
  response: string
  mentioned: boolean
  sentiment: 'positief' | 'neutraal' | 'negatief'
}

export interface Suggestion {
  title: string
  description: string
  impact: number // estimated score improvement
  effort: 'laag' | 'medium' | 'hoog'
  category: 'content' | 'technisch' | 'links' | 'structuur'
}

export interface Competitor {
  id: string
  business_id: string
  name: string
  category?: string
  city?: string
  website?: string
  created_at: string
}

export interface CompetitorScan {
  id: string
  scan_id: string
  competitor_id: string
  geo_score: number | null
  mention_rate: number | null
  sentiment_score: number | null
  platforms: PlatformResults
  created_at: string
  competitor?: Competitor
}

export interface ScanWithCompetitors extends Scan {
  competitor_scans?: CompetitorScan[]
}

export const PLAN_LIMITS = {
  gratis: { scans_per_day: 1, queries_per_scan: 5, competitors: 0, email_reports: false },
  mkb: { scans_per_day: 3, queries_per_scan: 50, competitors: 3, email_reports: true },
  bureau: { scans_per_day: 20, queries_per_scan: 50, competitors: 10, email_reports: true },
}

export const PLAN_PRICES = {
  gratis: { monthly: 0, label: 'Gratis' },
  mkb: { monthly: 39, label: 'MKB' },
  bureau: { monthly: 99, label: 'Bureau' },
}
