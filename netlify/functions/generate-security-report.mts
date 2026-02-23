import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Industry-specific compliance context
const industryCompliance: Record<string, string> = {
  'health-wellness': 'As a health & wellness business, you likely handle HIPAA-regulated patient data. A data breach doesn\'t just cost money — it can result in federal fines and loss of professional licenses.',
  'professional-services': 'Professional services firms (law, accounting, consulting) handle confidential client data. A breach can trigger malpractice liability and destroy the trust your business runs on.',
  'education': 'Education businesses handle student data, which falls under FERPA protections. Parents trust you with their children\'s information — a breach is both a legal and reputational crisis.',
  'food-hospitality': 'Food and hospitality businesses process high volumes of credit card transactions. PCI compliance isn\'t optional — a card data breach can result in fines and loss of your ability to accept cards.',
  'home-services': 'Home services businesses store customer addresses, access codes, and sometimes financial info. Your customers literally trust you with keys to their homes.',
  'fitness': 'Fitness businesses store health information, payment data, and personal details. Your members trust you with sensitive data about their health and habits.',
  'real-estate': 'Real estate businesses handle social security numbers, financial documents, and sensitive personal information during transactions. You\'re a high-value target for identity theft.',
  'retail': 'Retail businesses process payment card data and store customer information. PCI compliance is required, and a breach can result in costly fines and loss of customer trust.',
  'auto': 'Auto businesses store customer addresses, vehicle information, and payment data. Your customers\' vehicle and location data is more sensitive than most businesses realize.',
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const { businessName, industry, teamSize, biggestFear, scores, answerDetails } = body

    const categorySummary = scores.categories
      .map((c: any) => `- ${c.name}: ${c.score}/10 (${c.grade})`)
      .join('\n')

    const complianceContext = industryCompliance[industry] || 'Every business that stores customer data has a responsibility to protect it. A breach can result in legal liability, regulatory fines, and devastating loss of customer trust.'

    const prompt = `You are a small business security consultant writing a personalized security assessment. You understand that most small business owners aren't technical — you explain risks in plain language with real-world consequences. You're honest but not scary — you motivate action, not panic.

Business details:
- Name: ${businessName}
- Industry: ${industry}
- Team size: ${teamSize}
- Their biggest security fear: "${biggestFear}"

Industry compliance context: ${complianceContext}

Overall security score: ${scores.overall}/10 (${scores.overallGrade})

Category scores:
${categorySummary}

Individual answers (what they actually selected):
${answerDetails}

Write a personalized security assessment. Follow this structure:

1. **Your Risk Profile** — Summarize their overall security posture in plain language. Reference their industry specifically and the compliance context above. Address their biggest fear ("${biggestFear}") directly — are they right to worry about it? Is there something in their scores they should be MORE worried about? 2-3 sentences.

2. **The Real Risks** — Based on their specific answers, identify the 2-3 most dangerous vulnerabilities. Explain each one in terms of real consequences, not abstract risks:
   - Not "your password hygiene is poor" but "if an employee uses the same password everywhere and one service gets breached, attackers can access your email, customer data, and financial accounts — it's happened to thousands of small businesses"
   - Not "you need better backups" but "if your computer dies or gets ransomware tomorrow, you'd lose [X based on their answer] and it could take weeks to recover"
   - If they share passwords + have financial access issues → compound that risk
   - If they've been targeted by scams before + have no response plan → that's a ticking clock
   Be specific to THEIR answers and team size. Each risk should be 2-3 sentences.

3. **Priority Fixes** — The 3 most important things to fix, in order. Each should be:
   - Specific and actionable (not "improve security" but "set up 1Password, create a team vault, and migrate your shared accounts this week — it takes about 2 hours")
   - Tied to a specific risk from their answers
   - Realistic for a ${teamSize} team
   Each priority should be 2-3 sentences.

4. **This Week** — 2 things they can do RIGHT NOW that take less than an hour each. Keep these dead simple.

5. **What's Solid** — Acknowledge areas where they scored 7+. Security is stressful — they need to hear what's NOT on fire. 1-2 sentences.

Keep the entire report under 500 words. Write in second person. Use markdown formatting with bold headers (## for sections). Be honest but constructive.

IMPORTANT: Their biggest security fear was "${biggestFear}" — address this directly and honestly. Don't dismiss it, but also point out if their scores reveal something they should worry about more.`

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
    console.error('Security report error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
