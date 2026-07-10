from pydantic import BaseModel, EmailStr

from app.schemas.user import UserRead


class LoginRequest(BaseModel):
    email: EmailStr

    password: str


class TokenPair(BaseModel):
    access_token: str

    refresh_token: str

    token_type: str = "bearer"


class LoginResponse(BaseModel):
    user: UserRead

    tokens: TokenPair

class RefreshRequest(BaseModel):
    refresh_token: str