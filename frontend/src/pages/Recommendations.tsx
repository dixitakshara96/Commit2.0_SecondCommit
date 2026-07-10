import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Sparkles, Star, Users, TrendingUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '@/lib/api'
import type { FreelancerDashboardResponse } from '@/lib/types'

export default function Recommendations() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery<FreelancerDashboardResponse>({
    queryKey: ['freelancer', 'recommendations'],
    queryFn: () => api.get('/profile/projects/recommended').then((r) => r.data),
  })

  const projects = data?.recommended_projects ?? []

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Recommended Projects</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Projects matched to your skills and experience
        </p>
      </motion.div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <div key={i} className="h-40 skeleton rounded-2xl" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="card text-center py-12">
          <Sparkles size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold mb-2">No recommendations yet</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Connect your GitHub account and analyze your skills to get project recommendations
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project, i) => (
            <motion.div
              key={project.project_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="card cursor-pointer"
              onClick={() => navigate(`/analysis/${project.project_id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold">{project.title}</h3>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{project.startup_name}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                    {Math.round(project.matching_score)}%
                  </span>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Match</p>
                </div>
              </div>

              <div className="progress-bar mb-3">
                <div className="progress-fill" style={{ width: `${project.matching_score}%` }} />
              </div>

              <div className="space-y-1">
                {project.matching_reasons.slice(0, 3).map((reason, j) => (
                  <p key={j} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    • {reason}
                  </p>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
