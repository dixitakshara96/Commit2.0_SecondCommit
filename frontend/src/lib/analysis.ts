import api from './api'

/**
 * Resolve the actual RepositoryAnalysis ID from an idea ID.
 *
 * Data chain: Idea → Repository (idea_id FK) → RepositoryAnalysis (repository_id FK)
 *
 * Strategy:
 * 1. Check localStorage for a previously saved analysis ID (set by Analysis.tsx on completion)
 * 2. Verify it belongs to the selected repo for this idea
 * 3. Return the validated ID or null
 */
export async function resolveAnalysisId(ideaId: number): Promise<number | null> {
  try {
    // Fetch repos for this idea to find the selected repo
    const repos = await api.get(`/repositories?idea_id=${ideaId}`)
    const selectedRepo = repos.data.find((r: any) => r.is_selected)
    if (!selectedRepo) return null

    // Check localStorage for a previously stored analysis ID
    const storedId = localStorage.getItem('last_analysis_id')
    if (storedId) {
      try {
        const analysis = await api.get(`/analysis/${storedId}`).then((r) => r.data)
        if (analysis.repository_id === selectedRepo.id) {
          return parseInt(storedId)
        }
      } catch {
        // Stored ID is stale or invalid
        localStorage.removeItem('last_analysis_id')
      }
    }

    return null
  } catch {
    return null
  }
}

/**
 * Convenience hook to get the analysis ID for the current flow.
 * Returns null if no analysis has been run yet.
 */
export function getStoredAnalysisId(): number | null {
  const stored = localStorage.getItem('last_analysis_id')
  return stored ? parseInt(stored) : null
}
