import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Lightbulb, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { AdminIdea } from '@/lib/types'

export default function AdminIdeas() {
  const queryClient = useQueryClient()

  const { data: ideas, isLoading } = useQuery<AdminIdea[]>({
    queryKey: ['admin', 'ideas'],
    queryFn: () => api.get('/admin/ideas').then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (ideaId: number) => api.delete(`/admin/ideas/${ideaId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'ideas'] })
      toast.success('Idea deleted')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete'),
  })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Ideas</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>All platform ideas</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div>
      ) : !ideas || ideas.length === 0 ? (
        <div className="card text-center py-12">
          <Lightbulb size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
        </div>
      ) : (
        <div className="space-y-3">
          {ideas.map((idea, i) => (
            <motion.div
              key={idea.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="card"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium mb-1">{idea.original_prompt}</p>
                  <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                    <span>Owner #{idea.owner_id}</span>
                    <span className="badge badge-primary">{idea.status}</span>
                    {idea.has_refined_prompt && <span className="badge badge-success">Refined</span>}
                    <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Delete this idea?')) deleteMutation.mutate(idea.id)
                  }}
                  className="btn-ghost p-1.5"
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
