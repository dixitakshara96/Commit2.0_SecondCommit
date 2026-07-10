import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Lightbulb, BarChart3, Activity, TrendingUp, Target, Shield, UserCheck } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
import api from '@/lib/api'
import type { AdminDashboardResponse } from '@/lib/types'

const COLORS = ['#8B5CF6', '#C4B5FD', '#22C55E', '#F59E0B', '#EF4444']

export default function AdminDashboard() {
  const { data, isLoading } = useQuery<AdminDashboardResponse>({
    queryKey: ['dashboard', 'admin'],
    queryFn: () => api.get('/dashboard/admin').then((r) => r.data),
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

  const aggregates = data?.system_aggregates
  const health = data?.ecosystem_health

  const stats = [
    { label: 'Startup Users', value: aggregates?.total_startup_users ?? 0, icon: <Users size={20} />, color: '#8B5CF6' },
    { label: 'Freelancers', value: aggregates?.total_freelancer_users ?? 0, icon: <UserCheck size={20} />, color: '#22C55E' },
    { label: 'Analyses', value: aggregates?.total_analyses_executed ?? 0, icon: <BarChart3 size={20} />, color: '#F59E0B' },
    { label: 'Activity Rate', value: `${health?.platform_activity_rate_7d ?? 0}%`, icon: <Activity size={20} />, color: '#EF4444' },
  ]

  const healthStats = [
    { label: 'F/S Ratio', value: health?.freelancer_to_startup_ratio ?? 0, icon: <TrendingUp size={18} />, color: '#8B5CF6' },
    { label: 'Unverified', value: health?.unverified_users_count ?? 0, icon: <Shield size={18} />, color: '#F59E0B' },
    { label: 'Avg Analyses/Startup', value: health?.avg_analyses_per_startup ?? 0, icon: <Target size={18} />, color: '#22C55E' },
  ]

  const pieData = [
    { name: 'Startups', value: aggregates?.total_startup_users ?? 0 },
    { name: 'Freelancers', value: aggregates?.total_freelancer_users ?? 0 },
  ]

  const weekData = [
    { day: 'Mon', users: 12, analyses: 8 },
    { day: 'Tue', users: 18, analyses: 12 },
    { day: 'Wed', users: 15, analyses: 10 },
    { day: 'Thu', users: 22, analyses: 15 },
    { day: 'Fri', users: 20, analyses: 14 },
    { day: 'Sat', users: 8, analyses: 5 },
    { day: 'Sun', users: 5, analyses: 3 },
  ]

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Admin Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Platform overview & health metrics</p>
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

      {/* Health */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {healthStats.map((stat, i) => (
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card">
          <h3 className="text-base font-semibold mb-4">User Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card">
          <h3 className="text-base font-semibold mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={weekData}>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
              <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #ECE8FF' }} />
              <Area type="monotone" dataKey="users" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.1} strokeWidth={2} />
              <Area type="monotone" dataKey="analyses" stroke="#22C55E" fill="#22C55E" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
