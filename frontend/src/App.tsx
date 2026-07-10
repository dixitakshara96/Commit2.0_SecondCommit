import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import { lazy, Suspense } from 'react'


// Lazy loaded pages for code splitting
const StartupDashboard = lazy(() => import('@/pages/StartupDashboard'))
const FreelancerDashboard = lazy(() => import('@/pages/FreelancerDashboard'))
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'))
const Ideas = lazy(() => import('@/pages/Ideas'))
const Repositories = lazy(() => import('@/pages/Repositories'))
const Analysis = lazy(() => import('@/pages/Analysis'))
const Report = lazy(() => import('@/pages/Report'))
const Contributors = lazy(() => import('@/pages/Contributors'))
const Outreach = lazy(() => import('@/pages/Outreach'))
const Messages = lazy(() => import('@/pages/Messages'))
const Settings = lazy(() => import('@/pages/Settings'))
const Profile = lazy(() => import('@/pages/Profile'))
const GitHubConnect = lazy(() => import('@/pages/GitHubConnect'))
const Recommendations = lazy(() => import('@/pages/Recommendations'))
const Invitations = lazy(() => import('@/pages/Invitations'))
const AdminUsers = lazy(() => import('@/pages/AdminUsers'))
const AdminIdeas = lazy(() => import('@/pages/AdminIdeas'))
const AdminAnalytics = lazy(() => import('@/pages/AdminAnalytics'))
const AdminReports = lazy(() => import('@/pages/AdminReports'))

function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#8B5CF6]/30 border-t-[#8B5CF6] rounded-full animate-spin" />
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      refetchOnWindowFocus: false,
    },
  },
})

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <PageLoader />
  }

  // Fallback: read from localStorage in case React state hasn't propagated
  // (e.g. right after login() sets user while navigate() is called)
  const effectiveUser = user ?? (() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  if (!effectiveUser) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(effectiveUser.role.toLowerCase())) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

function DashboardRedirect() {
  const { user } = useAuth()
  const effectiveUser = user ?? (() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()
  if (!effectiveUser) return <Navigate to="/login" replace />
  return <Navigate to="/dashboard" replace />
}

function RoleDashboard() {
  const { user, isLoading } = useAuth()

  const effectiveUser = user ?? (() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })()

  if (isLoading && !effectiveUser) {
    return <PageLoader />
  }

  if (!effectiveUser) return <Navigate to="/login" replace />

  switch (effectiveUser.role.toLowerCase()) {
    case 'startup':
      return <StartupDashboard />
    case 'freelancer':
      return <FreelancerDashboard />
    case 'admin':
      return <AdminDashboard />
    default:
      return <Navigate to="/login" replace />
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected routes with layout */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardRedirect />} />
              <Route path="dashboard" element={<Suspense fallback={<PageLoader />}><RoleDashboard /></Suspense>} />

              {/* Startup routes */}
              <Route path="ideas" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['startup']}><Ideas /></ProtectedRoute></Suspense>} />
              <Route path="repositories" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['startup']}><Repositories /></ProtectedRoute></Suspense>} />
              <Route path="analysis" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['startup']}><Analysis /></ProtectedRoute></Suspense>} />
              <Route path="analysis/:id" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['startup']}><Report /></ProtectedRoute></Suspense>} />
              <Route path="contributors" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['startup']}><Contributors /></ProtectedRoute></Suspense>} />
              <Route path="outreach" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['startup']}><Outreach /></ProtectedRoute></Suspense>} />

              {/* Freelancer routes */}
              <Route path="github" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['freelancer']}><GitHubConnect /></ProtectedRoute></Suspense>} />
              <Route path="recommendations" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['freelancer']}><Recommendations /></ProtectedRoute></Suspense>} />
              <Route path="invitations" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['freelancer']}><Invitations /></ProtectedRoute></Suspense>} />

              {/* Admin routes */}
              <Route path="admin/users" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute></Suspense>} />
              <Route path="admin/ideas" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><AdminIdeas /></ProtectedRoute></Suspense>} />
              <Route path="admin/reports" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute></Suspense>} />
              <Route path="admin/analytics" element={<Suspense fallback={<PageLoader />}><ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute></Suspense>} />

              {/* Common routes */}
              <Route path="messages" element={<Suspense fallback={<PageLoader />}><Messages /></Suspense>} />
              <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
              <Route path="profile" element={<Suspense fallback={<PageLoader />}><Profile /></Suspense>} />
            </Route>

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                borderRadius: '12px',
                border: '1px solid #ECE8FF',
                fontFamily: 'Inter, sans-serif',
              },
            }}
          />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
