from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class RepositorySearchRequest(BaseModel):
    idea_id: int = Field(
        description="ID of the approved idea to search repositories for.",
    )


class RepositorySelectRequest(BaseModel):
    repository_id: int = Field(
        description="ID of the repository to select.",
    )


class RepositoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    idea_id: int
    github_repo_id: int
    owner: str
    repo_name: str
    url: str
    description: str | None
    stars: int
    forks: int
    language: str | None
    license: str | None
    last_commit: datetime | None
    is_selected: bool
    created_at: datetime
