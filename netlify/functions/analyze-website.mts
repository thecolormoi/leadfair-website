import * as cheerio from 'cheerio'

interface PageSpeedResult {
  performance: number | null
  seo: number | null
  accessibility: number | null
  coreWebVitals: {
    lcp: string | null
    fid: string | null
    cls: string | null
  }
  mobileFriendly: boolean | null
}

interface HtmlAnalysis {
  title: string | null
  metaDescription: string | null
  h1Tags: string[]
  imgsMissingAlt: number
  totalImages: number
  hasStructuredData: boolean
  canonicalUrl: string | null
  hasOpenGraph: boolean
}

interface CrawlabilityResult {
  hasRobotsTxt: boolean | null
  hasSitemap: boolean | null
}

interface AnalysisResult {
  status: 'success' | 'partial' | 'skipped' | 'error'
  url: string | null
  pageSpeed: PageSpeedResult | null
  html: HtmlAnalysis | null
  sslValid: boolean | null
  crawlability: CrawlabilityResult | null
  errors: string[]
}

function normalizeUrl(input: string): string | null {
  if (!input || input.trim().toLowerCase() === 'none') return null

  let url = input.trim()
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url
  }

  try {
    const parsed = new URL(url)
    if (!parsed.hostname.includes('.')) return null
    return parsed.href
  } catch {
    return null
  }
}

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    return res
  } finally {
    clearTimeout(timer)
  }
}

async function checkPageSpeed(url: string): Promise<PageSpeedResult | null> {
  const apiKey = process.env.GOOGLE_PAGESPEED_API_KEY
  if (!apiKey) {
    console.warn('No GOOGLE_PAGESPEED_API_KEY set, skipping PageSpeed check')
    return null
  }

  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=PERFORMANCE&category=SEO&category=ACCESSIBILITY&strategy=mobile`

  const res = await fetchWithTimeout(apiUrl, 15000)
  if (!res.ok) {
    console.error('PageSpeed API error:', res.status, await res.text())
    return null
  }

  const data = await res.json()
  const categories = data.lighthouseResult?.categories || {}
  const audits = data.lighthouseResult?.audits || {}

  return {
    performance: categories.performance ? Math.round(categories.performance.score * 100) : null,
    seo: categories.seo ? Math.round(categories.seo.score * 100) : null,
    accessibility: categories.accessibility ? Math.round(categories.accessibility.score * 100) : null,
    coreWebVitals: {
      lcp: audits['largest-contentful-paint']?.displayValue || null,
      fid: audits['max-potential-fid']?.displayValue || null,
      cls: audits['cumulative-layout-shift']?.displayValue || null,
    },
    mobileFriendly: audits['viewport']?.score === 1,
  }
}

async function analyzeHtml(url: string): Promise<HtmlAnalysis | null> {
  const res = await fetchWithTimeout(url, 8000)
  if (!res.ok) return null

  const html = await res.text()
  const $ = cheerio.load(html)

  const images = $('img')
  let imgsMissingAlt = 0
  images.each((_, el) => {
    const alt = $(el).attr('alt')
    if (!alt || alt.trim() === '') imgsMissingAlt++
  })

  return {
    title: $('title').first().text().trim() || null,
    metaDescription: $('meta[name="description"]').attr('content')?.trim() || null,
    h1Tags: $('h1').map((_, el) => $(el).text().trim()).get(),
    imgsMissingAlt,
    totalImages: images.length,
    hasStructuredData: $('script[type="application/ld+json"]').length > 0,
    canonicalUrl: $('link[rel="canonical"]').attr('href') || null,
    hasOpenGraph: $('meta[property="og:title"]').length > 0,
  }
}

async function checkSsl(url: string): Promise<boolean | null> {
  try {
    const httpsUrl = url.replace(/^http:\/\//, 'https://')
    const res = await fetchWithTimeout(httpsUrl, 5000)
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

async function checkCrawlability(url: string): Promise<CrawlabilityResult | null> {
  const origin = new URL(url).origin

  const [robotsRes, sitemapRes] = await Promise.allSettled([
    fetchWithTimeout(`${origin}/robots.txt`, 5000),
    fetchWithTimeout(`${origin}/sitemap.xml`, 5000),
  ])

  return {
    hasRobotsTxt:
      robotsRes.status === 'fulfilled' &&
      robotsRes.value.ok &&
      (robotsRes.value.headers.get('content-type')?.includes('text') ?? false),
    hasSitemap:
      sitemapRes.status === 'fulfilled' &&
      sitemapRes.value.ok &&
      ((sitemapRes.value.headers.get('content-type')?.includes('xml') ?? false) ||
        (sitemapRes.value.headers.get('content-type')?.includes('text') ?? false)),
  }
}

export default async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { url: rawUrl } = await req.json()
    const url = normalizeUrl(rawUrl)

    if (!url) {
      return new Response(
        JSON.stringify({
          status: 'skipped',
          url: null,
          pageSpeed: null,
          html: null,
          sslValid: null,
          crawlability: null,
          errors: ['No valid URL provided'],
        } satisfies AnalysisResult),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const errors: string[] = []

    const [pageSpeedResult, htmlResult, sslResult, crawlResult] = await Promise.allSettled([
      checkPageSpeed(url),
      analyzeHtml(url),
      checkSsl(url),
      checkCrawlability(url),
    ])

    const pageSpeed = pageSpeedResult.status === 'fulfilled' ? pageSpeedResult.value : null
    if (pageSpeedResult.status === 'rejected') errors.push(`PageSpeed: ${pageSpeedResult.reason}`)

    const html = htmlResult.status === 'fulfilled' ? htmlResult.value : null
    if (htmlResult.status === 'rejected') errors.push(`HTML: ${htmlResult.reason}`)

    const sslValid = sslResult.status === 'fulfilled' ? sslResult.value : null
    if (sslResult.status === 'rejected') errors.push(`SSL: ${sslResult.reason}`)

    const crawlability = crawlResult.status === 'fulfilled' ? crawlResult.value : null
    if (crawlResult.status === 'rejected') errors.push(`Crawlability: ${crawlResult.reason}`)

    const hasAnyData = pageSpeed || html || sslValid !== null || crawlability
    const status: AnalysisResult['status'] = hasAnyData
      ? errors.length > 0
        ? 'partial'
        : 'success'
      : 'error'

    const result: AnalysisResult = {
      status,
      url,
      pageSpeed,
      html,
      sslValid,
      crawlability,
      errors,
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('Website analysis error:', err)
    return new Response(
      JSON.stringify({
        status: 'error',
        url: null,
        pageSpeed: null,
        html: null,
        sslValid: null,
        crawlability: null,
        errors: [err.message || 'Unknown error'],
      } satisfies AnalysisResult),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
