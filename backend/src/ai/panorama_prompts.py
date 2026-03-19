"""Highly optimized structured prompting for Architectural Panorama Generation."""

import json
import math


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
    width_units: float = 0.0,
    height_units: float = 0.0,
) -> str:
    """Build a high-density spatial prompt using structured JSON blocks.
    
    This format reduces AI 'reasoning' time by providing a structured layout
    that the model can parse in a single pass.
    """
    
    # 1. Create the Spatial Data Block (The "Engine" of the prompt)
    spatial_data = {
        "room": {
            "label": room_label,
            "type": room_type,
            "dimensions": {
                "area_m2": round(area_sqm, 1),
                "width_relative": width_units,
                "height_relative": height_units
            },
            "lighting": natural_light,
            "features": features
        },
        "connections": [
            {
                "target": c["target_label"],
                "yaw_degrees": round(float(c["yaw"]), 0),
                "visual_anchor": "Visible door or opening"
            } for c in (connections or [])
        ],
        "style": {
            "aesthetic": aesthetic_tags,
            "notes": style_notes,
            "user_request": user_style_prompt
        }
    }

    # 2. Concise Instruction Set (Optimization: No fluff, just constraints)
    instructions = [
        "TASK: Generate a high-fidelity 360° Equirectangular Panorama based on SPATIAL_JSON.",
        "FORMAT: 2:1 Aspect Ratio, full 360° horizontal coverage.",
        "MAPPING: center=North(0°), far-left/right=South(180°).",
        "STRICT_RULE: Place all connections (doors) at their exact YAW coordinates.",
        "VISUALS: Photorealistic, 8K architectural render, Unreal Engine 5 style.",
        "CLEANLINESS: NO text, labels, room names, or degree markings on the image."
    ]

    return f"""
{chr(10).join(instructions)}

SPATIAL_JSON:
{json.dumps(spatial_data, indent=2)}

NEGATIVE_CONSTRAINTS:
- No text, captions, or watermarks.
- No degree numbers or compass markings.
- No UI elements or descriptive labels written in the scene.
- No distortion seams, low resolution, or people.
"""


def build_edit_prompt(
    modification: str,
    room_state: str = "",
    pitch: float | None = None,
    yaw: float | None = None,
    width: int = 2048,
    height: int = 1152,
) -> str:
    """Build a precision-targeted surgical edit prompt."""
    
    context = {
        "current_state": room_state or "Visible in image.",
        "modification_request": modification,
        "target_location": {
            "yaw": round(yaw, 1) if yaw is not None else None,
            "pitch": round(pitch, 1) if pitch is not None else None
        } if (pitch is not None and yaw is not None) else "Global"
    }

    return f"""
TASK: Perform a surgical In-Context edit on the attached 360° panorama.

TARGET_JSON:
{json.dumps(context, indent=2)}

STRICT_RULES:
1. Preserve structural geometry. Change ONLY the requested area/object.
2. Maintain perfect 360° horizontal continuity.
3. Match lighting and material quality of the base image.
4. DO NOT add any text, labels, or indicators to the image.
"""
