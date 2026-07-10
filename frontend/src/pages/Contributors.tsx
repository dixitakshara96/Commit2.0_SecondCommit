import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, GitBranch, Activity, ExternalLink, Sparkles, Star } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { resolveAnalysisId } from '@/lib/analysis'
import type { IdeaRead, ContributorRecommendResponse } from '@/lib/types'

export default function Contributors() {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<number | null>(null)
  const [contributors, setContributors] = useState<ContributorRecommendResponse['contributors']>([])
  const [hasSearched, setHasSearched] = useState(false)
  const queryClient = useQueryClient()

  const { data: ideas } = useQuery<IdeaRead[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  })

  const analyzedIdeas = ideas?.filter((i) => i.status === 'ANALYZED') ?? []

  const findContributors = async (ideaId: number) => {
    if (!ideaId) {
      toast.error('Select an analyzed project first')
      return
    }
    try {
      const analysisId = await resolveAnalysisId(ideaId)
      if (!analysisId) {
        toast.error('Could not find the analysis. Run the analysis first from the Analysis page.')
        return
      }
      const res = await api.post('/contributors/recommend', { analysis_id: analysisId })
      setContributors(res.data.contributors)
      setHasSearched(true)
      toast.success(`Found ${res.data.contributors.length} contributors`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to find contributors')
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Contributors</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Find and recommend contributors for your analyzed projects
        </p>
      </motion.div>

      {/* Controls */}
      <div className="card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5">Analyzed Project</label>
            <select
              value={selectedAnalysisId ?? ''}
              onChange={(e) => setSelectedAnalysisId(e.target.value ? Number(e.target.value) : null)}
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
            onClick={() => findContributors(selectedAnalysisId!)}
            disabled={!selectedAnalysisId}
            className="btn-primary"
          >
            <Sparkles size={18} />
            Find Contributors
          </button>
        </div>
        {analyzedIdeas.length === 0 && (
          <p className="text-xs mt-3" style={{ color: 'var(--warning)' }}>
            No analyzed projects found. Run an analysis first.
          </p>
        )}
      </div>

      {/* Results */}
      {hasSearched && contributors.length === 0 && (
        <div className="card text-center py-8">
          <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold mb-1">No contributors found</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try running the analysis again or selecting a different project
          </p>
        </div>
      )}

      {contributors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contributors.map((contributor, i) => (
            <motion.div
              key={contributor.id || contributor.github_username}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {contributor.avatar_url ? (
                    <img
                      src={contributor.avatar_url}
                      alt={contributor.github_username}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                      <GitBranch size={20} style={{ color: '#8B5CF6' }} />
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">@{contributor.github_username}</p>
                    <a
                      href={contributor.github_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline flex items-center gap-1"
                      style={{ color: 'var(--primary)' }}
                    >
                      View Profile <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                    {Math.round(contributor.match_score)}%
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Match</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {(contributor.matched_skills || []).slice(0, 5).map((skill) => (
                  <span key={skill} className="badge badge-primary">{skill}</span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                <span className="flex items-center gap-1">
                  <Activity size={12} />
                  Activity: {Math.round(contributor.recent_activity_score)}%
                </span>
                {(contributor.recent_repositories || []).length > 0 && (
                  <span className="flex items-center gap-1">
                    <Star size={12} />
                    {contributor.recent_repositories.slice(0, 2).join(', ')}
                  </span>
                )}
              </div>

              {contributor.recommendation_reason && (
                <p className="text-xs mt-2 p-2 rounded-lg" style={{ background: 'var(--sidebar)', color: 'var(--text-secondary)' }}>
                  {contributor.recommendation_reason}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {!hasSearched && (
        <div className="card text-center py-12">
          <Users size={48} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
          <h3 className="text-lg font-semibold mb-2">Contributor Recommendations</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Select an analyzed project and click "Find Contributors" to get AI-powered recommendations
          </p>
        </div>
      )}
    </div>
  )
}
