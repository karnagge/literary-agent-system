from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict
import logging
import json
import asyncio

from app.services.session_manager import SessionManager

router = APIRouter()
logger = logging.getLogger(__name__)

# Store active WebSocket connections
active_connections: Dict[str, WebSocket] = {}
session_manager = SessionManager()


@router.websocket("/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time story generation updates.

    Connect to this endpoint with a valid session_id to receive:
    - Agent status updates
    - Progress notifications
    - Validation results
    - Draft versions
    - Completion notification

    Args:
        websocket: WebSocket connection
        session_id: Unique session identifier
    """
    await websocket.accept()
    active_connections[session_id] = websocket

    logger.info(f"WebSocket connected for session {session_id}")

    try:
        # Send initial connection confirmation
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "session_id": session_id,
            "message": "WebSocket connection established"
        })

        # Start sending updates
        while True:
            # Get latest session state from Redis
            session = await session_manager.get_session(session_id)

            if session:
                await websocket.send_json({
                    "type": "update",
                    "data": session
                })

                # Check if story generation is complete
                if session.get("status") in ["completed", "failed", "cancelled"]:
                    await websocket.send_json({
                        "type": "final",
                        "status": session["status"],
                        "message": f"Story generation {session['status']}",
                        "data": session
                    })
                    break

            # Wait before next update (avoid spamming)
            await asyncio.sleep(2)

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "error": str(e),
                "message": "An error occurred in WebSocket connection"
            })
        except:
            pass
    finally:
        # Clean up connection
        if session_id in active_connections:
            del active_connections[session_id]
        try:
            await websocket.close()
        except:
            pass


async def broadcast_update(session_id: str, update: Dict):
    """
    Broadcast an update to the WebSocket connection for a session.

    Args:
        session_id: Session to send update to
        update: Update data to send
    """
    if session_id in active_connections:
        try:
            websocket = active_connections[session_id]
            await websocket.send_json({
                "type": "broadcast",
                "data": update
            })
        except Exception as e:
            logger.error(f"Error broadcasting to session {session_id}: {e}")


async def send_agent_update(
    session_id: str,
    agent_name: str,
    status: str,
    message: str = None,
    data: Dict = None
):
    """
    Send an agent-specific update.

    Args:
        session_id: Session identifier
        agent_name: Name of the agent
        status: Agent status (starting, running, completed, failed)
        message: Optional message
        data: Optional additional data
    """
    update = {
        "type": "agent_update",
        "agent": agent_name,
        "status": status,
        "message": message,
        "data": data,
        "timestamp": asyncio.get_event_loop().time()
    }

    await broadcast_update(session_id, update)


async def send_progress_update(
    session_id: str,
    iteration: int,
    max_iterations: int,
    phase: str,
    message: str = None
):
    """
    Send a progress update.

    Args:
        session_id: Session identifier
        iteration: Current iteration number
        max_iterations: Maximum iterations
        phase: Current phase (planning, writing, validating, editing)
        message: Optional message
    """
    progress_percent = (iteration / max_iterations) * 100 if max_iterations > 0 else 0

    update = {
        "type": "progress",
        "iteration": iteration,
        "max_iterations": max_iterations,
        "phase": phase,
        "progress_percent": progress_percent,
        "message": message,
        "timestamp": asyncio.get_event_loop().time()
    }

    await broadcast_update(session_id, update)


async def send_validation_results(
    session_id: str,
    validation_report: Dict,
    critique_report: Dict
):
    """
    Send validation and critique results.

    Args:
        session_id: Session identifier
        validation_report: Consistency validation report
        critique_report: Literary critic report
    """
    update = {
        "type": "validation",
        "validation": validation_report,
        "critique": critique_report,
        "timestamp": asyncio.get_event_loop().time()
    }

    await broadcast_update(session_id, update)


async def send_agent_prompt(
    session_id: str,
    agent_name: str,
    prompt: str,
    reasoning: str = None
):
    """
    Send the prompt being sent to an agent (for transparency).

    Args:
        session_id: Session identifier
        agent_name: Name of the agent
        prompt: The prompt text being sent
        reasoning: Optional reasoning about why this prompt was sent
    """
    update = {
        "type": "agent_prompt",
        "agent": agent_name,
        "prompt": prompt,
        "reasoning": reasoning,
        "timestamp": asyncio.get_event_loop().time()
    }

    await broadcast_update(session_id, update)


async def send_agent_response(
    session_id: str,
    agent_name: str,
    response: str,
    summary: str = None
):
    """
    Send the response received from an agent.

    Args:
        session_id: Session identifier
        agent_name: Name of the agent
        response: The full response from the LLM
        summary: Optional summary of the response
    """
    update = {
        "type": "agent_response",
        "agent": agent_name,
        "response": response,
        "message": summary,
        "timestamp": asyncio.get_event_loop().time()
    }

    await broadcast_update(session_id, update)


async def send_partial_draft(
    session_id: str,
    partial_content: str,
    word_count: int,
    progress_message: str = None
):
    """
    Send partial draft content as it's being written.

    Args:
        session_id: Session identifier
        partial_content: Partial story content
        word_count: Current word count
        progress_message: Optional progress message
    """
    update = {
        "type": "partial_draft",
        "partial_content": partial_content,
        "word_count": word_count,
        "message": progress_message,
        "timestamp": asyncio.get_event_loop().time()
    }

    await broadcast_update(session_id, update)


async def send_validation_issue(
    session_id: str,
    issue: Dict
):
    """
    Send individual validation issue as it's found.

    Args:
        session_id: Session identifier
        issue: Validation issue dict
    """
    update = {
        "type": "validation_issue",
        "issue": issue,
        "timestamp": asyncio.get_event_loop().time()
    }

    await broadcast_update(session_id, update)
