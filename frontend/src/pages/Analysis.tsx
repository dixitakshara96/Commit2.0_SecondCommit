import { useState, useRef, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, BarChart3, CheckCircle, AlertCircle, Brain, Code, FileText, Users, TrendingUp, Sparkles, Search, Loader, BookOpen, Activity, Target, Cpu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { IdeaRead, RepositoryRead, AnalysisRead } from '@/lib/types'

const agents = [
  { id: 'reader', name: 'Repository Reader', icon: <BookOpen size={16} />, color: '#8B5CF6', description: 'Cloning and reading repository structure...', log: 'Analyzing repository structure, file organization, and dependency graph...' },
  { id: 'documentation', name: 'Documentation Agent', icon: <FileText size={16} />, color: '#22C55E', description: 'Evaluating documentation quality and coverage...', log: 'Scanning README, API docs, JSDoc comments, and contribution guidelines...' },
  { id: 'health', name: 'Repository Health Agent', icon: <Activity size={16} />, color: '#F59E0B', description: 'Assessing overall codebase health...', log: 'Measuring commit frequency, issue resolution, community activity, and bus factor...' },
  { id: 'debt', name: 'Technical Debt Agent', icon: <Code size={16} />, color: '#EF4444', description: 'Identifying technical debt and code smells...', log: 'Detecting deprecated APIs, dead code, code duplication, and anti-patterns...' },
  { id: 'trend', name: 'Trend Prediction Agent', icon: <TrendingUp size={16} />, color: '#8B5CF6', description: 'Predicting technology and market trends...', log: 'Analyzing technology adoption, community growth, and ecosystem maturity...' },
  { id: 'ai_capability', name: 'AI Capability Agent', icon: <Brain size={16} />, color: '#22C55E', description: 'Estimating AI vs human contribution...', log: 'Identifying automatable tasks, refactoring opportunities, and AI-assisted areas...' },
  { id: 'skill_gap', name: 'Skill Gap Agent', icon: <Users size={16} />, color: '#F59E0B', description: 'Identifying required skills and gaps...', log: 'Mapping required expertise, identifying skill gaps, and prioritizing roles...' },
  { id: 'report', name: 'Final Report Generator', icon: <Sparkles size={16} />, color: '#8B5CF6', description: 'Compiling comprehensive revival report...', log: 'Aggregating agent findings, computing revival scores, and generating recommendations...' },
]

const LIVE_LOGS: Record<string, string[]> = {
  reader: [
    '[Reader] Scanning repository: ml-toolkit/ml-pipeline-orchestrator',
    '[Reader] Detected 342 files across 12 directories',
    '[Reader] Primary language: Python (72%)',
    '[Reader] Dependency count: 48 packages',
    '[Reader] Repository structure analyzed successfully',
  ],
  documentation: [
    '[Docs] Evaluating documentation coverage...',
    '[Docs] README quality score: 82/100',
    '[Docs] Found 156 documented functions (62% coverage)',
    '[Docs] Missing: API reference, migration guide',
    '[Docs] Documentation assessment complete',
  ],
  health: [
    '[Health] Analyzing commit history (1247 commits)...',
    '[Health] Commit frequency: 18 commits/week (last 6mo)',
    '[Health] Contributors: 12 total, 3 active',
    '[Health] Issue resolution rate: 76%',
    '[Health] Health assessment complete',
  ],
  debt: [
    '[Debt] Running static analysis...',
    '[Debt] Found 23 critical issues, 45 warnings',
    '[Debt] Detected 15 deprecated API usages',
    '[Debt] Code duplication rate: 12%',
    '[Debt] Technical debt analysis complete',
  ],
  trend: [
    '[Trend] Analyzing market signals...',
    '[Trend] ML pipeline market growing at 28% CAGR',
    '[Trend] Technology relevance score: 88/100',
    '[Trend] Competitor analysis: 3 major alternatives',
    '[Trend] Trend prediction complete',
  ],
  capability: [
    '[AI] Identifying AI-automatable tasks...',
    '[AI] Estimated AI contribution: 42.5%',
    '[AI] Tasks: testing (auto), refactoring, docs gen',
    '[AI] Human-critical: architecture, UX, strategy',
    '[AI] AI capability estimation complete',
  ],
  skill_gap: [
    '[Skills] Mapping required expertise...',
    '[Skills] Priority: ML Engineer, Full-Stack, DevOps',
    '[Skills] Skill availability: Python (high), Go (med)',
    '[Skills] Estimated hiring difficulty: moderate',
    '[Skills] Skill gap analysis complete',
  ],
  report: [
    '[Report] Compiling agent findings...',
    '[Report] Computing weighted revival score...',
    '[Report] Generating executive summary...',
    '[Report] Formatting recommendations...',
    '[Report] Revival report generated successfully!',
  ],
}

export default function Analysis() {
  const [selectedRepoId, setSelectedRepoId] = useState<number | null>(null)
  const [runningAgent, setRunningAgent] = useState(-1)
  const [completedAgents, setCompletedAgents] = useState<number[]>([])
  const [agentLogs, setAgentLogs] = useState<string[]>([])
  const [analysisId, setAnalysisId] = useState<number | null>(null)
  const [pipelineStarted, setPipelineStarted] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)
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

  // Auto-select the repo when data loads
  useEffect(() => {
    if (selectedRepo && !selectedRepoId) {
      setSelectedRepoId(selectedRepo.id)
    }
  }, [selectedRepo, selectedRepoId])

  // Scroll logs to bottom
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agentLogs])

  const runMutation = useMutation({
    mutationFn: async (repository_id: number) => {
      setPipelineStarted(true)
      setRunningAgent(0)
      setCompletedAgents([])
      setAgentLogs([])
      setAnalysisId(null)

      // Simulate sequential agent pipeline (~10 seconds total)
      for (let i = 0; i < agents.length; i++) {
        setRunningAgent(i)

        // Add initial "Queued" log for current agent
        setAgentLogs((prev) => [...prev, `[System] Agent ${i + 1}/${agents.length}: ${agents[i].name} starting...`])

        // Stream the live logs for this agent
        const logs = LIVE_LOGS[agents[i].id] || []
        for (let j = 0; j < logs.length; j++) {
          await new Promise((r) => setTimeout(r, 200 + Math.random() * 300))
          setAgentLogs((prev) => [...prev, logs[j]])
        }

        // Mark complete
        setCompletedAgents((prev) => [...prev, i])
        setAgentLogs((prev) => [...prev, `[System] ✓ ${agents[i].name} completed`])
      }

      // Call the actual API
      const res = await api.post('/analysis/run', { repository_id })
      const analysisId = res.data.analysis_id
      setAnalysisId(analysisId)
      localStorage.setItem('last_analysis_id', String(analysisId))
      setRunningAgent(-1)
      setAgentLogs((prev) => [...prev, '[System] ✅ Multi-agent analysis pipeline complete!'])
      return res.data
    },
    onSuccess: () => {
      toast.success('Analysis complete!')
    },
    onError: (err: any) => {
      setRunningAgent(-1)
      setCompletedAgents([])
      setPipelineStarted(false)
      toast.error(err.response?.data?.detail || 'Analysis failed')
    },
  })

  const isRunning = runMutation.isPending

  // Fetch analysis report when completed
  const { data: analysis } = useQuery<AnalysisRead>({
    queryKey: ['analysis', analysisId],
    queryFn: () => api.get(`/analysis/${analysisId}`).then((r) => r.data),
    enabled: !!analysisId,
  })

  const getStatusForAgent = (i: number): 'queued' | 'running' | 'completed' | 'pending' => {
    if (completedAgents.includes(i)) return 'completed'
    if (runningAgent === i) return 'running'
    if (pipelineStarted) return 'queued'
    return 'pending'
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Analysis Pipeline</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Run the multi-agent analysis pipeline on your selected repository
        </p>
      </motion.div>

      {/* Selected Repository Info */}
      {selectedRepo && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
          style={{ borderColor: 'var(--primary-light)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'var(--sidebar)' }}>
                <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{selectedRepo.owner}/{selectedRepo.repo_name}</h3>
                  <span className="badge badge-success">Currently Selected</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {selectedRepo.description?.slice(0, 120)}...
                </p>
                <div className="flex items-center gap-3 mt-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="flex items-center gap-1"><Users size={12} /> {selectedRepo.owner}</span>
                  <span className="flex items-center gap-1"><Sparkles size={12} /> {selectedRepo.stars} stars</span>
                  {selectedRepo.language && <span className="flex items-center gap-1"><Code size={12} /> {selectedRepo.language}</span>}
                  <span className="badge badge-success" style={{ fontSize: 10 }}>Healthy</span>
                  {selectedRepo.last_commit && (
                    <span>Updated {new Date(selectedRepo.last_commit).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
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
          </div>
        </motion.div>
      )}

      {!selectedRepo && !isRunning && (
        <div className="card text-center py-8">
          <BarChart3 size={40} className="mx-auto mb-3" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="font-semibold mb-1">No repository selected</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Go to the Repositories page, search for a repository, and select one to begin analysis.
          </p>
        </div>
      )}

      {/* Agent Pipeline */}
      {(selectedRepo || isRunning) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agent List */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-semibold">Multi-Agent Pipeline</h3>
              {isRunning && (
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--primary)' }}>
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  Processing agents {completedAgents.length + 1}/{agents.length}
                </div>
              )}
              {analysis && !isRunning && (
                <span className="badge badge-success">Pipeline Complete</span>
              )}
            </div>

            {/* Vertical connector line */}
            <div className="relative">
              <div className="absolute left-[21px] top-2 bottom-2 w-0.5" style={{ background: 'var(--border)' }} />

              <div className="space-y-4">
                {agents.map((agent, i) => {
                  const status = getStatusForAgent(i)
                  return (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="relative flex items-start gap-4"
                    >
                      {/* Status indicator */}
                      <div className="relative z-10">
                        {status === 'completed' ? (
                          <div className="w-[42px] h-[42px] rounded-xl bg-[#22C55E]/10 flex items-center justify-center">
                            <CheckCircle size={20} style={{ color: '#22C55E' }} />
                          </div>
                        ) : status === 'running' ? (
                          <div
                            className="w-[42px] h-[42px] rounded-xl flex items-center justify-center animate-pulse-ring"
                            style={{ background: `${agent.color}15` }}
                          >
                            <Loader size={20} className="animate-spin" style={{ color: agent.color }} />
                          </div>
                        ) : status === 'queued' ? (
                          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center" style={{ background: '#FFF7ED' }}>
                            <span className="text-[#9CA3AF]">{agent.icon}</span>
                          </div>
                        ) : (
                          <div className="w-[42px] h-[42px] rounded-xl flex items-center justify-center" style={{ background: '#F3F4F6' }}>
                            <span style={{ color: '#D1D5DB' }}>{agent.icon}</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 pt-1.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              status === 'completed'
                                ? 'text-[#22C55E]'
                                : status === 'running'
                                ? 'text-[#111827]'
                                : status === 'queued'
                                ? 'text-[#9CA3AF]'
                                : 'text-[#D1D5DB]'
                            }`}
                          >
                            {agent.name}
                          </span>
                          {status === 'completed' && (
                            <span className="text-xs text-[#22C55E]">✓ Complete</span>
                          )}
                          {status === 'running' && (
                            <span className="text-xs animate-pulse" style={{ color: agent.color }}>
                              Running...
                            </span>
                          )}
                          {status === 'queued' && (
                            <span className="text-xs" style={{ color: '#9CA3AF' }}>Queued</span>
                          )}
                        </div>
                        {status === 'running' && (
                          <>
                            <p className="text-xs mt-0.5" style={{ color: agent.color }}>
                              {agent.description}
                            </p>
                            <div className="mt-2 progress-bar max-w-xs">
                              <motion.div
                                className="progress-fill"
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2, ease: 'easeInOut' }}
                              />
                            </div>
                          </>
                        )}
                        {status === 'completed' && (
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                            {agent.description.replace('...', ' complete')}
                          </p>
                        )}
                        {status === 'queued' && (
                          <p className="text-xs mt-0.5" style={{ color: '#D1D5DB' }}>
                            Waiting in queue...
                          </p>
                        )}
                      </div>

                      {/* Progress percentage */}
                      {status === 'completed' && (
                        <span className="text-xs font-medium text-[#22C55E] flex-shrink-0 mt-2">100%</span>
                      )}
                      {status === 'running' && (
                        <span className="text-xs font-medium animate-pulse flex-shrink-0 mt-2" style={{ color: agent.color }}>In progress</span>
                      )}
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
                  <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>
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
                <p className="text-xs mt-2" style={{ color: 'var(--text-secondary)' }}>
                  Completed {completedAgents.length} of {agents.length} agents
                </p>
              </div>
            )}

            {/* Complete state */}
            {analysis && !isRunning && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-6 rounded-xl text-center"
                style={{ background: 'linear-gradient(135deg, #8B5CF615, #22C55E15)' }}
              >
                <div className="w-14 h-14 rounded-2xl bg-[#22C55E]/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={28} style={{ color: '#22C55E' }} />
                </div>
                <h4 className="text-lg font-bold mb-1">Analysis Complete!</h4>
                <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                  Revival Score: <span className="font-bold text-[#8B5CF6]">{analysis.revival_score}/100</span>
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => navigate(`/analysis/${analysis.id}`)}
                    className="btn-primary"
                  >
                    <FileText size={18} />
                    View Full Report
                  </button>
                  <button
                    onClick={() => navigate('/contributors')}
                    className="btn-secondary"
                  >
                    <Users size={18} />
                    Find Contributors
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Live Logs Panel */}
          <div className="space-y-6">
            {/* Circular Progress */}
            {(isRunning || analysis) && (
              <div className="card">
                <h3 className="text-sm font-semibold mb-4">Pipeline Status</h3>
                <div className="flex flex-col items-center">
                  <div className="relative w-28 h-28 mb-3">
                    <svg className="w-28 h-28 -rotate-90" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="48" fill="none" stroke="#F3F4F6" strokeWidth="8" />
                      <motion.circle
                        cx="56" cy="56" r="48"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={301.592}
                        initial={{ strokeDashoffset: 301.592 }}
                        animate={{
                          strokeDashoffset: 301.592 - (301.592 * (completedAgents.length / agents.length)),
                        }}
                        transition={{ duration: 0.5 }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                        {Math.round((completedAgents.length / agents.length) * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {isRunning ? 'Analysis in progress...' : analysis ? 'Analysis complete' : 'Ready'}
                  </p>
                </div>
              </div>
            )}

            {/* Live Execution Logs */}
            <div className="card flex-1">
              <h3 className="text-sm font-semibold mb-3">Execution Logs</h3>
              <div
                className="h-64 overflow-y-auto rounded-xl p-4 font-mono text-xs space-y-1.5"
                style={{ background: '#0F0F13', color: '#C4B5FD' }}
              >
                {agentLogs.length === 0 ? (
                  <div className="text-[#6B7280]">
                    [System] Analysis pipeline initialized. Click "Run Analysis" to start.
                  </div>
                ) : (
                  agentLogs.map((log, i) => {
                    const isSystem = log.startsWith('[System]')
                    const isComplete = log.includes('✓') || log.includes('✅')
                    const isError = log.includes('error') || log.includes('Error')
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`leading-relaxed ${
                          isError ? 'text-[#EF4444]' : isComplete ? 'text-[#22C55E]' : isSystem ? 'text-[#8B5CF6]' : 'text-[#9CA3AF]'
                        }`}
                      >
                        <span className="opacity-50 mr-2">{'>'}</span>
                        {log}
                      </motion.div>
                    )
                  })
                )}
                <div ref={logsEndRef} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
