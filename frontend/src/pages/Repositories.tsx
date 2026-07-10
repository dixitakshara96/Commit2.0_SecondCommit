import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, CheckCircle, Star, GitFork, ExternalLink, BookOpen, Globe, Loader } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { IdeaRead, RepositoryRead } from '@/lib/types'

export default function Repositories() {
  const [selectedIdeaId, setSelectedIdeaId] = useState<number | null>(null)
  const [searchResults, setSearchResults] = useState<RepositoryRead[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const queryClient = useQueryClient()

  const { data: ideas } = useQuery<IdeaRead[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  })

  const approvedIdeas = ideas?.filter((i) => i.status === 'APPROVED') ?? []

  const handleSearch = async () => {
    if (!selectedIdeaId) {
      toast.error('Select an approved idea first')
      return
    }
    setIsSearching(true)
    try {
      const res = await api.post('/repositories/search', { idea_id: selectedIdeaId })
      setSearchResults(res.data)
      toast.success(`Found ${res.data.length} repositories`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Search failed')
    } finally {
      setIsSearching(false)
    }
  }

  const selectMutation = useMutation({
    mutationFn: (repository_id: number) => api.post('/repositories/select', { repository_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['repositories'] })
      toast.success('Repository selected!')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Selection failed'),
  })

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

      {/* Results */}
      {searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Results ({searchResults.length})
          </h3>
          {searchResults.map((repo, i) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`card ${repo.is_selected ? 'ring-2 ring-[#8B5CF6]' : ''}`}
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
                    {repo.is_selected && (
                      <span className="badge badge-success">Selected</span>
                    )}
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
                  {!repo.is_selected && (
                    <button
                      onClick={() => selectMutation.mutate(repo.id)}
                      disabled={selectMutation.isPending}
                      className="btn-primary text-sm py-2"
                    >
                      <CheckCircle size={16} />
                      Select
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!isSearching && searchResults.length === 0 && (
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
