import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { RepositoryRead } from '@/lib/types'
import {
  MOCK_REPOSITORIES,
  MOCK_REFINED_PROMPTS,
  getMockAnalysisForRepo,
  MOCK_CONTRIBUTOR_MATCHES,
  MOCK_OUTREACH_MESSAGES,
} from './mockData'

// ──────────────────────────────────────────────
// STATE — tracks flow across multiple mock calls
// ──────────────────────────────────────────────

interface IdeaState {
  id: number
  owner_id: number
  original_prompt: string
  voice_transcript: string | null
  refined_prompt: string | null
  status: string
  created_at: string
}

interface MockState {
  ideas: IdeaState[]
  repositories: RepositoryRead[]
  selectedRepoId: number | null
  lastAnalysisId: number | null
  /** Set of idea IDs whose associated repo has been analyzed */
  analyzedIdeaIds: Set<number>
}

// Pre-seeded ideas so the demo flow works out of the gate
const INITIAL_IDEAS: IdeaState[] = [
  {
    id: 1,
    owner_id: 1,
    original_prompt: 'AI-powered code review tool that integrates with GitHub PRs to automatically catch bugs and suggest improvements',
    voice_transcript: null,
    refined_prompt: null,
    status: 'APPROVED',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 2,
    owner_id: 1,
    original_prompt: 'Open-source ML platform for managing, deploying and monitoring models in production',
    voice_transcript: null,
    refined_prompt: null,
    status: 'DRAFT',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 3,
    owner_id: 1,
    original_prompt: 'Developer tool that auto-generates API documentation from source code',
    voice_transcript: null,
    refined_prompt: null,
    status: 'ANALYZED',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
]

const state: MockState = {
  ideas: [...INITIAL_IDEAS],
  repositories: [...MOCK_REPOSITORIES],
  selectedRepoId: null,
  lastAnalysisId: null,
  analyzedIdeaIds: new Set([3]), // idea 3 is already analyzed
}

// Auto-increment ID generator
let nextId = 1000
function genId(): number {
  return nextId++
}

// ──────────────────────────────────────────────
// HELPER: Parse JSON body from the config
// ──────────────────────────────────────────────

function parseBody(config: AxiosRequestConfig): Record<string, unknown> {
  if (!config.data) return {}
  if (typeof config.data === 'object' && !Array.isArray(config.data)) {
    return config.data as Record<string, unknown>
  }
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data)
    } catch {
      return {}
    }
  }
  return {}
}

// ──────────────────────────────────────────────
// HELPER: Extract path & search params from URL
// ──────────────────────────────────────────────

function parseUrl(url: string): { path: string; searchParams: URLSearchParams } {
  const relativeUrl = url.startsWith('/api') ? url.slice(4) : url
  const questionIdx = relativeUrl.indexOf('?')
  const path = questionIdx >= 0 ? relativeUrl.slice(0, questionIdx) : relativeUrl
  const searchParams = new URLSearchParams(questionIdx >= 0 ? relativeUrl.slice(questionIdx) : '')
  return { path, searchParams }
}

// ──────────────────────────────────────────────
// HELPER: Build a valid AxiosResponse
// ──────────────────────────────────────────────

function mockResponse(data: unknown, config: AxiosRequestConfig): AxiosResponse {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: { 'content-type': 'application/json' },
    config,
  }
}

// ──────────────────────────────────────────────
// MOCK HANDLERS — one per endpoint
// ──────────────────────────────────────────────

const mockHandlers: Record<
  string,
  Record<string, (config: AxiosRequestConfig) => AxiosResponse | null>
> = {
  GET: {
    '/ideas': (_config) => {
      // Return ideas with ANALYZED status patched for those in the set
      const ideasWithStatus = state.ideas.map((idea) => ({
        ...idea,
        status: state.analyzedIdeaIds.has(idea.id) ? 'ANALYZED' : idea.status,
      }))
      return mockResponse(ideasWithStatus, _config)
    },

    '/repositories': (config) => {
      const { searchParams } = parseUrl(config.url ?? '')
      const ideaId = searchParams.get('idea_id')
      let repos = state.repositories
      if (ideaId) {
        repos = repos.filter((r) => r.idea_id === Number(ideaId))
      }
      return mockResponse(repos, config)
    },

    '/dashboard/startup': (_config) => {
      return mockResponse(
        {
          summary_metrics: {
            total_ideas_submitted: state.ideas.length,
            active_analyses_count: state.analyzedIdeaIds.size,
            contributors_contacted: 3,
            pending_responses_count: 2,
          },
          advanced_analytics: {
            idea_revival_score: 72,
            response_rate_percentage: 65,
            analysis_velocity: 4,
            outreach_conversion_index: 3,
          },
        },
        _config
      )
    },
  },

  POST: {
    '/ideas': (config) => {
      const body = parseBody(config)
      const newIdea: IdeaState = {
        id: genId(),
        owner_id: 1,
        original_prompt: (body.original_prompt as string) || '',
        voice_transcript: (body.voice_transcript as string) || null,
        refined_prompt: null,
        status: 'DRAFT',
        created_at: new Date().toISOString(),
      }
      state.ideas.push(newIdea)
      return mockResponse(newIdea, config)
    },

    '/ideas/1/approve': (_config) => {
      state.ideas = state.ideas.map((idea) =>
        idea.id === 1 ? { ...idea, status: 'APPROVED' } : idea
      )
      return mockResponse({ success: true, status: 'APPROVED' }, _config)
    },

    '/repositories/search': (config) => {
      state.repositories = MOCK_REPOSITORIES.map((r) => ({ ...r, is_selected: false }))
      state.selectedRepoId = null

      const body = parseBody(config)
      const ideaId = body.idea_id as number | undefined

      const repos = state.repositories.map((r) => ({
        ...r,
        idea_id: ideaId ?? r.idea_id,
        id: genId(),
      }))
      state.repositories = repos

      ;(config as any)._mockDelay = 5000

      return mockResponse(
        {
          repositories: repos,
          stages: [
            { name: 'Understanding Idea', duration: 1000 },
            { name: 'Searching GitHub', duration: 2000 },
            { name: 'Ranking Repositories', duration: 1000 },
            { name: 'Selecting Best Matches', duration: 1000 },
          ],
        },
        config
      )
    },

    '/repositories/select': (config) => {
      const body = parseBody(config)
      const repoId = body.repository_id as number

      state.repositories = state.repositories.map((r) => ({
        ...r,
        is_selected: r.id === repoId,
      }))
      state.selectedRepoId = repoId

      return mockResponse(
        {
          success: true,
          repository_id: state.selectedRepoId,
          all_repositories: state.repositories,
        },
        config
      )
    },

    '/analysis/run': (config) => {
      const body = parseBody(config)
      const repoId = (body.repository_id as number | undefined) ?? state.selectedRepoId

      if (repoId) {
        const matchedRepo = state.repositories.find((r) => r.id === repoId)
        if (matchedRepo) {
          state.analyzedIdeaIds.add(matchedRepo.idea_id)
          // Also update the idea status in state
          state.ideas = state.ideas.map((idea) =>
            idea.id === matchedRepo.idea_id ? { ...idea, status: 'ANALYZED' } : idea
          )
        }
      }

      const analysisId = genId()
      state.lastAnalysisId = analysisId
      localStorage.setItem('last_analysis_id', String(analysisId))

      // 10-second delay for multi-agent pipeline (the frontend simulates agents locally, then calls this)
      ;(config as any)._mockDelay = 10000

      return mockResponse(
        {
          analysis_id: analysisId,
          status: 'completed',
        },
        config
      )
    },

    '/contributors/recommend': (config) => {
      ;(config as any)._mockDelay = 3000
      return mockResponse(
        {
          recommendation_id: genId(),
          contributors: MOCK_CONTRIBUTOR_MATCHES.map((c) => ({
            ...c,
            analysis_id: state.lastAnalysisId ?? 1,
          })),
        },
        config
      )
    },

    '/outreach/generate': (config) => {
      const body = parseBody(config)
      const contributorIds = (body.contributor_ids as number[]) ?? []

      let messages = MOCK_OUTREACH_MESSAGES
      if (contributorIds.length > 0) {
        const usernames = MOCK_CONTRIBUTOR_MATCHES.filter((c) =>
          contributorIds.includes(c.id)
        ).map((c) => c.github_username)
        messages = MOCK_OUTREACH_MESSAGES.filter((m) => usernames.includes(m.recipient))
      }

      ;(config as any)._mockDelay = 2000

      return mockResponse(
        {
          analysis_id: state.lastAnalysisId ?? 1,
          messages: messages.map((m) => ({
            ...m,
            id: genId(),
            analysis_id: state.lastAnalysisId ?? 1,
          })),
        },
        config
      )
    },
  },
}

// ── Dynamic route matchers ──

function handleIdeaRefine(config: AxiosRequestConfig): AxiosResponse | null {
  const { path } = parseUrl(config.url ?? '')
  const match = path.match(/^\/ideas\/(\d+)\/refine$/)
  if (!match) return null

  const ideaId = parseInt(match[1], 10)
  ;(config as any)._mockDelay = 2500

  const promptByIdea: Record<number, string> = {
    1: 'An AI-powered code review assistant that integrates with GitHub PRs to automatically detect bugs, security vulnerabilities, and style issues. Uses advanced ML models for real-time analysis and provides actionable fix suggestions with code examples. Designed for development teams to accelerate code review cycles and improve code quality.',
    2: 'An open-source platform for managing, deploying, and monitoring machine learning models in production. Provides model versioning, A/B testing, automated retraining pipelines, and real-time performance dashboards. Built for ML teams to streamline the model lifecycle from experimentation to production.',
    3: 'A developer tool that automatically generates comprehensive OpenAPI/Swagger documentation from source code annotations and code structure analysis. Supports Express, FastAPI, Flask, and Spring Boot projects with customizable templates and CI/CD integration.',
    4: 'A real-time collaborative coding platform with built-in video chat, shared terminal, and synchronized code editor. Enables remote pair programming with features like shared cursors, code review annotations, and instant environment setup.',
  }

  const refined_prompt = promptByIdea[ideaId] || MOCK_REFINED_PROMPTS.default

  // Update state
  state.ideas = state.ideas.map((idea) =>
    idea.id === ideaId ? { ...idea, refined_prompt, status: 'REFINED' } : idea
  )

  return mockResponse({ refined_prompt }, config)
}

function handleIdeaApprove(config: AxiosRequestConfig): AxiosResponse | null {
  const { path } = parseUrl(config.url ?? '')
  const match = path.match(/^\/ideas\/(\d+)\/approve$/)
  if (!match) return null

  const ideaId = parseInt(match[1], 10)

  // Update state
  state.ideas = state.ideas.map((idea) =>
    idea.id === ideaId ? { ...idea, status: 'APPROVED' } : idea
  )

  return mockResponse({ success: true, status: 'APPROVED' }, config)
}

function handleGetAnalysis(config: AxiosRequestConfig): AxiosResponse | null {
  const { path } = parseUrl(config.url ?? '')
  const match = path.match(/^\/analysis\/(\d+)$/)
  if (!match) return null

  const analysisId = parseInt(match[1], 10)
  const _repoId = state.selectedRepoId ?? 101
  const report = getMockAnalysisForRepo(_repoId)
  return mockResponse({ ...report, id: analysisId }, config)
}

function handleGetResponses(config: AxiosRequestConfig): AxiosResponse | null {
  const { path } = parseUrl(config.url ?? '')
  const match = path.match(/^\/responses\/by-analysis\/(\d+)$/)
  if (!match) return null

  return mockResponse(
    [
      { id: 1, analysis_id: parseInt(match[1]), contributor_match_id: 201, status: 'pending', responded_at: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, analysis_id: parseInt(match[1]), contributor_match_id: 202, status: 'accepted', responded_at: new Date(Date.now() - 86400000).toISOString(), notes: 'Interested in learning more', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, analysis_id: parseInt(match[1]), contributor_match_id: 203, status: 'pending', responded_at: null, notes: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
    config
  )
}

// ──────────────────────────────────────────────
// MAIN: Check if a request should be mocked
// ──────────────────────────────────────────────

export function isMockedRequest(method: string, url: string): boolean {
  const { path } = parseUrl(url)
  const methodHandlers = mockHandlers[method.toUpperCase()]

  if (methodHandlers && methodHandlers[path]) return true

  if (method.toUpperCase() === 'GET' && /^\/analysis\/\d+$/.test(path)) return true
  if (method.toUpperCase() === 'GET' && /^\/responses\/by-analysis\/\d+$/.test(path)) return true
  if (method.toUpperCase() === 'POST' && /^\/ideas\/\d+\/refine$/.test(path)) return true
  if (method.toUpperCase() === 'POST' && /^\/ideas\/\d+\/approve$/.test(path)) return true

  return false
}

// ──────────────────────────────────────────────
// MAIN: Get mock response for a request
// ──────────────────────────────────────────────

export function getMockResponse(config: AxiosRequestConfig): AxiosResponse {
  const method = (config.method ?? 'get').toUpperCase()
  const { path } = parseUrl(config.url ?? '')

  const methodHandlers = mockHandlers[method]
  if (methodHandlers && methodHandlers[path]) {
    const response = methodHandlers[path](config)
    if (response) return response
  }

  if (method === 'POST' && /^\/ideas\/\d+\/refine$/.test(path)) {
    const response = handleIdeaRefine(config)
    if (response) return response
  }

  if (method === 'POST' && /^\/ideas\/\d+\/approve$/.test(path)) {
    const response = handleIdeaApprove(config)
    if (response) return response
  }

  if (method === 'GET' && /^\/analysis\/\d+$/.test(path)) {
    const response = handleGetAnalysis(config)
    if (response) return response
  }

  if (method === 'GET' && /^\/responses\/by-analysis\/\d+$/.test(path)) {
    const response = handleGetResponses(config)
    if (response) return response
  }

  return mockResponse({ error: 'No mock handler for this endpoint' }, config)
}

// ──────────────────────────────────────────────
// SETUP: Install the interceptor on the axios instance
// ──────────────────────────────────────────────

export function setupMockAdapter(axiosInstance: AxiosInstance): void {
  axiosInstance.interceptors.request.use((config) => {
    const method = (config.method ?? 'get').toUpperCase()
    const url = config.url ?? ''

    if (isMockedRequest(method, url)) {
      const mockResponseData = getMockResponse(config)
      const delay = (config as any)._mockDelay || 0

      config.adapter = () =>
        delay > 0
          ? new Promise((resolve) => setTimeout(() => resolve(mockResponseData), delay))
          : Promise.resolve(mockResponseData)
    }

    return config
  })
}
