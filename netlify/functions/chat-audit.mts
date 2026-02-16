import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type ConversationPhase = 'discovery' | 'scanning' | 'discussion' | 'pre-capture' | 'post-capture'

interface ChatRequest {
  messages: { role: 'user' | 'assistant'; content: string }[]
  scanResults?: any
  businessContext?: {
    name?: string
    url?: string
    city?: string
    industry?: string
    howGetCustomers?: string
    biggestChallenge?: string
  }
  conversationPhase: ConversationPhase
}

function buildAnalysisSummary(scan: any): string {
  if (!scan || scan.status === 'skipped') return '\n[No website — this business does not have a website.]'
  if (scan.status === 'error') return '\n[Website scan failed — could not reach the site.]'

  const parts: string[] = ['\n--- WEBSITE SCAN RESULTS (real data) ---']

  if (scan.pageSpeed) {
    const ps = scan.pageSpeed
    parts.push('PageSpeed (mobile):')
    if (ps.performance !== null) parts.push(`  Performance: ${ps.performance}/100`)
    if (ps.seo !== null) parts.push(`  SEO: ${ps.seo}/100`)
    if (ps.accessibility !== null) parts.push(`  Accessibility: ${ps.accessibility}/100`)
    if (ps.coreWebVitals?.lcp) parts.push(`  LCP: ${ps.coreWebVitals.lcp}`)
    if (ps.coreWebVitals?.cls) parts.push(`  CLS: ${ps.coreWebVitals.cls}`)
    if (ps.mobileFriendly !== null) parts.push(`  Mobile-friendly: ${ps.mobileFriendly ? 'Yes' : 'No'}`)
  }

  if (scan.html) {
    const h = scan.html
    parts.push('HTML/SEO:')
    parts.push(`  Title: ${h.title || 'MISSING'}`)
    parts.push(`  Meta description: ${h.metaDescription ? 'Present' : 'MISSING'}`)
    parts.push(`  H1: ${h.h1Tags?.length > 0 ? h.h1Tags.join(', ') : 'NONE'}`)
    parts.push(`  Images: ${h.totalImages} total, ${h.imgsMissingAlt} missing alt text`)
    parts.push(`  Structured data: ${h.hasStructuredData ? 'Yes' : 'No'}`)
    parts.push(`  Open Graph: ${h.hasOpenGraph ? 'Yes' : 'No'}`)
  }

  if (scan.sslValid !== null) parts.push(`SSL: ${scan.sslValid ? 'Valid' : 'INVALID'}`)
  if (scan.crawlability) {
    parts.push(`robots.txt: ${scan.crawlability.hasRobotsTxt ? 'Found' : 'Missing'}`)
    parts.push(`sitemap.xml: ${scan.crawlability.hasSitemap ? 'Found' : 'Missing'}`)
  }

  parts.push('--- END SCAN RESULTS ---')
  return parts.join('\n')
}

function buildSystemPrompt(phase: ConversationPhase, scanResults: any, businessContext: any): string {
  const base = `You are a friendly, knowledgeable local business visibility consultant working for LeadFair. You help business owners understand how visible they are online — on Google, in AI search tools, and in their local area.

CONVERSATION RULES:
- Keep responses to 2-4 sentences. Ask ONE question at a time.
- Be conversational and warm, but not cheesy or salesy. Sound like a helpful expert, not a chatbot.
- Use the business owner's business name naturally once you know it.
- NEVER make up or fabricate scan data. Only reference data explicitly provided below.
- NEVER ask for the user's name, email, or phone — the UI handles lead capture separately.
- If the user says something off-topic, gently steer back.`

  const contextBlock = businessContext
    ? `\nKNOWN BUSINESS CONTEXT:\n${businessContext.name ? `Business: ${businessContext.name}` : ''}\n${businessContext.url ? `Website: ${businessContext.url}` : ''}\n${businessContext.city ? `City: ${businessContext.city}` : ''}\n${businessContext.industry ? `Industry: ${businessContext.industry}` : ''}\n${businessContext.howGetCustomers ? `How they get customers: ${businessContext.howGetCustomers}` : ''}\n${businessContext.biggestChallenge ? `Biggest challenge: ${businessContext.biggestChallenge}` : ''}`
    : ''

  const scanBlock = scanResults ? buildAnalysisSummary(scanResults) : ''

  let phaseInstructions = ''

  switch (phase) {
    case 'discovery':
      phaseInstructions = `\nPHASE: Discovery
Your job is to learn about their business. Follow this flow:
1. If you don't know their business name yet, ask for it.
2. If you don't know their website URL, ask for it (mention they can say "none" if they don't have one).
3. If you don't know their city, ask what city they primarily serve.
4. If you don't know their industry, ask what type of business they run.
Keep it natural — acknowledge what they share before asking the next question.`
      break

    case 'scanning':
      phaseInstructions = `\nPHASE: Scanning (website scan is running in the background)
The user just provided their website URL and we're scanning it now. While we wait:
- If you still need their city, ask for it.
- If you still need their industry, ask about it.
- If you have both, ask how they currently get most of their customers (word of mouth, Google, social media, ads, etc.)
- Keep the conversation going naturally. Don't mention the scan is running — the UI shows a progress indicator.`
      break

    case 'discussion':
      phaseInstructions = `\nPHASE: Discussion (scan results available)
${scanBlock}

NOW discuss the scan findings naturally. Guidelines:
- Lead with something positive if possible ("Good news — your SSL is set up" or "I can see you have a meta description").
- Then discuss the most important issues. Be specific — cite actual numbers from the scan.
- For PageSpeed: below 50 is slow, 50-89 needs work, 90+ is great.
- For missing elements (no meta description, no structured data, etc.), explain WHY it matters in plain language.
- After discussing 2-3 key findings, ask a strategic question: "How do you currently get most of your customers?" or "What's your biggest challenge when it comes to being found online?"
- If the business has no website, make that priority #1 and explain why it's critical.`
      break

    case 'pre-capture':
      phaseInstructions = `\nPHASE: Pre-capture (wrapping up the conversation)
${scanBlock}

You've gathered enough information. Provide a brief summary of the 2-3 biggest things you've noticed, then say something like:
"I can put together a detailed visibility report for you with specific recommendations. Let me grab a couple details so I can send it over."
Keep it brief — the UI will show a lead capture form right after your message.`
      break

    case 'post-capture':
      phaseInstructions = `\nPHASE: Final Report
${scanBlock}

Generate a comprehensive visibility report. Structure it with markdown headers:

## The Big Picture
One paragraph summarizing where this business stands. Reference their name, city, and industry. Be honest but encouraging.

## Top 3 Priorities
The 3 most impactful things they should fix, based on the scan data and what they've told you. Be specific — don't say "improve SEO," say exactly what needs to change and why.

## Quick Wins
2-3 things they could do THIS WEEK that would make an immediate difference.

## What's Working
Acknowledge anything positive from the scan or conversation.

${scanResults && scanResults.status !== 'skipped' && scanResults.status !== 'error' ? `## Website Health
Summarize the technical scan findings. Mention PageSpeed scores, missing elements, and the single most impactful technical fix.` : ''}

Keep the report under 500 words. Write in second person ("you/your"). Be specific to their business, city, and industry. No generic advice.`
      break
  }

  return `${base}${contextBlock}${phaseInstructions}`
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body: ChatRequest = await req.json()
    const { messages, scanResults, businessContext, conversationPhase } = body

    const systemPrompt = buildSystemPrompt(conversationPhase, scanResults, businessContext)

    // Filter to only user/assistant messages for the API
    const apiMessages = messages
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))

    const stream = client.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: conversationPhase === 'post-capture' ? 1200 : 300,
      system: systemPrompt,
      messages: apiMessages,
    })

    // Convert to SSE ReadableStream
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`))
            }
          }
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          console.error('Stream error:', err)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    })
  } catch (err: any) {
    console.error('Chat audit error:', err)
    return new Response(JSON.stringify({ error: 'Failed to start chat' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
