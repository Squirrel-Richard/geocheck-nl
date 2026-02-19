import OpenAI from 'openai'
import { RawResult, Suggestion } from '@/types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// Generate 50 relevant Dutch questions for a business
export function generateQuestions(name: string, category: string, city: string): string[] {
  const templates = [
    // Direct brand queries
    `Is ${name} een goede keuze voor ${category} in ${city}?`,
    `Wat zijn de ervaringen met ${name}?`,
    `Hoe betrouwbaar is ${name}?`,
    `Is ${name} aan te bevelen?`,
    `Wat vinden klanten van ${name}?`,
    
    // Category-based discovery
    `Welk ${category} bedrijf is het beste in ${city}?`,
    `Wat zijn de top ${category} bedrijven in ${city}?`,
    `Welke ${category} bedrijven worden het meest aanbevolen in ${city}?`,
    `Goede ${category} bedrijven in ${city}?`,
    `Beste ${category} in Nederland?`,
    
    // Problem-solution queries
    `Ik zoek een betrouwbaar ${category} bedrijf in ${city}, wat raad je aan?`,
    `Welk ${category} bedrijf heeft de beste klantenservice in ${city}?`,
    `Wat zijn de prijzen voor ${category} diensten in ${city}?`,
    `Waar kan ik terecht voor professioneel ${category} in ${city}?`,
    `Wie zijn de marktleiders in ${category} in ${city}?`,
    
    // Comparison queries
    `Vergelijk de beste ${category} bedrijven in ${city}`,
    `Wat zijn de voor- en nadelen van ${name}?`,
    `Alternatieven voor ${name} in ${category}?`,
    `Is ${name} beter dan de concurrentie?`,
    `Hoe onderscheidt ${name} zich van anderen?`,
    
    // Trust & authority
    `Hoeveel jaar is ${name} actief?`,
    `Heeft ${name} certificeringen of awards?`,
    `Waar staat ${name} voor?`,
    `Wat is de specialisatie van ${name}?`,
    `Is ${name} lid van een branchevereniging?`,
    
    // Local NL queries
    `${category} bedrijf Amsterdam aanbeveling`,
    `Beste ${category} Rotterdam`,
    `Top ${category} bedrijven Utrecht`,
    `${category} specialist Den Haag`,
    `Betrouwbare ${category} Eindhoven`,
    
    // Intent-based
    `Ik wil samenwerken met een ${category} bedrijf, wie raad je aan?`,
    `Snelle levering ${category} ${city}?`,
    `${category} bedrijf met goede reviews in ${city}`,
    `Professioneel ${category} team ${city}`,
    `Ervaren ${category} specialist ${city}`,
    
    // AI-specific queries
    `Welke ${category} bedrijven noemen AI-assistenten meest?`,
    `Populaire ${category} merken in Nederland 2024`,
    `Innovatief ${category} bedrijf ${city}`,
    `${category} met duurzame aanpak ${city}`,
    `${category} startup ${city}`,
    
    // Social proof
    `Klantbeoordelingen ${name}`,
    `Case studies ${name}`,
    `Resultaten ${name}`,
    `Succesverhalen ${category} ${city}`,
    `${category} bedrijf met hoogste tevredenheid`,
    
    // Specific use cases
    `Voor welk type klant is ${name} het meest geschikt?`,
    `Kleine bedrijven ${category} ${city}`,
    `MKB ${category} oplossingen ${city}`,
    `Enterprise ${category} ${city}`,
    `Startup-vriendelijk ${category} ${city}`,
    
    // Seasonal/timely
    `Snelste ${category} bedrijf ${city}`,
    `${category} bedrijf 24/7 bereikbaar`,
    `Flex ${category} diensten ${city}`,
    `${category} op maat ${city}`,
    `Betaalbaar ${category} ${city}`,
  ]
  
  return templates.slice(0, 50)
}

// Query ChatGPT/OpenAI
async function queryOpenAI(question: string, businessName: string): Promise<{ response: string; mentioned: boolean; sentiment: 'positief' | 'neutraal' | 'negatief' }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Je bent een behulpzame AI-assistent die vragen beantwoordt over Nederlandse bedrijven en diensten. Geef eerlijke, informatieve antwoorden.'
        },
        { role: 'user', content: question }
      ],
      max_tokens: 300,
      temperature: 0.7,
    })
    
    const response = completion.choices[0]?.message?.content || ''
    const mentioned = response.toLowerCase().includes(businessName.toLowerCase())
    
    let sentiment: 'positief' | 'neutraal' | 'negatief' = 'neutraal'
    if (mentioned) {
      const posWords = ['uitstekend', 'excellent', 'geweldig', 'top', 'beste', 'aangeraden', 'aanbevolen', 'betrouwbaar', 'professioneel', 'goed']
      const negWords = ['slecht', 'niet goed', 'matig', 'problemen', 'klachten', 'oplichting', 'teleurstelling']
      const responseL = response.toLowerCase()
      const posScore = posWords.filter(w => responseL.includes(w)).length
      const negScore = negWords.filter(w => responseL.includes(w)).length
      if (posScore > negScore) sentiment = 'positief'
      else if (negScore > posScore) sentiment = 'negatief'
    }
    
    return { response, mentioned, sentiment }
  } catch {
    return { response: '', mentioned: false, sentiment: 'neutraal' }
  }
}

// Query Perplexity
async function queryPerplexity(question: string, businessName: string): Promise<{ response: string; mentioned: boolean; sentiment: 'positief' | 'neutraal' | 'negatief' }> {
  try {
    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PERPLEXITY_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [{ role: 'user', content: question }],
        max_tokens: 300,
      }),
    })
    
    if (!res.ok) return { response: '', mentioned: false, sentiment: 'neutraal' }
    
    const data = await res.json()
    const response = data.choices?.[0]?.message?.content || ''
    const mentioned = response.toLowerCase().includes(businessName.toLowerCase())
    
    let sentiment: 'positief' | 'neutraal' | 'negatief' = 'neutraal'
    if (mentioned) {
      const posWords = ['uitstekend', 'excellent', 'geweldig', 'top', 'beste', 'aangeraden', 'aanbevolen', 'betrouwbaar', 'professioneel', 'goed']
      const negWords = ['slecht', 'niet goed', 'matig', 'problemen', 'klachten', 'oplichting']
      const responseL = response.toLowerCase()
      const posScore = posWords.filter(w => responseL.includes(w)).length
      const negScore = negWords.filter(w => responseL.includes(w)).length
      if (posScore > negScore) sentiment = 'positief'
      else if (negScore > posScore) sentiment = 'negatief'
    }
    
    return { response, mentioned, sentiment }
  } catch {
    return { response: '', mentioned: false, sentiment: 'neutraal' }
  }
}

// Generate AI suggestions based on results
export async function generateSuggestions(
  businessName: string,
  category: string,
  score: number,
  mentionRate: number,
  rawResults: RawResult[]
): Promise<Suggestion[]> {
  try {
    const notMentionedQuestions = rawResults.filter(r => !r.mentioned).map(r => r.question).slice(0, 10).join('\n')
    
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `Je bent een GEO (Generative Engine Optimization) expert. Geef concrete, actionable adviezen in het Nederlands.
Je antwoord moet een JSON array zijn met maximaal 5 suggesties, elk met: title, description, impact (1-20 punten score verbetering), effort (laag/medium/hoog), category (content/technisch/links/structuur).`
        },
        {
          role: 'user',
          content: `Bedrijf: ${businessName} | Categorie: ${category} | GEO Score: ${score}/100 | Vermelding: ${Math.round(mentionRate * 100)}%
          
Vragen waarbij het bedrijf NIET werd vermeld:
${notMentionedQuestions}

Geef 5 concrete GEO-verbeteringstips in JSON array format.`
        }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 800,
    })
    
    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{"suggestions":[]}')
    return parsed.suggestions || []
  } catch {
    return [
      {
        title: 'Publiceer een autoritatief bedrijfsartikel',
        description: `Schrijf een uitgebreid artikel over "${category} in ${category}" op uw website. AI-modellen citeren autoritatieve bronnen.`,
        impact: 12,
        effort: 'medium' as const,
        category: 'content' as const,
      },
      {
        title: 'Optimaliseer Google Business Profile',
        description: 'Zorg voor een volledig ingevuld en geverifieerd Google Business profiel met recente reviews en foto\'s.',
        impact: 8,
        effort: 'laag' as const,
        category: 'technisch' as const,
      },
      {
        title: 'Structured data markup toevoegen',
        description: 'Voeg Schema.org markup toe (LocalBusiness, Reviews, FAQ) zodat AI-modellen uw bedrijfsinfo beter begrijpen.',
        impact: 10,
        effort: 'medium' as const,
        category: 'technisch' as const,
      },
    ]
  }
}

// Main scan function
export async function runGeoScan(
  businessName: string,
  category: string,
  city: string,
  questionsLimit: number = 10,
  platforms: ('chatgpt' | 'perplexity')[] = ['chatgpt']
): Promise<{
  geo_score: number
  mention_rate: number
  sentiment_score: number
  questions_asked: number
  questions_mentioned: number
  platforms: Record<string, { score: number; mention_rate: number; sentiment: string; questions_asked: number; questions_mentioned: number }>
  raw_results: RawResult[]
}> {
  const questions = generateQuestions(businessName, category, city).slice(0, questionsLimit)
  const rawResults: RawResult[] = []
  
  const platformStats: Record<string, { mentioned: number; total: number; pos: number; neg: number }> = {}
  platforms.forEach(p => { platformStats[p] = { mentioned: 0, total: 0, pos: 0, neg: 0 } })
  
  // Run queries in batches of 3 to avoid rate limits
  const batchSize = 3
  for (let i = 0; i < questions.length; i += batchSize) {
    const batch = questions.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (question) => {
      for (const platform of platforms) {
        let result: { response: string; mentioned: boolean; sentiment: 'positief' | 'neutraal' | 'negatief' }
        
        if (platform === 'chatgpt') {
          result = await queryOpenAI(question, businessName)
        } else {
          result = await queryPerplexity(question, businessName)
        }
        
        rawResults.push({
          platform,
          question,
          response: result.response.slice(0, 500),
          mentioned: result.mentioned,
          sentiment: result.sentiment,
        })
        
        platformStats[platform].total++
        if (result.mentioned) {
          platformStats[platform].mentioned++
          if (result.sentiment === 'positief') platformStats[platform].pos++
          if (result.sentiment === 'negatief') platformStats[platform].neg++
        }
      }
    }))
    
    // Small delay between batches
    if (i + batchSize < questions.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  // Calculate overall stats
  const totalMentioned = Object.values(platformStats).reduce((sum, p) => sum + p.mentioned, 0)
  const totalQuestions = Object.values(platformStats).reduce((sum, p) => sum + p.total, 0)
  const mentionRate = totalQuestions > 0 ? totalMentioned / totalQuestions : 0
  
  // GEO score calculation:
  // 40% mention rate, 30% sentiment, 30% consistency across platforms
  const totalPos = Object.values(platformStats).reduce((sum, p) => sum + p.pos, 0)
  const totalNeg = Object.values(platformStats).reduce((sum, p) => sum + p.neg, 0)
  const sentimentScore = totalMentioned > 0 ? (totalPos - totalNeg) / totalMentioned : 0
  
  const mentionComponent = mentionRate * 40
  const sentimentComponent = ((sentimentScore + 1) / 2) * 30
  const platformsWithMentions = Object.values(platformStats).filter(p => p.mentioned > 0).length
  const consistencyComponent = (platformsWithMentions / Math.max(platforms.length, 1)) * 30
  
  const geoScore = Math.round(mentionComponent + sentimentComponent + consistencyComponent)
  
  // Build platform results
  const platformResults: Record<string, { score: number; mention_rate: number; sentiment: string; questions_asked: number; questions_mentioned: number }> = {}
  for (const [platform, stats] of Object.entries(platformStats)) {
    const pMentionRate = stats.total > 0 ? stats.mentioned / stats.total : 0
    const pSentScore = stats.mentioned > 0 ? (stats.pos - stats.neg) / stats.mentioned : 0
    platformResults[platform] = {
      score: Math.round(pMentionRate * 40 + ((pSentScore + 1) / 2) * 60),
      mention_rate: pMentionRate,
      sentiment: pSentScore > 0.2 ? 'positief' : pSentScore < -0.2 ? 'negatief' : 'neutraal',
      questions_asked: stats.total,
      questions_mentioned: stats.mentioned,
    }
  }
  
  return {
    geo_score: geoScore,
    mention_rate: mentionRate,
    sentiment_score: sentimentScore,
    questions_asked: totalQuestions,
    questions_mentioned: totalMentioned,
    platforms: platformResults,
    raw_results: rawResults,
  }
}
