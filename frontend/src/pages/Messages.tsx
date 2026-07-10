import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, CheckCircle, Clock, User, AlertCircle, Search, Send, CheckCheck, ArrowLeft, MoreVertical, Phone, Video, Paperclip } from 'lucide-react'
import { toast } from 'sonner'
import api from '@/lib/api'

// ── Mock Conversation Data ──
interface ChatMessage {
  id: number
  sender: 'me' | 'them'
  text: string
  timestamp: string
  status?: 'sent' | 'delivered' | 'read'
}

interface Conversation {
  id: number
  name: string
  username: string
  initials: string
  gradient: string
  lastMessage: string
  time: string
  unread: boolean
  messages: ChatMessage[]
  project: string
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: 'Sarah Kim',
    username: 'sarahkim',
    initials: 'SK',
    gradient: 'from-[#8B5CF6] to-[#C4B5FD]',
    lastMessage: "Hi! I'd love to contribute to the AI Code Review Tool project. Count me in!",
    time: '2h ago',
    unread: true,
    project: 'AI-Powered Code Review Tool',
    messages: [
      { id: 1, sender: 'me', text: "Hi Sarah! 👋\n\nI came across your impressive work on React and TypeScript projects. We're currently reviving the ML Pipeline Orchestrator project and your expertise would be invaluable.\n\nWould you be open to a quick call this week to discuss how you might contribute?", timestamp: '2026-07-10T09:00:00', status: 'read' },
      { id: 2, sender: 'them', text: "Thanks for reaching out! I'd love to know more about the project. I've been following ML Pipeline Orchestrator for a while now.", timestamp: '2026-07-10T09:30:00' },
      { id: 3, sender: 'me', text: "That's great to hear! The project has solid foundations with 342 stars and 56 forks. We're looking for core maintainers to help modernize the codebase.\n\nAre you available for a quick chat this Thursday?", timestamp: '2026-07-10T09:35:00', status: 'read' },
      { id: 4, sender: 'them', text: "This project looks interesting! I'm available this weekend. Let's connect on Saturday morning?", timestamp: '2026-07-10T10:15:00' },
      { id: 5, sender: 'me', text: "Perfect! Saturday at 10 AM works great. I'll send you a calendar invite with the meeting link. Looking forward to it!", timestamp: '2026-07-10T10:20:00', status: 'delivered' },
      { id: 6, sender: 'them', text: "Hi! I'd love to contribute to the AI Code Review Tool project. Count me in!", timestamp: '2026-07-10T12:00:00' },
    ],
  },
  {
    id: 2,
    name: 'Marcus Chen',
    username: 'marcuschen',
    initials: 'MC',
    gradient: 'from-[#22C55E] to-[#34D399]',
    lastMessage: "Thanks for reaching out! I've reviewed the project and I'm interested.",
    time: '1d ago',
    unread: false,
    project: 'ML Pipeline Builder',
    messages: [
      { id: 1, sender: 'me', text: "Hi Marcus! 👋\n\nI've been following your work on Python and ML pipelines. Your contributions to Kubeflow are impressive! We're building an ML Pipeline Builder and I think you'd be a great fit.", timestamp: '2026-07-09T14:00:00', status: 'read' },
      { id: 2, sender: 'them', text: "Thanks for reaching out! I've reviewed the project and I'm interested. The architecture looks solid and I have some ideas for improving the pipeline execution engine.", timestamp: '2026-07-09T16:30:00' },
      { id: 3, sender: 'me', text: "That's exactly the kind of expertise we need! Would you like to join our Discord channel to discuss further?", timestamp: '2026-07-09T17:00:00', status: 'delivered' },
    ],
  },
  {
    id: 3,
    name: 'Aria Liu',
    username: 'arialiu',
    initials: 'AL',
    gradient: 'from-[#F59E0B] to-[#FBBF24]',
    lastMessage: 'Interesting project! Tell me more about the technical stack.',
    time: '3d ago',
    unread: false,
    project: 'ML Pipeline Orchestrator',
    messages: [
      { id: 1, sender: 'me', text: "Hi Aria! 🚀\n\nYour Kubernetes operator work caught my attention! We're reviving ML Pipeline Orchestrator and need a platform engineering expert.", timestamp: '2026-07-07T11:00:00', status: 'read' },
      { id: 2, sender: 'them', text: "Interesting project! Tell me more about the technical stack and what kind of infrastructure setup you're planning.", timestamp: '2026-07-07T14:20:00' },
      { id: 3, sender: 'me', text: "Great question! We're planning a Kubernetes-native deployment with Terraform for cloud infra, Prometheus for monitoring, and GitHub Actions for CI/CD. Your experience with K8s operators would be perfect for this.", timestamp: '2026-07-07T15:00:00', status: 'read' },
    ],
  },
  {
    id: 4,
    name: 'Jordan Lee',
    username: 'jordanlee',
    initials: 'JL',
    gradient: 'from-[#EF4444] to-[#F87171]',
    lastMessage: 'I can help with the documentation overhaul. Count me in!',
    time: '4d ago',
    unread: false,
    project: 'OpenAPI Docs Generator',
    messages: [
      { id: 1, sender: 'me', text: "Hi Jordan! We noticed your excellent work on docs-as-code workflows. We're looking for a technical writer to help with documentation.", timestamp: '2026-07-06T10:00:00', status: 'read' },
      { id: 2, sender: 'them', text: "I can help with the documentation overhaul. Count me in! I have experience with Sphinx, MkDocs, and OpenAPI specifications.", timestamp: '2026-07-06T13:45:00' },
    ],
  },
]

const MOCK_RESPONSES = [
  "Thanks for reaching out. I'd love to know more.",
  'This project looks interesting.',
  "I'm available this weekend.",
  "I've reviewed the project and I'm interested in contributing.",
  'Can you share more details about the roadmap?',
  'Sure, let me check my calendar and get back to you.',
  "I'd be happy to hop on a call to discuss this further.",
]

export default function Messages() {
  const [conversations] = useState<Conversation[]>(MOCK_CONVERSATIONS)
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [showMobileList, setShowMobileList] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedConv?.messages])

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConv) return
    setIsSending(true)

    // Add the message immediately
    const newMsg: ChatMessage = {
      id: Date.now(),
      sender: 'me',
      text: newMessage.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    }

    // Update the conversation
    selectedConv.messages.push(newMsg)
    setNewMessage('')

    // After a short delay, simulate a reply
    setTimeout(() => {
      const replyText = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)]
      const reply: ChatMessage = {
        id: Date.now() + 1,
        sender: 'them',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      selectedConv.messages.push(reply)
      setIsSending(false)
    }, 1500 + Math.random() * 2000)
  }

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ts
    }
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text)' }}>Messages</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
          Outreach conversations with contributors
        </p>
      </motion.div>

      <div className="card p-0 overflow-hidden" style={{ minHeight: '500px' }}>
        <div className="flex h-[600px]">
          {/* Conversation List */}
          <div className={`w-full md:w-80 lg:w-96 border-r flex-shrink-0 flex flex-col ${!showMobileList ? 'hidden md:flex' : 'flex'}`} style={{ borderColor: 'var(--border)' }}>
            {/* Search */}
            <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search conversations..."
                  className="input-field pl-9 py-2 text-sm"
                />
              </div>
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => { setSelectedConv(conv); setShowMobileList(false) }}
                  className={`w-full text-left p-4 transition-colors hover:bg-[#F4F1FF]/50 ${
                    selectedConv?.id === conv.id ? 'bg-[#F4F1FF]' : ''
                  }`}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${conv.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {conv.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-sm font-semibold truncate">{conv.name}</span>
                        <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{conv.time}</span>
                      </div>
                      <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>
                        {conv.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{conv.project}</span>
                        {conv.unread && (
                          <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${showMobileList ? 'hidden md:flex' : 'flex'}`}>
            {selectedConv ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileList(true)}
                      className="btn-ghost p-1.5 md:hidden"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedConv.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                      {selectedConv.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{selectedConv.name}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>@{selectedConv.username} · {selectedConv.project}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost p-2" title="Voice call"><Phone size={16} /></button>
                    <button className="btn-ghost p-2" title="Video call"><Video size={16} /></button>
                    <button className="btn-ghost p-2" title="More"><MoreVertical size={16} /></button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#FAFAFC' }}>
                  {selectedConv.messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl ${
                          msg.sender === 'me'
                            ? 'bg-[#8B5CF6] text-white rounded-br-md'
                            : 'bg-white border rounded-bl-md'
                        }`}
                        style={msg.sender === 'me' ? {} : { borderColor: 'var(--border)' }}
                      >
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        <div className={`flex items-center gap-1 mt-1.5 ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                          <span className={`text-[10px] ${msg.sender === 'me' ? 'text-white/70' : 'text-[#9CA3AF]'}`}>
                            {formatTime(msg.timestamp)}
                          </span>
                          {msg.sender === 'me' && msg.status && (
                            <span>
                              {msg.status === 'read' ? (
                                <CheckCheck size={12} className="text-blue-300" />
                              ) : msg.status === 'delivered' ? (
                                <CheckCheck size={12} className="text-white/50" />
                              ) : (
                                <CheckCircle size={10} className="text-white/50" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t" style={{ borderColor: 'var(--border)', background: 'white' }}>
                  <div className="flex items-center gap-2">
                    <button className="btn-ghost p-2 flex-shrink-0">
                      <Paperclip size={18} style={{ color: 'var(--text-secondary)' }} />
                    </button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                      placeholder="Type a message..."
                      className="input-field py-2.5 text-sm"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="btn-primary p-2.5 flex-shrink-0"
                    >
                      {isSending ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send size={18} />
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center py-12">
                  <MessageSquare size={48} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
                  <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Choose a conversation from the left to view messages
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
