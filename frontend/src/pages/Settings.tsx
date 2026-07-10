import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Shield, Mail, Loader, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [isVerifying, setIsVerifying] = useState(false)

  const handleVerifyEmail = async () => {
    setIsVerifying(true)
    try {
      await api.post('/auth/verify-email')
      await refreshUser()
      toast.success('Email verified successfully!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage your account settings</p>
      </motion.div>

      {/* Profile Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <User size={20} style={{ color: 'var(--primary)' }} />
          <h3 className="text-base font-semibold">Profile</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Display Name</label>
            <input
              type="text"
              value={user?.name || ''}
              disabled
              className="input-field opacity-60"
            />
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Name updates coming soon
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Email</label>
            <div className="flex gap-3">
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="input-field opacity-60 flex-1"
              />
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
              Email cannot be changed
            </p>
          </div>
          {user?.github_username && (
            <div>
              <label className="block text-sm font-medium mb-1.5">GitHub Username</label>
              <input
                type="text"
                value={user.github_username}
                disabled
                className="input-field opacity-60"
              />
            </div>
          )}
        </div>
      </div>

      {/* Security / Email Verification */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} style={{ color: 'var(--primary)' }} />
          <h3 className="text-base font-semibold">Security</h3>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--sidebar)' }}>
            <div className="flex items-center gap-3">
              <Mail size={18} style={{ color: 'var(--text-secondary)' }} />
              <div>
                <p className="text-sm font-medium">Email Verification</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {user?.is_verified ? 'Your email is verified' : 'Verify your email address'}
                </p>
              </div>
            </div>
            {user?.is_verified ? (
              <span className="badge badge-success flex items-center gap-1">
                <CheckCircle size={12} /> Verified
              </span>
            ) : (
              <button
                onClick={handleVerifyEmail}
                disabled={isVerifying}
                className="btn-primary text-sm py-2"
              >
                {isVerifying ? (
                  <Loader size={14} className="animate-spin" />
                ) : null}
                {isVerifying ? 'Verifying...' : 'Verify Now'}
              </button>
            )}
          </div>
        </div>
      </div>


    </div>
  )
}
