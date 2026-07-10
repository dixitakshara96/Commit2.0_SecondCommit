import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle, Star, GitFork, ExternalLink, BookOpen, Globe, Loader, Sparkles, Brain, BarChart3, Target } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { IdeaRead, RepositoryRead } from '@/lib/types'

const SEARCH_STAGES = [
  { id: 'understanding', label: 'Understanding Idea', icon: <Brain size={16} />, color: '#8B5CF6' },
  { id: 'searching', label: 'Searching GitHub', icon: <Search size={16} />, color: '#22C55E' },
  { id: 'ranking', label: 'Ranking Repositories', icon: <BarChart3 size={16} />, color: '#F59E0B' },
  { id: 'selecting', label: 'Selecting Best Matches', icon: <Target size={16} />, color: '#8B5CF6' },
]

export default function Repositories() {
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null)
  const [searchResults, setSearchResults] = useState<RepositoryRead[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [currentStage, setCurrentStage] = useState(-1)
  const [completedStages, setCompletedStages] = useState<number[]>([])
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null)
  const [localRepos, setLocalRepos] = useState<RepositoryRead[]>([])
  const queryClient = useQueryClient()
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: ideas } = useQuery<IdeaRead[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  })

  const approvedIdeas = ideas?.filter((i) => i.status === 'APPROVED') ?? []

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current)
    }
  }, [])

  // Sync local repos from search results
  useEffect(() => {
    if (searchResults.length > 0) {
      setLocalRepos(searchResults.map((r) => ({ ...r, is_selected: r.id === selectedRepoId })))
    }
  }, [searchResults, selectedRepoId])

  const handleSearch = async () => {
    if (!selectedIdeaId) {
      toast.error('Select an approved idea first')
      return
    }
    setIsSearching(true)
    setCurrentStage(0)
    setCompletedStages([])
    setSearchResults([])
    setSelectedRepoId(null)

    // Animate through stages
    const stageDurations = [1200, 1800, 1000, 1000]
    let stageIdx = 0
    const advanceStage = () => {
      setCompletedStages((prev) => [...prev, stageIdx])
      stageIdx++
      if (stageIdx < SEARCH_STAGES.length) {
        setCurrentStage(stageIdx)
      }
    }

    // Schedule stage transitions
    let cumulativeDelay = 0
    for (let i = 0; i < SEARCH_STAGES.length; i++) {
      const delay = stageDurations[i]
      setTimeout(() => advanceStage(), cumulativeDelay)
      cumulativeDelay += delay
    }

    try {
      const res = await api.post('/repositories/search', { idea_id: selectedIdeaId })
      const repos = Array.isArray(res.data) ? res.data : res.data.repositories || []
      setSearchResults(repos)
      toast.success(`Found ${repos.length} repositories`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const selectMutation = useMutation({
    mutationFn: async (repository_id: number) => {
      const res = await api.post('/repositories/select', { repository_id })
      return res.data
    },
    onSuccess: (data) => {
      setSelectedRepoId(data.repository_id)
      // Update local repos to reflect selection
      setLocalRepos((prev) =>
        prev.map((r) => ({
          ...r,
          is_selected: r.id === data.repository_id,
        }))
      )
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
      toast.success('Repository selected!')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Selection failed'),
  })

  const hasSelection = localRepos.some((r) => r.is_selected)

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Repository Search</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Search GitHub for repositories matching your approved idea
        </p>
      </motion.div>

      {/* Search Controls */}
      <div className="card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5">Approved Idea</label>
            <select
              value={selectedIdeaId ?? ''}
              onChange={(e) => setSelectedIdeaId(e.target.value ? Number(e.target.value) : null)}
              className="input-field"
            >
              <option value="">Select an idea...</option>
              {approvedIdeas.map((idea) => (
                <option key={idea.id} value={idea.id}>
                  {idea.original_prompt.slice(0, 80)}...
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleSearch} disabled={isSearching || !selectedIdeaId} className="btn-primary">
            {isSearching ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Search size={18} />}
            Search GitHub
          </button>
        </div>
      </div>

      {/* Search Animation Stages */}
      <AnimatePresence>
        {isSearching && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card"
          >
            <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-secondary)' }}>
              Searching for repositories...
            </h3>
            <div className="space-y-3">
              {SEARCH_STAGES.map((stage, i) => {
                const isCurrent = currentStage === i
                const isCompleted = completedStages.includes(i)
                return (
                  <div key={stage.id} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        isCompleted
                          ? 'bg-[#22C55E]/10'
                          : isCurrent
                          ? 'bg-[#8B5CF6]/10 animate-pulse-ring'
                          : 'bg-[#F3F4F6]'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle size={16} style={{ color: '#22C55E' }} />
                      ) : (
                        <span style={{ color: isCurrent ? stage.color : '#9CA3AF' }}>{stage.icon}</span>
                      )}
                    </div>
                    <span
                      className={`text-sm ${
                        isCompleted
                          ? 'text-[#22C55E]'
                          : isCurrent
                          ? ''
                          : 'text-[#9CA3AF]'
                      }`}
                    >
                      {stage.label}
                    </span>
                    {isCurrent && (
                      <span className="text-xs animate-pulse" style={{ color: stage.color }}>
                        Processing...
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-xs" style={{ color: '#22C55E' }}>
                        ✓ Done
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="mt-4 progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: '0%' }}
                animate={{ width: `${(completedStages.length / SEARCH_STAGES.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      {localRepos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Top Results ({localRepos.length})
          </h3>
          {localRepos.map((repo, i) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`card ${
                repo.is_selected
                  ? 'ring-2 ring-[#22C55E] border-[#22C55E]/30 bg-[#22C55E]/5'
                  : hasSelection
                  ? 'opacity-50 pointer-events-none'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <BookOpen size={16} style={{ color: 'var(--primary)' }} />
                    <a
                      href={repo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold hover:underline"
                      style={{ color: 'var(--text)' }}
                    >
                      {repo.owner}/{repo.repo_name}
                    </a>
                    {repo.is_selected ? (
                      <span className="badge badge-success">Selected ✓</span>
                    ) : hasSelection ? (
                      <span className="badge badge-neutral">Unavailable</span>
                    ) : null}
                  </div>
                  {repo.description && (
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {repo.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {repo.language && (
                      <span className="flex items-center gap-1">
                        <Globe size={12} /> {repo.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star size={12} /> {repo.stars}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork size={12} /> {repo.forks}
                    </span>
                    {repo.license && <span>{repo.license}</span>}
                    {repo.last_commit && (
                      <span>Updated {new Date(repo.last_commit).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={repo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost p-2"
                    title="Open on GitHub"
                  >
                    <ExternalLink size={16} />
                  </a>
                  {!repo.is_selected && !hasSelection && (
                    <button
                      onClick={() => selectMutation.mutate(repo.id)}
                      disabled={selectMutation.isPending}
                      className="btn-primary text-sm py-2"
                    >
                      <CheckCircle size={16} />
                      Select Repository
                    </button>
                  )}
                  {repo.is_selected && (
                    <span className="btn-success text-sm py-2 px-4 rounded-xl flex items-center gap-1.5" style={{ background: '#22C55E15', color: '#22C55E' }}>
                      <CheckCircle size={16} />
                      Selected
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isSearching && localRepos.length === 0 && (
        <div className="card text-center py-12">
          <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold mb-2">Search repositories</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Select an approved idea and click "Search GitHub" to find matching repositories
          </p>
        </div>
      )}
    </div>
  )
}
