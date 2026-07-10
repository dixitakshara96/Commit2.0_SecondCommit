from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.db.enums import UserRole


class UserCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)

    email: EmailStr

    password: str = Field(min_length=8)

    role: UserRole

    github_username: str | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
    )

    id: int

    name: str

    email: EmailStr

    role: UserRole

    github_username: str | None

    is_verified: bool