import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Lightbulb, BarChart3, Users, Clock, TrendingUp, Target, Activity, Send } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import api from '@/lib/api'
import type { StartupDashboardResponse } from '@/lib/types'

const COLORS = ['#8B5CF6', '#C4B5FD', '#22C55E', '#F59E0B']

export default function StartupDashboard() {
  const { data, isLoading } = useQuery<StartupDashboardResponse>({
    queryKey: ['dashboard', 'startup'],
    queryFn: () => api.get('/dashboard/startup').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 skeleton" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  const summary = data?.summary_metrics
  const analytics = data?.advanced_analytics

  const stats = [
    { label: 'Ideas Submitted', value: summary?.total_ideas_submitted ?? 0, icon: <Lightbulb size={20} />, color: '#8B5CF6' },
    { label: 'Active Analyses', value: summary?.active_analyses_count ?? 0, icon: <BarChart3 size={20} />, color: '#22C55E' },
    { label: 'Contributors Contacted', value: summary?.contributors_contacted ?? 0, icon: <Users size={20} />, color: '#F59E0B' },
    { label: 'Pending Responses', value: summary?.pending_responses_count ?? 0, icon: <Clock size={20} />, color: '#EF4444' },
  ]

  const advancedStats = [
    { label: 'Revival Score', value: `${analytics?.idea_revival_score ?? 0}%`, icon: <TrendingUp size={18} />, color: '#8B5CF6' },
    { label: 'Response Rate', value: `${analytics?.response_rate_percentage ?? 0}%`, icon: <Send size={18} />, color: '#22C55E' },
    { label: 'Analysis Velocity', value: analytics?.analysis_velocity ?? 0, icon: <Activity size={18} />, color: '#F59E0B' },
    { label: 'Conversion Index', value: analytics?.outreach_conversion_index ?? 0, icon: <Target size={18} />, color: '#8B5CF6' },
  ]

  const pieData = [
    { name: 'AI Tasks', value: 65 },
    { name: 'Human Tasks', value: 35 },
  ]

  const barData = [
    { name: 'Mon', analyses: 2, outreach: 1 },
    { name: 'Tue', analyses: 3, outreach: 2 },
    { name: 'Wed', analyses: 1, outreach: 3 },
    { name: 'Thu', analyses: 4, outreach: 1 },
    { name: 'Fri', analyses: 2, outreach: 2 },
    { name: 'Sat', analyses: 1, outreach: 0 },
    { name: 'Sun', analyses: 0, outreach: 1 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your startup revival overview</p>
      </motion.div>

      {/* Summary Stats */}
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
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}15` }}
              >
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>
                {stat.value}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Advanced Analytics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {advancedStats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="card"
          >
            <div className="flex items-center gap-3 mb-2">
              <span style={{ color: stat.color }}>{stat.icon}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{stat.label}</span>
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>{stat.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* AI vs Human Effort */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text)' }}>AI vs Human Effort</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {item.name}: {item.value}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Weekly Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="card"
        >
          <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text)' }}>Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #ECE8FF',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              />
              <Bar dataKey="analyses" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Analyses" />
              <Bar dataKey="outreach" fill="#C4B5FD" radius={[4, 4, 0, 0]} name="Outreach" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
