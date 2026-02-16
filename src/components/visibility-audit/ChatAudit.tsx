import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Types ──────────────────────────────────────────────
type ConversationPhase = 'discovery' | 'scanning' | 'discussion' | 'pre-capture' | 'post-capture'
type MessageType = 'user' | 'assistant' | 'scan-card' | 'lead-capture' | 'final-report'

interface Message {
  id: string
  type: MessageType
  content: string
  timestamp: number
}

interface BusinessContext {
  name?: string
  url?: string
  city?: string
  industry?: string
  howGetCustomers?: string
  biggestChallenge?: string
}

// ─── Shared styles ──────────────────────────────────────
const card = 'bg-[#1a1d2e] border border-[#2a2d3e] rounded-2xl'
const btnPrimary = 'bg-gradient-to-r from-[#10b981] to-[#3b82f6] text-white font-semibold px-8 py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40'
const inputBase = 'w-full bg-[#0f1117] border border-[#2a2d3e] rounded-xl px-5 py-3.5 text-white placeholder-[#4a5568] focus:border-[#10b981] focus:ring-2 focus:ring-[#10b981]/20 outline-none transition-all text-base'

// ─── URL detection ──────────────────────────────────────
function extractUrl(text: string): string | null {
  // Match common URL patterns
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+)(?:\/[^\s]*)?/i
  const match = text.match(urlPattern)
  if (match) return match[0]
  return null
}

function isNoWebsite(text: string): boolean {
  const lower = text.toLowerCase().trim()
  return lower === 'none' || lower === 'no' || lower === "i don't have one" || lower === 'no website' || lower === "don't have one"
}

// ─── PageSpeed score color ──────────────────────────────
function psColor(score: number | null) {
  if (score === null) return '#64748b'
  if (score >= 90) return '#10b981'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

// ─── Check Item ─────────────────────────────────────────
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

// ─── Scan Results Card ──────────────────────────────────
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
    <div className={`${card} p-5 animate-fadeIn`}>
      <div className="flex items-center gap-2 mb-4">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-bold text-white">Website Scan Results</h3>
          <p className="text-xs text-[#64748b]">{analysis.url}</p>
        </div>
      </div>

      {scoreItems.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {scoreItems.map(s => (
            <div key={s.label} className="bg-[#0f1117] rounded-xl p-3 text-center">
              <div className="text-xl font-bold mb-0.5" style={{ color: psColor(s.value!) }}>{s.value}</div>
              <div className="text-xs text-[#64748b]">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-1.5">
        {ssl !== null && <CheckItem ok={ssl} label="SSL/HTTPS" detail={ssl ? 'Secure' : 'Not secure'} />}
        {html?.title && <CheckItem ok={true} label="Title" detail={html.title} />}
        {html && !html.title && <CheckItem ok={false} label="Title" detail="Missing" />}
        {html && <CheckItem ok={!!html.metaDescription} label="Meta description" detail={html.metaDescription ? 'Present' : 'Missing'} />}
        {html && <CheckItem ok={html.h1Tags.length > 0} label="H1 heading" detail={html.h1Tags.length > 0 ? html.h1Tags[0] : 'Missing'} />}
        {html && html.totalImages > 0 && <CheckItem ok={html.imgsMissingAlt === 0} label="Alt text" detail={html.imgsMissingAlt === 0 ? 'All good' : `${html.imgsMissingAlt}/${html.totalImages} missing`} />}
        {html && <CheckItem ok={html.hasStructuredData} label="Structured data" detail={html.hasStructuredData ? 'Found' : 'Missing'} />}
        {html && <CheckItem ok={html.hasOpenGraph} label="Open Graph" detail={html.hasOpenGraph ? 'Present' : 'Missing'} />}
        {crawl && <CheckItem ok={crawl.hasRobotsTxt} label="robots.txt" detail={crawl.hasRobotsTxt ? 'Found' : 'Missing'} />}
        {crawl && <CheckItem ok={crawl.hasSitemap} label="sitemap.xml" detail={crawl.hasSitemap ? 'Found' : 'Missing'} />}
      </div>
    </div>
  )
}

// ─── Lead Capture Card ──────────────────────────────────
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

// ─── Simple markdown renderer ───────────────────────────
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

// ─── Typing Indicator ───────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <span className="w-2 h-2 rounded-full bg-[#64748b] animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#64748b] animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-2 h-2 rounded-full bg-[#64748b] animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────
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

  if (message.type === 'assistant') {
    return (
      <div className="flex justify-start animate-fadeIn">
        <div className={`max-w-[85%] ${card} text-[#e2e8f0] rounded-2xl rounded-bl-sm px-4 py-3`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    )
  }

  return null
}

// ─── Scan Status Bar ────────────────────────────────────
function ScanStatusBar() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#8b5cf6]/10 border border-[#8b5cf6]/20 animate-fadeIn">
      <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs text-[#8b5cf6]">Scanning your website...</span>
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────
export default function ChatAudit() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [businessContext, setBusinessContext] = useState<BusinessContext>({})
  const [scanResults, setScanResults] = useState<any>(null)
  const [scanLoading, setScanLoading] = useState(false)
  const [conversationPhase, setConversationPhase] = useState<ConversationPhase>('discovery')
  const [leadCaptured, setLeadCaptured] = useState(false)
  const [leadSubmitting, setLeadSubmitting] = useState(false)
  const [showLeadCapture, setShowLeadCapture] = useState(false)
  const [showFinalReport, setShowFinalReport] = useState(false)
  const [finalReport, setFinalReport] = useState('')

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userMessageCountRef = useRef(0)
  const scanTriggeredRef = useRef(false)
  const scanResultsRef = useRef<any>(null)

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, showLeadCapture, showFinalReport, scanLoading, scrollToBottom])

  // Initial greeting
  useEffect(() => {
    const greeting: Message = {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: "Hi! I help local businesses figure out how visible they are online — on Google, in AI search results, and in your local area. What's your business name?",
      timestamp: Date.now(),
    }
    setMessages([greeting])
  }, [])

  // Update context from user messages
  function updateContext(userText: string, currentContext: BusinessContext, messageCount: number): BusinessContext {
    const updated = { ...currentContext }

    // Message 1: business name
    if (messageCount === 1 && !updated.name) {
      updated.name = userText.trim()
    }
    // Message 2: website URL
    else if (messageCount === 2 && !updated.url) {
      if (isNoWebsite(userText)) {
        updated.url = 'none'
      } else {
        const url = extractUrl(userText)
        if (url) updated.url = url
        else updated.url = userText.trim() // let them type whatever, AI will handle it
      }
    }
    // Message 3: city
    else if (messageCount === 3 && !updated.city) {
      updated.city = userText.trim()
    }
    // Message 4: industry
    else if (messageCount === 4 && !updated.industry) {
      updated.industry = userText.trim()
    }
    // Message 5+: strategic questions
    else if (messageCount >= 5) {
      if (!updated.howGetCustomers) {
        updated.howGetCustomers = userText.trim()
      } else if (!updated.biggestChallenge) {
        updated.biggestChallenge = userText.trim()
      }
    }

    return updated
  }

  // Determine conversation phase
  function getPhase(ctx: BusinessContext, hasScan: boolean, scanInProgress: boolean, msgCount: number): ConversationPhase {
    if (leadCaptured) return 'post-capture'

    // If we have enough info + scan is done (or no website), and enough exchanges, show lead capture
    const hasBasics = ctx.name && ctx.url && ctx.city && ctx.industry
    const hasStrategic = ctx.howGetCustomers || ctx.biggestChallenge
    if (hasBasics && (hasScan || ctx.url === 'none') && hasStrategic && msgCount >= 5) {
      return 'pre-capture'
    }

    // Scan is done, discuss findings
    if (hasScan && hasBasics) return 'discussion'

    // Scan is running
    if (scanInProgress) return 'scanning'

    return 'discovery'
  }

  // Trigger website scan
  async function triggerScan(url: string) {
    if (scanTriggeredRef.current) return
    scanTriggeredRef.current = true
    setScanLoading(true)

    try {
      const res = await fetch('/.netlify/functions/analyze-website', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      if (res.ok) {
        const data = await res.json()
        setScanResults(data)
        scanResultsRef.current = data
      }
    } catch (err) {
      console.error('Scan error:', err)
    }
    setScanLoading(false)
  }

  // Send message to chat-audit function and stream response
  async function sendToAI(allMessages: Message[], ctx: BusinessContext, phase: ConversationPhase, scan: any) {
    setIsStreaming(true)

    const assistantMsg: Message = {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: '',
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, assistantMsg])

    try {
      const apiMessages = allMessages
        .filter(m => m.type === 'user' || m.type === 'assistant')
        .map(m => ({ role: m.type as 'user' | 'assistant', content: m.content }))

      const res = await fetch('/.netlify/functions/chat-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          scanResults: scan,
          businessContext: ctx,
          conversationPhase: phase,
        }),
      })

      if (!res.ok || !res.body) {
        throw new Error('Chat request failed')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                accumulated += parsed.text
                const finalText = accumulated
                setMessages(prev =>
                  prev.map(m => m.id === assistantMsg.id ? { ...m, content: finalText } : m)
                )
              }
            } catch { /* skip unparseable chunks */ }
          }
        }
      }
    } catch (err) {
      console.error('Chat error:', err)
      setMessages(prev =>
        prev.map(m => m.id === assistantMsg.id
          ? { ...m, content: "Sorry, I'm having trouble connecting right now. Could you try again?" }
          : m
        )
      )
    }

    setIsStreaming(false)
  }

  // Handle user sending a message
  async function handleSend() {
    const text = inputValue.trim()
    if (!text || isStreaming) return

    setInputValue('')
    userMessageCountRef.current += 1
    const msgCount = userMessageCountRef.current

    const userMsg: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: text,
      timestamp: Date.now(),
    }

    const updatedMessages = [...messages, userMsg]
    setMessages(updatedMessages)

    // Update business context
    const updatedContext = updateContext(text, businessContext, msgCount)
    setBusinessContext(updatedContext)

    // Trigger scan when URL is provided (message 2)
    if (msgCount === 2 && updatedContext.url && updatedContext.url !== 'none') {
      triggerScan(updatedContext.url)
    }

    // Determine phase
    const hasScan = !!(scanResultsRef.current)
    const phase = getPhase(updatedContext, hasScan, scanLoading, msgCount)
    setConversationPhase(phase)

    // Send to AI
    await sendToAI(updatedMessages, updatedContext, phase, scanResultsRef.current)

    // After AI responds, check if we should show lead capture
    const postPhase = getPhase(updatedContext, !!(scanResultsRef.current), false, msgCount)
    if (postPhase === 'pre-capture' && !showLeadCapture && !leadCaptured) {
      // Small delay so the AI message is visible first
      setTimeout(() => setShowLeadCapture(true), 800)
    }

    inputRef.current?.focus()
  }

  // Handle lead capture submission
  async function handleLeadSubmit(info: { name: string; email: string; phone: string }) {
    setLeadSubmitting(true)

    // Submit to FormSubmit
    try {
      const formData = new FormData()
      formData.append('name', info.name)
      formData.append('email', info.email)
      formData.append('phone', info.phone)
      formData.append('business-name', businessContext.name || '')
      formData.append('website-url', businessContext.url || '')
      formData.append('city', businessContext.city || '')
      formData.append('industry', businessContext.industry || '')
      formData.append('how-get-customers', businessContext.howGetCustomers || '')
      formData.append('biggest-challenge', businessContext.biggestChallenge || '')
      formData.append('_subject', 'New Visibility Audit (Chat) — ' + (businessContext.name || 'Unknown'))
      formData.append('_captcha', 'false')
      formData.append('_template', 'table')

      await fetch('https://formsubmit.co/ajax/hello@leadfair.ai', {
        method: 'POST',
        body: formData,
      })
    } catch (err) {
      console.error('Form submission error:', err)
    }

    setLeadCaptured(true)
    setShowLeadCapture(false)
    setLeadSubmitting(false)

    // Now generate the final report
    setShowFinalReport(true)
    setConversationPhase('post-capture')

    // Send one final request for the comprehensive report
    const reportMessages = [
      ...messages.filter(m => m.type === 'user' || m.type === 'assistant'),
      {
        id: crypto.randomUUID(),
        type: 'user' as MessageType,
        content: 'Please generate my full visibility report now.',
        timestamp: Date.now(),
      },
    ]

    setIsStreaming(true)

    try {
      const apiMessages = reportMessages
        .filter(m => m.type === 'user' || m.type === 'assistant')
        .map(m => ({ role: m.type as 'user' | 'assistant', content: m.content }))

      const res = await fetch('/.netlify/functions/chat-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          scanResults: scanResultsRef.current,
          businessContext,
          conversationPhase: 'post-capture',
        }),
      })

      if (!res.ok || !res.body) throw new Error('Report request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                accumulated += parsed.text
                setFinalReport(accumulated)
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      console.error('Report error:', err)
      setFinalReport('Sorry, there was an issue generating your report. Please try refreshing the page.')
    }

    setIsStreaming(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center py-8 px-4">
      {/* Header */}
      <div className="w-full max-w-2xl text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-1">Visibility Audit</h1>
        <p className="text-xs font-medium text-[#64748b]">by <span className="text-[#10b981]">LeadFair</span></p>
      </div>

      {/* Chat Container */}
      <div className="w-full max-w-2xl flex flex-col flex-1">
        <div className="flex-1 space-y-4 mb-4 min-h-[300px]">
          {/* Messages */}
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* Scanning indicator */}
          {scanLoading && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <ScanStatusBar />
              </div>
            </div>
          )}

          {/* Scan results card (appears after scan completes, before lead capture) */}
          {scanResults && scanResults.status !== 'skipped' && scanResults.status !== 'error' && !showFinalReport && (
            <div className="flex justify-start">
              <div className="max-w-[85%]">
                <ScanResultsCard analysis={scanResults} />
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isStreaming && !showFinalReport && (
            <div className="flex justify-start">
              <div className={`${card} rounded-2xl rounded-bl-sm`}>
                <TypingIndicator />
              </div>
            </div>
          )}

          {/* Lead capture card */}
          {showLeadCapture && !leadCaptured && (
            <div className="flex justify-start">
              <div className="max-w-[85%] w-full">
                <LeadCaptureCard onSubmit={handleLeadSubmit} submitting={leadSubmitting} />
              </div>
            </div>
          )}

          {/* Final report */}
          {showFinalReport && (
            <div className="animate-fadeIn">
              <div className={`${card} p-6 sm:p-8 mb-4`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#10b981] to-[#3b82f6] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-white">Your Visibility Report</h3>
                </div>
                {finalReport ? (
                  <div>{renderMarkdown(finalReport)}</div>
                ) : (
                  <div className="flex items-center gap-3 py-8 justify-center">
                    <div className="w-5 h-5 border-2 border-[#10b981] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[#94a3b8]">Writing your personalized report...</p>
                  </div>
                )}
              </div>

              {/* Scan results in final report section too */}
              {scanResults && scanResults.status !== 'skipped' && scanResults.status !== 'error' && (
                <div className="mb-4">
                  <ScanResultsCard analysis={scanResults} />
                </div>
              )}

              {/* CTA */}
              <div className={`${card} p-8 text-center`}>
                <h3 className="text-xl font-bold text-white mb-3">Want Us to Fix This?</h3>
                <p className="text-[#94a3b8] mb-6 max-w-md mx-auto">
                  Book a free visibility consultation and we'll walk through your report together — with a clear plan to get your business found by more customers.
                </p>
                <a href="/contact" className={btnPrimary}>
                  Book a Free Visibility Consultation
                </a>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area (hidden after lead capture) */}
        {!showLeadCapture && !leadCaptured && (
          <div className="sticky bottom-0 pt-2 pb-4 bg-gradient-to-t from-[#0b0d14] via-[#0b0d14] to-transparent">
            <div className="flex gap-2">
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
