import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, GitBranch, Activity, ExternalLink, Sparkles, Star, Loader, Clock } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { resolveAnalysisId } from '@/lib/analysis'
import type { IdeaRead, ContributorRecommendResponse } from '@/lib/types'

const MOCK_AVAILABILITY = ['Available (2-3 hrs/week)', 'Available (5+ hrs/week)', 'Available (weekends)']

export default function Contributors() {
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null)
  const [contributors, setContributors] = useState<ContributorRecommendResponse['contributors']>([] as any[])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoadingSearch, setIsLoadingSearch] = useState(false)
  const [searchStage, setSearchStage] = useState(0)
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: ideas } = useQuery<IdeaRead[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  })

  const analyzedIdeas = ideas?.filter((i) => i.status === 'ANALYZED') ?? []

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current)
    }
  }, [])

  const findContributors = async (ideaId: number) => {
    if (!ideaId) {
      toast.error('Select an analyzed project first')
      return
    }
    setIsLoadingSearch(true)
    setSearchStage(0)
    setHasSearched(true)
    setContributors([])

    // Animate through stages
    const stages = ['Analyzing project requirements...', 'Scanning GitHub profiles...', 'Matching skills & experience...', 'Ranking compatibility...']
    let i = 0
    stageTimerRef.current = setInterval(() => {
      i++
      if (i < stages.length) {
        setSearchStage(i)
      } else {
        if (stageTimerRef.current) clearInterval(stageTimerRef.current)
      }
    }, 700)

    try {
      const analysisId = await resolveAnalysisId(ideaId)
      if (!analysisId) {
        toast.error('Could not find the analysis. Run the analysis first from the Analysis page.')
        setIsLoadingSearch(false)
        if (stageTimerRef.current) clearInterval(stageTimerRef.current)
        return
      }
      const res = await api.post('/contributors/recommend', { analysis_id: analysisId })
      // Add mock availability and recent activity to each contributor
      const enriched = (res.data.contributors || []).map((c: any, i: number) => ({
        ...c,
        availability: MOCK_AVAILABILITY[i % MOCK_AVAILABILITY.length],
        avatar_url: c.avatar_url || null,
      }))
      setContributors(enriched)
      toast.success(`Found ${enriched.length} contributors`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to find contributors')
    } finally {
      setIsLoadingSearch(false)
      if (stageTimerRef.current) clearInterval(stageTimerRef.current)
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
              value={selectedIdeaId ?? ''}
              onChange={(e) => setSelectedIdeaId(e.target.value ? Number(e.target.value) : null)}
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
          onClick={() => findContributors(selectedIdeaId!)}
          disabled={!selectedIdeaId || isLoadingSearch}
            className="btn-primary"
          >
            {isLoadingSearch ? (
              <Loader size={18} className="animate-spin" />
            ) : <Sparkles size={18} />}
            {isLoadingSearch ? 'Searching...' : 'Recommend Contributors'}
          </button>
        </div>
        {analyzedIdeas.length === 0 && (
          <p className="text-xs mt-3" style={{ color: 'var(--warning)' }}>
            No analyzed projects found. Run an analysis first.
          </p>
        )}


      </div>

      {/* Loading Animation */}
      <AnimatePresence>
        {isLoadingSearch && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card text-center py-10"
          >
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-pulse-ring" style={{ background: 'var(--sidebar)' }}>
                <Users size={28} style={{ color: 'var(--primary)' }} className="animate-float" />
              </div>
            </div>
            <p className="text-sm font-semibold mb-1">Finding the best contributors...</p>
            <div className="flex items-center justify-center gap-2 mt-3">
              {['Analyzing', 'Scanning', 'Matching', 'Ranking'].map((stage, i) => (
                <div key={stage} className="flex items-center gap-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      i <= searchStage ? 'bg-[#8B5CF6]' : 'bg-[#D1D5DB]'
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      i <= searchStage ? 'text-[#8B5CF6]' : 'text-[#D1D5DB]'
                    }`}
                  >
                    {stage}
                  </span>
                  {i < 3 && <span className="text-[#D1D5DB] text-xs">→</span>}
                </div>
              ))}
            </div>
            <div className="mt-4 progress-bar max-w-xs mx-auto">
              <motion.div
                className="progress-fill"
                initial={{ width: '0%' }}
                animate={{ width: `${((searchStage + 1) / 4) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {hasSearched && !isLoadingSearch && contributors.length === 0 && (
        <div className="card text-center py-8">
          <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold mb-1">No contributors found</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try running the analysis again or selecting a different project
          </p>
        </div>
      )}

      {contributors.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
              Top Contributors ({contributors.length})
            </h3>
            <span className="badge badge-primary">AI Recommended</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {contributors.slice(0, 3).map((contributor: any, i: number) => (
              <motion.div
                key={contributor.id || contributor.github_username}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.12 }}
                className="card relative overflow-hidden"
                style={{ borderColor: i === 0 ? '#22C55E' : 'var(--border)' }}
              >
                {i === 0 && (
                  <div className="absolute top-3 right-3">
                    <span className="badge badge-success">Best Match</span>
                  </div>
                )}

                <div className="flex items-start gap-4 mb-4">
                  {contributor.avatar_url ? (
                    <img
                      src={contributor.avatar_url}
                      alt={contributor.github_username}
                      className="w-12 h-12 rounded-full ring-2 ring-[#8B5CF6]/20"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${['#8B5CF6', '#22C55E', '#F59E0B'][i]}, ${['#C4B5FD', '#34D399', '#FBBF24'][i]})` }}
                    >
                      {(contributor.github_username || '??')[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">@{contributor.github_username}</p>
                    <a
                      href={contributor.github_profile}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs hover:underline flex items-center gap-1"
                      style={{ color: 'var(--primary)' }}
                    >
                      GitHub Profile <ExternalLink size={10} />
                    </a>
                  </div>
                  {/* Compatibility Score */}
                  <div className="text-center flex-shrink-0">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-sm"
                      style={{
                        background: `conic-gradient(var(--primary) ${contributor.match_score}%, #F3F4F6 ${contributor.match_score}%)`,
                        color: contributor.match_score >= 85 ? '#22C55E' : '#F59E0B',
                      }}
                    >
                      <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center">
                        {Math.round(contributor.match_score)}%
                      </div>
                    </div>
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>Compatibility</span>
                  </div>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {(contributor.matched_skills || []).slice(0, 5).map((skill: string) => (
                    <span key={skill} className="badge badge-primary text-[10px]">{skill}</span>
                  ))}
                </div>

                {/* Recent Technologies */}
                {(contributor.recent_repositories || []).length > 0 && (
                  <div className="mb-3 p-2.5 rounded-xl" style={{ background: 'var(--sidebar)' }}>
                    <p className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Recent Technologies</p>
                    <div className="flex flex-wrap gap-1">
                      {contributor.recent_repositories.slice(0, 4).map((repo: string) => (
                        <span key={repo} className="text-[10px] px-2 py-0.5 rounded-full bg-white" style={{ color: 'var(--text)' }}>
                          {repo}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                <div className="flex items-center justify-between text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1">
                    <Activity size={12} />
                    Activity: {Math.round(contributor.recent_activity_score)}%
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {contributor.availability || 'Flexible'}
                  </span>
                </div>

                {/* Recommendation Reason */}
                {contributor.recommendation_reason && (
                  <div className="p-3 rounded-xl text-xs leading-relaxed" style={{ background: 'var(--sidebar)', color: 'var(--text-secondary)' }}>
                    <span className="font-medium text-[#8B5CF6]">Why recommend: </span>
                    {contributor.recommendation_reason}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {!hasSearched && !isLoadingSearch && (
        <div className="card text-center py-12">
          <Users size={48} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
          <h3 className="text-lg font-semibold mb-2">Contributor Recommendations</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Select an analyzed project and click "Recommend Contributors" to get AI-powered recommendations
          </p>
        </div>
      )}
    </div>
  )
}
