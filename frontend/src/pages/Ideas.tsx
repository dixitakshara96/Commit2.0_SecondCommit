import { useState, useRef, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Lightbulb, Plus, Sparkles, CheckCircle, Trash2, Edit3, Mic, MicOff, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'
import type { IdeaRead } from '@/lib/types'

export default function Ideas() {
  const [showCreate, setShowCreate] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const recognitionRef = useRef<any>(null)
  const queryClient = useQueryClient()

  const { data: ideas, isLoading } = useQuery<IdeaRead[]>({
    queryKey: ['ideas'],
    queryFn: () => api.get('/ideas').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (original_prompt: string) => api.post('/ideas', { original_prompt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      setShowCreate(false)
      setPrompt('')
      toast.success('Idea created!')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to create idea'),
  })

  const refineMutation = useMutation({
    mutationFn: (id: number) => api.post(`/ideas/${id}/refine`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      toast.success('Idea refined!')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to refine idea'),
  })

  const approveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/ideas/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      toast.success('Idea approved!')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to approve idea'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/ideas/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      toast.success('Idea deleted')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to delete idea'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, original_prompt }: { id: number; original_prompt: string }) =>
      api.patch(`/ideas/${id}`, { original_prompt }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ideas'] })
      setEditingId(null)
      toast.success('Idea updated!')
    },
    onError: (err: any) => toast.error(err.response?.data?.detail || 'Failed to update idea'),
  })

  // ── Voice-to-Text (Web Speech API) ──
  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      toast.error('Speech recognition is not supported in this browser. Try Chrome or Edge.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsRecording(true)
      setIsSpeaking(false)
    }

    recognition.onresult = (event: any) => {
      setIsSpeaking(true)
      let transcript = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }
      setPrompt((prev) => prev + transcript)
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsRecording(false)
      setIsSpeaking(false)
      if (event.error !== 'no-speech') {
        toast.error('Voice input failed. Please try typing instead.')
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
      setIsSpeaking(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
    setIsSpeaking(false)
  }, [])

  const clearTranscript = () => {
    setPrompt('')
    toast.success('Text cleared')
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const statusColors: Record<string, string> = {
    DRAFT: '#6B7280',
    REFINED: '#8B5CF6',
    APPROVED: '#22C55E',
    ANALYZED: '#F59E0B',
    COMPLETED: '#22C55E',
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>My Ideas</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Manage and refine your project ideas</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="btn-primary">
          <Plus size={18} />
          New Idea
        </button>
      </motion.div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="card">
              <label className="block text-sm font-medium mb-2">Idea Description</label>
              <div className="relative">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="input-field min-h-[120px] resize-none pr-12"
                  placeholder="Describe your project idea in detail, or use the microphone to speak it..."
                />
                <div className="absolute bottom-3 right-3 flex flex-col gap-2">
                  <button
                    onClick={toggleRecording}
                    className={`p-2 rounded-full transition-all ${
                      isRecording
                        ? 'bg-[#EF4444] text-white animate-pulse shadow-lg shadow-red-500/30'
                        : 'bg-[#F4F1FF] text-[#8B5CF6] hover:bg-[#E8E0FF]'
                    }`}
                    title={isRecording ? 'Stop recording' : 'Start voice input'}
                  >
                    {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
              </div>
              {isRecording && (
                <div className="flex items-center gap-2 mt-2 text-xs" style={{ color: isSpeaking ? '#22C55E' : '#EF4444' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: isSpeaking ? '#22C55E' : '#EF4444' }} />
                  {isSpeaking ? 'Listening... Speak clearly' : 'Waiting for speech...'}
                </div>
              )}
              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => createMutation.mutate(prompt)}
                  disabled={!prompt || createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Lightbulb size={18} />}
                  Submit Idea
                </button>
                {prompt && (
                  <button onClick={clearTranscript} className="btn-secondary">
                    <RefreshCw size={18} />
                    Edit Again
                  </button>
                )}
                <button onClick={() => {
                  setShowCreate(false)
                  setPrompt('')
                  stopRecording()
                }} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ideas List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-32 skeleton rounded-2xl" />)}
        </div>
      ) : !ideas || ideas.length === 0 ? (
        <div className="card text-center py-12">
          <Lightbulb size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <h3 className="text-lg font-semibold mb-2">No ideas yet</h3>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Create your first idea to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
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
                  {editingId === idea.id ? (
                    <div>
                      <div className="relative">
                        <textarea
                          value={editPrompt}
                          onChange={(e) => setEditPrompt(e.target.value)}
                          className="input-field min-h-[80px] resize-none mb-3"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateMutation.mutate({ id: idea.id, original_prompt: editPrompt })}
                          className="btn-primary text-sm py-2"
                        >
                          Save
                        </button>
                        <button onClick={() => setEditingId(null)} className="btn-secondary text-sm py-2">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium mb-2">{idea.original_prompt}</p>
                      {idea.voice_transcript && (
                        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: '#8B5CF6' }}>
                          <Mic size={12} />
                          <span>Voice input available</span>
                        </div>
                      )}
                      {idea.refined_prompt && (
                        <div className="p-3 rounded-xl mb-2" style={{ background: 'var(--sidebar)' }}>
                          <p className="text-xs font-medium mb-1" style={{ color: 'var(--primary)' }}>Refined:</p>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{idea.refined_prompt}</p>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                        <span>{new Date(idea.created_at).toLocaleDateString()}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="badge"
                    style={{
                      background: `${(statusColors[idea.status] || '#6B7280')}15`,
                      color: statusColors[idea.status] || '#6B7280',
                    }}
                  >
                    {idea.status}
                  </span>

                  {!editingId && (
                    <>
                      {idea.status === 'DRAFT' && (
                        <button
                          onClick={() => {
                            setEditingId(idea.id)
                            setEditPrompt(idea.original_prompt)
                          }}
                          className="btn-ghost p-2"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                      )}
                      {idea.status === 'DRAFT' && (
                        <button
                          onClick={() => refineMutation.mutate(idea.id)}
                          disabled={refineMutation.isPending}
                          className="btn-ghost p-2"
                          title="Refine with AI"
                        >
                          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
                        </button>
                      )}
                      {idea.status === 'REFINED' && (
                        <button
                          onClick={() => approveMutation.mutate(idea.id)}
                          className="btn-ghost p-2"
                          title="Approve"
                        >
                          <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (confirm('Delete this idea?')) deleteMutation.mutate(idea.id)
                        }}
                        className="btn-ghost p-2"
                        title="Delete"
                      >
                        <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
