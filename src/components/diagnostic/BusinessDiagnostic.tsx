import { useState, useRef, useEffect } from 'react'
import {
  allQuestions,
  discoveryQuestions,
  assessmentQuestions,
  categories,
  calculateScores,
  type Question,
  type CategoryScore,
} from './data'

// ─── Shared styles ───────────────────────────────────────
const card = 'bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl'
const btnPrimary = 'bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40'
const btnSecondary = 'text-[#94a3b8] hover:text-white transition-colors text-sm'
const inputBase = 'w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-5 py-3.5 text-white placeholder-[#4a5568] focus:border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6]/20 outline-none transition-all text-base'

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
          className="h-full rounded-full bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] transition-all duration-500"
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
  // Find category header for assessment questions
  const catInfo = question.category
    ? categories.find(c => c.key === question.category)
    : null
  const isFirstInCategory = question.category
    ? assessmentQuestions.findIndex(q => q.category === question.category) ===
      assessmentQuestions.indexOf(question)
    : false

  return (
    <div className="animate-fadeIn">
      {isFirstInCategory && catInfo && (
        <div className="text-center mb-6">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#3b82f6]/15 text-[#60a5fa] mb-2">
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

      {question.type === 'textarea' && (
        <textarea
          className={`${inputBase} min-h-[120px] resize-none`}
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
                  ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-white'
                  : 'border-[#2a2d3e] bg-[#0f1117] text-[#94a3b8] hover:border-[#3b82f6]/50'
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
                  ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-white'
                  : 'border-[#2a2d3e] bg-[#0f1117] text-[#94a3b8] hover:border-[#3b82f6]/50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {question.type === 'slider' && (
        <div>
          <div className="flex justify-between text-sm text-[#64748b] mb-3">
            <span>0</span>
            <span className="text-2xl font-bold text-white">{value || 5}</span>
            <span>10</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="1"
            value={value || 5}
            onChange={e => onChange(parseInt(e.target.value))}
            className="w-full accent-[#3b82f6] h-2 bg-[#1a1d2e] rounded-full cursor-pointer"
          />
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
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Your Results Are Ready</h2>
      <p className="text-[#94a3b8] mb-8 max-w-md mx-auto">
        Enter your info below to see your personalized diagnostic report with specific recommendations for your business.
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
          {submitting ? 'Loading...' : 'See My Results'}
        </button>
      </div>
    </div>
  )
}

// ─── Score Card ──────────────────────────────────────────
function ScoreCard({ cat, weak }: { cat: CategoryScore; weak: boolean }) {
  const color = gradeColor(cat.grade)
  return (
    <div className={`${card} p-5 ${weak ? 'ring-1 ring-[#f59e0b]/30' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
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

      {weak && (
        <div className="mt-4 pt-4 border-t border-[#2a2d3e]">
          <p className="text-xs font-semibold text-[#f59e0b] mb-1">Recommended: {cat.service}</p>
          <p className="text-xs text-[#94a3b8] leading-relaxed">{cat.serviceDescription}</p>
        </div>
      )}
    </div>
  )
}

// ─── Results ─────────────────────────────────────────────
function Results({
  scores,
  businessName,
}: {
  scores: ReturnType<typeof calculateScores>
  businessName: string
}) {
  const color = gradeColor(scores.overallGrade)
  const weakAreas = scores.categories.filter(c => c.score < 6)
  const strongAreas = scores.categories.filter(c => c.score >= 7)

  return (
    <div className="animate-fadeIn">
      {/* Overall Score */}
      <div className="text-center mb-10">
        <p className="text-sm text-[#64748b] mb-2">Overall Score for {businessName}</p>
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

      {/* Category Breakdown */}
      <h3 className="text-lg font-bold text-white mb-4">Category Breakdown</h3>
      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        {scores.categories.map(cat => (
          <ScoreCard key={cat.key} cat={cat} weak={cat.score < 6} />
        ))}
      </div>

      {/* Weak Areas — Recommendations */}
      {weakAreas.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-white mb-2">Where LeadFair Can Help</h3>
          <p className="text-sm text-[#64748b] mb-4">
            Based on your scores, here are the areas where you'd see the biggest improvement:
          </p>
          <div className="space-y-4">
            {weakAreas
              .sort((a, b) => a.score - b.score)
              .map(cat => (
                <div key={cat.key} className={`${card} p-5`}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-bold text-[#f59e0b]">{cat.name}: {cat.score}/10</span>
                  </div>
                  <h4 className="font-semibold text-white mb-1">{cat.service}</h4>
                  <p className="text-sm text-[#94a3b8] leading-relaxed">{cat.serviceDescription}</p>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Strong Areas */}
      {strongAreas.length > 0 && (
        <div className="mb-10">
          <h3 className="text-lg font-bold text-white mb-4">Your Strengths</h3>
          <div className="flex flex-wrap gap-3">
            {strongAreas.map(cat => (
              <span
                key={cat.key}
                className="text-sm font-medium px-4 py-2 rounded-full"
                style={{ backgroundColor: `${gradeColor(cat.grade)}15`, color: gradeColor(cat.grade) }}
              >
                {cat.name}: {cat.score}/10
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      <div className={`${card} p-8 text-center`}>
        <h3 className="text-xl font-bold text-white mb-3">Ready to Fix the Gaps?</h3>
        <p className="text-[#94a3b8] mb-6 max-w-md mx-auto">
          Book a free call and we'll walk through your results together. No pressure, no pitch — just an honest conversation about what would actually help.
        </p>
        <a
          href="/contact"
          className={btnPrimary}
        >
          Book a Free Call
        </a>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function BusinessDiagnostic() {
  const [phase, setPhase] = useState<'questions' | 'capture' | 'results'>('questions')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [scores, setScores] = useState<ReturnType<typeof calculateScores> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalQuestions = allQuestions.length
  const currentQuestion = allQuestions[currentIndex]

  // Initialize slider defaults
  useEffect(() => {
    if (currentQuestion?.type === 'slider' && answers[currentQuestion.id] === undefined) {
      setAnswers(prev => ({ ...prev, [currentQuestion.id]: 5 }))
    }
  }, [currentIndex])

  function canProceed() {
    if (!currentQuestion) return false
    const val = answers[currentQuestion.id]
    if (currentQuestion.type === 'slider') return true // always has a value
    if (currentQuestion.required === false) return true
    if (val === undefined || val === '') return false
    return true
  }

  function handleNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Done with questions — go to lead capture
      setPhase('capture')
    }
  }

  function handleBack() {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && canProceed() && currentQuestion?.type !== 'textarea') {
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
      formData.append('industry', String(answers['industry'] || ''))
      formData.append('team-size', String(answers['team-size'] || ''))
      formData.append('years', String(answers['years'] || ''))
      formData.append('challenge', String(answers['challenge'] || ''))
      formData.append('overall-score', String(result.overall))
      formData.append('overall-grade', result.overallGrade)
      result.categories.forEach(cat => {
        formData.append(`score-${cat.key}`, String(cat.score))
        formData.append(`grade-${cat.key}`, cat.grade)
      })
      formData.append('_subject', 'New Business Diagnostic Result')
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
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4"
    >
      {/* Persistent branding header */}
      <div className="w-full max-w-2xl text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">Business Diagnostic</h1>
        <p className="text-sm text-[#64748b]">Find out where AI and automation can help your business the most</p>
      </div>

      <div className="w-full max-w-2xl">
        {phase === 'questions' && currentQuestion && (
          <>
            <ProgressBar current={currentIndex + 1} total={totalQuestions} />

            <div className={`${card} p-8 sm:p-10`}>
              <QuestionView
                question={currentQuestion}
                value={answers[currentQuestion.id] ?? (currentQuestion.type === 'slider' ? 5 : '')}
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
          <Results scores={scores} businessName={String(answers['business-name'] || 'Your Business')} />
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
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          cursor: pointer;
          border: 2px solid #0f1117;
        }
        input[type="range"]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6, #06b6d4);
          cursor: pointer;
          border: 2px solid #0f1117;
        }
      `}</style>
    </div>
  )
}
