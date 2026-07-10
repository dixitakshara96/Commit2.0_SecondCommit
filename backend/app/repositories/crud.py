from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models.repository import Repository


class RepositoryCRUD:

    @staticmethod
    def create(
        db: Session,
        *,
        idea_id: int,
        github_repo_id: int,
        owner: str,
        repo_name: str,
        url: str,
        description: str | None,
        stars: int,
        forks: int,
        language: str | None,
        license: str | None,
        last_commit: str | None,
    ) -> Repository:
        """Create a new repository record."""
        repo = Repository(
            idea_id=idea_id,
            github_repo_id=github_repo_id,
            owner=owner,
            repo_name=repo_name,
            url=url,
            description=description,
            stars=stars,
            forks=forks,
            language=language,
            license=license,
            last_commit=last_commit,
        )
        db.add(repo)
        db.commit()
        db.refresh(repo)
        return repo

    @staticmethod
    def get(
        db: Session,
        *,
        repository_id: int,
    ) -> Repository | None:
        return db.get(Repository, repository_id)

    @staticmethod
    def get_by_idea(
        db: Session,
        *,
        idea_id: int,
    ) -> list[Repository]:
        stmt = (
            select(Repository)
            .where(Repository.idea_id == idea_id)
            .order_by(Repository.stars.desc())
        )
        return list(db.execute(stmt).scalars().all())

    @staticmethod
    def get_selected(
        db: Session,
        *,
        idea_id: int,
    ) -> Repository | None:
        stmt = (
            select(Repository)
            .where(Repository.idea_id == idea_id)
            .where(Repository.is_selected.is_(True))
        )
        return db.execute(stmt).scalar_one_or_none()

    @staticmethod
    def select(
        db: Session,
        *,
        repository: Repository,
    ) -> Repository:
        """Mark a repository as selected and deselect all others for the same idea."""
        # Deselect all repos for this idea
        stmt = (
            select(Repository)
            .where(Repository.idea_id == repository.idea_id)
        )
        for repo in db.execute(stmt).scalars().all():
            repo.is_selected = False

        # Select this one
        repository.is_selected = True
        db.commit()
        db.refresh(repository)
        return repository

    @staticmethod
    def delete(
        db: Session,
        *,
        repository: Repository,
    ) -> None:
        db.delete(repository)
        db.commit()


repository_crud = RepositoryCRUD()
