import { useState } from 'react'
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Lightbulb,
  Search,
  BarChart3,
  Users,
  Send,
  MessageSquare,
  Settings,
  User,
  GitBranch,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sparkles,
  Shield,
  Activity,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/lib/types'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  roles: UserRole[]
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard size={18} />, path: '/dashboard', roles: ['startup', 'freelancer', 'admin'] },
  // Startup
  { label: 'My Ideas', icon: <Lightbulb size={18} />, path: '/ideas', roles: ['startup'] },
  { label: 'Repositories', icon: <Search size={18} />, path: '/repositories', roles: ['startup'] },
  { label: 'Analysis', icon: <BarChart3 size={18} />, path: '/analysis', roles: ['startup'] },
  { label: 'Contributors', icon: <Users size={18} />, path: '/contributors', roles: ['startup'] },
  { label: 'Outreach', icon: <Send size={18} />, path: '/outreach', roles: ['startup'] },
  { label: 'Messages', icon: <MessageSquare size={18} />, path: '/messages', roles: ['startup', 'freelancer'] },
  // Freelancer
  { label: 'GitHub', icon: <GitBranch size={18} />, path: '/github', roles: ['freelancer'] },
  { label: 'Recommendations', icon: <Sparkles size={18} />, path: '/recommendations', roles: ['freelancer'] },
  { label: 'Invitations', icon: <Briefcase size={18} />, path: '/invitations', roles: ['freelancer'] },
  // Admin
  { label: 'Users', icon: <Users size={18} />, path: '/admin/users', roles: ['admin'] },
  { label: 'Ideas', icon: <Lightbulb size={18} />, path: '/admin/ideas', roles: ['admin'] },
  { label: 'Reports', icon: <FileText size={18} />, path: '/admin/reports', roles: ['admin'] },
  { label: 'Analytics', icon: <Activity size={18} />, path: '/admin/analytics', roles: ['admin'] },
  // Common
  { label: 'Settings', icon: <Settings size={18} />, path: '/settings', roles: ['startup', 'freelancer', 'admin'] },
  { label: 'Profile', icon: <User size={18} />, path: '/profile', roles: ['startup', 'freelancer', 'admin'] },
]

const roleLabels: Record<UserRole, string> = {
  startup: 'Startup Owner',
  freelancer: 'Freelancer',
  admin: 'Administrator',
}

const roleColors: Record<UserRole, string> = {
  startup: '#8B5CF6',
  freelancer: '#22C55E',
  admin: '#F59E0B',
}

export default function Layout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)

  if (!user) return null

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user.role))

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--background)' }}>
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 240 }}
        className="flex-shrink-0 flex flex-col border-r"
        style={{
          background: 'var(--sidebar)',
          borderColor: 'var(--border)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary)' }}>
            <GitBranch size={18} className="text-white" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-bold text-base"
              style={{ color: 'var(--text)' }}
            >
              SecondCommit
            </motion.span>
          )}
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{
                background: `${roleColors[user.role]}15`,
                color: roleColors[user.role],
              }}
            >
              <Shield size={12} />
              {roleLabels[user.role]}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/')
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center h-10 mx-3 rounded-lg hover:bg-black/5 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* Logout */}
        <div className="p-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleLogout}
            className="sidebar-item w-full"
            style={{ color: 'var(--danger)' }}
          >
            <LogOut size={18} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
