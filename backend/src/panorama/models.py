"""SQLAlchemy models for panorama domain."""

from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database import Base


class WalkthroughModel(Base):
    __tablename__ = "walkthroughs"

    id: Mapped[str] = mapped_column(String(12), primary_key=True)
    floor_plan_id: Mapped[str] = mapped_column(String, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False, default="")
    pannellum_config: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    rooms: Mapped[list["RoomModel"]] = relationship(
        back_populates="walkthrough", cascade="all, delete-orphan", lazy="selectin"
    )


class RoomModel(Base):
    __tablename__ = "rooms"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    walkthrough_id: Mapped[str] = mapped_column(
        String(12), ForeignKey("walkthroughs.id", ondelete="CASCADE"), nullable=False
    )
    room_id: Mapped[str] = mapped_column(String, nullable=False)
    room_label: Mapped[str] = mapped_column(String, nullable=False, default="")
    current_version_id: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    walkthrough: Mapped[WalkthroughModel] = relationship(back_populates="rooms")
    versions: Mapped[list["RoomVersionModel"]] = relationship(
        back_populates="room", cascade="all, delete-orphan", lazy="selectin"
    )


class RoomVersionModel(Base):
    __tablename__ = "room_versions"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    room_pk: Mapped[int] = mapped_column(
        Integer, ForeignKey("rooms.id", ondelete="CASCADE"), nullable=False
    )
    image_url: Mapped[str] = mapped_column(Text, nullable=False)
    prompt_used: Mapped[str] = mapped_column(Text, nullable=False, default="")
    hotspots: Mapped[dict] = mapped_column(JSONB, nullable=False, default=list)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    room: Mapped[RoomModel] = relationship(back_populates="versions")
