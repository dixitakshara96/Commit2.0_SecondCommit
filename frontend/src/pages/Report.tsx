import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText, TrendingUp, Brain, Users, AlertTriangle,
  CheckCircle, ArrowLeft, Download, BarChart3,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from 'recharts'
import api from '@/lib/api'
import type { AnalysisRead } from '@/lib/types'

const COLORS = ['#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#C4B5FD']

function ScoreGauge({ value, label, color }: { value: number; label: string; color: string }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const progress = ((100 - value) / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width="100" height="100" className="transform -rotate-90">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#F3F4F6" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={progress}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <span className="text-2xl font-bold -mt-16" style={{ color }}>{value}</span>
      <span className="text-xs mt-2 text-center" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}

export default function Report() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const analysisId = id ? parseInt(id) : null

  const { data: analysis, isLoading } = useQuery<AnalysisRead>({
    queryKey: ['analysis', analysisId],
    queryFn: () => api.get(`/analysis/${analysisId}`).then((r) => r.data),
    enabled: !!analysisId,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      </div>
    )
  }

  if (!analysis) {
    return (
      <div className="card text-center py-12">
        <FileText size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
        <h3 className="text-lg font-semibold mb-2">Analysis not found</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Run an analysis first to see the report</p>
        <button onClick={() => navigate('/analysis')} className="btn-primary">Go to Analysis</button>
      </div>
    )
  }

  const scores = [
    { label: 'Revival', value: analysis.revival_score, color: '#8B5CF6' },
    { label: 'Health', value: analysis.project_health_score, color: '#22C55E' },
    { label: 'Documentation', value: analysis.documentation_score, color: '#F59E0B' },
    { label: 'Tech Debt', value: 100 - analysis.technical_debt_score, color: '#EF4444' },
    { label: 'Trend', value: analysis.trend_score, color: '#8B5CF6' },
  ]

  const effortData = [
    { name: 'AI Effort', value: Math.round(analysis.ai_effort_percentage) },
    { name: 'Human Effort', value: Math.round(analysis.human_effort_percentage) },
  ]

  const radarData = scores.map((s) => ({
    subject: s.label,
    score: s.value,
    fullMark: 100,
  }))

  const timelineData = [
    { phase: 'Discovery', weeks: 2, tasks: 8 },
    { phase: 'Planning', weeks: 3, tasks: 12 },
    { phase: 'Development', weeks: 8, tasks: 30 },
    { phase: 'Testing', weeks: 3, tasks: 15 },
    { phase: 'Launch', weeks: 2, tasks: 8 },
  ]

  const severityColors: Record<string, string> = {
    CRITICAL: '#EF4444',
    HIGH: '#F59E0B',
    MEDIUM: '#8B5CF6',
    LOW: '#22C55E',
  }

  const criticalFindings = analysis.findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH')
  const roles = analysis.required_roles

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/analysis')} className="btn-ghost p-2">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Project Revival Report</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Generated {new Date(analysis.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="btn-secondary">
          <Download size={18} />
          Export PDF
        </button>
      </motion.div>

      {/* Executive Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`card ${analysis.safe_to_revive ? 'ring-2 ring-[#22C55E]' : 'ring-2 ring-[#F59E0B]'}`}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
            analysis.safe_to_revive ? 'bg-[#22C55E]/10' : 'bg-[#F59E0B]/10'
          }`}>
            {analysis.safe_to_revive
              ? <CheckCircle size={24} style={{ color: '#22C55E' }} />
              : <AlertTriangle size={24} style={{ color: '#F59E0B' }} />
            }
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">
              {analysis.safe_to_revive ? 'Safe to Revive' : 'Proceed with Caution'}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              {analysis.executive_summary}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Score Gauges */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-5 gap-4"
      >
        {scores.map((score, i) => (
          <motion.div
            key={score.label}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + i * 0.1 }}
            className="card"
          >
            <ScoreGauge value={score.value} label={score.label} color={score.color} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Radar / Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4">Project Health Radar</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#ECE8FF" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12, fill: '#6B7280' }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#9CA3AF' }} />
              <Radar name="Score" dataKey="score" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ECE8FF' }} />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* AI vs Human */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4">AI vs Human Effort</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="55%" height={250}>
              <PieChart>
                <Pie
                  data={effortData}
                  cx="50%" cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {effortData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-4">
              {effortData.map((item, i) => (
                <div key={item.name}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                    <span className="text-sm font-medium">{item.name}</span>
                    <span className="text-sm font-bold" style={{ color: COLORS[i] }}>{item.value}%</span>
                  </div>
                  <div className="progress-bar w-32">
                    <div className="progress-fill" style={{ width: `${item.value}%`, background: COLORS[i] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="card"
      >
        <h3 className="text-base font-semibold mb-4">Estimated Revival Timeline</h3>
        <div className="flex items-end gap-3 h-40">
          {timelineData.map((phase, i) => (
            <div key={phase.phase} className="flex-1 flex flex-col items-center gap-2">
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{phase.tasks} tasks</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(phase.weeks / 8) * 100}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                className="w-full rounded-t-lg"
                style={{ background: `var(--primary)`, opacity: 0.3 + i * 0.15 }}
              />
              <span className="text-xs font-medium">{phase.phase}</span>
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{phase.weeks}w</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Findings & Roles */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Critical Findings */}
        {criticalFindings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="card"
          >
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle size={18} style={{ color: '#EF4444' }} />
              Priority Issues
            </h3>
            <div className="space-y-3">
              {criticalFindings.map((finding) => (
                <div key={finding.id} className="p-3 rounded-xl" style={{ background: `${severityColors[finding.severity] || '#6B7280'}08` }}>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="badge"
                      style={{
                        background: `${severityColors[finding.severity] || '#6B7280'}15`,
                        color: severityColors[finding.severity] || '#6B7280',
                      }}
                    >
                      {finding.severity}
                    </span>
                    <span className="text-sm font-medium">{finding.title}</span>
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{finding.description}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Required Roles */}
        {roles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="card"
          >
            <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
              <Users size={18} style={{ color: '#8B5CF6' }} />
              Required Skills
            </h3>
            <div className="space-y-3">
              {roles.sort((a, b) => b.priority - a.priority).map((role) => (
                <div key={role.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
                  <span className="badge badge-primary">P{role.priority}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{role.role}</p>
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{role.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Contributors */}
      {analysis.contributor_matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Users size={18} style={{ color: '#22C55E' }} />
            Recommended Contributors ({analysis.contributor_matches.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.contributor_matches.slice(0, 4).map((match) => (
              <div key={match.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
                <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center">
                  <Users size={18} style={{ color: '#8B5CF6' }} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">@{match.github_username}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Match: {Math.round(match.match_score)}% · Activity: {Math.round(match.recent_activity_score)}%
                  </p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {match.matched_skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="badge badge-primary text-[10px]">{skill}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* All Findings */}
      {analysis.findings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4">All Findings ({analysis.findings.length})</h3>
          <div className="space-y-2">
            {analysis.findings.map((finding) => (
              <div key={finding.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F4F1FF] transition-colors">
                <span
                  className="badge flex-shrink-0 mt-0.5"
                  style={{
                    background: `${severityColors[finding.severity] || '#6B7280'}15`,
                    color: severityColors[finding.severity] || '#6B7280',
                  }}
                >
                  {finding.severity}
                </span>
                <div>
                  <p className="text-sm font-medium">{finding.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{finding.recommendation}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
