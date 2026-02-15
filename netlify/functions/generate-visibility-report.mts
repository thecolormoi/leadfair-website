import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const { businessName, city, industry, websiteUrl, scores, weakQuestions } = body

    const categorySummary = scores.categories
      .map((c: any) => `- ${c.name}: ${c.score}/10 (${c.grade})`)
      .join('\n')

    const weakSummary = weakQuestions.length > 0
      ? weakQuestions.map((w: any) => `- "${w.text}" — scored ${w.score}/10`).join('\n')
      : 'No major weak areas identified.'

    const prompt = `You are a local business visibility consultant writing a personalized report for a small business owner. Be direct, specific, and actionable. No fluff.

Business details:
- Name: ${businessName}
- City: ${city}
- Industry: ${industry}
- Website: ${websiteUrl}

Overall visibility score: ${scores.overall}/10 (${scores.overallGrade})

Category scores:
${categorySummary}

Weakest areas (questions they scored lowest on):
${weakSummary}

Write a personalized visibility report for this business. Follow this structure:

1. **The Big Picture** — One short paragraph summarizing where they stand. Reference their business name, city, and industry specifically. Be honest but not discouraging.

2. **Your Top 3 Priorities** — The 3 most impactful things they should fix first, based on their weakest scores. Be extremely specific — don't say "improve your SEO," say exactly what to do and why it matters for a ${industry} business in ${city}.

3. **Quick Wins** — 2-3 things they could do this week that would make an immediate difference. Keep these actionable and concrete.

4. **What's Working** — If any category scored well (7+), briefly acknowledge it so they don't feel like everything is broken.

Keep the entire report under 400 words. Write in second person ("you/your"). Use markdown formatting with bold headers. No generic advice — everything should feel like it was written specifically for this business.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    })

    const report = message.content[0].type === 'text' ? message.content[0].text : ''

    return new Response(JSON.stringify({ report }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Report generation error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
