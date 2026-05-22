from fastapi import APIRouter
from app.schemas.route import ChatRequest, ChatResponse
from app.rag.retriever import retrieve_local_intelligence, retrieve_safety_tips
from app.rag.llm_service import generate_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI chatbot endpoint.
    Retrieves relevant local intelligence then generates LLM response.
    """
    # Extract location hints from message for targeted retrieval
    message = request.message
    context = request.context or {}
    history = request.history or []

    # Retrieve relevant local intelligence
    local_intel = retrieve_local_intelligence(message)

    # If context has route info, also get safety tips
    if context.get("to_location"):
        safety = retrieve_safety_tips(context["to_location"])
        local_intel += safety

    reply = await generate_chat_response(
        user_message=message,
        context=context,
        history=history,
        local_intel=local_intel,
    )

    return ChatResponse(reply=reply)
