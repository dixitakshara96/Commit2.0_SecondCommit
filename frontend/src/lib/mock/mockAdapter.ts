import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import type { RepositoryRead } from '@/lib/types'
import {
  MOCK_REPOSITORIES,
  getMockAnalysisForRepo,
  MOCK_CONTRIBUTOR_MATCHES,
  MOCK_OUTREACH_MESSAGES,
} from './mockData'

// ──────────────────────────────────────────────
// STATE — tracks flow across multiple mock calls
// ──────────────────────────────────────────────

interface MockState {
  repositories: RepositoryRead[]
  selectedRepoId: number | null
  lastAnalysisId: number | null
  /** Set of idea IDs whose associated repo has been analyzed */
  analyzedIdeaIds: Set<number>
}

const state: MockState = {
  repositories: [...MOCK_REPOSITORIES],
  selectedRepoId: null,
  lastAnalysisId: null,
  analyzedIdeaIds: new Set(),
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
  if (!config.data || typeof config.data !== 'string') return {}
  try {
    return JSON.parse(config.data)
  } catch {
    return {}
  }
}

// ──────────────────────────────────────────────
// HELPER: Extract path & search params from URL
// ──────────────────────────────────────────────

function parseUrl(url: string): { path: string; searchParams: URLSearchParams } {
  // Strip baseURL from the start if present
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
  POST: {
    '/repositories/search': (config) => {
      // Reset state for a fresh search
      state.repositories = MOCK_REPOSITORIES.map((r) => ({ ...r, is_selected: false }))
      state.selectedRepoId = null

      const body = parseBody(config)
      const ideaId = body.idea_id

      const repos = state.repositories.map((r) => ({
        ...r,
        idea_id: (ideaId as number) || r.idea_id,
        id: genId(),
      }))
      state.repositories = repos

      return mockResponse(repos, config)
    },

    '/repositories/select': (config) => {
      const body = parseBody(config)
      const repoId = body.repository_id as number

      // Mark the selected repo in state
      state.repositories = state.repositories.map((r) => ({
        ...r,
        is_selected: r.id === repoId,
      }))
      state.selectedRepoId = repoId

      return mockResponse({ success: true, repository_id: repoId }, config)
    },

    '/analysis/run': (config) => {
      const body = parseBody(config)
      const repoId = body.repository_id as number | undefined

      // Track which idea this repo belongs to so GET /ideas can reflect ANALYZED status
      const matchedRepo = state.repositories.find((r) => r.id === repoId)
      if (matchedRepo) {
        state.analyzedIdeaIds.add(matchedRepo.idea_id)
      }

      const analysisId = 1
      state.lastAnalysisId = analysisId

      // Save to localStorage so resolveAnalysisId can find it
      localStorage.setItem('last_analysis_id', String(analysisId))

      return mockResponse({ analysis_id: analysisId, status: 'completed' }, config)
    },

    '/contributors/recommend': (config) => {
      return mockResponse(
        {
          recommendation_id: 1001,
          // Use the same IDs as those in MOCK_ANALYSIS_REPORT.contributor_matches
          // so the Outreach page can reference them consistently
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

      // MOCK_CONTRIBUTOR_MATCHES contains the canonical IDs (201–204)
      // which match what the Outreach page receives via GET /analysis/{id}
      let messages = MOCK_OUTREACH_MESSAGES

      if (contributorIds.length > 0) {
        const usernames = MOCK_CONTRIBUTOR_MATCHES.filter((c) =>
          contributorIds.includes(c.id)
        ).map((c) => c.github_username)
        messages = MOCK_OUTREACH_MESSAGES.filter((m) => usernames.includes(m.recipient))
      }

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

  GET: {
    '/repositories': (config) => {
      // Return current state repositories with correct is_selected
      // Also allow filtering by idea_id if provided
      const { searchParams } = parseUrl(config.url ?? '')
      const ideaId = searchParams.get('idea_id')

      let repos = state.repositories
      if (ideaId) {
        repos = repos.filter((r) => r.idea_id === Number(ideaId))
      }

      return mockResponse(repos, config)
    },

    // Match /analysis/{id} using a regex test
  },
}

// For analysis/{id} we need custom matching
function handleGetAnalysis(config: AxiosRequestConfig): AxiosResponse | null {
  const { path } = parseUrl(config.url ?? '')
  const match = path.match(/^\/analysis\/(\d+)$/)
  if (!match) return null

  const analysisId = parseInt(match[1], 10)
  const _repoId = state.selectedRepoId ?? 101

  const report = getMockAnalysisForRepo(_repoId)
  return mockResponse({ ...report, id: analysisId }, config)
}

// ──────────────────────────────────────────────
// MAIN: Check if a request should be mocked
// ──────────────────────────────────────────────

export function isMockedRequest(method: string, url: string): boolean {
  const { path } = parseUrl(url)

  // Check exact matches first
  const methodHandlers = mockHandlers[method.toUpperCase()]
  if (methodHandlers && methodHandlers[path]) {
    return true
  }

  // Check /analysis/{id}
  if (method.toUpperCase() === 'GET' && /^\/analysis\/\d+$/.test(path)) {
    return true
  }

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

  if (method === 'GET' && /^\/analysis\/\d+$/.test(path)) {
    const response = handleGetAnalysis(config)
    if (response) return response
  }

  // Fallback — should not be reached
  return mockResponse({ error: 'No mock handler for this endpoint' }, config)
}

// ──────────────────────────────────────────────
// SETUP: Install the interceptor on the axios instance
// ──────────────────────────────────────────────

export function setupMockAdapter(axiosInstance: AxiosInstance): void {
  // ── Request interceptor: short-circuit pipeline endpoints ──
  axiosInstance.interceptors.request.use((config) => {
    const method = (config.method ?? 'get').toUpperCase()
    const url = config.url ?? ''

    if (isMockedRequest(method, url)) {
      // Override the adapter to short-circuit the HTTP request
      const mockResponseData = getMockResponse(config)
      config.adapter = () => Promise.resolve(mockResponseData)
    }

    return config
  })

  // ── Response interceptor: patch GET /ideas to show ANALYZED status ──
  // The /ideas endpoint comes from the real backend. After a mock analysis
  // runs, we patch the response so Contributors/Outreach pages see
  // status === 'ANALYZED' and show the idea in their dropdowns.
  axiosInstance.interceptors.response.use((response) => {
    const url = response.config.url ?? ''
    if (url === '/ideas' && Array.isArray(response.data)) {
      response.data = response.data.map((idea: Record<string, unknown>) => {
        if (idea.id && state.analyzedIdeaIds.has(Number(idea.id))) {
          return { ...idea, status: 'ANALYZED' }
        }
        return idea
      })
    }
    return response
  })
}
