import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildAnalysisSection(analysis: any): string {
  if (!analysis || analysis.status === 'skipped') {
    return `\nREAL WEBSITE ANALYSIS:\nNo website was provided. This business does not appear to have a website.\n`
  }

  if (analysis.status === 'error') {
    return `\nREAL WEBSITE ANALYSIS:\nWe attempted to scan their website but could not reach it. The URL may be incorrect or the site may be down.\n`
  }

  const sections: string[] = ['\nREAL WEBSITE ANALYSIS (data from scanning their actual website):']

  // PageSpeed
  if (analysis.pageSpeed) {
    const ps = analysis.pageSpeed
    sections.push(`\nGoogle PageSpeed Insights (mobile):`)
    if (ps.performance !== null) sections.push(`- Performance score: ${ps.performance}/100`)
    if (ps.seo !== null) sections.push(`- SEO score: ${ps.seo}/100`)
    if (ps.accessibility !== null) sections.push(`- Accessibility score: ${ps.accessibility}/100`)
    if (ps.coreWebVitals) {
      if (ps.coreWebVitals.lcp) sections.push(`- Largest Contentful Paint (LCP): ${ps.coreWebVitals.lcp}`)
      if (ps.coreWebVitals.cls) sections.push(`- Cumulative Layout Shift (CLS): ${ps.coreWebVitals.cls}`)
    }
    if (ps.mobileFriendly !== null) sections.push(`- Mobile-friendly: ${ps.mobileFriendly ? 'Yes' : 'No'}`)
  }

  // HTML analysis
  if (analysis.html) {
    const h = analysis.html
    sections.push(`\nHTML/SEO structure:`)
    sections.push(`- Page title: ${h.title || 'MISSING'}`)
    sections.push(`- Meta description: ${h.metaDescription ? 'Present' : 'MISSING'}`)
    sections.push(`- H1 tags: ${h.h1Tags.length > 0 ? h.h1Tags.join(', ') : 'NONE found'}`)
    sections.push(`- Images: ${h.totalImages} total, ${h.imgsMissingAlt} missing alt text`)
    sections.push(`- Structured data (JSON-LD): ${h.hasStructuredData ? 'Present' : 'Missing'}`)
    sections.push(`- Canonical URL: ${h.canonicalUrl ? 'Set' : 'Missing'}`)
    sections.push(`- Open Graph tags: ${h.hasOpenGraph ? 'Present' : 'Missing'}`)
  }

  // SSL
  if (analysis.sslValid !== null) {
    sections.push(`\nSSL/HTTPS: ${analysis.sslValid ? 'Valid' : 'INVALID or not configured'}`)
  }

  // Crawlability
  if (analysis.crawlability) {
    const c = analysis.crawlability
    sections.push(`\nCrawlability:`)
    sections.push(`- robots.txt: ${c.hasRobotsTxt ? 'Present' : 'Missing'}`)
    sections.push(`- sitemap.xml: ${c.hasSitemap ? 'Present' : 'Missing'}`)
  }

  return sections.join('\n')
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const body = await req.json()
    const { businessName, city, industry, websiteUrl, scores, weakQuestions, websiteAnalysis } = body

    const categorySummary = scores.categories
      .map((c: any) => `- ${c.name}: ${c.score}/10 (${c.grade})`)
      .join('\n')

    const weakSummary = weakQuestions.length > 0
      ? weakQuestions.map((w: any) => `- "${w.text}" — scored ${w.score}/10`).join('\n')
      : 'No major weak areas identified.'

    const analysisSection = buildAnalysisSection(websiteAnalysis)

    const hasRealData = websiteAnalysis && websiteAnalysis.status !== 'skipped' && websiteAnalysis.status !== 'error'

    const comparisonInstruction = hasRealData
      ? `\nIMPORTANT: Compare the self-reported scores above against the real website data below. If there are discrepancies (e.g., they rated their website highly but PageSpeed scores are low, or they said they have good SEO but meta tags are missing), point this out diplomatically. Say something like "Your site's actual performance score is X, which suggests there's room for improvement beyond what you might expect." Never be harsh — be helpful and specific.`
      : ''

    const websiteHealthSection = hasRealData
      ? `\n5. **Website Health** — Based on the scan results, briefly summarize the technical state of their website. Mention the key metrics (PageSpeed scores, missing SEO elements, SSL status) and what the most impactful technical fix would be.`
      : ''

    const noWebsiteInstruction = websiteAnalysis?.status === 'skipped'
      ? `\nCRITICAL: This business has no website. Make "Get a website" the #1 priority in your recommendations. Explain why this is holding them back, especially for a ${industry} business in ${city}.`
      : ''

    const prompt = `You are a local business visibility consultant writing a personalized report for a small business owner. Be direct, specific, and actionable. No fluff.

Business details:
- Name: ${businessName}
- City: ${city}
- Industry: ${industry}
- Website: ${websiteUrl}

Overall visibility score: ${scores.overall}/10 (${scores.overallGrade})

Category scores (self-reported):
${categorySummary}

Weakest areas (questions they scored lowest on):
${weakSummary}
${analysisSection}
${comparisonInstruction}
${noWebsiteInstruction}

Write a personalized visibility report for this business. Follow this structure:

1. **The Big Picture** — One short paragraph summarizing where they stand. Reference their business name, city, and industry specifically. Be honest but not discouraging.${hasRealData ? ' If real website data is available, reference it here.' : ''}

2. **Your Top 3 Priorities** — The 3 most impactful things they should fix first, based on their weakest scores${hasRealData ? ' and the real website scan findings' : ''}. Be extremely specific — don't say "improve your SEO," say exactly what to do and why it matters for a ${industry} business in ${city}.

3. **Quick Wins** — 2-3 things they could do this week that would make an immediate difference. Keep these actionable and concrete.

4. **What's Working** — If any category scored well (7+), briefly acknowledge it so they don't feel like everything is broken.
${websiteHealthSection}

Keep the entire report under ${hasRealData ? '500' : '400'} words. Write in second person ("you/your"). Use markdown formatting with bold headers. No generic advice — everything should feel like it was written specifically for this business.`

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
    console.error('Report generation error:', err)
    return new Response(JSON.stringify({ error: 'Failed to generate report' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
