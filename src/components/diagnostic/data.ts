// Business Diagnostic — Questions, categories, and scoring

export interface Question {
  id: string
  phase: 'discovery' | 'assessment'
  category?: string
  text: string
  subtext?: string
  type: 'text' | 'textarea' | 'select' | 'radio' | 'slider'
  options?: { label: string; value: number | string }[]
  required?: boolean
}

export interface Category {
  key: string
  name: string
  description: string
  service: string
  serviceDescription: string
}

export const categories: Category[] = [
  {
    key: 'lead-generation',
    name: 'Lead Generation',
    description: 'How effectively you attract and capture new potential customers.',
    service: 'AI Receptionist',
    serviceDescription: 'Never miss a call, text, or inquiry again. An AI that answers 24/7, captures lead info, and sends booking links — so every potential customer gets a response in seconds.',
  },
  {
    key: 'sales-conversion',
    name: 'Sales & Conversion',
    description: 'How well you turn interested people into paying customers.',
    service: 'AI Receptionist + Automations',
    serviceDescription: 'Automated follow-up sequences, instant booking links, and an AI that handles the back-and-forth so leads don\'t go cold while you\'re busy.',
  },
  {
    key: 'customer-retention',
    name: 'Customer Retention',
    description: 'How well you keep existing customers engaged and coming back.',
    service: 'Automations',
    serviceDescription: 'Automated check-ins, reminders, and re-engagement sequences that keep your customers coming back — without you having to remember to follow up.',
  },
  {
    key: 'marketing-visibility',
    name: 'Marketing & Visibility',
    description: 'How easily people can find your business when they\'re looking.',
    service: 'Visibility',
    serviceDescription: 'Get found on Google, show up when people ask AI tools like ChatGPT for recommendations, and make sure your online presence actually drives business.',
  },
  {
    key: 'operations',
    name: 'Operations & Efficiency',
    description: 'How streamlined and automated your day-to-day business processes are.',
    service: 'Company Companion',
    serviceDescription: 'An AI trained on your business knowledge that your team can ask anything — policies, procedures, pricing, how-to. Stops you from being the bottleneck for every question.',
  },
]

// Discovery questions — gather business context
export const discoveryQuestions: Question[] = [
  {
    id: 'business-name',
    phase: 'discovery',
    text: 'What\'s your business name?',
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
  {
    id: 'team-size',
    phase: 'discovery',
    text: 'How big is your team?',
    type: 'radio',
    required: true,
    options: [
      { label: 'Just me', value: '1' },
      { label: '2–5 people', value: '2-5' },
      { label: '6–15 people', value: '6-15' },
      { label: '16–50 people', value: '16-50' },
      { label: '50+', value: '50+' },
    ],
  },
  {
    id: 'years',
    phase: 'discovery',
    text: 'How long have you been in business?',
    type: 'radio',
    required: true,
    options: [
      { label: 'Less than a year', value: '<1' },
      { label: '1–3 years', value: '1-3' },
      { label: '3–5 years', value: '3-5' },
      { label: '5–10 years', value: '5-10' },
      { label: '10+ years', value: '10+' },
    ],
  },
  {
    id: 'challenge',
    phase: 'discovery',
    text: 'What\'s your biggest challenge right now?',
    subtext: 'No wrong answers — just tell us what\'s on your mind.',
    type: 'textarea',
    required: true,
  },
]

// Assessment questions — 3 per category, scored 0-10
export const assessmentQuestions: Question[] = [
  // ── Lead Generation ──
  {
    id: 'lead-consistency',
    phase: 'assessment',
    category: 'lead-generation',
    text: 'How consistently do new leads come into your business?',
    subtext: '0 = We have no idea where leads come from. 10 = Steady, predictable flow every week.',
    type: 'slider',
  },
  {
    id: 'lead-channels',
    phase: 'assessment',
    category: 'lead-generation',
    text: 'How do most potential customers find you?',
    type: 'radio',
    options: [
      { label: 'Word of mouth only', value: 2 },
      { label: 'Some online presence, but mostly referrals', value: 4 },
      { label: 'Active marketing across a few channels', value: 7 },
      { label: 'Multiple channels driving leads consistently', value: 10 },
    ],
  },
  {
    id: 'lead-afterhours',
    phase: 'assessment',
    category: 'lead-generation',
    text: 'When someone contacts your business after hours, what happens?',
    type: 'radio',
    options: [
      { label: 'They get voicemail or nothing', value: 1 },
      { label: 'Sometimes we catch them, sometimes we don\'t', value: 3 },
      { label: 'We have a system but it\'s inconsistent', value: 6 },
      { label: 'Every inquiry gets a response within minutes', value: 10 },
    ],
  },

  // ── Sales & Conversion ──
  {
    id: 'conversion-rate',
    phase: 'assessment',
    category: 'sales-conversion',
    text: 'What percentage of your leads become paying customers?',
    type: 'radio',
    options: [
      { label: 'Less than 10%', value: 2 },
      { label: '10–25%', value: 4 },
      { label: '25–50%', value: 7 },
      { label: 'Over 50%', value: 10 },
    ],
  },
  {
    id: 'sales-process',
    phase: 'assessment',
    category: 'sales-conversion',
    text: 'How structured is your sales process?',
    subtext: '0 = No real process, we wing it. 10 = Clear steps from first contact to close.',
    type: 'slider',
  },
  {
    id: 'lead-followup',
    phase: 'assessment',
    category: 'sales-conversion',
    text: 'When a lead doesn\'t buy right away, what happens next?',
    type: 'radio',
    options: [
      { label: 'Nothing — we move on', value: 1 },
      { label: 'We follow up manually when we remember', value: 3 },
      { label: 'We have a follow-up process but it\'s manual', value: 6 },
      { label: 'Automated sequences handle it', value: 10 },
    ],
  },

  // ── Customer Retention ──
  {
    id: 'customer-outreach',
    phase: 'assessment',
    category: 'customer-retention',
    text: 'How often do you proactively reach out to existing customers?',
    type: 'radio',
    options: [
      { label: 'Rarely or never', value: 1 },
      { label: 'A few times a year', value: 3 },
      { label: 'Monthly', value: 7 },
      { label: 'Weekly or more', value: 10 },
    ],
  },
  {
    id: 'retention-rating',
    phase: 'assessment',
    category: 'customer-retention',
    text: 'How well do you retain your customers over time?',
    subtext: '0 = Most are one-and-done. 10 = Customers stay for years.',
    type: 'slider',
  },
  {
    id: 'upsell-referral',
    phase: 'assessment',
    category: 'customer-retention',
    text: 'Do you have systems for upselling or getting referrals from happy customers?',
    type: 'radio',
    options: [
      { label: 'No, not really', value: 1 },
      { label: 'We ask sometimes but it\'s ad hoc', value: 3 },
      { label: 'We have a process for it', value: 7 },
      { label: 'It\'s automated and consistent', value: 10 },
    ],
  },

  // ── Marketing & Visibility ──
  {
    id: 'findability',
    phase: 'assessment',
    category: 'marketing-visibility',
    text: 'If someone searched for your type of business in your area, how easily would they find you?',
    subtext: '0 = We\'re invisible online. 10 = We\'re the first result.',
    type: 'slider',
  },
  {
    id: 'gbp-management',
    phase: 'assessment',
    category: 'marketing-visibility',
    text: 'Do you actively manage your Google Business Profile?',
    type: 'radio',
    options: [
      { label: 'What\'s that?', value: 1 },
      { label: 'We set it up but don\'t maintain it', value: 3 },
      { label: 'We update it occasionally', value: 6 },
      { label: 'We actively manage it — posts, photos, reviews', value: 10 },
    ],
  },
  {
    id: 'content-consistency',
    phase: 'assessment',
    category: 'marketing-visibility',
    text: 'How consistent is your online content or social media presence?',
    subtext: '0 = We haven\'t posted in months. 10 = We publish regularly and it drives business.',
    type: 'slider',
  },

  // ── Operations & Efficiency ──
  {
    id: 'process-docs',
    phase: 'assessment',
    category: 'operations',
    text: 'How well are your business processes documented?',
    subtext: '0 = Nothing is written down, it\'s all in my head. 10 = Everything is documented and accessible.',
    type: 'slider',
  },
  {
    id: 'automation-level',
    phase: 'assessment',
    category: 'operations',
    text: 'How much of your repetitive work is automated?',
    type: 'radio',
    options: [
      { label: 'Almost nothing — it\'s all manual', value: 1 },
      { label: 'A few things here and there', value: 3 },
      { label: 'About half of routine tasks', value: 6 },
      { label: 'Most routine tasks run on autopilot', value: 10 },
    ],
  },
  {
    id: 'repeated-questions',
    phase: 'assessment',
    category: 'operations',
    text: 'How often do you or your team answer the same questions over and over?',
    type: 'radio',
    options: [
      { label: 'Constantly — it eats up our day', value: 1 },
      { label: 'Several times a day', value: 3 },
      { label: 'Occasionally', value: 7 },
      { label: 'Rarely — we have systems for that', value: 10 },
    ],
  },
]

// All questions in order
export const allQuestions: Question[] = [...discoveryQuestions, ...assessmentQuestions]

// Scoring
export interface CategoryScore {
  key: string
  name: string
  score: number       // 0-10
  grade: string       // A-F
  service: string
  serviceDescription: string
}

export function calculateScores(answers: Record<string, number | string>): {
  categories: CategoryScore[]
  overall: number
  overallGrade: string
} {
  const catScores: CategoryScore[] = categories.map(cat => {
    const catQuestions = assessmentQuestions.filter(q => q.category === cat.key)
    const values = catQuestions.map(q => {
      const val = answers[q.id]
      return typeof val === 'number' ? val : parseFloat(String(val)) || 0
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
      score,
      grade,
      service: cat.service,
      serviceDescription: cat.serviceDescription,
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

  return { categories: catScores, overall, overallGrade }
}
