import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, BarChart3, CheckCircle, AlertCircle, Brain, Code, FileText, Users, TrendingUp, Sparkles, Search, Loader } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { IdeaRead, RepositoryRead, AnalysisRead } from '@/lib/types'

const agents = [
  { id: 'snapshot', name: 'Snapshot Agent', icon: <Search size={16} />, color: '#8B5CF6', description: 'Fetching GitHub data...' },
  { id: 'documentation', name: 'Documentation Agent', icon: <FileText size={16} />, color: '#22C55E', description: 'Evaluating documentation...' },
  { id: 'code_health', name: 'Code Health Agent', icon: <Code size={16} />, color: '#F59E0B', description: 'Analyzing code quality...' },
  { id: 'trend', name: 'Trend Agent', icon: <TrendingUp size={16} />, color: '#EF4444', description: 'Assessing market trends...' },
  { id: 'ai_capability', name: 'AI Capability Agent', icon: <Brain size={16} />, color: '#8B5CF6', description: 'Estimating AI effort...' },
  { id: 'skill_gap', name: 'Skill Gap Agent', icon: <Users size={16} />, color: '#22C55E', description: 'Identifying required skills...' },
  { id: 'contributor', name: 'Contributor Agent', icon: <Sparkles size={16} />, color: '#F59E0B', description: 'Finding contributors...' },
  { id: 'report', name: 'Report Generator', icon: <FileText size={16} />, color: '#8B5CF6', description: 'Generating report...' },
]

export default function Analysis() {
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null)
  const [runningAgent, setRunningAgent] = useState(-1)
  const [completedAgents, setCompletedAgents] = useState<number[]>([])
  const [analysisId, setAnalysisId] = useState<number | null>(null)
  const navigate = useNavigate()

  const { data: ideas } = useQuery<IdeaRead[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  })

  const analyzedIdeas = ideas?.filter((i) => i.status === 'APPROVED' || i.status === 'ANALYZED') ?? []
  const firstIdeaId = analyzedIdeas[0]?.id

  const { data: repos } = useQuery<RepositoryRead[]>({
    queryKey: ['repositories', firstIdeaId],
    queryFn: () => api.get(`/repositories?idea_id=${firstIdeaId}`).then((r) => r.data),
    enabled: !!firstIdeaId,
  })

  const selectedRepo = repos?.find((r) => r.is_selected)

  const runMutation = useMutation({
    mutationFn: async (repository_id: number) => {
      setRunningAgent(0)
      setCompletedAgents([])

      // Simulate agent pipeline with progress
      for (let i = 0; i < agents.length; i++) {
        setRunningAgent(i)
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600))
        setCompletedAgents((prev) => [...prev, i])
      }

      const res = await api.post('/analysis/run', { repository_id })
      const analysisId = res.data.analysis_id
      setAnalysisId(analysisId)
      // Save to localStorage for other pages to reference
      localStorage.setItem('last_analysis_id', String(analysisId))
      setRunningAgent(-1)
      return res.data
    },
    onSuccess: (data) => {
      toast.success('Analysis complete!')
    },
    onError: (err: any) => {
      setRunningAgent(-1)
      setCompletedAgents([])
      toast.error(err.response?.data?.detail || 'Analysis failed')
    },
  })

  const isRunning = runMutation.isPending

  // If we have an analysisId, try to fetch the analysis
  const { data: analysis } = useQuery<AnalysisRead>({
    queryKey: ['analysis', analysisId],
    queryFn: () => api.get(`/analysis/${analysisId}`).then((r) => r.data),
    enabled: !!analysisId,
  })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Analysis Pipeline</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Run the multi-agent analysis pipeline on your selected repository
        </p>
      </motion.div>

      {/* Controls */}
      <div className="card">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1.5">Selected Repository</label>
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
              {selectedRepo ? (
                <>
                  <BarChart3 size={18} style={{ color: 'var(--primary)' }} />
                  <div>
                    <p className="text-sm font-medium">{selectedRepo.owner}/{selectedRepo.repo_name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {selectedRepo.stars} stars · {selectedRepo.language || 'N/A'}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No repository selected. Go to Repositories page first.
                </p>
              )}
            </div>
          </div>
          {selectedRepo && (
            <button
              onClick={() => runMutation.mutate(selectedRepo.id)}
              disabled={isRunning}
              className="btn-primary"
            >
              {isRunning ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : <Play size={18} />}
              {isRunning ? 'Running...' : 'Run Analysis'}
            </button>
          )}
        </div>
      </div>

      {/* Agent Pipeline */}
      <div className="card">
        <h3 className="text-base font-semibold mb-6">Agent Pipeline</h3>
        <div className="relative">
          {/* Vertical connector line */}
          <div className="absolute left-5 top-2 bottom-2 w-px" style={{ background: 'var(--border)' }} />

          <div className="space-y-6">
            {agents.map((agent, i) => {
              const isCurrent = runningAgent === i
              const isCompleted = completedAgents.includes(i)
              const isPending = !isCurrent && !isCompleted

              return (
                <motion.div
                  key={agent.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative flex items-start gap-4"
                >
                  {/* Status indicator */}
                  <div className="relative z-10">
                    {isCompleted ? (
                      <div className="w-10 h-10 rounded-full bg-[#22C55E]/10 flex items-center justify-center">
                        <CheckCircle size={18} style={{ color: '#22C55E' }} />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center animate-pulse-ring"
                        style={{ background: `${agent.color}15` }}>
                        <Loader size={18} className="animate-spin" style={{ color: agent.color }} />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                        <span style={{ color: '#9CA3AF' }}>{agent.icon}</span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        isCompleted ? 'text-[#22C55E]' : isCurrent ? '' : 'text-[#9CA3AF]'
                      }`}>
                        {agent.name}
                      </span>
                      {isCompleted && (
                        <span className="text-xs text-[#22C55E]">✓ Complete</span>
                      )}
                      {isCurrent && (
                        <span className="text-xs animate-pulse" style={{ color: agent.color }}>
                          {agent.description}
                        </span>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="mt-2 progress-bar">
                        <motion.div
                          className="progress-fill"
                          initial={{ width: '0%' }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 1.4, ease: 'easeInOut' }}
                        />
                      </div>
                    )}
                    {isCompleted && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                        {agent.description.replace('...', ' complete')}
                      </p>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Overall progress */}
        {isRunning && (
          <div className="mt-6 p-4 rounded-xl" style={{ background: 'var(--sidebar)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm font-medium" style={{ color: 'var(--primary)' }}>
                {Math.round((completedAgents.length / agents.length) * 100)}%
              </span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: '0%' }}
                animate={{ width: `${(completedAgents.length / agents.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* Complete */}
        {analysis && !isRunning && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-xl text-center"
            style={{ background: 'linear-gradient(135deg, #8B5CF615, #22C55E15)' }}
          >
            <CheckCircle size={32} className="mx-auto mb-2" style={{ color: '#22C55E' }} />
            <h4 className="font-semibold mb-1">Analysis Complete!</h4>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>
              Revival Score: {analysis.revival_score}/100
            </p>
            <button
              onClick={() => navigate(`/analysis/${analysis.id}`)}
              className="btn-primary"
            >
              <FileText size={18} />
              View Full Report
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
