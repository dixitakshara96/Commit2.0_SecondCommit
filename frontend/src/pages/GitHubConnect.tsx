import { useState } from 'react'
import { motion } from 'framer-motion'
import { GitBranch, Link, CheckCircle, Loader, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function GitHubConnect() {
  const { user, refreshUser } = useAuth()
  const [username, setUsername] = useState(user?.github_username || '')
  const [isConnecting, setIsConnecting] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleConnect = async () => {
    if (!username) {
      toast.error('Enter a GitHub username')
      return
    }
    setIsConnecting(true)
    try {
      await api.post('/profile/github/connect', { github_username: username })
      await refreshUser()
      toast.success('GitHub account connected!')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to connect')
    } finally {
      setIsConnecting(false)
    }
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    try {
      const res = await api.post('/profile/analyze')
      toast.success(`Analyzed! Found ${res.data.skills?.length || 0} skills`)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const isConnected = !!user?.github_username

  return (
    <div className="space-y-6 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>GitHub Integration</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Connect your GitHub account to enable skill matching and project recommendations
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6]/10 flex items-center justify-center">
            <GitBranch size={28} style={{ color: '#8B5CF6' }} />
          </div>
          <div>
            <h3 className="text-base font-semibold">Connect GitHub</h3>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {isConnected ? `Connected as @${user.github_username}` : 'Link your GitHub profile'}
            </p>
          </div>
          {isConnected && (
            <span className="badge badge-success ml-auto">
              <CheckCircle size={12} /> Connected
            </span>
          )}
        </div>

        <div className="flex gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field flex-1"
            placeholder="GitHub username"
            disabled={isConnected}
          />
          <button
            onClick={isConnected ? handleAnalyze : handleConnect}
            disabled={isConnecting || isAnalyzing || !username}
            className="btn-primary"
          >
            {isConnecting || isAnalyzing ? (
              <Loader size={18} className="animate-spin" />
            ) : isConnected ? (
              <RefreshCw size={18} />
            ) : (
              <Link size={18} />
            )}
            {isConnected ? 'Re-analyze' : 'Connect'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
