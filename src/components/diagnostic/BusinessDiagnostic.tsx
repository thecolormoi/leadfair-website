import { useState, useRef, useEffect, useCallback } from 'react'
import {
  allQuestions,
  discoveryQuestions,
  assessmentQuestions,
  categories,
  calculateScores,
  type Question,
  type CategoryScore,
} from './data'

// ─── Theme ───────────────────────────────────────────────
const accent = {
  from: '#3b82f6',
  to: '#06b6d4',
  primary: '#3b82f6',
  light: '#60a5fa',
  glow: 'rgba(59,130,246,0.35)',
}

// ─── Shared styles ───────────────────────────────────────
const glass = 'bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl'
const btnPrimary = `bg-gradient-to-r from-[${accent.from}] to-[${accent.to}] text-white font-semibold px-8 py-3.5 rounded-xl hover:shadow-lg hover:shadow-[${accent.from}]/20 transition-all disabled:opacity-40 disabled:hover:shadow-none`
const inputStyle = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-5 py-4 text-white text-lg placeholder-white/20 focus:border-[#3b82f6]/50 focus:ring-2 focus:ring-[#3b82f6]/10 focus:bg-white/[0.06] outline-none transition-all'

// ─── Grade helpers ───────────────────────────────────────
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

// ─── Build answer details for AI ─────────────────────────
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
        <ul key={`list-${listIndex++}`} className="space-y-2 mb-5 ml-1">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#3b82f6] flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: inlineMd(item) }} />
            </li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  function inlineMd(s: string) {
    return s.replace(/\*\*(.+?)\*\*/g, '<strong class="text-white/90 font-semibold">$1</strong>')
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const listMatch = line.match(/^[-*]\s+(.+)/)
    const numListMatch = line.match(/^\d+\.\s+(.+)/)

    if (listMatch) { listItems.push(listMatch[1]); continue }
    if (numListMatch) { listItems.push(numListMatch[1]); continue }

    flushList()

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-base font-bold text-white/90 mt-6 mb-2">{line.slice(4).replace(/\*\*/g, '')}</h4>)
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-lg font-bold text-white mt-7 mb-2">{line.slice(3).replace(/\*\*/g, '')}</h3>)
    } else if (line.trim() === '') {
      continue
    } else {
      elements.push(<p key={i} className="text-sm text-white/60 leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />)
    }
  }
  flushList()
  return elements
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
      if (start >= value) { setDisplay(value); clearInterval(timer) }
      else setDisplay(Math.round(start * 10) / 10)
    }, step)
    return () => clearInterval(timer)
  }, [value])
  return <span className="text-7xl font-bold tabular-nums" style={{ color }}>{display}</span>
}

// ─── Option Button ───────────────────────────────────────
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']

function OptionButton({
  label, selected, letter, onClick,
}: {
  label: string; selected: boolean; letter: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border transition-all duration-200 text-left ${
        selected
          ? 'border-[#3b82f6]/40 bg-[#3b82f6]/[0.08] shadow-[0_0_24px_rgba(59,130,246,0.08)]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.05]'
      }`}
    >
      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all duration-200 ${
        selected
          ? 'bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] text-white shadow-lg shadow-[#3b82f6]/30'
          : 'bg-white/[0.06] text-white/30 group-hover:text-white/50 group-hover:bg-white/[0.08]'
      }`}>
        {selected ? (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : letter}
      </span>
      <span className={`text-sm transition-colors ${selected ? 'text-white' : 'text-white/50 group-hover:text-white/70'}`}>
        {label}
      </span>
    </button>
  )
}

// ─── Question Renderer ───────────────────────────────────
function QuestionView({
  question, value, onChange,
}: {
  question: Question
  value: string | number
  onChange: (val: string | number) => void
}) {
  const catInfo = question.category ? categories.find(c => c.key === question.category) : null
  const isFirstInCategory = question.category
    ? assessmentQuestions.findIndex(q => q.category === question.category) === assessmentQuestions.indexOf(question)
    : false

  return (
    <div className="animate-slideIn">
      {isFirstInCategory && catInfo && (
        <div className="mb-5">
          <span className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-[#3b82f6]/10 text-[#60a5fa] border border-[#3b82f6]/20">
            {catInfo.name}
          </span>
        </div>
      )}

      <h2 className="text-xl sm:text-2xl font-bold text-white mb-1.5 leading-snug">
        {question.text}
      </h2>
      {question.subtext && (
        <p className="text-sm text-white/30 mb-6">{question.subtext}</p>
      )}
      {!question.subtext && <div className="mb-6" />}

      {question.type === 'text' && (
        <input
          type="text"
          className={inputStyle}
          value={value as string}
          onChange={e => onChange(e.target.value)}
          autoFocus
        />
      )}

      {question.type === 'textarea' && (
        <textarea
          className={`${inputStyle} min-h-[120px] resize-none`}
          value={value as string}
          onChange={e => onChange(e.target.value)}
          autoFocus
        />
      )}

      {(question.type === 'select' || question.type === 'radio') && (
        <div className="space-y-2">
          {question.options?.map((opt, i) => (
            <OptionButton
              key={String(opt.value)}
              label={opt.label}
              letter={LETTERS[i] || String(i + 1)}
              selected={value === opt.value}
              onClick={() => onChange(opt.value)}
            />
          ))}
        </div>
      )}

      {question.type === 'slider' && (
        <div className="pt-2">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-xs text-white/20 font-medium">0</span>
            <div className="text-center">
              <span className="text-4xl font-bold text-white tabular-nums">{value ?? 5}</span>
              <span className="text-lg text-white/20 ml-1">/10</span>
            </div>
            <span className="text-xs text-white/20 font-medium">10</span>
          </div>
          <div className="relative">
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={value ?? 5}
              onChange={e => onChange(parseInt(e.target.value))}
              className="slider-input w-full h-2 rounded-full cursor-pointer appearance-none bg-white/[0.06]"
              style={{
                background: `linear-gradient(to right, ${accent.from} 0%, ${accent.to} ${((value as number ?? 5) / 10) * 100}%, rgba(255,255,255,0.06) ${((value as number ?? 5) / 10) * 100}%)`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Lead Capture ────────────────────────────────────────
function LeadCapture({
  onSubmit, submitting,
}: {
  onSubmit: (info: { name: string; email: string; phone: string }) => void
  submitting: boolean
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  return (
    <div className="animate-slideIn text-center">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[#3b82f6]/20">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Your Results Are Ready</h2>
      <p className="text-white/40 mb-8 max-w-md mx-auto text-sm">
        We'll generate a personalized diagnostic report with specific recommendations — not generic advice.
      </p>

      <div className="max-w-sm mx-auto space-y-3 text-left">
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 ml-1">Name</label>
          <input type="text" className={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 ml-1">Email</label>
          <input type="email" className={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div>
          <label className="block text-xs font-medium text-white/40 mb-1.5 ml-1">Phone <span className="text-white/20">(optional)</span></label>
          <input type="tel" className={inputStyle} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(256) 555-0000" />
        </div>
        <button
          onClick={() => onSubmit({ name, email, phone })}
          disabled={!name.trim() || !email.trim() || submitting}
          className={`${btnPrimary} w-full mt-3`}
        >
          {submitting ? 'Generating Report...' : 'Get My Report'}
        </button>
      </div>
    </div>
  )
}

// ─── Score Card ──────────────────────────────────────────
function ScoreCard({ cat, weak }: { cat: CategoryScore; weak: boolean }) {
  const color = gradeColor(cat.grade)
  return (
    <div className={`${glass} p-5 ${weak ? 'ring-1 ring-[#f59e0b]/20' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
        <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
          {cat.grade}
        </span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold" style={{ color }}>{cat.score}</span>
        <span className="text-sm text-white/20 mb-1">/10</span>
      </div>
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden mb-3">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.score * 10}%`, backgroundColor: color }} />
      </div>
      <p className="text-xs text-white/30">{gradeLabel(cat.grade)}</p>
    </div>
  )
}

// ─── Results ─────────────────────────────────────────────
function Results({
  scores, businessName, aiReport, reportLoading, loadingStatus,
}: {
  scores: ReturnType<typeof calculateScores>
  businessName: string
  aiReport: string
  reportLoading: boolean
  loadingStatus: string
}) {
  const color = gradeColor(scores.overallGrade)

  return (
    <div className="min-h-[calc(100dvh-64px)] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-8 animate-slideIn">
        {/* Hero Score */}
        <div className={`${glass} p-8 sm:p-10 text-center`}>
          <p className="text-sm text-white/30 mb-4">Business Health Score for {businessName}</p>
          <div className="flex items-center justify-center gap-3 mb-4">
            <AnimatedScore value={scores.overall} color={color} />
            <span className="text-2xl text-white/15 font-light">/10</span>
          </div>
          <span className="inline-block text-sm font-bold px-5 py-2 rounded-full" style={{ backgroundColor: `${color}15`, color }}>
            {scores.overallGrade} — {gradeLabel(scores.overallGrade)}
          </span>
        </div>

        {/* Category Breakdown */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Category Breakdown</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scores.categories.map(cat => (
              <ScoreCard key={cat.key} cat={cat} weak={cat.score < 6} />
            ))}
          </div>
        </div>

        {/* AI Report */}
        <div className={`${glass} p-6 sm:p-8`}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#3b82f6]/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Your Personalized Report</h3>
              <p className="text-xs text-white/30">AI-generated analysis based on your specific answers</p>
            </div>
          </div>
          {reportLoading ? (
            <div className="flex items-center gap-3 py-12 justify-center">
              <div className="w-5 h-5 border-2 border-[#3b82f6] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-white/40">{loadingStatus || 'Analyzing your business...'}</p>
            </div>
          ) : aiReport ? (
            <div>{renderMarkdown(aiReport)}</div>
          ) : (
            <p className="text-sm text-white/30 py-4">Report unavailable — please try refreshing the page.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 no-print">
          <button
            onClick={() => window.print()}
            className={`flex-1 flex items-center justify-center gap-2 ${glass} text-white font-semibold px-6 py-3.5 hover:bg-white/[0.06] transition-all`}
          >
            <svg className="w-5 h-5 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Save Report
          </button>
          <a href="/tools/test-drive" className={`${btnPrimary} flex-1 text-center flex items-center justify-center gap-2`}>
            Try the Demo — See It In Action
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────
export default function BusinessDiagnostic() {
  const [phase, setPhase] = useState<'intro' | 'questions' | 'capture' | 'results'>('intro')
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

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (phase !== 'questions' || !currentQuestion) return

    if (e.key === 'Enter' && canProceed() && currentQuestion.type !== 'textarea') {
      handleNext()
      return
    }

    // Letter key shortcuts for options
    if (currentQuestion.type === 'radio' || currentQuestion.type === 'select') {
      const letterIndex = e.key.toUpperCase().charCodeAt(0) - 65 // A=0, B=1, etc.
      if (letterIndex >= 0 && letterIndex < (currentQuestion.options?.length || 0)) {
        const opt = currentQuestion.options![letterIndex]
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: opt.value }))
      }
    }
  }, [phase, currentQuestion, currentIndex, answers])

  async function handleLeadSubmit(info: { name: string; email: string; phone: string }) {
    setSubmitting(true)
    const result = calculateScores(answers)
    setScores(result)
    setPhase('results')
    setSubmitting(false)
    setReportLoading(true)
    setLoadingStatus('Analyzing your answers...')

    let reportText = ''
    try {
      const res = await fetch('/.netlify/functions/generate-diagnostic-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: String(answers['business-name'] || ''),
          industry: String(answers['industry'] || ''),
          teamSize: String(answers['team-size'] || ''),
          yearsInBusiness: String(answers['years'] || ''),
          biggestChallenge: String(answers['challenge'] || ''),
          scores: result,
          answerDetails: buildAnswerDetails(answers),
        }),
      })
      if (res.ok) {
        const data = await res.json()
        reportText = data.report || ''
        setAiReport(reportText)
      }
    } catch (err) { console.error('Report error:', err) }
    setReportLoading(false)

    try {
      localStorage.setItem('leadfair_audit', JSON.stringify({
        type: 'diagnostic', businessName: String(answers['business-name'] || ''),
        industry: String(answers['industry'] || ''), teamSize: String(answers['team-size'] || ''),
        yearsInBusiness: String(answers['years'] || ''), biggestChallenge: String(answers['challenge'] || ''),
        scores: result, report: reportText, completedAt: new Date().toISOString(),
      }))
    } catch {}

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
      if (reportText) formData.append('diagnostic-report', reportText)
      formData.append('_subject', `Business Diagnostic — ${answers['business-name'] || 'Unknown'} (${result.overallGrade})`)
      formData.append('_captcha', 'false')
      formData.append('_template', 'table')
      await fetch('https://formsubmit.co/ajax/hello@leadfair.ai', { method: 'POST', body: formData })
    } catch (err) { console.error('Form submission error:', err) }
  }

  // ─── Intro Screen ─────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-[calc(100dvh-64px)] flex items-center justify-center px-4">
        <div className="text-center max-w-lg animate-slideIn">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#3b82f6]/20">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">Business Diagnostic</h1>
          <p className="text-white/40 mb-6 text-base leading-relaxed max-w-md mx-auto">
            Find out where AI and automation can help your business the most. Get a personalized report with specific recommendations.
          </p>
          <div className="flex items-center justify-center gap-6 text-xs text-white/20 mb-10">
            <span>20 questions</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span>~5 minutes</span>
            <span className="w-1 h-1 rounded-full bg-white/10" />
            <span>100% free</span>
          </div>
          <button onClick={() => setPhase('questions')} className={btnPrimary}>
            Start Diagnostic
          </button>
        </div>
        <style>{styles}</style>
      </div>
    )
  }

  // ─── Results Screen ───────────────────────────────────
  if (phase === 'results' && scores) {
    return (
      <>
        <Results scores={scores} businessName={String(answers['business-name'] || 'Your Business')} aiReport={aiReport} reportLoading={reportLoading} loadingStatus={loadingStatus} />
        <style>{styles}</style>
      </>
    )
  }

  // ─── Quiz + Capture ───────────────────────────────────
  return (
    <div ref={containerRef} onKeyDown={handleKeyDown} tabIndex={0} className="min-h-[calc(100dvh-64px)] flex flex-col outline-none">

      {/* Compact top bar */}
      {phase === 'questions' && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3b82f6] to-[#06b6d4] flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white/70">Business Diagnostic</span>
          </div>
          <span className="text-xs text-white/25 tabular-nums font-medium">{currentIndex + 1} / {totalQuestions}</span>
        </div>
      )}

      {/* Progress bar */}
      {phase === 'questions' && (
        <div className="flex-shrink-0 px-6 pt-0">
          <div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${Math.round(((currentIndex + 1) / totalQuestions) * 100)}%`,
                background: `linear-gradient(90deg, ${accent.from}, ${accent.to})`,
                boxShadow: `0 0 12px ${accent.glow}`,
              }}
            />
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-xl">

          {phase === 'questions' && currentQuestion && (
            <div className="relative">
              {/* Glass card */}
              <div className={`${glass} overflow-hidden`}>
                {/* Accent top line */}
                <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent.from}, ${accent.to}, transparent)` }} />
                <div className="p-7 sm:p-9">
                  <QuestionView
                    question={currentQuestion}
                    value={answers[currentQuestion.id] ?? (currentQuestion.type === 'slider' ? 5 : '')}
                    onChange={val => setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))}
                  />
                </div>
                {/* Nav inside card */}
                <div className="flex items-center justify-between px-7 sm:px-9 py-4 border-t border-white/[0.04]">
                  <button
                    onClick={handleBack}
                    className="text-sm text-white/25 hover:text-white/50 transition-colors"
                    style={{ visibility: currentIndex > 0 ? 'visible' : 'hidden' }}
                  >
                    &larr; Back
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className={`text-sm font-semibold px-6 py-2.5 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                      canProceed()
                        ? 'bg-gradient-to-r from-[#3b82f6] to-[#06b6d4] text-white hover:shadow-lg hover:shadow-[#3b82f6]/20'
                        : 'bg-white/[0.06] text-white/30'
                    }`}
                  >
                    {currentIndex === totalQuestions - 1 ? 'See Results' : 'Continue \u2192'}
                  </button>
                </div>
              </div>

              {/* Keyboard hint */}
              {(currentQuestion.type === 'radio' || currentQuestion.type === 'select') && (
                <p className="text-center text-[11px] text-white/15 mt-4">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[10px]">A</kbd>{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[10px]">B</kbd>{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[10px]">C</kbd> to select, then{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[10px]">Enter</kbd> to continue
                </p>
              )}
              {currentQuestion.type === 'text' && (
                <p className="text-center text-[11px] text-white/15 mt-4">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-white/[0.06] text-white/30 font-mono text-[10px]">Enter ↵</kbd> to continue
                </p>
              )}
            </div>
          )}

          {phase === 'capture' && (
            <div className={`${glass} overflow-hidden`}>
              <div className="h-[2px]" style={{ background: `linear-gradient(90deg, transparent, ${accent.from}, ${accent.to}, transparent)` }} />
              <div className="p-7 sm:p-9">
                <LeadCapture onSubmit={handleLeadSubmit} submitting={submitting} />
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{styles}</style>
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────
const styles = `
  @keyframes slideIn {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-slideIn {
    animation: slideIn 0.35s ease-out;
  }
  .slider-input::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    cursor: pointer;
    border: 3px solid #0a0b10;
    box-shadow: 0 0 12px rgba(59,130,246,0.4);
  }
  .slider-input::-moz-range-thumb {
    height: 22px;
    width: 22px;
    border-radius: 50%;
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    cursor: pointer;
    border: 3px solid #0a0b10;
    box-shadow: 0 0 12px rgba(59,130,246,0.4);
  }
  @media print {
    header, footer, nav, .no-print { display: none !important; }
    body, main, section { background: white !important; color: #1a1a2e !important; }
    * { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  }
`
