import redis.asyncio as redis
import json
from typing import Dict, Any, List, Optional
import logging
from datetime import datetime

from app.config import settings

logger = logging.getLogger(__name__)


class SessionManager:
    """Manages story generation sessions using Redis"""

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None

    async def get_redis(self) -> redis.Redis:
        """Get or create Redis connection"""
        if self.redis_client is None:
            self.redis_client = await redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True
            )
        return self.redis_client

    async def create_session(self, session_id: str, request_data: Dict[str, Any]) -> None:
        """
        Create a new story generation session.

        Args:
            session_id: Unique session identifier
            request_data: Story request parameters
        """
        client = await self.get_redis()

        session_data = {
            "session_id": session_id,
            "status": "initiated",
            "request": request_data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "current_iteration": 0,
            "max_iterations": settings.max_agent_iterations,
            "agents_completed": [],
            "agents_in_progress": [],
            "validation_issues": [],
            "critic_scores": {},
            "drafts": [],
            "final_draft": None,
            "approved": False
        }

        await client.setex(
            f"session:{session_id}",
            60 * 60 * 24,  # 24 hours TTL
            json.dumps(session_data)
        )

        logger.info(f"Created session {session_id}")

    async def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get session data.

        Args:
            session_id: Session identifier

        Returns:
            Session data or None if not found
        """
        client = await self.get_redis()
        data = await client.get(f"session:{session_id}")

        if data:
            return json.loads(data)
        return None

    async def update_session(
        self,
        session_id: str,
        updates: Dict[str, Any]
    ) -> None:
        """
        Update session data.

        Args:
            session_id: Session identifier
            updates: Fields to update
        """
        client = await self.get_redis()
        session = await self.get_session(session_id)

        if session:
            session.update(updates)
            session["updated_at"] = datetime.utcnow().isoformat()

            await client.setex(
                f"session:{session_id}",
                60 * 60 * 24,
                json.dumps(session)
            )

            logger.debug(f"Updated session {session_id}")

    async def add_draft(
        self,
        session_id: str,
        draft_content: str,
        version: int,
        metadata: Dict[str, Any] = None
    ) -> None:
        """
        Add a new draft version to session.

        Args:
            session_id: Session identifier
            draft_content: Content of the draft
            version: Draft version number
            metadata: Additional metadata
        """
        session = await self.get_session(session_id)

        if session:
            draft = {
                "version": version,
                "content": draft_content,
                "created_at": datetime.utcnow().isoformat(),
                "metadata": metadata or {}
            }

            session["drafts"].append(draft)
            await self.update_session(session_id, {"drafts": session["drafts"]})

            logger.info(f"Added draft v{version} to session {session_id}")

    async def get_draft(self, session_id: str, version: int = None) -> Optional[Dict[str, Any]]:
        """
        Get a specific draft version or the latest.

        Args:
            session_id: Session identifier
            version: Draft version (None for latest)

        Returns:
            Draft data or None
        """
        session = await self.get_session(session_id)

        if not session or not session.get("drafts"):
            return None

        if version is None:
            return session["drafts"][-1]

        for draft in session["drafts"]:
            if draft["version"] == version:
                return draft

        return None

    async def set_agent_status(
        self,
        session_id: str,
        agent_name: str,
        status: str
    ) -> None:
        """
        Update agent status.

        Args:
            session_id: Session identifier
            agent_name: Name of the agent
            status: Status (in_progress, completed, failed)
        """
        session = await self.get_session(session_id)

        if session:
            agents_in_progress = session.get("agents_in_progress", [])
            agents_completed = session.get("agents_completed", [])

            if status == "in_progress":
                if agent_name not in agents_in_progress:
                    agents_in_progress.append(agent_name)
            elif status == "completed":
                if agent_name in agents_in_progress:
                    agents_in_progress.remove(agent_name)
                if agent_name not in agents_completed:
                    agents_completed.append(agent_name)

            await self.update_session(session_id, {
                "agents_in_progress": agents_in_progress,
                "agents_completed": agents_completed
            })

    async def cancel_session(self, session_id: str) -> None:
        """
        Mark session as cancelled.

        Args:
            session_id: Session identifier
        """
        await self.update_session(session_id, {
            "status": "cancelled",
            "cancelled_at": datetime.utcnow().isoformat()
        })

        logger.info(f"Cancelled session {session_id}")

    async def complete_session(
        self,
        session_id: str,
        final_draft: str,
        approved: bool,
        metadata: Dict[str, Any] = None
    ) -> None:
        """
        Mark session as completed.

        Args:
            session_id: Session identifier
            final_draft: Final story content
            approved: Whether story was approved by all validators
            metadata: Additional metadata
        """
        await self.update_session(session_id, {
            "status": "completed",
            "final_draft": final_draft,
            "approved": approved,
            "completed_at": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        })

        logger.info(f"Completed session {session_id} (approved={approved})")

    async def fail_session(
        self,
        session_id: str,
        error: str
    ) -> None:
        """
        Mark session as failed.

        Args:
            session_id: Session identifier
            error: Error message
        """
        await self.update_session(session_id, {
            "status": "failed",
            "error": error,
            "failed_at": datetime.utcnow().isoformat()
        })

        logger.error(f"Failed session {session_id}: {error}")

    async def list_sessions(
        self,
        limit: int = 10,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        List recent sessions.

        Args:
            limit: Maximum number of sessions
            offset: Number to skip

        Returns:
            List of session summaries
        """
        client = await self.get_redis()

        # Get all session keys
        keys = []
        async for key in client.scan_iter("session:*"):
            keys.append(key)

        # Sort by creation time (newest first)
        sessions = []
        for key in keys:
            data = await client.get(key)
            if data:
                session = json.loads(data)
                sessions.append({
                    "session_id": session["session_id"],
                    "status": session["status"],
                    "created_at": session["created_at"],
                    "updated_at": session["updated_at"],
                    "approved": session.get("approved", False)
                })

        sessions.sort(key=lambda x: x["created_at"], reverse=True)

        return sessions[offset:offset + limit]

    async def close(self):
        """Close Redis connection"""
        if self.redis_client:
            await self.redis_client.close()
