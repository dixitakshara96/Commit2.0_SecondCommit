import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Briefcase, Mail, CheckCircle, TrendingUp, Target, Star, Users, Clock } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import type { FreelancerDashboardResponse } from '@/lib/types'

const COLORS = ['#8B5CF6', '#C4B5FD', '#22C55E', '#F59E0B']

export default function FreelancerDashboard() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<FreelancerDashboardResponse>({
    queryKey: ['dashboard', 'freelancer'],
    queryFn: () => api.get('/dashboard/freelancer').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const overview = data?.collaboration_overview
  const analytics = data?.smart_analytics

  const stats = [
    { label: 'Invitations', value: overview?.total_invitations_received ?? 0, icon: <Mail size={20} />, color: '#8B5CF6' },
    { label: 'Accepted', value: overview?.accepted_collaborations_count ?? 0, icon: <CheckCircle size={20} />, color: '#22C55E' },
    { label: 'Pending', value: overview?.pending_invitations_count ?? 0, icon: <Clock size={20} />, color: '#F59E0B' },
    { label: 'Match Score', value: `${analytics?.profile_matching_score ?? 0}%`, icon: <Target size={20} />, color: '#8B5CF6' },
  ]

  const skillData = [
    { name: 'Match Score', value: analytics?.profile_matching_score ?? 75 },
    { name: 'Acceptance Rate', value: analytics?.invitation_acceptance_rate ?? 60 },
    { name: 'Fit Rating', value: analytics?.avg_collaboration_fit_rating ?? 70 },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Freelancer Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Market Demand: <span className="font-medium text-[#8B5CF6]">{analytics?.market_demand_index ?? 'Medium'}</span>
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${stat.color}15` }}>
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <h3 className="text-base font-semibold mb-4">Profile Performance</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={skillData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ECE8FF' }} />
              <Bar dataKey="value" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Recommended Projects */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
          <h3 className="text-base font-semibold mb-4">Recommended Projects</h3>
          <div className="space-y-3">
            {(data?.recommended_projects ?? []).slice(0, 4).map((project, i) => (
              <div key={project.project_id} className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F4F1FF] transition-colors cursor-pointer"
                onClick={() => navigate(`/analysis/${project.project_id}`)}>
                <div>
                  <p className="text-sm font-medium">{project.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{project.startup_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="progress-bar w-20">
                    <div className="progress-fill" style={{ width: `${project.matching_score}%` }} />
                  </div>
                  <span className="text-xs font-medium">{Math.round(project.matching_score)}%</span>
                </div>
              </div>
            ))}
            {(!data?.recommended_projects || data.recommended_projects.length === 0) && (
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No project recommendations yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

