import { motion } from 'framer-motion'
import { User, Mail, GitBranch, Shield, Calendar, BadgeCheck } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Profile</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Your account information</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-bold"
            style={{ background: 'linear-gradient(135deg, #8B5CF6, #7C3AED)' }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold">{user.name}</h2>
            <span className="badge badge-primary mt-1 capitalize">{user.role}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
            <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </div>

          {user.github_username && (
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
              <GitBranch size={18} style={{ color: 'var(--text-secondary)' }} />
              <div>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>GitHub</p>
                <p className="text-sm font-medium">@{user.github_username}</p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
            <Shield size={18} style={{ color: 'var(--text-secondary)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Role</p>
              <p className="text-sm font-medium capitalize">{user.role}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
            {user.is_verified ? <BadgeCheck size={18} style={{ color: '#22C55E' }} /> : <Calendar size={18} style={{ color: 'var(--text-secondary)' }} />}
            <div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Email Verified</p>
              <p className="text-sm font-medium">{user.is_verified ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
