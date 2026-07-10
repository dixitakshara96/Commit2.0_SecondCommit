import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { MessageSquare, CheckCircle, Clock, User, AlertCircle, Search } from 'lucide-react'
import api from '@/lib/api'
import { resolveAnalysisId } from '@/lib/analysis'
import type { IdeaRead } from '@/lib/types'

export default function Messages() {
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)

  const { data: ideas } = useQuery<IdeaRead[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  })

  const analyzedIdeas = ideas?.filter((i) => i.status === 'ANALYZED') ?? []

  const loadMessages = async (ideaId: number) => {
    setIsLoadingMessages(true)
    setSelectedIdeaId(ideaId)
    try {
      const analysisId = await resolveAnalysisId(ideaId)
      if (!analysisId) {
        setMessages([])
        setIsLoadingMessages(false)
        return
      }

      // Fetch the analysis to get contributor matches
      const analysis = await api.get(`/analysis/${analysisId}`).then((r) => r.data)

      // Try to get response tracking entries
      let responses: any[] = []
      try {
        responses = await api.get(`/responses/by-analysis/${analysisId}`).then((r) => r.data)
      } catch { /* no tracking entries yet */ }

      // Combine data
      if (analysis.contributor_matches?.length > 0) {
        const combined = analysis.contributor_matches.map((match: any) => {
          const tracker = responses.find((r: any) =>
            r.contributor_match_id === match.id
          )
          return {
            id: match.id,
            analysis_id: analysisId,
            recipient: match.github_username,
            type: 'contributor',
            generated_message: match.recommendation_reason || 'Awaiting outreach message generation...',
            created_at: new Date().toISOString(),
            status: tracker?.status || 'pending',
          }
        })
        setMessages(combined)
      } else {
        setMessages([])
      }
    } catch {
      setMessages([])
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const statusIcon = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return <CheckCircle size={14} style={{ color: '#22C55E' }} />
      case 'DECLINED': return <AlertCircle size={14} style={{ color: '#EF4444' }} />
      default: return <Clock size={14} style={{ color: '#F59E0B' }} />
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Messages</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Outreach conversations with contributors
        </p>
      </motion.div>

      {/* Project selector */}
      <div className="card">
        <label className="block text-sm font-medium mb-2">Select Project</label>
        <div className="flex gap-3">
          <select
            value={selectedIdeaId ?? ''}
            onChange={(e) => {
              const val = e.target.value
              if (val) loadMessages(Number(val))
              else {
                setSelectedIdeaId(null)
                setMessages([])
              }
            }}
            className="input-field flex-1"
          >
            <option value="">Choose an analyzed project...</option>
            {analyzedIdeas.map((idea) => (
              <option key={idea.id} value={idea.id}>
                {idea.original_prompt.slice(0, 60)}...
              </option>
            ))}
          </select>
        </div>
        {analyzedIdeas.length === 0 && (
          <p className="text-xs mt-3" style={{ color: 'var(--text-secondary)' }}>
            No analyzed projects found. Complete an analysis first.
          </p>
        )}
      </div>

      {/* Messages */}
      {isLoadingMessages ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center flex-shrink-0">
                  <User size={20} style={{ color: '#8B5CF6' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">@{msg.recipient}</span>
                      {statusIcon(msg.status)}
                    </div>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {msg.status}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl mt-2" style={{ background: 'var(--sidebar)' }}>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {msg.generated_message}
                    </p>
                  </div>
                </div>
                <span className={`badge ${
                  msg.status === 'ACCEPTED' ? 'badge-success' :
                  msg.status === 'DECLINED' ? 'badge-danger' : 'badge-warning'
                }`}>
                  {msg.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : selectedIdeaId ? (
        <div className="card text-center py-12">
          <MessageSquare size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold mb-2">No messages yet</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Generate outreach messages first to see them here
          </p>
        </div>
      ) : (
        <div className="card text-center py-12">
          <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold mb-2">Select a project</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Choose an analyzed project to view its outreach messages
          </p>
        </div>
      )}
    </div>
  )
}
