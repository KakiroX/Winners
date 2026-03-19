"""All panorama generation prompt templates live here and ONLY here."""

import math


SYSTEM_INSTRUCTIONS = (
    "You are an expert Architectural Visualization AI. Your task is to "
    "generate a high-fidelity 360-degree Equirectangular Panorama of an "
    "interior space. You MUST follow the spatial layout data precisely."
)

BASE_CONTEXT = (
    "Format: 360-degree equirectangular projection, 2:1 aspect ratio. "
    "The image wraps around a full 360° sphere horizontally. "
    "The CENTER of the image (x=50%) faces YAW=0° (North). "
    "The LEFT edge faces YAW=-180° (South via West). "
    "The RIGHT edge faces YAW=+180° (South via East). "
    "Style: Photorealistic, architectural photography, 8K resolution, "
    "Unreal Engine 5 rendering quality. "
    "Lighting: Global illumination, natural sunlight from windows."
)

TECHNICAL_KEYWORDS = (
    "360-degree, panoramic view, equirectangular projection, aspect ratio 2:1, "
    "ultra-wide angle, distorted perspective for 3D sphere mapping, seamless horizon, "
    "full interior view, 8K resolution, photorealistic, sharp details, "
    "architectural photography style"
)

NEGATIVE_PROMPT = (
    "Do NOT include: fisheye lens distortion, black bars, cut-off edges, "
    "2D flat image, people, blur, low resolution, broken geometry, "
    "inconsistent perspective, visible seams."
)


def _compute_yaw_between(
    from_pos: dict[str, int], from_w: int, from_h: int,
    to_pos: dict[str, int], to_w: int, to_h: int,
) -> float:
    """Compute the yaw angle from one room's center to another's."""
    ax = from_pos["x"] + from_w / 2
    ay = from_pos["y"] + from_h / 2
    bx = to_pos["x"] + to_w / 2
    by = to_pos["y"] + to_h / 2
    return math.degrees(math.atan2(bx - ax, -(by - ay)))


def _yaw_to_compass(yaw: float) -> str:
    """Convert a yaw angle to a human-readable compass direction."""
    # Normalize to [0, 360)
    yaw = yaw % 360
    if yaw < 0:
        yaw += 360
    directions = [
        (0, "North (center of image)"),
        (45, "North-East (slightly right of center)"),
        (90, "East (right quarter of image)"),
        (135, "South-East (right edge of image)"),
        (180, "South (far left/right edges of image)"),
        (225, "South-West (left edge of image)"),
        (270, "West (left quarter of image)"),
        (315, "North-West (slightly left of center)"),
    ]
    closest = min(directions, key=lambda d: abs(((yaw - d[0] + 180) % 360) - 180))
    return closest[1]


def _yaw_to_image_position(yaw: float) -> str:
    """Convert yaw to approximate horizontal position in the equirectangular image."""
    # In equirectangular: x_percent = (yaw + 180) / 360
    x_pct = ((yaw + 180) / 360) * 100
    if x_pct < 15:
        return "far left edge"
    elif x_pct < 35:
        return "left side"
    elif x_pct < 65:
        return "center"
    elif x_pct < 85:
        return "right side"
    else:
        return "far right edge"


def build_room_prompt(
    room_label: str,
    room_type: str,
    area_sqm: float,
    features: list[str],
    natural_light: str,
    aesthetic_tags: list[str],
    style_notes: str,
    connections: list[dict[str, object]] | None = None,
    user_style_prompt: str = "",
) -> str:
    """Build a full generation prompt for a single room panorama.

    Args:
        connections: list of dicts with keys:
            - target_label: str (room name)
            - target_type: str (room type)
            - yaw: float (angle to the connected room)
    """
    style_str = ", ".join(aesthetic_tags) if aesthetic_tags else "modern, clean"
    features_str = ", ".join(f.replace("_", " ") for f in features) if features else "standard layout"
    light_desc = {
        "high": "abundant natural sunlight flooding through large windows",
        "medium": "moderate natural light filtering through windows",
        "low": "ambient interior lighting, minimal windows",
    }.get(natural_light, "natural lighting")

    # Build door/connection instructions
    door_instructions = ""
    if connections:
        door_lines = []
        for conn in connections:
            yaw = float(conn["yaw"])  # type: ignore[arg-type]
            compass = _yaw_to_compass(yaw)
            img_pos = _yaw_to_image_position(yaw)
            door_lines.append(
                f"  - Door/opening to {conn['target_label']} ({conn['target_type']}): "
                f"at yaw {yaw:.0f}° → {compass} → {img_pos} of the panorama image. "
                f"Render a visible door or archway at this exact position."
            )
        door_instructions = (
            "\n\nDOOR AND OPENING PLACEMENT (CRITICAL — follow exactly):\n"
            "The panorama camera is positioned at the CENTER of this room. "
            "Doors and openings MUST be placed at the following positions. "
            "Each yaw angle maps to a horizontal position in the equirectangular image:\n"
            + "\n".join(door_lines)
        )

    # Build window instructions from features
    window_lines = []
    for f in features:
        if f.startswith("window_"):
            direction = f.replace("window_", "")
            window_lines.append(f"  - Window on the {direction} wall")
    window_instructions = ""
    if window_lines:
        window_instructions = "\n\nWINDOW PLACEMENT:\n" + "\n".join(window_lines)

    # User's custom style
    user_style_section = ""
    if user_style_prompt:
        user_style_section = f"\n\nUSER STYLE REQUEST: {user_style_prompt}"

    scene_description = (
        f"A {area_sqm:.0f} square meter {room_label} ({room_type.replace('_', ' ')}). "
        f"Interior design style: {style_str}. "
        f"Room features: {features_str}. "
        f"Lighting condition: {light_desc}. "
        f"Design rationale: {style_notes}"
    )

    return "\n".join([
        SYSTEM_INSTRUCTIONS,
        "",
        f"BASE CONTEXT: {BASE_CONTEXT}",
        "",
        f"SCENE DESCRIPTION: {scene_description}",
        door_instructions,
        window_instructions,
        user_style_section,
        "",
        f"TECHNICAL KEYWORDS: {TECHNICAL_KEYWORDS}",
        "",
        NEGATIVE_PROMPT,
    ])


def build_edit_prompt(
    modification: str,
    room_state: str = "",
    pitch: float | None = None,
    yaw: float | None = None,
    width: int = 2048,
    height: int = 1152,
) -> str:
    """Build a surgical edit prompt for an existing panorama."""
    location_context = ""
    if pitch is not None and yaw is not None:
        x = int(((yaw + 180) / 360) * width)
        y = int(((90 - pitch) / 180) * height)
        compass = _yaw_to_compass(yaw)
        img_pos = _yaw_to_image_position(yaw)
        location_context = (
            f"STRICT FOCUS: This modification applies ONLY to the area "
            f"at yaw={yaw:.1f}°, pitch={pitch:.1f}° → {compass} → "
            f"{img_pos} of the image (pixel ~x={x}, y={y}). "
        )

    generation_rules = (
        "1. Maintain the overall spatial geometry and architectural structure. "
        "2. Modify ONLY the specified element — keep everything else identical. "
        "3. For style changes, transform lighting, materials, and furniture "
        "while keeping the 360-degree perspective intact. "
        "4. Ensure the horizontal line stays perfectly straight for seamless sphere mapping. "
        "5. Local Transformation: Change only the specified area/object. "
        "Do not alter surrounding walls, lighting, or unrelated furniture."
    )

    return "\n".join([
        SYSTEM_INSTRUCTIONS,
        "",
        f"BASE CONTEXT: {BASE_CONTEXT}",
        "",
        f"CURRENT ROOM STATE: {room_state}" if room_state else "",
        "",
        f"USER MODIFICATION REQUEST: {location_context}{modification}",
        "",
        f"GENERATION RULES: {generation_rules}",
        "",
        NEGATIVE_PROMPT,
    ])
