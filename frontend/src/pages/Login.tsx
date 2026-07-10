import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, LogIn, GitBranch, Sparkles, Brain, GitMerge } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import { Users, BarChart2, Terminal } from 'lucide-react'


export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    setIsLoading(true)
    try {
      await login({ email, password })
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left Panel - Illustration */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)' }}
      >
        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
              <GitBranch size={32} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">SecondCommit</h1>
            <p className="text-lg text-white/80 mb-8 max-w-md mx-auto">
              Revive forgotten open-source projects with AI-powered analysis and smart contributor matching
            </p>
          </motion.div>

          {/* Smooth 5-Node Orbit Illustration Container */}
          <div className="relative mx-auto w-80 h-80 flex items-center justify-center my-6">
            
            {/* Center Anchor (Framer Motion Enhanced) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute inset-12 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center z-10"
            >
              <GitMerge size={40} className="text-white" />
            </motion.div>

            {/* Orbiting track layer (Smooth 40s duration) */}
            <div className="absolute inset-0 animate-spin-slow z-20" style={{ animationDuration: '40s' }}>
              <div className="absolute inset-0 w-full h-full">
                
                {/* Node 1: GitBranch Icon (0 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(0deg) translateY(-120px) rotate(0deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float">
                    <GitBranch size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Node 2: Brain Icon (72 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(72deg) translateY(-120px) rotate(-72deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
                    <Brain size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Node 3: Users Icon (144 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(144deg) translateY(-120px) rotate(-144deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                    <Users size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Node 4: BarChart2 Icon (216 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(216deg) translateY(-120px) rotate(-216deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float" style={{ animationDelay: '1.5s' }}>
                    <BarChart2 size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Node 5: Terminal Icon (288 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(288deg) translateY(-120px) rotate(-288deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float" style={{ animationDelay: '2s' }}>
                    <Terminal size={24} className="text-white" />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Timeline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            className="flex items-center justify-center gap-3 mt-8"
          >
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-white/40 flex items-center justify-center">
                  <span className="text-white/80 text-xs font-medium">{step}</span>
                </div>
                {step < 4 && <div className="w-8 h-px bg-white/20" />}
              </div>
            ))}
          </motion.div>
        </div>


        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Welcome back</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text)' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <LogIn size={18} />
                  Sign in
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-medium" style={{ color: 'var(--primary)' }}>
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
