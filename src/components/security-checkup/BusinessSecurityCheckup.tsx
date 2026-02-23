import { useState, useRef, useEffect } from 'react'
import {
  allQuestions,
  assessmentQuestions,
  categories,
  calculateScores,
  type Question,
  type CategoryScore,
} from './data'

// ─── Shared styles (purple/violet theme for security) ────
const card = 'bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl'
const btnPrimary = 'bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40'
const btnSecondary = 'text-[#94a3b8] hover:text-white transition-colors text-sm'
const inputBase = 'w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-5 py-3.5 text-white placeholder-[#4a5568] focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 outline-none transition-all text-base'

// ─── Grade colors ────────────────────────────────────────
function gradeColor(grade: string) {
  if (grade === 'A') return '#10b981'
  if (grade === 'B') return '#3b82f6'
  if (grade === 'C') return '#f59e0b'
  if (grade === 'D') return '#f97316'
  return '#ef4444'
}

function gradeLabel(grade: string) {
  if (grade === 'A') return 'Well Protected'
  if (grade === 'B') return 'Good Shape'
  if (grade === 'C') return 'Needs Attention'
  if (grade === 'D') return 'At Risk'
  return 'Vulnerable'
}

// ─── Build answer details for AI report ──────────────────
function buildAnswerDetails(answers: Record<string, string | number>): string {
  const lines: string[] = []
  for (const cat of categories) {
    lines.push(`\n${cat.name}:`)
    const catQuestions = assessmentQuestions.filter(q => q.category === cat.key)
    for (const q of catQuestions) {
      const val = answers[q.id]
      if (q.type === 'slider') {
        lines.push(`- ${q.text}: ${val}/10`)
      } else if (q.options) {
        const opt = q.options.find(o => o.value === val)
        const label = opt?.label || String(val)
        lines.push(`- ${q.text}: "${label}" (scored ${val}/10)`)
      }
    }
  }
  return lines.join('\n')
}

// ─── Markdown Renderer ──────────────────────────────────
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
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#8b5cf6] flex-shrink-0" />
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

    if (listMatch) { listItems.push(listMatch[1]); continue }
    if (numListMatch) { listItems.push(numListMatch[1]); continue }

    flushList()

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-base font-bold text-white mt-5 mb-2">{line.slice(4).replace(/\*\*/g, '')}</h4>)
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
          className="h-full rounded-full bg-gradient-to-r from-[#8b5cf6] to-[#6366f1] transition-all duration-500"
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

  return (
    <div className="animate-fadeIn">
      {isFirstInCategory && catInfo && (
        <div className="text-center mb-6">
          <span className="inline-block text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-[#8b5cf6]/15 text-[#a78bfa] mb-2">
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
                  ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 text-white'
                  : 'border-[#2a2d3e] bg-[#0f1117] text-[#94a3b8] hover:border-[#8b5cf6]/50'
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
                  ? 'border-[#8b5cf6] bg-[#8b5cf6]/10 text-white'
                  : 'border-[#2a2d3e] bg-[#0f1117] text-[#94a3b8] hover:border-[#8b5cf6]/50'
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
            className="w-full accent-[#8b5cf6] h-2 bg-[#1a1d2e] rounded-full cursor-pointer"
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
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">Your Security Report Is Ready</h2>
      <p className="text-[#94a3b8] mb-8 max-w-md mx-auto">
        We'll generate a personalized security assessment with a real risk analysis for your business — not generic tips.
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
          {submitting ? 'Generating Report...' : 'Get My Report'}
        </button>
      </div>
    </div>
  )
}

// ─── Animated Score ──────────────────────────────────────
function AnimatedScore({ value, color }: { value: number; color: string }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let start = 0
    const duration = 1200
    const step = 16
    const increment = value / (duration / step)
    const timer = setInterval(() => {
      start += increment
      if (start >= value) {
        setDisplay(value)
        clearInterval(timer)
      } else {
        setDisplay(Math.round(start * 10) / 10)
      }
    }, step)
    return () => clearInterval(timer)
  }, [value])

  return (
    <span className="text-7xl font-bold tabular-nums" style={{ color }}>
      {display}
    </span>
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
    </div>
  )
}

// ─── Results ─────────────────────────────────────────────
function Results({
  scores,
  businessName,
  aiReport,
  reportLoading,
  loadingStatus,
}: {
  scores: ReturnType<typeof calculateScores>
  businessName: string
  aiReport: string
  reportLoading: boolean
  loadingStatus: string
}) {
  const color = gradeColor(scores.overallGrade)

  return (
    <div className="animate-fadeIn space-y-8">
      {/* Overall Score — Hero */}
      <div className={`${card} p-8 sm:p-10 text-center`}>
        <p className="text-sm text-[#64748b] mb-4">Security Score for {businessName}</p>
        <div className="flex items-center justify-center gap-3 mb-4">
          <AnimatedScore value={scores.overall} color={color} />
          <span className="text-2xl text-[#4a5568] font-light">/10</span>
        </div>
        <span
          className="inline-block text-sm font-bold px-5 py-2 rounded-full"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {scores.overallGrade} — {gradeLabel(scores.overallGrade)}
        </span>
      </div>

      {/* Category Breakdown */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4">Security Breakdown</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          {scores.categories.map(cat => (
            <ScoreCard key={cat.key} cat={cat} weak={cat.score < 6} />
          ))}
        </div>
      </div>

      {/* AI Report */}
      <div className={`${card} p-6 sm:p-8`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Your Security Assessment</h3>
            <p className="text-xs text-[#64748b]">AI-generated risk analysis based on your specific answers</p>
          </div>
        </div>
        {reportLoading ? (
          <div className="flex items-center gap-3 py-12 justify-center">
            <div className="w-5 h-5 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[#94a3b8]">{loadingStatus || 'Analyzing your security posture...'}</p>
          </div>
        ) : aiReport ? (
          <div>{renderMarkdown(aiReport)}</div>
        ) : (
          <p className="text-sm text-[#64748b] py-4">Report unavailable — please try refreshing the page.</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 no-print">
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 bg-[#1a1d2e] border border-[#2a2d3e] text-white font-semibold px-6 py-3.5 rounded-xl hover:bg-[#232640] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Save Report
        </button>
        <a
          href="/tools/test-drive"
          className={`${btnPrimary} flex-1 text-center flex items-center justify-center gap-2`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Try the Demo — See It In Action
        </a>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function BusinessSecurityCheckup() {
  const [phase, setPhase] = useState<'questions' | 'capture' | 'results'>('questions')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number>>({})
  const [scores, setScores] = useState<ReturnType<typeof calculateScores> | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [aiReport, setAiReport] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
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
    if (currentQuestion.type === 'slider') return true
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
    if (e.key === 'Enter' && canProceed() && currentQuestion?.type !== 'textarea') {
      handleNext()
    }
  }

  async function handleLeadSubmit(info: { name: string; email: string; phone: string }) {
    setSubmitting(true)

    const result = calculateScores(answers)
    setScores(result)

    // Switch to results immediately
    setPhase('results')
    setSubmitting(false)
    setReportLoading(true)
    setLoadingStatus('Analyzing your security posture...')

    // Generate AI report
    let reportText = ''
    try {
      const res = await fetch('/.netlify/functions/generate-security-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: String(answers['business-name'] || ''),
          industry: String(answers['industry'] || ''),
          teamSize: String(answers['team-size'] || ''),
          biggestFear: String(answers['biggest-fear'] || ''),
          scores: result,
          answerDetails: buildAnswerDetails(answers),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        reportText = data.report || ''
        setAiReport(reportText)
      }
    } catch (err) {
      console.error('Report error:', err)
    }
    setReportLoading(false)

    // Store for test drive demo
    try {
      localStorage.setItem('leadfair_audit', JSON.stringify({
        type: 'security',
        businessName: String(answers['business-name'] || ''),
        industry: String(answers['industry'] || ''),
        teamSize: String(answers['team-size'] || ''),
        biggestFear: String(answers['biggest-fear'] || ''),
        scores: result,
        report: reportText,
        completedAt: new Date().toISOString(),
      }))
    } catch { /* localStorage not available */ }

    // Submit to FormSubmit
    try {
      const formData = new FormData()
      formData.append('name', info.name)
      formData.append('email', info.email)
      formData.append('phone', info.phone)
      formData.append('business-name', String(answers['business-name'] || ''))
      formData.append('industry', String(answers['industry'] || ''))
      formData.append('team-size', String(answers['team-size'] || ''))
      formData.append('biggest-fear', String(answers['biggest-fear'] || ''))
      formData.append('overall-score', String(result.overall))
      formData.append('overall-grade', result.overallGrade)
      result.categories.forEach(cat => {
        formData.append(`score-${cat.key}`, String(cat.score))
        formData.append(`grade-${cat.key}`, cat.grade)
      })
      if (reportText) {
        formData.append('security-report', reportText)
      }
      formData.append('_subject', `Security Checkup — ${answers['business-name'] || 'Unknown'} (${result.overallGrade})`)
      formData.append('_captcha', 'false')
      formData.append('_template', 'table')

      await fetch('https://formsubmit.co/ajax/hello@leadfair.ai', {
        method: 'POST',
        body: formData,
      })
    } catch (err) {
      console.error('Form submission error:', err)
    }
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className="min-h-[70vh] flex flex-col items-center justify-center py-12 px-4"
    >
      {/* Branding header */}
      <div className="w-full max-w-2xl text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">Business Security Checkup</h1>
        <p className="text-xs font-medium text-[#64748b] mb-2">by <span className="text-[#a78bfa]">LeadFair</span></p>
        {phase === 'questions' && (
          <p className="text-sm text-[#64748b]">Find out how protected your business really is — in under 5 minutes</p>
        )}
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
                &larr; Back
              </button>
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className={btnPrimary}
              >
                {currentIndex === totalQuestions - 1 ? 'See Results' : 'Continue \u2192'}
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
          <Results
            scores={scores}
            businessName={String(answers['business-name'] || 'Your Business')}
            aiReport={aiReport}
            reportLoading={reportLoading}
            loadingStatus={loadingStatus}
          />
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
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          cursor: pointer;
          border: 2px solid #0f1117;
        }
        input[type="range"]::-moz-range-thumb {
          height: 24px;
          width: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8b5cf6, #6366f1);
          cursor: pointer;
          border: 2px solid #0f1117;
        }
        @media print {
          header, footer, nav, .no-print { display: none !important; }
          body, main, section { background: white !important; color: #1a1a2e !important; }
          * { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .min-h-\\[70vh\\] { min-height: auto !important; padding: 0 !important; }
          .bg-\\[\\#1a1d2e\\] { background: #f8f9fa !important; border-color: #e2e8f0 !important; }
          .bg-\\[\\#0f1117\\] { background: #f1f5f9 !important; }
          .text-white { color: #1a1a2e !important; }
          .text-\\[\\#94a3b8\\] { color: #475569 !important; }
          .text-\\[\\#64748b\\] { color: #64748b !important; }
        }
      `}</style>
    </div>
  )
}
