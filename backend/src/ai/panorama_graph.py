"""LangGraph pipeline for panorama generation from a floor plan schema."""

from langgraph.graph import END, StateGraph

from src.ai.panorama_nodes import (
    generate_room_panoramas,
    handle_panorama_error,
    link_rooms_and_build,
    prepare_room_prompts,
)
from src.ai.panorama_state import PanoramaGraphState


def _route_after_generation(state: PanoramaGraphState) -> str:
    """Route based on generation results."""
    generated = state.get("generated_images", {})
    if not generated:
        return "error"
    return "link"


def build_panorama_graph() -> StateGraph:
    """Build and compile the panorama generation LangGraph pipeline.

    Pipeline:
        prepare_room_prompts
            ↓
        generate_room_panoramas
            ↓ (conditional)
        link_rooms_and_build  ──→  END
            or
        handle_panorama_error ──→  END
    """
    graph = StateGraph(PanoramaGraphState)

    graph.add_node("prepare_room_prompts", prepare_room_prompts)
    graph.add_node("generate_room_panoramas", generate_room_panoramas)
    graph.add_node("link_rooms_and_build", link_rooms_and_build)
    graph.add_node("handle_panorama_error", handle_panorama_error)

    graph.set_entry_point("prepare_room_prompts")
    graph.add_edge("prepare_room_prompts", "generate_room_panoramas")

    graph.add_conditional_edges(
        "generate_room_panoramas",
        _route_after_generation,
        {
            "link": "link_rooms_and_build",
            "error": "handle_panorama_error",
        },
    )

    graph.add_edge("link_rooms_and_build", END)
    graph.add_edge("handle_panorama_error", END)

    return graph.compile()
