"""User domain service — auth business logic."""

import logging
import uuid
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.config import settings
from src.users.exceptions import InvalidCredentialsError, InvalidTokenError, UserAlreadyExistsError
from src.users.models import UserModel
from src.users.schemas import UserOut

logger = logging.getLogger(__name__)

_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"


def _hash_password(plain: str) -> str:
    return _pwd_context.hash(plain)


def _verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.jwt_expire_days)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=ALGORITHM)


def decode_access_token(token: str) -> str:
    """Decode token and return user_id (sub claim). Raises InvalidTokenError on failure."""
    try:
        payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[ALGORITHM])
        user_id: str | None = payload.get("sub")
        if not user_id:
            raise InvalidTokenError("Token missing subject")
        return user_id
    except JWTError as exc:
        raise InvalidTokenError(str(exc)) from exc


class UserService:
    @staticmethod
    async def register(name: str, email: str, password: str, session: AsyncSession) -> tuple[UserModel, str]:
        existing = await session.scalar(select(UserModel).where(UserModel.email == email))
        if existing:
            raise UserAlreadyExistsError(f"Email {email} is already registered")

        user = UserModel(
            id=str(uuid.uuid4()),
            email=email,
            name=name,
            hashed_password=_hash_password(password),
        )
        session.add(user)
        await session.commit()
        await session.refresh(user)

        token = create_access_token(user.id)
        logger.info("user_registered", extra={"user_id": user.id})
        return user, token

    @staticmethod
    async def login(email: str, password: str, session: AsyncSession) -> tuple[UserModel, str]:
        user = await session.scalar(select(UserModel).where(UserModel.email == email))
        if not user or not _verify_password(password, user.hashed_password):
            raise InvalidCredentialsError("Invalid email or password")

        token = create_access_token(user.id)
        logger.info("user_logged_in", extra={"user_id": user.id})
        return user, token

    @staticmethod
    async def get_by_id(user_id: str, session: AsyncSession) -> UserModel | None:
        return await session.scalar(select(UserModel).where(UserModel.id == user_id))

    @staticmethod
    def to_out(user: UserModel) -> UserOut:
        return UserOut(id=user.id, email=user.email, name=user.name)
