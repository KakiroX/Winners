import logging
import uuid

from src.ai.client import get_gemini_client
from src.ai.prompts import GENERATE_SCHEMAS_TEMPLATE, INTERPRET_PROMPT_TEMPLATE
from src.ai.state import FloorPlanGraphState
from src.ai.utils import parse_json_response
from src.floor_plan.schemas import FloorPlanSchema

logger = logging.getLogger(__name__)


async def interpret_prompt(state: FloorPlanGraphState) -> dict[str, object]:
    llm = get_gemini_client()
    chain = INTERPRET_PROMPT_TEMPLATE | llm
    result = await chain.ainvoke({"prompt": state["raw_prompt"]})
    content = result.content
    if isinstance(content, list):
        interpretation = "".join(block["text"] for block in content if isinstance(block, dict) and block.get("type") == "text").strip()
    else:
        interpretation = str(content).strip()
    logger.info("prompt_interpreted", extra={"generation_id": state["generation_id"]})
    return {"prompt_interpretation": interpretation}


async def generate_schemas(state: FloorPlanGraphState) -> dict[str, object]:
    llm = get_gemini_client()
    chain = GENERATE_SCHEMAS_TEMPLATE | llm
    attempt = state.get("parse_attempts", 0)
    error = state.get("error", "")
    error_context = (
        f"This is attempt number {attempt}. Previous attempt failed with: {error}\nFix the issue and try again."
        if attempt > 0 and error
        else f"This is attempt number {attempt}."
    )
    result = await chain.ainvoke({
        "interpretation": state["prompt_interpretation"],
        "error_context": error_context,
    })
    logger.info("schemas_generated", extra={"attempt": attempt, "generation_id": state["generation_id"]})
    content = result.content
    if isinstance(content, list):
        raw = "".join(block["text"] for block in content if isinstance(block, dict) and block.get("type") == "text")
    else:
        raw = str(content)

    return {
        "raw_llm_output": raw,
        "parse_attempts": attempt + 1,
    }


async def validate_schemas(state: FloorPlanGraphState) -> dict[str, object]:
    try:
        data = parse_json_response(state["raw_llm_output"])
        raw_schemas: list[dict[str, object]] = data["schemas"]  # type: ignore[assignment]
        schemas = [
            FloorPlanSchema(**{**s, "id": str(uuid.uuid4())})
            for s in raw_schemas
        ]
        if not (3 <= len(schemas) <= 4):
            raise ValueError(f"Expected 3-4 schemas, got {len(schemas)}")
        logger.info("schemas_validated", extra={"count": len(schemas), "generation_id": state["generation_id"]})
        return {"validated_schemas": schemas}
    except Exception as exc:
        logger.warning(
            "schema_validation_failed error=%s raw=%s",
            str(exc),
            state.get("raw_llm_output", "")[:500],
        )
        return {"error": str(exc)}


async def handle_error(state: FloorPlanGraphState) -> dict[str, object]:
    from src.floor_plan.exceptions import SchemaGenerationError

    raise SchemaGenerationError(
        f"Failed to generate valid floor plan after 3 attempts. Last error: {state.get('error')}"
    )
