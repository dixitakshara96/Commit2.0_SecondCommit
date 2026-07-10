import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  FileText, TrendingUp, Brain, Users, AlertTriangle,
  CheckCircle, ArrowLeft, Download, BarChart3, Star,
  GitBranch, ExternalLink, Target, Shield, Zap, Layers,
  Cpu, BookOpen, Activity, Code,
} from 'lucide-react'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from 'recharts'
import api from '@/lib/api'
import type { AnalysisRead } from '@/lib/types'

function CircularGauge({ value, label, color, size = 140, strokeWidth = 10 }: { value: number; label: string; color: string; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#F3F4F6" strokeWidth={strokeWidth} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />
      </svg>
      <div className="flex flex-col items-center -mt-[60px]">
        <span className="text-3xl font-bold" style={{ color }}>{value}</span>
        <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>/ 100</span>
      </div>
      <span className="text-xs font-medium mt-1 text-center" style={{ color: 'var(--text-secondary)' }}>{label}</span>
    </div>
  )
}

const WEIGHTED_SCORES = [
  { label: 'Repository Health', weight: 0.30, color: '#8B5CF6', key: 'project_health_score' as const },
  { label: 'Documentation', weight: 0.20, color: '#22C55E', key: 'documentation_score' as const },
  { label: 'Technical Debt (inverted)', weight: 0.20, color: '#F59E0B', key: 'technical_debt_score' as const, invert: true },
  { label: 'Trend Prediction', weight: 0.15, color: '#8B5CF6', key: 'trend_score' as const },
  { label: 'AI Capability', weight: 0.15, color: '#EF4444', key: 'revival_score' as const },
]

function computeWeightedScore(analysis: AnalysisRead): number {
  let total = 0
  for (const s of WEIGHTED_SCORES) {
    const raw = analysis[s.key] ?? 50
    const val = s.invert ? 100 - raw : raw
    total += val * s.weight
  }
  return Math.round(total)
}

const MOCK_RISKS = [
  { risk: 'Single maintainer bus factor — 95% of commits from one contributor', severity: 'High', impact: 'Critical' },
  { risk: 'Outdated dependencies with known CVEs in TensorFlow 2.8', severity: 'High', impact: 'Production risk' },
  { risk: 'Test coverage below 15% in core execution engine', severity: 'Medium', impact: 'Regression risk' },
  { risk: 'No REST API layer for external integrations', severity: 'Medium', impact: 'Limited extensibility' },
  { risk: 'Deprecated Python 3.7 APIs — will break on upgrade to 3.12+', severity: 'Low', impact: 'Migration effort' },
]

const MOCK_MISSING_FEATURES = [
  'Native mobile SDK support',
  'Built-in authentication & authorization',
  'Real-time collaboration features',
  'GraphQL API endpoint',
  'Plugin/extension system',
  'Multi-cloud deployment support',
]

const MOCK_NEXT_STEPS = [
  'Update all core dependencies to latest stable versions',
  'Achieve 70%+ test coverage on critical modules',
  'Design and implement a RESTful API using FastAPI',
  'Onboard 2-3 core maintainers to reduce bus factor',
  'Set up automated documentation generation pipeline',
  'Create comprehensive contribution guidelines',
]

const MOCK_TECH_STACK = [
  { name: 'Python', category: 'Language', score: 72, color: '#3572A5' },
  { name: 'TypeScript', category: 'Language', score: 18, color: '#3178C6' },
  { name: 'Shell', category: 'Scripting', score: 7, color: '#89E051' },
  { name: 'Dockerfile', category: 'Infra', score: 3, color: '#2496ED' },
]

const severityColors: Record<string, string> = {
  CRITICAL: '#EF4444',
  HIGH: '#F59E0B',
  MEDIUM: '#8B5CF6',
  LOW: '#22C55E',
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
        <FileText size={48} className="mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analysis not found</h3>
        <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Run an analysis first to see the report</p>
        <button onClick={() => navigate('/analysis')} className="btn-primary">Go to Analysis</button>
      </div>
    )
  }

  const finalScore = computeWeightedScore(analysis)
  const radarData = [
    { subject: 'Health', score: analysis.project_health_score, fullMark: 100 },
    { subject: 'Docs', score: analysis.documentation_score, fullMark: 100 },
    { subject: 'Tech Debt', score: 100 - analysis.technical_debt_score, fullMark: 100 },
    { subject: 'Trend', score: analysis.trend_score, fullMark: 100 },
    { subject: 'AI Cap.', score: analysis.ai_effort_percentage, fullMark: 100 },
  ]

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

      {/* Executive Summary + Revival Score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`lg:col-span-2 card ${analysis.safe_to_revive ? 'ring-2 ring-[#22C55E]' : 'ring-2 ring-[#F59E0B]'}`}
        >
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${
              analysis.safe_to_revive ? 'bg-[#22C55E]/10' : 'bg-[#F59E0B]/10'
            }`}>
              {analysis.safe_to_revive
                ? <CheckCircle size={28} style={{ color: '#22C55E' }} />
                : <AlertTriangle size={28} style={{ color: '#F59E0B' }} />
              }
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                {analysis.safe_to_revive ? 'Safe to Revive' : 'Proceed with Caution'}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {analysis.executive_summary}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Revival Score Circular Gauge */}
        <motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ delay: 0.15 }}
  className="card p-6 bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center min-h-[220px] w-full"
>
  {/* Project Revival Report Icon Grid */}
  <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center mb-4 text-violet-600 shadow-inner">
    <svg xmlns="http://w3.org" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 0A48.536 48.536 0 0 1 12 3m0 0c2.917 0 5.747.294 8.5.862m-21 10.398c0-.552.448-1 1-1h6.25a1 1 0 0 1 1 1v3.83a1 1 0 0 1-1 1H2.5a1 1 0 0 1-1-1v-3.83Z" />
    </svg>
  </div>

  {/* Card Headings */}
  <h3 className="text-sm font-bold text-slate-800 tracking-tight">Project Revival Report</h3>
  <p className="text-xs text-slate-400 mt-1 max-w-[180px] leading-normal">
    Detailed workspace health tracking metrics generated successfully.
  </p>
</motion.div>
</div>


      {/* Weighted Scoring Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <h3 className="text-base font-semibold mb-4">Weighted Scoring Breakdown</h3>
        <div className="space-y-3">
          {WEIGHTED_SCORES.map((s) => {
            const raw = analysis[s.key] ?? 50
            const val = s.invert ? 100 - raw : raw
            const weighted = (val * s.weight).toFixed(1)
            return (
              <div key={s.label} className="flex items-center gap-4">
                <div className="w-44 flex-shrink-0">
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 progress-bar">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${val}%` }}
                        transition={{ duration: 1, delay: 0.3 }}
                        style={{ background: s.color }}
                      />
                    </div>
                    <span className="text-sm font-bold w-10 text-right" style={{ color: s.color }}>{val}</span>
                    <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>× {s.weight.toFixed(2)}</span>
                    <span className="text-sm font-bold w-14 text-right" style={{ color: s.color }}>={weighted}</span>
                  </div>
                </div>
              </div>
            )
          })}
          <div className="pt-3 mt-3 border-t flex items-center justify-end gap-4" style={{ borderColor: 'var(--border)' }}>
            <span className="text-sm font-semibold">Final Revival Score</span>
            <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{finalScore} / 100</span>
          </div>
        </div>
      </motion.div>

     {/* Score Gauges Row */}
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
  {[
    { label: 'Repo Health', value: analysis.project_health_score || 0, color: '#8B5CF6' },
    { label: 'Documentation', value: analysis.documentation_score || 0, color: '#22C55E' },
    { label: 'Tech Debt (clean)', value: 100 - (analysis.technical_debt_score || 0), color: '#F59E0B' },
    { label: 'Trend', value: analysis.trend_score || 0, color: '#EF4444' },
    { label: 'AI Capability', value: analysis.ai_effort_percentage || 0, color: '#EF4444' }, 
  ].map((score, i) => {
    // Exact mathematical calculations for the SVG circle stroke
    const size = 100;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (score.value / 100) * circumference;

    return (
      <motion.div
        key={score.label}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.25 + i * 0.08 }}
        className="card flex flex-col items-center justify-between p-5 min-h-[190px] text-center bg-white rounded-xl shadow-sm border border-slate-100"
      >
        {/* Pure Self-Contained SVG Gauge */}
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle track */}
            <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="transparent" />
            {/* Colored progress line */}
            <circle cx={size / 2} cy={size / 2} r={radius} stroke={score.color} strokeWidth={strokeWidth} fill="transparent"
              strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-500 ease-out" />
          </svg>
          {/* Numbers locked inside the center space */}
          <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
            <span className="text-xl font-bold tracking-tight text-slate-800">{score.value}</span>
            <span className="text-[10px] text-slate-400 font-medium mt-0.5">/ 100</span>
          </div>
        </div>

        {/* Labels strictly separated below the graphic elements */}
        <span className="text-xs font-semibold text-slate-600 mt-3 block w-full truncate px-1">
          {score.label}
        </span>
      </motion.div>
    );
  })}
</div>

{/* AI vs Human Contribution */}
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.3 }}
  className="card p-6 mt-6 bg-white rounded-xl shadow-sm border border-slate-100"
>
  <h3 className="text-base font-semibold mb-6 text-slate-800">AI Contribution vs Human Contribution</h3>
  <div className="flex flex-col sm:flex-row items-start justify-center gap-12 py-4">
    
    {/* Human Contribution Block */}
    {(() => {
      const size = 130;
      const strokeWidth = 10;
      const radius = (size - strokeWidth) / 2;
      const circumference = radius * 2 * Math.PI;
      const value = Math.round(analysis.human_effort_percentage || 0);
      const strokeDashoffset = circumference - (value / 100) * circumference;

      return (
        <div className="flex flex-col items-center text-center w-full sm:w-1/2 max-w-[220px]">
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="transparent" />
              <circle cx={size / 2} cy={size / 2} r={radius} stroke="#8B5CF6" strokeWidth={strokeWidth} fill="transparent"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-500 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-2xl font-bold tracking-tight text-slate-800">{value}</span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">/ 100</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 mt-4">Human Contribution</span>
          <p className="text-[11px] mt-2 leading-relaxed text-slate-500">
            Strategic architecture, UX design, community management, and code review
          </p>
        </div>
      );
    })()}

    {/* AI Contribution Block */}
    {(() => {
      const size = 130;
      const strokeWidth = 10;
      const radius = (size - strokeWidth) / 2;
      const circumference = radius * 2 * Math.PI;
      const value = Math.round(analysis.ai_effort_percentage || 0);
      const strokeDashoffset = circumference - (value / 100) * circumference;

      return (
        <div className="flex flex-col items-center text-center w-full sm:w-1/2 max-w-[220px]">
          <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius} stroke="#F1F5F9" strokeWidth={strokeWidth} fill="transparent" />
              <circle cx={size / 2} cy={size / 2} r={radius} stroke="#22C55E" strokeWidth={strokeWidth} fill="transparent"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-500 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
              <span className="text-2xl font-bold tracking-tight text-slate-800">{value}</span>
              <span className="text-[11px] text-slate-400 font-medium mt-0.5">/ 100</span>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700 mt-4">AI Contribution</span>
          <p className="text-[11px] mt-2 leading-relaxed text-slate-500">
            Automated testing, code refactoring, documentation generation, and dependency updates
          </p>
        </div>
      );
    })()}

  </div>
</motion.div>




      {/* Radar & Tech Stack */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4">Health Radar</h3>
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4">Technology Stack</h3>
          <div className="space-y-4">
            {MOCK_TECH_STACK.map((tech) => (
              <div key={tech.name}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-sm" style={{ background: tech.color }} />
                    <span className="font-medium">{tech.name}</span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{tech.category}</span>
                </div>
                <div className="progress-bar">
                  <motion.div
                    className="progress-fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${tech.score}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    style={{ background: tech.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Total files: {String(analysis.analysis_metadata?.total_files ?? 'N/A')} · Lines: {String(analysis.analysis_metadata?.total_lines ?? 'N/A')}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Risk Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="card"
      >
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle size={18} style={{ color: '#EF4444' }} />
          Risk Analysis
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MOCK_RISKS.map((risk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.05 }}
              className="p-3 rounded-xl"
              style={{ background: risk.severity === 'High' ? '#FEF2F2' : risk.severity === 'Medium' ? '#FFF7ED' : '#F0FDF4' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className={`badge text-[10px] ${
                  risk.severity === 'High' ? 'badge-danger' : risk.severity === 'Medium' ? 'badge-warning' : 'badge-success'
                }`}>
                  {risk.severity}
                </span>
                <span className="text-xs font-medium">{risk.risk}</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Impact: {risk.impact}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Missing Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="card"
      >
        <h3 className="text-base font-semibold mb-4">Missing Features</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {MOCK_MISSING_FEATURES.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.05 }}
              className="flex items-center gap-2 p-2.5 rounded-xl"
              style={{ background: 'var(--sidebar)' }}
            >
              <Target size={14} style={{ color: '#F59E0B' }} />
              <span className="text-xs">{feature}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recommended Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="card"
      >
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Zap size={18} style={{ color: '#22C55E' }} />
          Recommended Next Steps
        </h3>
        <div className="space-y-2">
          {MOCK_NEXT_STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: i < 2 ? '#F0FDF4' : 'var(--sidebar)' }}
            >
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                i < 2 ? 'bg-[#22C55E]/10 text-[#22C55E]' : 'bg-[#8B5CF6]/10 text-[#8B5CF6]'
              }`}>
                {i + 1}
              </div>
              <span className="text-sm">{step}</span>
              {i < 2 && <span className="badge badge-success text-[10px]">High Priority</span>}
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Required Skills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="card"
      >
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Users size={18} style={{ color: '#8B5CF6' }} />
          Required Skills
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {roles.sort((a, b) => a.priority - b.priority).map((role) => (
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

      {/* Priority Issues */}
      {criticalFindings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
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

      {/* Contributors */}
      {analysis.contributor_matches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4">Recommended Contributors</h3>
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

      {/* Overall Recommendation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
        className={`card text-center py-6 ${
          analysis.safe_to_revive ? 'ring-2 ring-[#22C55E]' : 'ring-2 ring-[#F59E0B]'
        }`}
      >
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
          analysis.safe_to_revive ? 'bg-[#22C55E]/10' : 'bg-[#F59E0B]/10'
        }`}>
          {analysis.safe_to_revive
            ? <CheckCircle size={32} style={{ color: '#22C55E' }} />
            : <AlertTriangle size={32} style={{ color: '#F59E0B' }} />
          }
        </div>
        <h3 className="text-xl font-bold mb-2">
          {analysis.safe_to_revive ? 'This Repository is Worth Reviving' : 'Proceed with Caution'}
        </h3>
        <p className="text-sm max-w-2xl mx-auto mb-4" style={{ color: 'var(--text-secondary)' }}>
          {analysis.safe_to_revive
            ? `With a weighted revival score of ${finalScore}/100, this repository shows strong potential for successful revival. The combination of solid architecture, active community interest, and clear market demand makes it an excellent candidate for investment. Focus on the recommended next steps to maximize revival success.`
            : 'The repository has significant challenges that need to be addressed before revival. Consider the risk factors and required investment carefully.'}
        </p>
        <div className="flex justify-center gap-3">
          <button onClick={() => navigate('/contributors')} className="btn-primary">
            <Users size={18} />
            Find Contributors
          </button>
          <button onClick={() => navigate('/outreach')} className="btn-secondary">
            <Target size={18} />
            Start Outreach
          </button>
        </div>
      </motion.div>
    </div>
  )
}
