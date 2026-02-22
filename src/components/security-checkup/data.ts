// Business Security Checkup — Questions, categories, and scoring

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
  recommendation: string
  recommendationDescription: string
}

export const categories: Category[] = [
  {
    key: 'data-protection',
    name: 'Data Protection',
    description: 'How well you protect customer and business data from loss or exposure.',
    recommendation: 'Automated Backups + Encryption',
    recommendationDescription: 'LeadFair encrypts all data at rest and in transit. Customer info, messages, and payment data are protected automatically — no setup required from you.',
  },
  {
    key: 'access-control',
    name: 'Access & Passwords',
    description: 'How securely your team accesses business tools and accounts.',
    recommendation: 'Role-Based Access Control',
    recommendationDescription: 'LeadFair gives each team member their own login with only the permissions they need. No shared passwords, no accidental access to sensitive data.',
  },
  {
    key: 'payment-security',
    name: 'Payment Security',
    description: 'How safely you handle customer payments and financial information.',
    recommendation: 'Stripe-Powered Payments',
    recommendationDescription: 'LeadFair handles payments through Stripe — PCI compliant, encrypted, and secure. You never see or store credit card numbers directly.',
  },
  {
    key: 'incident-readiness',
    name: 'Incident Readiness',
    description: 'How prepared you are if something goes wrong — a breach, data loss, or scam.',
    recommendation: 'AI Security Monitoring',
    recommendationDescription: 'LeadFair runs proprietary AI security monitoring that watches for emerging threats and vulnerabilities — so your business stays protected without you having to think about it.',
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
    id: 'biggest-fear',
    phase: 'discovery',
    text: "When it comes to security, what worries you most?",
    subtext: 'Could be data loss, getting hacked, scams — whatever comes to mind.',
    type: 'textarea',
    required: true,
  },
]

// Assessment questions — 3 per category, scored 0-10
export const assessmentQuestions: Question[] = [
  // ── Data Protection ──
  {
    id: 'backup-situation',
    phase: 'assessment',
    category: 'data-protection',
    text: 'If your computer died right now, how much business data would you lose?',
    type: 'radio',
    options: [
      { label: 'Everything — it\'s all on one device', value: 1 },
      { label: 'Most of it — some stuff is backed up', value: 3 },
      { label: 'Not much — we use cloud tools for most things', value: 7 },
      { label: 'Nothing — everything is backed up and recoverable', value: 10 },
    ],
  },
  {
    id: 'customer-data-storage',
    phase: 'assessment',
    category: 'data-protection',
    text: 'Where do you store customer information (names, emails, phone numbers)?',
    type: 'radio',
    options: [
      { label: 'Spreadsheets, notes, or on paper', value: 1 },
      { label: 'A mix of tools — some organized, some not', value: 3 },
      { label: 'A CRM or dedicated business software', value: 7 },
      { label: 'A secure system with controlled access', value: 10 },
    ],
  },
  {
    id: 'data-protection-confidence',
    phase: 'assessment',
    category: 'data-protection',
    text: 'How confident are you that customer data in your business is protected?',
    subtext: '0 = No idea, honestly. 10 = Very confident — we\'ve got it locked down.',
    type: 'slider',
  },

  // ── Access & Passwords ──
  {
    id: 'password-sharing',
    phase: 'assessment',
    category: 'access-control',
    text: 'Does your team share passwords for any business tools or accounts?',
    type: 'radio',
    options: [
      { label: 'Yes — most accounts are shared', value: 1 },
      { label: 'A few shared accounts, but we\'re mostly separate', value: 4 },
      { label: 'Everyone has their own login', value: 7 },
      { label: 'Separate logins plus two-factor authentication', value: 10 },
    ],
  },
  {
    id: 'ex-employee-access',
    phase: 'assessment',
    category: 'access-control',
    text: 'When someone leaves your team, how quickly do you remove their access to business accounts?',
    type: 'radio',
    options: [
      { label: 'We don\'t really track that', value: 1 },
      { label: 'Eventually, when we remember', value: 3 },
      { label: 'Within a few days', value: 7 },
      { label: 'Same day — we have a process for it', value: 10 },
    ],
  },
  {
    id: 'password-strength',
    phase: 'assessment',
    category: 'access-control',
    text: 'How strong are the passwords used across your business accounts?',
    subtext: '0 = Same simple password everywhere. 10 = Unique strong passwords with a password manager.',
    type: 'slider',
  },

  // ── Payment Security ──
  {
    id: 'payment-method',
    phase: 'assessment',
    category: 'payment-security',
    text: 'How do you collect payments from customers?',
    type: 'radio',
    options: [
      { label: 'Cash, checks, or Venmo/Zelle', value: 2 },
      { label: 'We take cards but sometimes manually enter numbers', value: 4 },
      { label: 'Online payments through a proper processor (Stripe, Square, etc.)', value: 8 },
      { label: 'Secure online payments — we never see card numbers', value: 10 },
    ],
  },
  {
    id: 'financial-data-access',
    phase: 'assessment',
    category: 'payment-security',
    text: 'How many people on your team have access to financial accounts or payment info?',
    type: 'radio',
    options: [
      { label: 'Anyone can access them', value: 1 },
      { label: 'A few people, but no real controls', value: 3 },
      { label: 'Only 1-2 trusted people', value: 7 },
      { label: 'Restricted access with audit trails', value: 10 },
    ],
  },
  {
    id: 'payment-security-confidence',
    phase: 'assessment',
    category: 'payment-security',
    text: 'How confident are you that your payment process is secure?',
    subtext: '0 = Not sure at all. 10 = Fully secure and compliant.',
    type: 'slider',
  },

  // ── Incident Readiness ──
  {
    id: 'scam-awareness',
    phase: 'assessment',
    category: 'incident-readiness',
    text: 'Has your business ever been targeted by a scam, phishing email, or suspicious activity?',
    type: 'radio',
    options: [
      { label: 'Yes, and we fell for it', value: 1 },
      { label: 'Yes, but we caught it in time', value: 5 },
      { label: 'Not that we know of', value: 6 },
      { label: 'Yes, and we have training to prevent it', value: 10 },
    ],
  },
  {
    id: 'breach-plan',
    phase: 'assessment',
    category: 'incident-readiness',
    text: 'If customer data was compromised tomorrow, would you know what to do?',
    type: 'radio',
    options: [
      { label: 'No idea — I\'d panic', value: 1 },
      { label: 'I\'d figure it out, but no plan exists', value: 3 },
      { label: 'I have a rough idea of the steps', value: 6 },
      { label: 'We have a documented response plan', value: 10 },
    ],
  },
  {
    id: 'security-updates',
    phase: 'assessment',
    category: 'incident-readiness',
    text: 'How often do you update software, plugins, or tools your business uses?',
    type: 'radio',
    options: [
      { label: 'Never — if it works, we don\'t touch it', value: 1 },
      { label: 'When something breaks', value: 3 },
      { label: 'Every few months', value: 6 },
      { label: 'Regularly — updates happen automatically or on a schedule', value: 10 },
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
  recommendation: string
  recommendationDescription: string
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
      recommendation: cat.recommendation,
      recommendationDescription: cat.recommendationDescription,
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
