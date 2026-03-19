"""Panorama domain exceptions."""


class PanoramaGenerationError(Exception):
    """Raised when panorama generation fails after retries."""


class RoomNotFoundError(Exception):
    """Raised when a room ID is not found in a walkthrough."""


class WalkthroughNotFoundError(Exception):
    """Raised when a walkthrough/design ID is not found."""


class VersionNotFoundError(Exception):
    """Raised when a version ID is not found."""
