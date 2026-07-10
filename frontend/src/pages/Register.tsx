import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, UserPlus, Building2, Code, Shield, GitMerge, Cpu, Globe, Layers, GitBranch } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import type { UserRole } from '@/lib/types'
import React from 'react';

const roles: { value: UserRole; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'startup', label: 'Startup Owner', icon: <Building2 size={20} />, desc: 'I want to revive projects' },
  { value: 'freelancer', label: 'Freelancer', icon: <Code size={20} />, desc: 'I want to contribute' },
  { value: 'admin', label: 'Admin', icon: <Shield size={20} />, desc: 'I manage the platform' },
]

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('startup')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) {
      toast.error('Please fill in all fields')
      return
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setIsLoading(true)
    try {
      await register({ name, email, password, role })
      toast.success('Account created successfully!')
      navigate('/dashboard')
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setIsLoading(false)
    }
  }



return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left Panel */}
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
            <h1 className="text-4xl font-bold text-white mb-4">Get Started</h1>
            <p className="text-lg text-white/80 max-w-md mx-auto mb-8">
              Join SecondCommit and start reviving open-source projects today
            </p>
          </motion.div>

          {/* Smooth Counter-Clockwise 5-Node Orbit Illustration Container */}
          <div className="relative mx-auto w-80 h-80 flex items-center justify-center my-6">
            
            {/* Center Anchor Core */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute inset-12 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 flex items-center justify-center z-10"
            >
              <GitMerge size={40} className="text-white" />
            </motion.div>

            {/* Orbiting track layer (Reverse Counter-Clockwise Rotation) */}
            <div className="absolute inset-0 animate-spin-slow-reverse z-20" style={{ animationDuration: '45s' }}>
              <div className="absolute inset-0 w-full h-full">
                
                {/* Node 1: Code Icon (0 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(0deg) translateY(-130px) rotate(0deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float">
                    <Code size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Node 2: Cpu Icon (72 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(72deg) translateY(-130px) rotate(-72deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float" style={{ animationDelay: '0.5s' }}>
                    <Cpu size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Node 3: Globe Icon (144 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(144deg) translateY(-130px) rotate(-144deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float" style={{ animationDelay: '1s' }}>
                    <Globe size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Node 4: Layers Icon (216 deg) */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(216deg) translateY(-130px) rotate(-216deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float" style={{ animationDelay: '1.5s' }}>
                    <Layers size={24} className="text-white" />
                  </div>
                </div>
                
                {/* Node 5: GitBranch Plus */}
                <div className="absolute top-1/2 left-1/2" style={{ transform: 'translate(-50%, -50%) rotate(288deg) translateY(-130px) rotate(-288deg)' }}>
                  <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 flex items-center justify-center animate-float" style={{ animationDelay: '2s' }}>
                    <GitBranch size={24} className="text-white" />
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full bg-white blur-3xl" />
        </div>
      </div>


      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-sm"
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Create account</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
              Choose your role and get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selection */}
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    role === r.value
                      ? 'border-[#8B5CF6] bg-[#8B5CF6]/5'
                      : 'border-[#ECE8FF] bg-white hover:border-[#C4B5FD]'
                  }`}
                >
                  <div className="flex justify-center mb-1" style={{ color: role === r.value ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {r.icon}
                  </div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text)' }}>{r.label}</div>
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input-field"
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
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
              <label className="block text-sm font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-10"
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
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
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus size={18} />
                  Create account
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: 'var(--text-secondary)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium" style={{ color: 'var(--primary)' }}>
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
