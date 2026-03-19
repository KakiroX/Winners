"""Panorama domain constants."""

from pathlib import Path

# Image dimensions for equirectangular panoramas (2:1 aspect ratio)
PANORAMA_WIDTH = 1024
PANORAMA_HEIGHT = 512

# Context crop size for surgical edits
CROP_SIZE = 512

# Storage
STORAGE_BASE_DIR = Path(__file__).parent.parent.parent / "storage" / "designs"

# Pannellum viewer defaults
DEFAULT_HFOV = 110
DEFAULT_AUTO_ROTATE = -2.0

# Generation
MAX_ROOMS_PARALLEL = 6
MAX_GENERATION_RETRIES = 2
