import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Mail, Shield, GitBranch, Trash2, BadgeCheck, Clock } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { AdminUser } from '@/lib/types'

export default function AdminUsers() {
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (userId: number) => api.delete(`/admin/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
      toast.success('User deleted')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete'),
  })

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Users</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage platform users</p>
      </motion.div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 skeleton rounded-2xl" />)}</div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>GitHub</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(users ?? []).map((user, i) => (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td className="font-medium">{user.name}</td>
                  <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                  <td>
                    <span className="badge badge-primary capitalize">{user.role.charAt(0) + user.role.slice(1).toLowerCase()}</span>
                  </td>
                  <td>{user.github_username || '—'}</td>
                  <td>
                    {user.is_verified ? (
                      <BadgeCheck size={16} style={{ color: '#22C55E' }} />
                    ) : (
                      <Clock size={16} style={{ color: '#F59E0B' }} />
                    )}
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        if (confirm(`Delete user ${user.name}?`)) deleteMutation.mutate(user.id)
                      }}
                      className="btn-ghost p-1.5"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
