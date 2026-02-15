// Visibility Audit — Questions, categories, and scoring

export interface Question {
  id: string
  phase: 'discovery' | 'assessment'
  category?: string
  text: string
  subtext?: string
  type: 'text' | 'select' | 'radio'
  options?: { label: string; value: number | string }[]
  required?: boolean
}

export interface Category {
  key: string
  name: string
  color: string
  description: string
  service: string
  serviceDescription: string
  actions: string[]
}

export const categories: Category[] = [
  {
    key: 'search-visibility',
    name: 'Search Visibility',
    color: '#10b981',
    description: 'How well your business shows up when people search on Google.',
    service: 'SEO & Website Optimization',
    serviceDescription: 'Get your website ranking higher on Google with proper SEO, mobile optimization, and structured data — so customers find you instead of your competitors.',
    actions: [
      'Optimize your website for mobile and page speed',
      'Add structured data (schema markup) so Google understands your business',
      'Create service-specific landing pages targeting your city',
      'Start publishing helpful content that answers what your customers search for',
      'Set up Google Search Console to track your rankings',
    ],
  },
  {
    key: 'ai-visibility',
    name: 'AI Visibility',
    color: '#3b82f6',
    description: 'How well AI tools like ChatGPT and Perplexity know about your business.',
    service: 'AI Search Optimization',
    serviceDescription: 'Make sure AI assistants recommend your business by building the online presence, directory listings, and content depth that AI models use to form their answers.',
    actions: [
      'Claim and complete your profiles on major directories (Yelp, BBB, industry-specific)',
      'Ensure your business name, address, and phone are consistent everywhere online',
      'Create in-depth content about your services, process, and expertise',
      'Get mentioned on local blogs, news sites, and industry publications',
      'Add FAQ content that mirrors how people ask AI tools for recommendations',
    ],
  },
  {
    key: 'local-presence',
    name: 'Local Presence',
    color: '#f97316',
    description: 'How strong your business looks in your local area — reviews, maps, and directories.',
    service: 'Local Presence Management',
    serviceDescription: 'Build a dominant local presence with an optimized Google Business Profile, a steady flow of reviews, and consistent directory listings that make you the obvious local choice.',
    actions: [
      'Fully optimize your Google Business Profile with photos, posts, and services',
      'Set up an automated review request system after every job or visit',
      'Respond to every Google review — positive and negative — within 24 hours',
      'List your business in the top 10 local directories for your industry',
      'Add local content and community involvement to your online presence',
    ],
  },
]

// Discovery questions — gather business context
export const discoveryQuestions: Question[] = [
  {
    id: 'business-name',
    phase: 'discovery',
    text: "What's your business name?",
    type: 'text',
    required: true,
  },
  {
    id: 'website-url',
    phase: 'discovery',
    text: "What's your website URL?",
    subtext: "If you don't have one, just type \"none\".",
    type: 'text',
    required: true,
  },
  {
    id: 'city',
    phase: 'discovery',
    text: 'What city do you primarily serve?',
    type: 'text',
    required: true,
  },
  {
    id: 'industry',
    phase: 'discovery',
    text: 'What industry are you in?',
    type: 'select',
    required: true,
    options: [
      { label: 'Home Services (plumbing, HVAC, electrical, etc.)', value: 'home-services' },
      { label: 'Health & Wellness (med spa, chiro, dental, etc.)', value: 'health-wellness' },
      { label: 'Professional Services (law, accounting, consulting)', value: 'professional-services' },
      { label: 'Fitness & Recreation', value: 'fitness' },
      { label: 'Education & Tutoring', value: 'education' },
      { label: 'Food & Hospitality', value: 'food-hospitality' },
      { label: 'Real Estate', value: 'real-estate' },
      { label: 'Retail', value: 'retail' },
      { label: 'Auto (repair, detail, sales)', value: 'auto' },
      { label: 'Other', value: 'other' },
    ],
  },
]

// Assessment questions — 5 per category, scored 0-10
export const assessmentQuestions: Question[] = [
  // ── Search Visibility ──
  {
    id: 'google-ranking',
    phase: 'assessment',
    category: 'search-visibility',
    text: 'When you Google your main service + your city, where does your business show up?',
    subtext: 'For example: "plumber Huntsville" or "dentist Madison".',
    type: 'radio',
    options: [
      { label: "I don't show up at all", value: 0 },
      { label: 'Page 2 or beyond', value: 3 },
      { label: 'Bottom half of page 1', value: 6 },
      { label: 'Top 3 results', value: 10 },
    ],
  },
  {
    id: 'website-quality',
    phase: 'assessment',
    category: 'search-visibility',
    text: 'How would you describe your website?',
    type: 'radio',
    options: [
      { label: "I don't have a website", value: 0 },
      { label: "It exists but it's outdated or basic", value: 3 },
      { label: 'It looks decent but could use work', value: 6 },
      { label: 'Professional, fast, and regularly updated', value: 10 },
    ],
  },
  {
    id: 'mobile-friendly',
    phase: 'assessment',
    category: 'search-visibility',
    text: 'How does your website look on a phone?',
    type: 'radio',
    options: [
      { label: "No website / I haven't checked", value: 0 },
      { label: "It works but it's not great", value: 3 },
      { label: 'It looks fine on mobile', value: 7 },
      { label: 'Fully optimized — fast and easy to use on any device', value: 10 },
    ],
  },
  {
    id: 'content-publishing',
    phase: 'assessment',
    category: 'search-visibility',
    text: 'Do you publish content on your website (blog posts, service pages, FAQs)?',
    type: 'radio',
    options: [
      { label: 'No, just a basic homepage', value: 1 },
      { label: 'A few pages but nothing recent', value: 3 },
      { label: 'Some content, updated occasionally', value: 6 },
      { label: 'Regular content that targets what our customers search for', value: 10 },
    ],
  },
  {
    id: 'structured-data',
    phase: 'assessment',
    category: 'search-visibility',
    text: 'Does your website have structured data (schema markup) that tells Google your business type, hours, and services?',
    subtext: "If you're not sure, the answer is probably no.",
    type: 'radio',
    options: [
      { label: "I don't know what that is", value: 0 },
      { label: "I don't think so", value: 2 },
      { label: 'I think we have some basics', value: 6 },
      { label: 'Yes, fully implemented', value: 10 },
    ],
  },

  // ── AI Visibility ──
  {
    id: 'ai-recommendation',
    phase: 'assessment',
    category: 'ai-visibility',
    text: 'Have you ever asked ChatGPT or Perplexity to recommend a business like yours in your area?',
    subtext: 'Try it — ask "recommend a [your service] in [your city]" and see what comes up.',
    type: 'radio',
    options: [
      { label: "Haven't tried it", value: 2 },
      { label: 'Tried it — my business was not mentioned', value: 1 },
      { label: 'Found, but with wrong or outdated info', value: 5 },
      { label: 'Recommended accurately', value: 10 },
    ],
  },
  {
    id: 'directory-listings',
    phase: 'assessment',
    category: 'ai-visibility',
    text: 'How many online directories is your business listed on (Yelp, BBB, Angi, industry-specific sites)?',
    type: 'radio',
    options: [
      { label: "None that I know of / I haven't set any up", value: 1 },
      { label: 'Just Google Business Profile', value: 3 },
      { label: 'A handful (3-5 directories)', value: 6 },
      { label: '10+ directories with complete, consistent info', value: 10 },
    ],
  },
  {
    id: 'content-depth',
    phase: 'assessment',
    category: 'ai-visibility',
    text: 'How much detailed information about your business exists online (beyond your own website)?',
    subtext: 'Think: mentions in articles, interviews, directory descriptions, social media.',
    type: 'radio',
    options: [
      { label: 'Almost nothing', value: 1 },
      { label: 'A few basic listings', value: 3 },
      { label: 'Some mentions and profiles across the web', value: 6 },
      { label: 'Extensive presence — articles, features, active social, and detailed profiles', value: 10 },
    ],
  },
  {
    id: 'online-mentions',
    phase: 'assessment',
    category: 'ai-visibility',
    text: 'Has your business been mentioned on local blogs, news sites, or industry publications?',
    type: 'radio',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Maybe once or twice', value: 3 },
      { label: 'A few times', value: 6 },
      { label: 'Regularly — we actively pursue coverage', value: 10 },
    ],
  },
  {
    id: 'nap-consistency',
    phase: 'assessment',
    category: 'ai-visibility',
    text: 'Is your business name, address, and phone number exactly the same across every online listing?',
    subtext: 'Even small differences (like "St" vs "Street") can confuse search engines and AI tools.',
    type: 'radio',
    options: [
      { label: "I have no idea", value: 1 },
      { label: "Probably not — I've never checked", value: 2 },
      { label: 'Mostly consistent but there might be some differences', value: 6 },
      { label: '100% consistent — I\'ve verified it', value: 10 },
    ],
  },

  // ── Local Presence ──
  {
    id: 'gbp-status',
    phase: 'assessment',
    category: 'local-presence',
    text: 'How complete is your Google Business Profile?',
    type: 'radio',
    options: [
      { label: "I don't have one / not sure", value: 0 },
      { label: "It's claimed but barely filled out", value: 3 },
      { label: 'Most info is there but I rarely update it', value: 6 },
      { label: 'Fully complete — photos, posts, services, hours, and updated regularly', value: 10 },
    ],
  },
  {
    id: 'review-count',
    phase: 'assessment',
    category: 'local-presence',
    text: 'How many Google reviews does your business have?',
    type: 'radio',
    options: [
      { label: 'Less than 5', value: 1 },
      { label: '5–20', value: 4 },
      { label: '21–50', value: 7 },
      { label: '50+', value: 10 },
    ],
  },
  {
    id: 'review-rating',
    phase: 'assessment',
    category: 'local-presence',
    text: "What's your average Google review rating?",
    type: 'radio',
    options: [
      { label: "No reviews yet / I don't know", value: 0 },
      { label: 'Below 4.0 stars', value: 3 },
      { label: '4.0–4.4 stars', value: 6 },
      { label: '4.5+ stars', value: 10 },
    ],
  },
  {
    id: 'review-responses',
    phase: 'assessment',
    category: 'local-presence',
    text: 'Do you respond to your Google reviews?',
    type: 'radio',
    options: [
      { label: 'Never', value: 0 },
      { label: 'Only negative ones', value: 3 },
      { label: 'Sometimes', value: 5 },
      { label: 'Every single one, within a day or two', value: 10 },
    ],
  },
  {
    id: 'local-directories',
    phase: 'assessment',
    category: 'local-presence',
    text: 'Are you listed in local directories and community sites (Chamber of Commerce, local business associations)?',
    type: 'radio',
    options: [
      { label: "No / I haven't looked into it", value: 0 },
      { label: 'Maybe one or two', value: 3 },
      { label: 'A few local listings', value: 6 },
      { label: 'Yes, fully listed with consistent info', value: 10 },
    ],
  },
]

// All questions in order
export const allQuestions: Question[] = [...discoveryQuestions, ...assessmentQuestions]

// Scoring
export interface WeakQuestion {
  id: string
  text: string
  score: number
  category: string
}

export interface CategoryScore {
  key: string
  name: string
  color: string
  score: number       // 0-10
  grade: string       // A-F
  service: string
  serviceDescription: string
  actions: string[]
}

export function calculateScores(answers: Record<string, number | string>): {
  categories: CategoryScore[]
  overall: number
  overallGrade: string
  weakQuestions: WeakQuestion[]
} {
  const weakQuestions: WeakQuestion[] = []

  const catScores: CategoryScore[] = categories.map(cat => {
    const catQuestions = assessmentQuestions.filter(q => q.category === cat.key)
    const values = catQuestions.map(q => {
      const val = answers[q.id]
      const num = typeof val === 'number' ? val : parseFloat(String(val)) || 0
      // Track weak individual questions (scored 3 or below)
      if (num <= 3) {
        weakQuestions.push({ id: q.id, text: q.text, score: num, category: cat.key })
      }
      return num
    })
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
    const score = Math.round(avg * 10) / 10

    let grade = 'F'
    if (score >= 9) grade = 'A'
    else if (score >= 7) grade = 'B'
    else if (score >= 5) grade = 'C'
    else if (score >= 3) grade = 'D'

    return {
      key: cat.key,
      name: cat.name,
      color: cat.color,
      score,
      grade,
      service: cat.service,
      serviceDescription: cat.serviceDescription,
      actions: cat.actions,
    }
  })

  const overall = catScores.length > 0
    ? Math.round((catScores.reduce((s, c) => s + c.score, 0) / catScores.length) * 10) / 10
    : 0

  let overallGrade = 'F'
  if (overall >= 9) overallGrade = 'A'
  else if (overall >= 7) overallGrade = 'B'
  else if (overall >= 5) overallGrade = 'C'
  else if (overall >= 3) overallGrade = 'D'

  return { categories: catScores, overall, overallGrade, weakQuestions }
}

// Per-question recommendations for weak areas
export const questionRecommendations: Record<string, string> = {
  'google-ranking': "You're not showing up when people search for your services. Local SEO work — optimized service pages, proper keywords, and Google Business Profile improvements — can move you onto page 1.",
  'website-quality': 'Your website is your 24/7 salesperson. A modern, fast website with clear calls-to-action and service descriptions builds trust and converts visitors into leads.',
  'mobile-friendly': 'Over 60% of local searches happen on phones. A slow or clunky mobile experience means you\'re losing leads before they even call.',
  'content-publishing': 'Publishing helpful content (FAQs, how-to guides, service explanations) tells Google you\'re an authority in your field and gives you more chances to show up in search results.',
  'structured-data': 'Structured data helps Google display rich results for your business — star ratings, hours, service areas. Without it, you\'re leaving free visibility on the table.',
  'ai-recommendation': "AI tools are becoming the new search. If ChatGPT and Perplexity don't know about your business, you're invisible to a growing number of potential customers.",
  'directory-listings': 'Directory listings are how AI tools and search engines verify your business exists. More complete, consistent listings = more trust signals = higher visibility.',
  'content-depth': 'AI tools form recommendations from what they can find online. The more detailed, high-quality content about your business that exists across the web, the more likely AI will recommend you.',
  'online-mentions': 'Third-party mentions (press, blogs, features) are powerful trust signals. They tell both Google and AI tools that your business is established and worth recommending.',
  'nap-consistency': "Inconsistent business info across the web confuses search engines and AI tools. A NAP (Name, Address, Phone) audit and cleanup can boost your visibility significantly.",
  'gbp-status': 'Your Google Business Profile is often the first thing people see. An incomplete profile signals that your business might not be active or trustworthy.',
  'review-count': 'Businesses with more reviews rank higher in local search and get chosen more often. An automated review request system after each job can build your count quickly.',
  'review-rating': 'Your star rating is the first filter customers use. If you\'re below 4.5, focus on delivering great experiences and making it easy for happy customers to leave reviews.',
  'review-responses': 'Responding to every review — good and bad — shows Google you\'re active and shows customers you care. It directly impacts your local search ranking.',
  'local-directories': 'Local directories and community sites build your authority in your area. Chamber of Commerce listings and local business association memberships signal legitimacy.',
}
