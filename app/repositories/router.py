from fastapi import APIRouter, HTTPException, Query, status

from app.core.dependencies import CurrentUser
from app.core.types import DBSession
from app.crud.idea import idea_crud
from app.db.enums import IdeaStatus
from app.repositories.crud import repository_crud
from app.repositories.github_service import github_service
from app.repositories.schemas import (
    RepositoryRead,
    RepositorySearchRequest,
    RepositorySelectRequest,
)

router = APIRouter(
    prefix="/repositories",
    tags=["Repositories"],
)


@router.post(
    "/search",
    response_model=list[RepositoryRead],
    status_code=status.HTTP_200_OK,
)
async def search_repositories(
    payload: RepositorySearchRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Search GitHub for the top 3 most relevant open-source repositories
    matching the approved idea's refined description.

    The idea must be in APPROVED status.
    Results are saved to the database and returned.
    """
    # 1. Fetch the idea and verify ownership
    idea = idea_crud.get(db=db, idea_id=payload.idea_id)

    if idea is None or idea.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Idea not found.",
        )

    if idea.status != IdeaStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idea must be in APPROVED status before searching repositories.",
        )

    if not idea.refined_prompt:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Idea has no refined prompt. Refine it first via POST /ideas/{id}/refine.",
        )

    # 2. Build a search query from the refined prompt
    search_query = _build_search_query(idea.refined_prompt)

    # 3. Search GitHub
    results = await github_service.search_repositories(
        query=search_query,
        sort="stars",
        per_page=10,
    )

    # 4. Filter: must have a permissive license and not be archived
    permissive_licenses = {
        "mit", "apache-2.0", "bsd-2-clause", "bsd-3-clause",
        "cc0-1.0", "unlicense", "isc", "zlib",
    }

    filtered = []
    for item in results:
        license_info = item.get("license")
        license_key = (license_info or {}).get("spdx_id", "").lower() if license_info else ""

        if item.get("archived", False):
            continue
        if license_key and license_key not in permissive_licenses and license_key != "other":
            continue

        filtered.append(item)
        if len(filtered) >= 3:
            break

    # 5. Save to database
    saved_repos = []
    for item in filtered:
        license_info = item.get("license")
        license_key = (license_info or {}).get("spdx_id") if license_info else None

        last_commit = None
        if item.get("pushed_at"):
            from datetime import datetime
            try:
                last_commit = datetime.fromisoformat(item["pushed_at"].replace("Z", "+00:00"))
            except (ValueError, TypeError):
                pass

        repo = repository_crud.create(
            db=db,
            idea_id=idea.id,
            github_repo_id=item["id"],
            owner=item["owner"]["login"],
            repo_name=item["name"],
            url=item["html_url"],
            description=item.get("description"),
            stars=item.get("stargazers_count", 0),
            forks=item.get("forks_count", 0),
            language=item.get("language"),
            license=license_key,
            last_commit=last_commit,
        )
        saved_repos.append(repo)

    return saved_repos


@router.post(
    "/select",
    response_model=RepositoryRead,
)
def select_repository(
    payload: RepositorySelectRequest,
    db: DBSession,
    current_user: CurrentUser,
):
    """
    Select a repository for analysis.

    Marks the repository as selected (is_selected = True) and
    deselects all other repositories for the same idea.
    """
    repo = repository_crud.get(db=db, repository_id=payload.repository_id)

    if repo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found.",
        )

    # Verify ownership through the idea
    idea = idea_crud.get(db=db, idea_id=repo.idea_id)
    if idea is None or idea.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Repository not found.",
        )

    return repository_crud.select(db=db, repository=repo)


@router.get(
    "",
    response_model=list[RepositoryRead],
)
def list_repositories(
    db: DBSession,
    current_user: CurrentUser,
    idea_id: int | None = Query(
        default=None,
        description="Filter by idea ID.",
    ),
):
    """
    List repositories, optionally filtered by idea_id.
    """
    if idea_id:
        # Verify ownership
        idea = idea_crud.get(db=db, idea_id=idea_id)
        if idea is None or idea.owner_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Idea not found.",
            )
        return repository_crud.get_by_idea(db=db, idea_id=idea_id)

    return []


def _build_search_query(refined_prompt: str) -> str:
    """
    Build an effective GitHub search query from the refined idea description.
    Extracts key terms, limits query length, and adds quality filters.
    """
    import re

    # Take first ~200 chars of the refined prompt
    text = refined_prompt[:200].strip()

    # Remove common stop words and special chars
    text = re.sub(r'[^\w\s]', ' ', text)
    stop_words = {
        'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
        'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
        'this', 'that', 'these', 'those', 'it', 'its', 'and', 'or',
        'but', 'not', 'we', 'our', 'you', 'your', 'their', 'they',
        'will', 'can', 'has', 'have', 'had', 'do', 'does', 'did',
        'build', 'using', 'based', 'tool', 'platform', 'system',
    }

    words = [w.lower() for w in text.split() if w.lower() not in stop_words and len(w) > 2]
    unique_words = list(dict.fromkeys(words))[:8]  # deduplicate, keep top 8

    query_parts = " ".join(unique_words)

    # Add quality filters
    query = f"{query_parts} stars:>50"

    return query.strip()
