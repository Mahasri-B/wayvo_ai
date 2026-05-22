"""
LLM service - Ollama (primary) with Groq fallback.
LLM is used ONLY for natural language explanation, NOT for route calculation.
"""
import httpx
import json
from typing import List, Dict, Optional
from app.config import settings


SYSTEM_PROMPT = """You are Wayvo AI, an expert Tamil Nadu rural travel assistant.
You help travelers navigate between villages, towns, and hill stations in Tamil Nadu, India.

Your role:
- Explain travel routes clearly and naturally
- Summarize transport options (bus, train, local transport)
- Provide safety guidance for ghat roads and hill stations
- Share local travel intelligence and tips
- Warn about weather, road conditions, and seasonal closures
- Compare route options to help travelers decide

Rules:
- Only explain routes that are provided to you in context. Do NOT invent routes.
- Be concise but helpful. Use simple English.
- Mention approximate costs and durations when available.
- Always mention safety warnings if present.
- Keep responses under 200 words unless asked for detail.
- You are multilingual-ready but respond in English by default.
"""


async def generate_route_explanation(
    from_loc: str,
    to_loc: str,
    routes: List[Dict],
    local_intel: List[Dict],
    alerts: List[Dict],
    preference: str = "fastest",
    elevation: dict = None,
) -> str:
    """Generate natural language explanation of route options."""
    context = _build_route_context(from_loc, to_loc, routes, local_intel, alerts, preference, elevation or {})
    prompt = f"""Based on the following travel information, explain the best route options from {from_loc} to {to_loc} in Tamil Nadu.

{context}

Provide a helpful, conversational summary covering:
1. The recommended route and why
2. Key transport connections
3. Approximate time and cost
4. Any warnings or tips
"""
    return await _call_llm(prompt)


async def generate_chat_response(
    user_message: str,
    context: Optional[Dict],
    history: List[Dict],
    local_intel: List[Dict]
) -> str:
    """Generate conversational response for chatbot."""
    intel_text = "\n".join([d.get("content", "") for d in local_intel[:3]])
    context_text = json.dumps(context, indent=2) if context else "No specific route context."

    history_text = ""
    for msg in history[-4:]:  # last 4 messages for context
        role = msg.get("role", "user")
        content = msg.get("content", "")
        history_text += f"{role.upper()}: {content}\n"

    prompt = f"""Current route context:
{context_text}

Relevant local intelligence:
{intel_text}

Conversation history:
{history_text}

User: {user_message}

Respond as Wayvo AI assistant:"""

    return await _call_llm(prompt)


async def _call_llm(prompt: str) -> str:
    """Try Ollama first (fast fail), then Groq. Hard 20s total timeout."""
    import asyncio
    try:
        result = await asyncio.wait_for(_call_llm_inner(prompt), timeout=20.0)
        return result
    except asyncio.TimeoutError:
        return "AI summary unavailable — routes are shown above."


async def _call_llm_inner(prompt: str) -> str:
    """Try Ollama first, fall back to Groq if unavailable."""
    response = await _call_ollama(prompt)
    if response:
        return response
    if settings.groq_api_key:
        response = await _call_groq(prompt)
        if response:
            return response
    return "AI summary unavailable — routes are shown above."


async def _call_ollama(prompt: str) -> Optional[str]:
    """Call local Ollama instance. Short timeout so Groq fallback is fast."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(
                f"{settings.ollama_host}/api/generate",
                json={
                    "model": settings.ollama_model,
                    "prompt": f"{SYSTEM_PROMPT}\n\n{prompt}",
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 400},
                },
            )
            if resp.status_code == 200:
                return resp.json().get("response", "").strip()
    except Exception:
        pass
    return None


async def _call_groq(prompt: str) -> Optional[str]:
    """Call Groq API as fallback."""
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.groq_api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "llama-3.1-8b-instant",
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0.3,
                    "max_tokens": 400,
                },
            )
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception:
        pass
    return None


def _build_route_context(
    from_loc: str,
    to_loc: str,
    routes: List[Dict],
    local_intel: List[Dict],
    alerts: List[Dict],
    preference: str,
    elevation: dict = None,
) -> str:
    lines = [f"Journey: {from_loc} → {to_loc}", f"Preference: {preference}"]

    if elevation:
        if elevation.get("is_hill_route"):
            lines.append(f"Hill Route: destination at ~{int(elevation.get('destination_elevation_m', 0))}m elevation")
        if elevation.get("elevation_gain_m") is not None:
            lines.append(f"Elevation gain: {elevation['elevation_gain_m']}m")
    lines.append("")

    for i, route in enumerate(routes[:3], 1):
        lines.append(f"Route {i}: {route.get('label', '')}")
        lines.append(f"  Duration: {route.get('total_duration_minutes', 0)} minutes")
        lines.append(f"  Cost: ₹{route.get('total_fare_inr', 0)}")
        lines.append(f"  Safety: {route.get('safety_rating', 0)}/5")
        if route.get("warnings"):
            lines.append(f"  Warnings: {', '.join(route['warnings'])}")
        lines.append("")

    if alerts:
        lines.append("Active Alerts:")
        for alert in alerts[:3]:
            lines.append(f"  - [{alert.get('severity', '').upper()}] {alert.get('title', '')}")
        lines.append("")

    if local_intel:
        lines.append("Local Intelligence:")
        for intel in local_intel[:2]:
            lines.append(f"  - {intel.get('content', '')[:150]}")

    return "\n".join(lines)
