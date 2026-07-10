import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Send, Mail, Users, Loader } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { resolveAnalysisId } from '@/lib/analysis'
import type { IdeaRead, AnalysisRead, OutreachMessageRead } from '@/lib/types'

export default function Outreach() {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null)
  const [messages, setMessages] = useState<OutreachMessageRead[]>([])
  const [selectedContributorIds, setSelectedContributorIds] = useState<number[]>([])

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
      // Resolve the analysis ID from the idea
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
      setMessages(data.messages)
      toast.success(`Generated ${data.messages.length} outreach messages!`)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to generate outreach')
    },
  })

  const toggleContributor = (id: number) => {
    setSelectedContributorIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
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
            ) : <Send size={18} />}
            Generate Messages
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

      {/* Generated Messages */}
      {messages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Generated Messages ({messages.length})
          </h3>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                  <Users size={16} style={{ color: '#8B5CF6' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">@{msg.recipient}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="badge badge-success">Generated</span>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
                <p className="text-sm whitespace-pre-wrap">{msg.generated_message}</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!selectedAnalysisId && (
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
