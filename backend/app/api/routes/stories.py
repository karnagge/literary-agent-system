from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Dict, Any
import uuid
import logging

from app.models.story_request import StoryRequest
from app.services.story_service import StoryGenerationService
from app.services.session_manager import SessionManager

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize services
story_service = StoryGenerationService()
session_manager = SessionManager()


@router.post("/stories/generate")
async def generate_story(
    request: StoryRequest,
    background_tasks: BackgroundTasks
) -> Dict[str, Any]:
    """
    Generate a literary story using multi-agent system.

    The generation happens asynchronously. Use the session_id to track progress
    via WebSocket connection or polling the /stories/{session_id} endpoint.

    Args:
        request: Story generation parameters

    Returns:
        Session information with session_id for tracking
    """
    try:
        # Create unique session ID
        session_id = str(uuid.uuid4())

        # Initialize session in Redis
        await session_manager.create_session(session_id, request.dict())

        # Start story generation in background
        background_tasks.add_task(
            story_service.generate_story,
            request=request,
            session_id=session_id
        )

        logger.info(f"Started story generation for session {session_id}")

        return {
            "session_id": session_id,
            "status": "initiated",
            "message": "Story generation started. Connect to WebSocket for real-time updates.",
            "websocket_url": f"/ws/{session_id}"
        }

    except Exception as e:
        logger.error(f"Error initiating story generation: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to initiate story generation: {str(e)}"
        )


@router.get("/stories/{session_id}")
async def get_story_status(session_id: str) -> Dict[str, Any]:
    """
    Get current status of story generation.

    Args:
        session_id: Unique session identifier

    Returns:
        Current status, progress, and story if completed
    """
    try:
        session = await session_manager.get_session(session_id)

        if not session:
            raise HTTPException(
                status_code=404,
                detail=f"Session {session_id} not found"
            )

        return session

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving session {session_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve session: {str(e)}"
        )


@router.get("/stories/{session_id}/draft")
async def get_current_draft(session_id: str) -> Dict[str, Any]:
    """
    Get the current draft of the story (even if not completed).

    Args:
        session_id: Unique session identifier

    Returns:
        Current draft and metadata
    """
    try:
        draft = await session_manager.get_draft(session_id)

        if not draft:
            raise HTTPException(
                status_code=404,
                detail=f"No draft found for session {session_id}"
            )

        return draft

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving draft for {session_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve draft: {str(e)}"
        )


@router.delete("/stories/{session_id}")
async def cancel_generation(session_id: str) -> Dict[str, str]:
    """
    Cancel an ongoing story generation.

    Args:
        session_id: Unique session identifier

    Returns:
        Cancellation confirmation
    """
    try:
        await session_manager.cancel_session(session_id)

        logger.info(f"Cancelled story generation for session {session_id}")

        return {
            "session_id": session_id,
            "status": "cancelled",
            "message": "Story generation cancelled"
        }

    except Exception as e:
        logger.error(f"Error cancelling session {session_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to cancel session: {str(e)}"
        )


@router.get("/stories")
async def list_sessions(limit: int = 10, offset: int = 0) -> Dict[str, Any]:
    """
    List recent story generation sessions.

    Args:
        limit: Maximum number of sessions to return
        offset: Number of sessions to skip

    Returns:
        List of sessions with metadata
    """
    try:
        sessions = await session_manager.list_sessions(limit=limit, offset=offset)

        return {
            "sessions": sessions,
            "count": len(sessions),
            "limit": limit,
            "offset": offset
        }

    except Exception as e:
        logger.error(f"Error listing sessions: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list sessions: {str(e)}"
        )
