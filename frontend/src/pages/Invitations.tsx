import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Briefcase, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import type { FreelancerDashboardResponse } from '@/lib/types'

export default function Invitations() {
  const { user } = useAuth()
  const [invitations, setInvitations] = useState<any[]>([])

  const { data, isLoading } = useQuery<FreelancerDashboardResponse>({
    queryKey: ['freelancer', 'invitations'],
    queryFn: () => api.get('/profile/projects/recommended').then((r) => r.data),
    enabled: !!user?.github_username,
  })

  // Build invitations list from recommended projects
  useEffect(() => {
    if (data?.recommended_projects) {
      setInvitations(
        data.recommended_projects.map((p) => ({
          id: p.project_id,
          project: p.title,
          startup: p.startup_name,
          score: p.matching_score,
          status: 'pending' as const,
          reasons: p.matching_reasons,
        }))
      )
    }
  }, [data])

  const handleAccept = async (analysisId: number) => {
    try {
      await api.post(`/profile/projects/${analysisId}/accept`)
      toast.success('Invitation accepted!')
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === analysisId ? { ...inv, status: 'accepted' as const } : inv
        )
      )
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to accept')
    }
  }

  const handleDecline = async (analysisId: number) => {
    try {
      await api.post(`/profile/projects/${analysisId}/decline`)
      toast.success('Invitation declined')
      setInvitations((prev) =>
        prev.map((inv) =>
          inv.id === analysisId ? { ...inv, status: 'declined' as const } : inv
        )
      )
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to decline')
    }
  }

  if (!user?.github_username) {
    return (
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Invitations</h1>
        </motion.div>
        <div className="card text-center py-12">
          <Briefcase size={48} className="mx-auto mb-4" style={{ color: 'var(--warning)' }} />
          <h3 className="text-lg font-semibold mb-2">GitHub Not Connected</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connect your GitHub account to receive project invitations
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Invitations</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Project invitations based on your skill matches
        </p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      ) : invitations.length === 0 ? (
        <div className="card text-center py-12">
          <Briefcase size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold mb-2">No invitations yet</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Projects you're matched to will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {invitations.map((inv, i) => (
            <motion.div
              key={inv.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase size={16} style={{ color: 'var(--primary)' }} />
                    <span className="text-sm font-semibold">{inv.project}</span>
                    <span className={`badge ${
                      inv.status === 'accepted' ? 'badge-success' :
                      inv.status === 'declined' ? 'badge-danger' : 'badge-warning'
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>By {inv.startup}</span>
                    <span>Match: {Math.round(inv.score)}%</span>
                  </div>
                  {inv.reasons && inv.reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {inv.reasons.slice(0, 2).map((r: string, j: number) => (
                        <span key={j} className="badge badge-primary text-[10px]">{r}</span>
                      ))}
                    </div>
                  )}
                </div>

                {inv.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleAccept(inv.id)} className="btn-primary text-sm py-2">
                      <CheckCircle size={16} />
                      Accept
                    </button>
                    <button onClick={() => handleDecline(inv.id)} className="btn-secondary text-sm py-2">
                      <XCircle size={16} />
                      Decline
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
