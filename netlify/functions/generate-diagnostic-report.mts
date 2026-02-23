import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const { businessName, industry, teamSize, yearsInBusiness, biggestChallenge, scores, answerDetails } = body

    const categorySummary = scores.categories
      .map((c: any) => `- ${c.name}: ${c.score}/10 (${c.grade})`)
      .join('\n')

    const prompt = `You are a small business operations consultant writing a personalized diagnostic report. You're direct, specific, and genuinely helpful — not salesy. You speak in plain language. You're the kind of consultant who tells it like it is but always leaves people feeling like they can fix things.

Business details:
- Name: ${businessName}
- Industry: ${industry}
- Team size: ${teamSize}
- Years in business: ${yearsInBusiness}
- Their biggest challenge right now: "${biggestChallenge}"

Overall score: ${scores.overall}/10 (${scores.overallGrade})

Category scores:
${categorySummary}

Individual answers (what they actually selected):
${answerDetails}

Write a personalized diagnostic report. Follow this structure:

1. **The Diagnosis** — Start by acknowledging their biggest challenge ("${biggestChallenge}") and connect it to what the scores reveal. Be specific about how their weak areas are likely contributing to that challenge. Reference their industry, team size, and years in business to make it feel personal. 2-3 sentences max.

2. **The Hidden Connections** — Identify 2-3 connections between their specific answers that reveal deeper patterns. Look for things like:
   - If they rely on word of mouth but rate lead flow highly → that's fragile growth
   - If retention is high but no referral system → leaving growth on the table
   - If operations are weak but team is growing → heading toward chaos
   - If after-hours inquiries go to voicemail but they have a decent conversion rate → they're losing money they don't even know about
   - If sales process is ad hoc but conversion is OK → they'll hit a ceiling
   Be specific to THEIR actual answers. Each insight should be 1-2 sentences.

3. **Your Top 3 Priorities** — The 3 most impactful changes they should make, ordered by urgency. Be extremely specific — not "improve lead generation" but "set up an after-hours auto-response so the leads that come outside business hours don't go cold." Tailor to their industry (e.g., for a plumber: "When someone's pipe bursts at 9 PM, they're calling the first person who answers"). Each priority should be 2-3 sentences.

4. **Quick Wins** — 2-3 things they could implement this week with minimal effort. Keep these very concrete and realistic for a ${teamSize} team.

5. **What's Working** — Briefly acknowledge areas where they scored 7+ so they don't feel overwhelmed. 1-2 sentences.

Keep the entire report under 500 words. Write in second person ("you/your"). Use markdown formatting with bold headers (## for sections). Everything should feel like it was written specifically for THIS business — no generic advice.

CRITICAL: Their biggest challenge was "${biggestChallenge}" — your entire report should feel like a direct response to that concern. This is what brought them here. Address it head-on and show how the scores connect to it.`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    })

    const report = message.content[0].type === 'text' ? message.content[0].text : ''

    return new Response(JSON.stringify({ report }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Diagnostic report error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
