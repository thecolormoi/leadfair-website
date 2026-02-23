import { useState, useRef, useEffect } from 'react'
import { assessmentQuestions, categories, calculateScores, type Question } from './data'

// ─── Types ──────────────────────────────────────────────
type Phase = 'discovery' | 'quiz' | 'lead-capture' | 'report'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
}

interface BusinessContext {
  name?: string
  url?: string
  city?: string
  industry?: string
}

// ─── Shared styles ──────────────────────────────────────
const card = 'bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl'
const btnPrimary = 'bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40'
const inputBase = 'w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-5 py-3.5 text-white placeholder-[#4a5568] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all text-base'

// ─── Helpers ────────────────────────────────────────────
function extractUrl(text: string): string | null {
  const match = text.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)(?:\/[^\s]*)?/i)
  return match ? match[0] : null
}

function isNoWebsite(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return ['none', 'no', "i don't have one", 'no website', "don't have one", 'n/a', 'na'].includes(lower)
}

function psColor(score: number | null) {
  if (score === null) return '#64748b'
  if (score >= 90) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

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

// ─── Sub-components ─────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  if (message.type === 'user') {
    return (
      <div className="flex justify-end animate-fadeIn">
        <div className="max-w-[80%] bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white rounded-2xl rounded-br-sm px-4 py-3">
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex justify-start animate-fadeIn">
      <div className={`max-w-[85%] ${card} text-[#e2e8f0] rounded-2xl rounded-bl-sm px-4 py-3`}>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className={`${card} rounded-2xl rounded-bl-sm`}>
        <div className="flex items-center gap-1 px-4 py-3">
          <span className="w-2 h-2 rounded-full bg-[#64748b] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#64748b] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[#64748b] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

function ScanStatusBar() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 animate-fadeIn">
      <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-[#8b5cf6]">Scanning your website...</span>
    </div>
  )
}

function CheckItem({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${ok ? 'bg-[#10b981]/20 text-[#10b981]' : 'bg-[#ef4444]/20 text-[#ef4444]'}`}>
        {ok ? (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        ) : (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        )}
      </span>
      <span className="text-[#94a3b8] font-medium">{label}</span>
      <span className="text-[#64748b] truncate">{detail}</span>
    </div>
  )
}

function ScanResultsCard({ analysis }: { analysis: any }) {
  if (!analysis || analysis.status === 'skipped' || analysis.status === 'error') return null

  const ps = analysis.pageSpeed
  const html = analysis.html
  const ssl = analysis.sslValid
  const crawl = analysis.crawlability

  const scoreItems = [
    { label: 'Performance', value: ps?.performance },
    { label: 'SEO', value: ps?.seo },
    { label: 'Accessibility', value: ps?.accessibility },
  ].filter(s => s.value !== null && s.value !== undefined)

  return (
    <div className={`${card} p-5 sm:p-6 animate-fadeIn`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Website Scan Results</h3>
          <p className="text-xs text-[#64748b]">{analysis.url}</p>
        </div>
      </div>

      {scoreItems.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {scoreItems.map(s => (
            <div key={s.label} className="bg-[#0f1117] rounded-xl p-3 text-center">
              <div className="text-2xl font-bold mb-0.5" style={{ color: psColor(s.value!) }}>{s.value}</div>
              <div className="text-xs text-[#64748b]">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {ssl !== null && <CheckItem ok={ssl} label="SSL/HTTPS" detail={ssl ? 'Secure connection' : 'Not secure'} />}
        {html?.title && <CheckItem ok={true} label="Page title" detail={html.title} />}
        {html && !html.title && <CheckItem ok={false} label="Page title" detail="Missing" />}
        {html && <CheckItem ok={!!html.metaDescription} label="Meta description" detail={html.metaDescription ? 'Present' : 'Missing'} />}
        {html && <CheckItem ok={html.h1Tags.length > 0} label="H1 heading" detail={html.h1Tags.length > 0 ? html.h1Tags[0] : 'Missing'} />}
        {html && html.totalImages > 0 && <CheckItem ok={html.imgsMissingAlt === 0} label="Image alt text" detail={html.imgsMissingAlt === 0 ? 'All images have alt text' : `${html.imgsMissingAlt} of ${html.totalImages} missing`} />}
        {html && <CheckItem ok={html.hasStructuredData} label="Structured data" detail={html.hasStructuredData ? 'Found' : 'Missing'} />}
        {html && <CheckItem ok={html.hasOpenGraph} label="Open Graph tags" detail={html.hasOpenGraph ? 'Present' : 'Missing'} />}
        {crawl && <CheckItem ok={crawl.hasRobotsTxt} label="robots.txt" detail={crawl.hasRobotsTxt ? 'Found' : 'Missing'} />}
        {crawl && <CheckItem ok={crawl.hasSitemap} label="sitemap.xml" detail={crawl.hasSitemap ? 'Found' : 'Missing'} />}
      </div>
    </div>
  )
}

function LeadCaptureCard({ onSubmit, submitting }: {
  onSubmit: (info: { name: string; email: string; phone: string }) => void
  submitting: boolean
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  return (
    <div className={`${card} p-5 animate-fadeIn`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Get Your Full Report</h3>
          <p className="text-xs text-[#64748b]">We'll generate a detailed visibility report with specific recommendations.</p>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[#94a3b8] mb-1">Name</label>
          <input type="text" className={inputBase} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#94a3b8] mb-1">Email</label>
          <input type="email" className={inputBase} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#94a3b8] mb-1">Phone <span className="text-[#4a5568]">(optional)</span></label>
          <input type="tel" className={inputBase} value={phone} onChange={e => setPhone(e.target.value)} placeholder="(256) 555-0000" />
        </div>
        <button
          onClick={() => onSubmit({ name, email, phone })}
          disabled={!name.trim() || !email.trim() || submitting}
          className={`${btnPrimary} w-full mt-1`}
        >
          {submitting ? 'Generating Report...' : 'Get My Report'}
        </button>
      </div>
    </div>
  )
}

// ─── Quiz Question Card ─────────────────────────────────

function QuizQuestionCard({ question, selectedValue, onSelect, active }: {
  question: Question
  selectedValue: number | undefined
  onSelect: (val: number) => void
  active: boolean
}) {
  const catInfo = question.category ? categories.find(c => c.key === question.category) : null
  const accentColor = catInfo?.color || '#10b981'

  // Compact answered state
  if (!active && selectedValue !== undefined) {
    const label = question.options?.find(o => o.value === selectedValue)?.label || ''
    return (
      <div className="bg-[#1a1d2e]/50 border border-[#2a2d3e]/50 rounded-xl px-4 py-2.5">
        <p className="text-xs text-[#64748b]">{question.text}</p>
        <p className="text-xs mt-0.5" style={{ color: accentColor }}>
          <span className="mr-1">&#10003;</span>{label}
        </p>
      </div>
    )
  }

  // Not yet reached
  if (!active) return null

  // Active question with selectable options
  return (
    <div className={`${card} p-5 animate-fadeIn`}>
      <p className="text-sm font-medium text-white mb-1">{question.text}</p>
      {question.subtext && <p className="text-xs text-[#64748b] mb-3">{question.subtext}</p>}
      <div className="space-y-2 mt-3">
        {question.options?.map(opt => (
          <button
            key={String(opt.value)}
            onClick={() => onSelect(opt.value as number)}
            className="w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-all border-[#2a2d3e] bg-[#0f1117] text-[#94a3b8] hover:border-[#10b981]/50 hover:text-white"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
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

    if (listMatch) { listItems.push(listMatch[1]); continue }
    if (numListMatch) { listItems.push(numListMatch[1]); continue }

    flushList()

    if (line.startsWith('### ')) {
      elements.push(<h4 key={i} className="text-base font-bold text-white mt-5 mb-2">{line.slice(4).replace(/\*\*/g, '')}</h4>)
    } else if (line.startsWith('## ')) {
      elements.push(<h3 key={i} className="text-lg font-bold text-white mt-5 mb-2">{line.slice(3).replace(/\*\*/g, '')}</h3>)
    } else if (line.trim() === '') {
      continue
    } else {
      elements.push(<p key={i} className="text-sm text-[#94a3b8] leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: inlineMd(line) }} />)
    }
  }
  flushList()
  return elements
}

// ─── Main Component ─────────────────────────────────────

export default function ChatAudit() {
  // Phase
  const [phase, setPhase] = useState<Phase>('discovery')

  // Discovery
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [businessContext, setBusinessContext] = useState<BusinessContext>({})
  const userMsgCountRef = useRef(0)

  // Quiz
  const [quizIndex, setQuizIndex] = useState(0)
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})

  // Scan — store the promise so we can await it later
  const [scanResults, setScanResults] = useState<any>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const scanTriggeredRef = useRef(false)
  const scanPromiseRef = useRef<Promise<any> | null>(null)

  // Lead + Report
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [leadInfo, setLeadInfo] = useState<{ name: string; email: string; phone: string } | null>(null)
  const [aiReport, setAiReport] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState('')
  const [scores, setScores] = useState<ReturnType<typeof calculateScores> | null>(null)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasInteracted = useRef(false)

  // Auto-scroll within the chat container (not the page) — skip initial mount
  useEffect(() => {
    if (!hasInteracted.current) return
    scrollContainerRef.current?.scrollTo({
      top: scrollContainerRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages, phase, quizIndex, scanResults, scanLoading])

  // Initial greeting
  useEffect(() => {
    setMessages([{
      id: crypto.randomUUID(),
      type: 'assistant',
      content: "Hi! I help local businesses figure out how visible they are online — on Google, in AI search results, and in your local area. What's your business name?",
    }])
  }, [])

  // Context extraction by message position
  function updateContext(text: string, ctx: BusinessContext, msgCount: number): BusinessContext {
    const updated = { ...ctx }
    if (msgCount === 1) updated.name = text.trim()
    else if (msgCount === 2) {
      updated.url = isNoWebsite(text) ? 'none' : (extractUrl(text) || text.trim())
    }
    else if (msgCount === 3) updated.city = text.trim()
    else if (msgCount === 4) updated.industry = text.trim()
    return updated
  }

  // Trigger website scan — returns a promise we can await
  function triggerScan(url: string) {
    if (scanTriggeredRef.current) return
    scanTriggeredRef.current = true
    setScanLoading(true)

    const promise = (async () => {
      try {
        const res = await fetch('/.netlify/functions/analyze-website', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        })
        if (res.ok) {
          const data = await res.json()
          setScanResults(data)
          return data
        }
      } catch (err) {
        console.error('Scan error:', err)
      }
      setScanLoading(false)
      return null
    })()

    promise.then(() => setScanLoading(false))
    scanPromiseRef.current = promise
  }

  // Stream AI response (discovery only)
  async function sendToAI(allMessages: Message[], ctx: BusinessContext) {
    setIsStreaming(true)
    const assistantMsg: Message = { id: crypto.randomUUID(), type: 'assistant', content: '' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const apiMessages = allMessages
        .filter(m => m.type === 'user' || m.type === 'assistant')
        .map(m => ({ role: m.type, content: m.content }))

      const res = await fetch('/.netlify/functions/chat-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          businessContext: ctx,
          conversationPhase: 'discovery',
        }),
      })

      if (!res.ok || !res.body) throw new Error('Chat failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        for (const line of chunk.split('\n')) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                accumulated += parsed.text
                const finalText = accumulated
                setMessages(prev => prev.map(m => m.id === assistantMsg.id ? { ...m, content: finalText } : m))
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev => prev.map(m =>
        m.id === assistantMsg.id ? { ...m, content: "Sorry, I'm having trouble connecting. Could you try again?" } : m
      ))
    }

    setIsStreaming(false)
  }

  // Handle user message during discovery
  async function handleSend() {
    const text = inputValue.trim()
    if (!text || isStreaming) return

    setInputValue('')
    hasInteracted.current = true
    userMsgCountRef.current += 1
    const msgCount = userMsgCountRef.current

    const userMsg: Message = { id: crypto.randomUUID(), type: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)

    const ctx = updateContext(text, businessContext, msgCount)
    setBusinessContext(ctx)

    // Trigger scan when URL is provided (message 2)
    if (msgCount === 2 && ctx.url && ctx.url !== 'none') {
      triggerScan(ctx.url)
    }

    // After 4th user message, transition to quiz
    if (msgCount >= 4) {
      setIsStreaming(true)
      setTimeout(() => {
        const hasWebsite = ctx.url && ctx.url !== 'none'
        const transitionContent = hasWebsite
          ? `Got it! I'm scanning ${ctx.name || 'your'} website now. While that runs, I've got some quick questions about your online presence that'll help me build a thorough visibility report. Just tap the answer that fits best — should only take a couple minutes.`
          : `Got it! Not having a website is actually important to know — that'll be a key part of our recommendations. I've got some quick questions about your online presence that'll help me build a thorough report for ${ctx.name || 'your business'}. Just tap the answer that fits best.`

        setMessages(prev => [...prev, { id: crypto.randomUUID(), type: 'assistant', content: transitionContent }])
        setIsStreaming(false)
        setPhase('quiz')
      }, 800)
      return
    }

    // Normal discovery chat
    await sendToAI(updated, ctx)
    inputRef.current?.focus()
  }

  // Handle quiz answer selection
  function handleQuizAnswer(questionId: string, value: number) {
    hasInteracted.current = true
    setQuizAnswers(prev => ({ ...prev, [questionId]: value }))

    setTimeout(() => {
      if (quizIndex < assessmentQuestions.length - 1) {
        setQuizIndex(prev => prev + 1)
      } else {
        setPhase('lead-capture')
      }
    }, 400)
  }

  // Handle lead capture → wait for scan → generate report → submit form with report
  async function handleLeadSubmit(info: { name: string; email: string; phone: string }) {
    setLeadSubmitting(true)
    setLeadInfo(info)

    // Calculate scores
    const result = calculateScores(quizAnswers as Record<string, string | number>)
    setScores(result)

    // Switch to report view immediately
    setPhase('report')
    setLeadSubmitting(false)
    setReportLoading(true)

    // Step 1: Wait for website scan to finish (if one was triggered)
    let websiteAnalysis: any = { status: 'skipped' }
    if (scanTriggeredRef.current) {
      setLoadingStatus('Finishing website scan...')
      // Try awaiting the promise first
      if (scanPromiseRef.current) {
        const scanData = await scanPromiseRef.current
        if (scanData) websiteAnalysis = scanData
      }
      // Fall back to state if promise returned null but state has data
      if (websiteAnalysis.status === 'skipped' && scanResults) {
        websiteAnalysis = scanResults
      }
    }

    // Step 2: Generate AI report
    setLoadingStatus('Writing your personalized report...')
    let reportText = ''
    try {
      const res = await fetch('/.netlify/functions/generate-visibility-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessContext.name || '',
          city: businessContext.city || '',
          industry: businessContext.industry || '',
          websiteUrl: businessContext.url || '',
          scores: result,
          weakQuestions: result.weakQuestions,
          websiteAnalysis,
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

    // Step 3: Submit to FormSubmit with everything — CC the customer
    try {
      const formData = new FormData()
      formData.append('name', info.name)
      formData.append('email', info.email)
      formData.append('phone', info.phone)
      formData.append('business-name', businessContext.name || '')
      formData.append('website-url', businessContext.url || '')
      formData.append('city', businessContext.city || '')
      formData.append('industry', businessContext.industry || '')
      formData.append('overall-score', String(result.overall))
      formData.append('overall-grade', result.overallGrade)
      result.categories.forEach(cat => {
        formData.append(`score-${cat.key}`, String(cat.score))
        formData.append(`grade-${cat.key}`, cat.grade)
      })
      formData.append('weak-areas', result.weakQuestions.map(w => w.id).join(', '))
      if (reportText) {
        formData.append('visibility-report', reportText)
      }
      formData.append('_subject', `Visibility Audit — ${businessContext.name || 'Unknown'} (${result.overallGrade})`)
      formData.append('_captcha', 'false')
      formData.append('_template', 'table')

      await fetch('https://formsubmit.co/ajax/hello@leadfair.ai', {
        method: 'POST',
        body: formData,
      })
    } catch (err) {
      console.error('Form submission error:', err)
    }

    // Store for test drive demo
    try {
      localStorage.setItem('leadfair_audit', JSON.stringify({
        type: 'visibility',
        businessName: businessContext.name || '',
        industry: businessContext.industry || '',
        city: businessContext.city || '',
        websiteUrl: businessContext.url || '',
        scores: result,
        report: reportText,
        completedAt: new Date().toISOString(),
      }))
    } catch { /* localStorage not available */ }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── Quiz Rendering ─────────────────────────────────────

  function renderQuizSection() {
    const items: React.ReactNode[] = []
    let lastCat = ''

    for (let i = 0; i <= quizIndex; i++) {
      const q = assessmentQuestions[i]

      if (q.category && q.category !== lastCat) {
        lastCat = q.category
        const cat = categories.find(c => c.key === q.category)
        if (cat) {
          const catIdx = categories.indexOf(cat)
          items.push(
            <div key={`cat-${q.category}`} className="flex justify-start animate-fadeIn">
              <div className={`max-w-[85%] ${card} rounded-2xl rounded-bl-sm px-4 py-3`}>
                <p className="text-sm text-[#e2e8f0] leading-relaxed">
                  {catIdx === 0 ? "Let's start with " : catIdx === categories.length - 1 ? 'Last section — ' : 'Next up: '}
                  <span className="font-semibold" style={{ color: cat.color }}>{cat.name}</span>
                  {' — '}{cat.description.charAt(0).toLowerCase() + cat.description.slice(1)}
                </p>
              </div>
            </div>
          )
        }
      }

      items.push(
        <QuizQuestionCard
          key={q.id}
          question={q}
          selectedValue={quizAnswers[q.id]}
          onSelect={(val) => handleQuizAnswer(q.id, val)}
          active={i === quizIndex && quizAnswers[q.id] === undefined}
        />
      )
    }

    return items
  }

  const answeredCount = Object.keys(quizAnswers).length
  const quizPct = Math.round((answeredCount / assessmentQuestions.length) * 100)

  // ─── Render ─────────────────────────────────────────────

  // Report phase: clean view — hide chat/quiz clutter
  if (phase === 'report' && scores) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center py-12 px-4">
        {/* Header */}
        <div className="w-full max-w-2xl text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">Visibility Audit</h1>
          <p className="text-xs font-medium text-[#64748b] mb-2">by <span className="text-[#10b981]">LeadFair</span></p>
        </div>

        <div className="w-full max-w-2xl space-y-6">
          {/* Overall Score — Hero */}
          <div className={`${card} p-8 sm:p-10 text-center`}>
            <p className="text-sm text-[#64748b] mb-4">Visibility Score for {businessContext.name || 'Your Business'}</p>
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="text-7xl font-bold" style={{ color: gradeColor(scores.overallGrade) }}>{scores.overall}</span>
              <span className="text-2xl text-[#4a5568] font-light">/10</span>
            </div>
            <span
              className="inline-block text-sm font-bold px-5 py-2 rounded-full"
              style={{ backgroundColor: `${gradeColor(scores.overallGrade)}20`, color: gradeColor(scores.overallGrade) }}
            >
              {scores.overallGrade} — {gradeLabel(scores.overallGrade)}
            </span>
          </div>

          {/* Category Breakdown */}
          <h3 className="text-lg font-bold text-white mb-3">Category Breakdown</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {scores.categories.map(cat => {
              const gColor = gradeColor(cat.grade)
              return (
                <div key={cat.key} className={`${card} p-5`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${gColor}20`, color: gColor }}>
                      {cat.grade}
                    </span>
                  </div>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-3xl font-bold" style={{ color: cat.color }}>{cat.score}</span>
                    <span className="text-sm text-[#64748b] mb-1">/10</span>
                  </div>
                  <div className="h-1.5 bg-[#0f1117] rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${cat.score * 10}%`, backgroundColor: cat.color }} />
                  </div>
                  <p className="text-xs text-[#64748b]">{gradeLabel(cat.grade)}</p>
                </div>
              )
            })}
          </div>

          {/* Website Scan Results */}
          {scanResults && scanResults.status !== 'skipped' && scanResults.status !== 'error' && (
            <ScanResultsCard analysis={scanResults} />
          )}

          {/* AI Report */}
          <div className={`${card} p-6 sm:p-8`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Your Personalized Report</h3>
                <p className="text-xs text-[#64748b]">AI-generated analysis based on your answers and website scan</p>
              </div>
            </div>
            {reportLoading ? (
              <div className="flex items-center gap-3 py-8 justify-center">
                <div className="w-5 h-5 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#94a3b8]">{loadingStatus || 'Generating your report...'}</p>
              </div>
            ) : aiReport ? (
              <div>{renderMarkdown(aiReport)}</div>
            ) : (
              <p className="text-sm text-[#64748b]">Report unavailable — please try refreshing the page.</p>
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

        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.3s ease-out;
          }
          @media print {
            /* Hide site chrome */
            header, footer, nav, .no-print { display: none !important; }
            /* White background for print */
            body, main, section { background: white !important; color: #1a1a2e !important; }
            * { color-adjust: exact !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            /* Report container */
            .min-h-\\[70vh\\] { min-height: auto !important; padding: 0 !important; }
            /* Cards */
            .bg-\\[\\#1a1d2e\\] { background: #f8f9fa !important; border-color: #e2e8f0 !important; }
            .bg-\\[\\#0f1117\\] { background: #f1f5f9 !important; }
            /* Text colors for print */
            .text-white { color: #1a1a2e !important; }
            .text-\\[\\#e2e8f0\\] { color: #334155 !important; }
            .text-\\[\\#94a3b8\\] { color: #475569 !important; }
            .text-\\[\\#64748b\\] { color: #64748b !important; }
            .text-\\[\\#4a5568\\] { color: #64748b !important; }
          }
        `}</style>
      </div>
    )
  }

  // Non-report phases: discovery, quiz, lead-capture
  // Contained chat window that fills the viewport below the site nav
  return (
    <div className="flex flex-col" style={{ height: 'calc(100dvh - 64px)' }}>
      {/* Compact header — always visible */}
      <div className="flex-shrink-0 text-center pt-5 pb-3 px-4">
        <div className="flex items-center justify-center gap-2.5 mb-1.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-white">Visibility Audit</h1>
          <span className="text-xs text-[#64748b]">by <span className="text-[#10b981]">LeadFair</span></span>
        </div>
        <p className="text-xs text-[#4a5568]">See how visible your business is on Google, AI search, and in your local area</p>
      </div>

      {/* Quiz progress bar — pinned below header during quiz */}
      {phase === 'quiz' && (
        <div className="flex-shrink-0 px-4 sm:px-6 max-w-2xl w-full mx-auto pb-2">
          <div className="flex justify-between text-xs text-[#64748b] mb-1">
            <span>Question {Math.min(quizIndex + 1, assessmentQuestions.length)} of {assessmentQuestions.length}</span>
            <span>{quizPct}%</span>
          </div>
          <div className="h-1.5 bg-[#1a1d2e] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#10b981] to-[#3b82f6] transition-all duration-500"
              style={{ width: `${quizPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Scrollable chat area */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto space-y-3 py-3">

          {/* Discovery chat messages */}
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Typing indicator (discovery) */}
          {isStreaming && phase === 'discovery' && <TypingIndicator />}

          {/* Quiz + Scan section */}
          {phase !== 'discovery' && (
            <>
              {/* Scan status / results */}
              {scanLoading && <ScanStatusBar />}
              {scanResults && !scanLoading && scanResults.status !== 'skipped' && scanResults.status !== 'error' && (
                <ScanResultsCard analysis={scanResults} />
              )}

              {/* Quiz questions */}
              {(phase === 'quiz' || phase === 'lead-capture') && (
                <div className="space-y-2">
                  {renderQuizSection()}
                </div>
              )}
            </>
          )}

          {/* Lead capture */}
          {phase === 'lead-capture' && (
            <>
              <div className="flex justify-start animate-fadeIn">
                <div className={`max-w-[85%] ${card} rounded-2xl rounded-bl-sm px-4 py-3`}>
                  <p className="text-sm text-[#e2e8f0] leading-relaxed">
                    Great, that's everything I need! Let me put together a detailed visibility report for {businessContext.name || 'your business'} with specific recommendations. Just drop your info below and I'll generate it.
                  </p>
                </div>
              </div>
              <LeadCaptureCard onSubmit={handleLeadSubmit} submitting={leadSubmitting} />
            </>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input bar — pinned at bottom (discovery only) */}
      {phase === 'discovery' && (
        <div className="flex-shrink-0 border-t border-[#1a1d2e] px-4 sm:px-6 py-3">
          <div className="max-w-2xl mx-auto flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className={inputBase}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isStreaming}
              className="bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white p-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

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
