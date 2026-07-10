from fastapi import HTTPException, status


credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials.",
    headers={
        "WWW-Authenticate": "Bearer",
    },
)


forbidden_exception = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Insufficient permissions.",
)