"""All panorama generation prompt templates live here and ONLY here."""

SYSTEM_INSTRUCTIONS = (
    "You are an expert Architectural Visualization AI. Your task is to "
    "generate a high-fidelity 360-degree Equirectangular Panorama of an "
    "interior space."
)

BASE_CONTEXT = (
    "Format: 360-degree, equirectangular projection, 2:1 aspect ratio. "
    "Style: Photorealistic, architectural photography, 8k resolution, "
    "Unreal Engine 5 render. "
    "Lighting: Global illumination, natural sunlight from windows."
)

TECHNICAL_KEYWORDS = (
    "360-degree, panoramic view, equirectangular projection, aspect ratio 2:1, "
    "ultra-wide angle, distorted perspective for 3D sphere, seamless horizon, "
    "full interior view, 8k resolution, photorealistic, sharp details, "
    "architectural photography style"
)

NEGATIVE_PROMPT = (
    "Do NOT include: fisheye lens distortion, black bars, cut-off edges, "
    "2D flat image, people, blur, low resolution, broken geometry."
)

GENERATION_RULES = (
    "1. Maintain the overall spatial geometry and architectural structure of the room. "
    "2. If asked to change a single element, modify ONLY that element and keep "
    "everything else identical. "
    "3. If asked for a style change, transform the lighting, materials, and furniture "
    "while keeping the 360-degree perspective intact. "
    "4. Ensure the horizontal line is perfectly straight for seamless 3D sphere mapping."
)


def build_room_prompt(
    room_label: str,
    room_type: str,
    area_sqm: float,
    features: list[str],
    natural_light: str,
    aesthetic_tags: list[str],
    style_notes: str,
) -> str:
    """Build a full generation prompt for a single room panorama."""
    style_str = ", ".join(aesthetic_tags) if aesthetic_tags else "modern, clean"
    features_str = ", ".join(features) if features else "standard layout"
    light_desc = {
        "high": "abundant natural sunlight from large windows",
        "medium": "moderate natural light with some windows",
        "low": "ambient interior lighting with minimal windows",
    }.get(natural_light, "natural lighting")

    scene_description = (
        f"A {area_sqm:.0f} square meter {room_label} ({room_type.replace('_', ' ')}). "
        f"Style: {style_str}. "
        f"Features: {features_str}. "
        f"Lighting: {light_desc}. "
        f"Design notes: {style_notes}"
    )

    return "\n".join([
        SYSTEM_INSTRUCTIONS,
        "",
        f"BASE CONTEXT: {BASE_CONTEXT}",
        "",
        f"SCENE DESCRIPTION: {scene_description}",
        f"STYLE HINTS: {style_str}",
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
    width: int = 1024,
    height: int = 512,
) -> str:
    """Build a surgical edit prompt for an existing panorama."""
    location_context = ""
    if pitch is not None and yaw is not None:
        x = int(((yaw + 180) / 360) * width)
        y = int(((90 - pitch) / 180) * height)
        location_context = (
            f"STRICT FOCUS: This modification applies ONLY to the object "
            f"located at pixel coordinates (x={x}, y={y}). "
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
        f"GENERATION RULES: {GENERATION_RULES}",
        "5. Local Transformation: Change only the specified area/object. "
        "Do not alter the surrounding walls, lighting, or unrelated furniture.",
        "",
        NEGATIVE_PROMPT,
    ])
