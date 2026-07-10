import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, BarChart3, Users, MessageSquare, Target, TrendingUp } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import api from '@/lib/api'
import type { AdminAnalytics } from '@/lib/types'

const COLORS = ['#8B5CF6', '#22C55E', '#F59E0B', '#EF4444', '#C4B5FD']

export default function AdminAnalytics() {
  const { data, isLoading, error } = useQuery<AdminAnalytics>({
    queryKey: ['admin', 'analytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data),
  })

  if (error) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Platform Analytics</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Deep platform metrics and insights</p>
        </motion.div>
        <div className="card text-center py-12">
          <Activity size={48} className="mx-auto mb-4" style={{ color: 'var(--danger)' }} />
          <h3 className="text-lg font-semibold mb-2">Unable to load analytics</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {error instanceof Error ? error.message : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    )
  }

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

  const metrics = [
    { label: 'Total Users', value: ((data?.users?.total_startup_users ?? 0) + (data?.users?.total_freelancer_users ?? 0)), icon: <Users size={20} />, color: '#8B5CF6' },
    { label: 'Total Ideas', value: data?.ideas?.total ?? 0, icon: <BarChart3 size={20} />, color: '#22C55E' },
    { label: 'Analyses', value: data?.analyses?.total ?? 0, icon: <Activity size={20} />, color: '#F59E0B' },
    { label: 'Outreach Sent', value: data?.outreach?.total_sent ?? 0, icon: <MessageSquare size={20} />, color: '#EF4444' },
  ]

  const responseData = [
    { name: 'Accepted', value: data?.responses?.accepted ?? 0 },
    { name: 'Other', value: Math.max(0, (data?.responses?.total ?? 0) - (data?.responses?.accepted ?? 0)) },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Platform Analytics</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Deep platform metrics and insights</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="stat-card">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${m.color}15` }}>
                <span style={{ color: m.color }}>{m.icon}</span>
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--text)' }}>{m.value}</span>
            </div>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card">
          <h3 className="text-base font-semibold mb-4">Response Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={responseData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                  {responseData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Acceptance Rate: <span className="font-bold text-[#22C55E]">{data?.responses?.acceptance_rate ?? 0}%</span>
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                Matches: <span className="font-bold">{data?.contributor_matches?.total ?? 0}</span>
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
          <h3 className="text-base font-semibold mb-4">Platform Composition</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Startups</span>
                <span className="font-medium">{data?.users?.total_startup_users ?? 0}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((data?.users?.total_startup_users ?? 0) / Math.max(1, (data?.users?.total_startup_users ?? 0) + (data?.users?.total_freelancer_users ?? 0))) * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Freelancers</span>
                <span className="font-medium">{data?.users?.total_freelancer_users ?? 0}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((data?.users?.total_freelancer_users ?? 0) / Math.max(1, (data?.users?.total_startup_users ?? 0) + (data?.users?.total_freelancer_users ?? 0))) * 100}%`, background: '#22C55E' }} />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
