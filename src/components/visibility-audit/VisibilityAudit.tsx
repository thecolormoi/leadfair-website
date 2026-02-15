import { useState, useRef, useEffect } from 'react'
import {
  allQuestions,
  assessmentQuestions,
  categories,
  calculateScores,
  type Question,
  type CategoryScore,
} from './data'

// ─── Shared styles ───────────────────────────────────────
const card = 'bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl'
const btnPrimary = 'bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40'
const btnSecondary = 'text-[#94a3b8] hover:text-white transition-colors text-sm'
const inputBase = 'w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-5 py-3.5 text-white placeholder-[#4a5568] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all text-base'

// ─── Grade colors ────────────────────────────────────────
function gradeColor(grade: string) {
  if (grade === 'A') return '#10b981'
  if (grade === 'B') return '#3b82f6'
  if (grade === 'C') return '#f59e0b'
  if (grade === 'D') return '#f97316'
  return '#ef4444'
}

function gradeLabel(grade: string) {
  if (grade === 'A') return 'Excellent'
  if (grade === 'B') return 'Good'
  if (grade === 'C') return 'Needs Work'
  if (grade === 'D') return 'Struggling'
  return 'Critical'
}

// ─── Progress Bar ────────────────────────────────────────
function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = Math.round((current / total) * 100)
  return (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-[#64748b] mb-2">
        <span>Question {current} of {total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-[#1a1d2e] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#3b82f6] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Question Renderer ───────────────────────────────────
function QuestionView({
  question,
  value,
  onChange,
}: {
  question: Question
  value: string | number
  onChange: (val: string | number) => void
}) {
  const catInfo = question.category
    ? categories.find(c => c.key === question.category)
    : null
  const isFirstInCategory = question.category
    ? assessmentQuestions.findIndex(q => q.category === question.category) ===
      assessmentQuestions.indexOf(question)
    : false

  const accentColor = catInfo?.color || '#10b981'

  return (
    <div className="animate-fadeIn">
      {isFirstInCategory && catInfo && (
        <div className="text-center mb-6">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full mb-2"
            style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
          >
            {catInfo.name}
          </span>
          <p className="text-sm text-[#64748b]">{catInfo.description}</p>
        </div>
      )}

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
        {question.text}
      </h2>
      {question.subtext && (
        <p className="text-sm text-[#64748b] mb-6">{question.subtext}</p>
      )}

      {question.type === 'text' && (
        <input
          type="text"
          className={inputBase}
          value={value as string}
          onChange={e => onChange(e.target.value)}
          autoFocus
        />
      )}

      {question.type === 'select' && (
        <div className="space-y-2">
          {question.options?.map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all ${
                value === opt.value
                  ? 'border-[#10b981] bg-[#10b981]/10 text-white'
                  : 'border-[#2a2d3e] bg-[#0f1117] text-[#94a3b8] hover:border-[#10b981]/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {question.type === 'radio' && (
        <div className="space-y-2">
          {question.options?.map(opt => (
            <button
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`w-full text-left px-5 py-3.5 rounded-xl border transition-all ${
                value === opt.value
                  ? `text-white`
                  : 'border-[#2a2d3e] bg-[#0f1117] text-[#94a3b8] hover:border-[#10b981]/50'
              }`}
              style={
                value === opt.value
                  ? { borderColor: accentColor, backgroundColor: `${accentColor}15` }
                  : undefined
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Lead Capture ────────────────────────────────────────
function LeadCapture({
  onSubmit,
  submitting,
}: {
  onSubmit: (info: { name: string; email: string; phone: string }) => void
  submitting: boolean
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  return (
    <div className="animate-fadeIn text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Your Visibility Report Is Ready</h2>
      <p className="text-[#94a3b8] mb-8 max-w-md mx-auto">
        Enter your info below to see your personalized visibility report with specific recommendations for improving your online presence.
      </p>

      <div className="max-w-sm mx-auto space-y-4 text-left">
        <div>
          <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Name</label>
          <input
            type="text"
            className={inputBase}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Email</label>
          <input
            type="email"
            className={inputBase}
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">Phone <span className="text-[#4a5568]">(optional)</span></label>
          <input
            type="tel"
            className={inputBase}
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="(256) 555-0000"
          />
        </div>
        <button
          onClick={() => onSubmit({ name, email, phone })}
          disabled={!name.trim() || !email.trim() || submitting}
          className={`${btnPrimary} w-full mt-2`}
        >
          {submitting ? 'Loading...' : 'See My Report'}
        </button>
      </div>
    </div>
  )
}

// ─── Score Card (category-colored) ───────────────────────
function ScoreCard({ cat }: { cat: CategoryScore }) {
  const color = cat.color
  const gColor = gradeColor(cat.grade)
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${gColor}20`, color: gColor }}
        >
          {cat.grade}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold" style={{ color }}>{cat.score}</span>
        <span className="text-sm text-[#64748b] mb-1">/10</span>
      </div>

      <div className="h-1.5 bg-[#0f1117] rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${cat.score * 10}%`, backgroundColor: color }}
        />
      </div>

      <p className="text-xs text-[#64748b]">{gradeLabel(cat.grade)}</p>
    </div>
  )
}

// ─── Simple markdown renderer ────────────────────────────
function renderMarkdown(text: string) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let listIndex = 0

  function flushList() {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listIndex++}`} className="space-y-1.5 mb-4 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-[#94a3b8]">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#10b981] flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  function inlineMd(s: string) {
    return s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white">$1</strong>')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const listMatch = line.match(/^[-*]\s+(.+)/)
    const numListMatch = line.match(/^\d+\.\s+(.+)/)

    if (listMatch) {
      listItems.push(listMatch[1])
      continue
    }
    if (numListMatch) {
      listItems.push(numListMatch[1])
      continue
    }

    flushList()

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-base font-bold text-white mt-6 mb-2">{line.slice(4).replace(/\*\*/g, '')}</h4>)
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-lg font-bold text-white mt-6 mb-2">{line.slice(3).replace(/\*\*/g, '')}</h3>)
    } else if (line.trim() === '') {
      continue
    } else {
      elements.push(<p key={i} className="text-sm text-[#94a3b8] leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />)
    }
  }
  flushList()
  return elements
}

// ─── Results ─────────────────────────────────────────────
function Results({
  scores,
  businessName,
  aiReport,
  aiLoading,
}: {
  scores: ReturnType<typeof calculateScores>
  businessName: string
  aiReport: string
  aiLoading: boolean
}) {
  const color = gradeColor(scores.overallGrade)

  return (
    <div className="animate-fadeIn">
      {/* Overall Score */}
      <div className="text-center mb-10">
        <p className="text-sm text-[#64748b] mb-2">Visibility Score for {businessName}</p>
        <div className="flex items-center justify-center gap-3 mb-2">
          <span className="text-6xl font-bold" style={{ color }}>{scores.overall}</span>
          <span className="text-2xl text-[#4a5568] font-light">/10</span>
        </div>
        <span
          className="inline-block text-sm font-bold px-4 py-1.5 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {scores.overallGrade} — {gradeLabel(scores.overallGrade)}
        </span>
      </div>

      {/* Category Breakdown — 3 columns */}
      <h3 className="text-lg font-bold text-white mb-4">Category Breakdown</h3>
      <div className="grid sm:grid-cols-3 gap-4 mb-10">
        {scores.categories.map(cat => (
          <ScoreCard key={cat.key} cat={cat} />
        ))}
      </div>

      {/* AI-Generated Personalized Report */}
      <div className={`${card} p-6 sm:p-8 mb-10`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-white">Your Personalized Report</h3>
        </div>
        {aiLoading ? (
          <div className="flex items-center gap-3 py-8 justify-center">
            <div className="w-5 h-5 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#94a3b8]">Analyzing your business and writing your report...</p>
          </div>
        ) : aiReport ? (
          <div>{renderMarkdown(aiReport)}</div>
        ) : (
          <p className="text-sm text-[#64748b]">Report unavailable — see the recommendations below.</p>
        )}
      </div>

      {/* CTA */}
      <div className={`${card} p-8 text-center`}>
        <h3 className="text-xl font-bold text-white mb-3">Want Us to Fix This?</h3>
        <p className="text-[#94a3b8] mb-6 max-w-md mx-auto">
          Book a free visibility consultation and we'll walk through your report together — with a clear plan to get your business found by more customers.
        </p>
        <a
          href="/contact"
          className={btnPrimary}
        >
          Book a Free Visibility Consultation
        </a>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function VisibilityAudit() {
  const [phase, setPhase] = useState<'questions' | 'capture' | 'results'>('questions')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [scores, setScores] = useState<ReturnType<typeof calculateScores> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [aiReport, setAiReport] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalQuestions = allQuestions.length
  const currentQuestion = allQuestions[currentIndex]

  function canProceed() {
    if (!currentQuestion) return false
    const val = answers[currentQuestion.id]
    if (currentQuestion.required === false) return true
    if (val === undefined || val === '') return false
    return true
  }

  function handleNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      setPhase('capture')
    }
  }

  function handleBack() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && canProceed()) {
      handleNext()
    }
  }

  async function handleLeadSubmit(info: { name: string; email: string; phone: string }) {
    setSubmitting(true)

    const result = calculateScores(answers)
    setScores(result)

    // Submit to FormSubmit
    try {
      const formData = new FormData()
      formData.append('name', info.name)
      formData.append('email', info.email)
      formData.append('phone', info.phone)
      formData.append('business-name', String(answers['business-name'] || ''))
      formData.append('website-url', String(answers['website-url'] || ''))
      formData.append('city', String(answers['city'] || ''))
      formData.append('industry', String(answers['industry'] || ''))
      formData.append('overall-score', String(result.overall))
      formData.append('overall-grade', result.overallGrade)
      result.categories.forEach(cat => {
        formData.append(`score-${cat.key}`, String(cat.score))
        formData.append(`grade-${cat.key}`, cat.grade)
      })
      // Include weak question IDs for quick reference
      formData.append('weak-areas', result.weakQuestions.map(w => w.id).join(', '))
      formData.append('_subject', 'New Visibility Audit Result')
      formData.append('_captcha', 'false')
      formData.append('_template', 'table')

      await fetch('https://formsubmit.co/ajax/hello@leadfair.ai', {
        method: 'POST',
        body: formData,
      })
    } catch (err) {
      console.error('Form submission error:', err)
    }

    setSubmitting(false)
    setPhase('results')

    // Fetch AI report in the background (results show immediately with loading state)
    setAiLoading(true)
    try {
      const res = await fetch('/.netlify/functions/generate-visibility-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: String(answers['business-name'] || ''),
          city: String(answers['city'] || ''),
          industry: String(answers['industry'] || ''),
          websiteUrl: String(answers['website-url'] || ''),
          scores: result,
          weakQuestions: result.weakQuestions,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiReport(data.report || '')
      }
    } catch (err) {
      console.error('AI report error:', err)
    }
    setAiLoading(false)
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4"
    >
      {/* Persistent branding header */}
      <div className="w-full max-w-2xl text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">Visibility Audit</h1>
        <p className="text-xs font-medium text-[#64748b] mb-2">by <span className="text-[#10b981]">LeadFair</span></p>
        <p className="text-sm text-[#64748b]">See how visible your business is on Google, AI search, and in your local area</p>
      </div>

      <div className="w-full max-w-2xl">
        {phase === 'questions' && currentQuestion && (
          <>
            <ProgressBar current={currentIndex + 1} total={totalQuestions} />

            <div className={`${card} p-8 sm:p-10`}>
              <QuestionView
                question={currentQuestion}
                value={answers[currentQuestion.id] ?? ''}
                onChange={val => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
              />
            </div>

            <div className="flex items-center justify-between mt-6">
              <button
                onClick={handleBack}
                className={btnSecondary}
                style={{ visibility: currentIndex > 0 ? 'visible' : 'hidden' }}
              >
                ← Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={btnPrimary}
              >
                {currentIndex === totalQuestions - 1 ? 'See Results' : 'Continue →'}
              </button>
            </div>
          </>
        )}

        {phase === 'capture' && (
          <div className={`${card} p-8 sm:p-10`}>
            <LeadCapture onSubmit={handleLeadSubmit} submitting={submitting} />
          </div>
        )}

        {phase === 'results' && scores && (
          <Results scores={scores} businessName={String(answers['business-name'] || 'Your Business')} aiReport={aiReport} aiLoading={aiLoading} />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
