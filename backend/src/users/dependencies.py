"""User domain FastAPI dependencies."""

from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_session
from src.users.exceptions import InvalidTokenError
from src.users.models import UserModel
from src.users.service import UserService, decode_access_token

# Same message for all auth failures — prevents user enumeration
_AUTH_ERROR = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
)


async def get_current_user(
    auth_token: str | None = Cookie(default=None),
    session: AsyncSession = Depends(get_session),
) -> UserModel:
    if not auth_token:
        raise _AUTH_ERROR

    try:
        user_id = decode_access_token(auth_token)
    except InvalidTokenError:
        raise _AUTH_ERROR

    user = await UserService.get_by_id(user_id, session)
    if not user:
        raise _AUTH_ERROR

    return user


async def get_optional_current_user(
    auth_token: str | None = Cookie(default=None),
    session: AsyncSession = Depends(get_session),
) -> UserModel | None:
    if not auth_token:
        return None
    try:
        user_id = decode_access_token(auth_token)
        return await UserService.get_by_id(user_id, session)
    except Exception:
        return None
