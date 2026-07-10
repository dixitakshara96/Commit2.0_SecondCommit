import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mail, Loader, Copy, Edit3, RefreshCw, CheckCheck, Sparkles, Clock } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { resolveAnalysisId } from '@/lib/analysis'
import type { IdeaRead, AnalysisRead, OutreachMessageRead } from '@/lib/types'

export default function Outreach() {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null)
  const [messages, setMessages] = useState<OutreachMessageRead[]>([])
  const [selectedContributorIds, setSelectedContributorIds] = useState<number[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [typedMessages, setTypedMessages] = useState<string[]>([])
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: ideas } = useQuery<IdeaRead[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  })

  const analyzedIdeas = ideas?.filter((i) => i.status === 'ANALYZED') ?? []

  // Fetch contributors for the selected idea
  const { data: analysisData } = useQuery<AnalysisRead>({
    queryKey: ['analysis-for-outreach', selectedAnalysisId],
    queryFn: async () => {
      if (!selectedAnalysisId) return null
      const analysisId = await resolveAnalysisId(selectedAnalysisId)
      if (!analysisId) return null
      return api.get(`/analysis/${analysisId}`).then((r) => r.data)
    },
    enabled: !!selectedAnalysisId,
  })

  const contributors = analysisData?.contributor_matches ?? []

  const generateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAnalysisId) throw new Error('No analysis selected')
      const analysisId = await resolveAnalysisId(selectedAnalysisId)
      if (!analysisId) throw new Error('Could not find the analysis')

      const ids = selectedContributorIds.length > 0
        ? selectedContributorIds
        : contributors.map((c) => c.id)

      const res = await api.post('/outreach/generate', {
        analysis_id: analysisId,
        contributor_ids: ids,
      })
      return res.data
    },
    onSuccess: (data) => {
      const msgs = data.messages || []
      setMessages(msgs)
      setTypedMessages(new Array(msgs.length).fill(''))
      setIsTyping(true)

      // Simulate AI typing effect for each message
      const fullTexts = msgs.map((m: any) => m.generated_message)
      let msgIdx = 0
      let charIdx = 0
      const newTyped = new Array(msgs.length).fill('')

      typingRef.current = setInterval(() => {
        if (msgIdx >= msgs.length) {
          if (typingRef.current) clearInterval(typingRef.current)
          setIsTyping(false)
          return
        }

        const text = fullTexts[msgIdx]
        if (charIdx < text.length) {
          // Type 3-5 chars at a time
          const charsToAdd = Math.min(3 + Math.floor(Math.random() * 3), text.length - charIdx)
          newTyped[msgIdx] = text.slice(0, charIdx + charsToAdd)
          charIdx += charsToAdd
          setTypedMessages([...newTyped])
        } else {
          msgIdx++
          charIdx = 0
        }
      }, 30)

      toast.success(`Generated ${msgs.length} outreach messages!`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to generate outreach')
    },
  })

  // Cleanup typing interval
  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current)
    }
  }, [])

  const toggleContributor = (id: number) => {
    setSelectedContributorIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
    toast.success('Message copied!')
  }

  const handleEdit = (index: number, currentText: string) => {
    setEditingIndex(index)
    setEditText(currentText)
  }

  const handleSaveEdit = (index: number) => {
    setTypedMessages((prev) => {
      const updated = [...prev]
      updated[index] = editText
      return updated
    })
    setEditingIndex(null)
    toast.success('Message updated!')
  }

  const handleRegenerate = (index: number) => {
    // Reset the typing for just this message
    setTypedMessages((prev) => {
      const updated = [...prev]
      updated[index] = ''
      return updated
    })
    // Simulate regeneration
    setIsTyping(true)
    const original = messages[index]?.generated_message || ''
    let charIdx = 0
    const newTyped = [...typedMessages]

    const regenInterval = setInterval(() => {
      if (charIdx < original.length) {
        const charsToAdd = Math.min(3 + Math.floor(Math.random() * 3), original.length - charIdx)
        newTyped[index] = original.slice(0, charIdx + charsToAdd)
        charIdx += charsToAdd
        setTypedMessages([...newTyped])
      } else {
        clearInterval(regenInterval)
        setIsTyping(false)
        toast.success('Message regenerated!')
      }
    }, 25)
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Outreach</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Generate AI-powered outreach messages for recommended contributors
        </p>
      </motion.div>

      {/* Controls */}
      <div className="card">
        <div className="flex items-end gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5">Analyzed Project</label>
            <select
              value={selectedAnalysisId ?? ''}
              onChange={(e) => {
                setSelectedAnalysisId(e.target.value ? Number(e.target.value) : null)
                setMessages([])
                setTypedMessages([])
              }}
              className="input-field"
            >
              <option value="">Select an analyzed idea...</option>
              {analyzedIdeas.map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {idea.original_prompt.slice(0, 60)}...
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending || !selectedAnalysisId}
            className="btn-primary"
          >
            {generateMutation.isPending ? (
              <Loader size={18} className="animate-spin" />
            ) : isTyping ? (
              <Sparkles size={18} className="animate-spin" />
            ) : <Send size={18} />}
            {generateMutation.isPending || isTyping ? 'Generating...' : 'Generate Outreach'}
          </button>
        </div>

        {/* Contributors for selection */}
        {contributors.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Select contributors to message:</p>
            <div className="flex flex-wrap gap-2">
              {contributors.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleContributor(c.id)}
                  className={`badge cursor-pointer transition-all ${
                    selectedContributorIds.includes(c.id)
                      ? 'badge-primary ring-2 ring-[#8B5CF6]'
                      : 'badge-neutral'
                  }`}
                >
                  @{c.github_username} ({Math.round(c.match_score)}%)
                </button>
              ))}
              <button
                onClick={() => setSelectedContributorIds(contributors.map((c) => c.id))}
                className="badge badge-neutral cursor-pointer hover:bg-[#E5E7EB]"
              >
                Select All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card py-4"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--sidebar)' }}>
                  <Sparkles size={20} style={{ color: 'var(--primary)' }} className="animate-spin-slow-reverse" />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">AI is crafting personalized messages...</p>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Analyzing contributor profiles and project context...</p>
              </div>
              <Clock size={16} className="animate-pulse" style={{ color: 'var(--primary)' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generated Messages */}
      {messages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Generated Messages ({messages.length})
            </h3>
            {!isTyping && (
              <span className="badge badge-success flex items-center gap-1">
                <CheckCheck size={12} />
                Ready to send
              </span>
            )}
          </div>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: `linear-gradient(135deg, ${['#8B5CF6', '#22C55E', '#F59E0B'][i % 3]}, ${['#C4B5FD', '#34D399', '#FBBF24'][i % 3]})` }}
                >
                  {(msg.recipient || '?')[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">@{msg.recipient}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="badge badge-success">Generated</span>
              </div>

              {editingIndex === i ? (
                <div>
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="input-field min-h-[120px] resize-none mb-2"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(i)} className="btn-primary text-sm py-2">
                      <CheckCheck size={16} />
                      Save
                    </button>
                    <button onClick={() => setEditingIndex(null)} className="btn-secondary text-sm py-2">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl whitespace-pre-wrap text-sm leading-relaxed" style={{ background: 'var(--sidebar)' }}>
                  {isTyping && typedMessages[i]?.length < (msg.generated_message?.length || 0) ? (
                    <>
                      {typedMessages[i]}
                      <span className="inline-block w-0.5 h-4 bg-[#8B5CF6] animate-pulse ml-0.5" />
                    </>
                  ) : (
                    msg.generated_message
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={() => handleCopy(msg.generated_message, i)}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  {copiedIndex === i ? (
                    <><CheckCheck size={14} className="text-[#22C55E]" /> Copied</>
                  ) : (
                    <><Copy size={14} /> Copy</>
                  )}
                </button>
                <button
                  onClick={() => handleEdit(i, msg.generated_message)}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleRegenerate(i)}
                  disabled={isTyping}
                  className="btn-ghost text-xs py-1.5 px-3"
                >
                  <RefreshCw size={14} className={isTyping ? 'animate-spin' : ''} />
                  Regenerate
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!selectedAnalysisId && messages.length === 0 && (
        <div className="card text-center py-12">
          <Mail size={48} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
          <h3 className="text-lg font-semibold mb-2">Generate Outreach</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Select an analyzed project to generate personalized outreach messages for contributors
          </p>
        </div>
      )}
    </div>
  )
}
