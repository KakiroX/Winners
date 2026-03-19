"""User/auth API router."""

import logging

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.database import get_session
from src.users.dependencies import get_current_user
from src.users.exceptions import InvalidCredentialsError, UserAlreadyExistsError
from src.users.models import UserModel
from src.users.schemas import LoginRequest, RegisterRequest, TokenResponse, UserOut
from src.users.service import UserService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["auth"])

_COOKIE_OPTS: dict = {
    "key": "auth_token",
    "httponly": True,
    "samesite": "lax",
    "secure": False,   # set True behind HTTPS in production
    "max_age": 60 * 60 * 24 * 30,  # 30 days
    "path": "/",
}


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    body: RegisterRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    try:
        user, token = await UserService.register(body.name, body.email, body.password, session)
    except UserAlreadyExistsError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc

    response.set_cookie(value=token, **_COOKIE_OPTS)
    return TokenResponse(user=UserService.to_out(user))


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
)
async def login(
    body: LoginRequest,
    response: Response,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    try:
        user, token = await UserService.login(body.email, body.password, session)
    except InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    response.set_cookie(value=token, **_COOKIE_OPTS)
    return TokenResponse(user=UserService.to_out(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response) -> None:
    response.delete_cookie(key="auth_token", path="/")


@router.get("/me", response_model=UserOut)
async def me(current_user: UserModel = Depends(get_current_user)) -> UserOut:
    return UserService.to_out(current_user)
