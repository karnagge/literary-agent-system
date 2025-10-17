import asyncio
import json
import logging
from typing import Dict, Any
from anthropic import Anthropic

from app.models.story_request import StoryRequest
from app.services.session_manager import SessionManager
from app.api.routes.websocket import (
    send_agent_update,
    send_progress_update,
    send_validation_results,
    send_agent_prompt,
    send_agent_response,
    send_partial_draft,
    send_validation_issue
)
from app.config import settings

logger = logging.getLogger(__name__)


class StoryGenerationService:
    """
    Orchestrates multi-agent story generation using Claude Agent SDK.

    This service coordinates 8 specialized agents to create a high-quality
    literary story with iterative validation and refinement.
    """

    def __init__(self):
        self.anthropic_client = Anthropic(api_key=settings.anthropic_api_key)
        self.session_manager = SessionManager()

    async def generate_story(
        self,
        request: StoryRequest,
        session_id: str
    ) -> None:
        """
        Main story generation pipeline.

        Coordinates all agents through multiple phases:
        1. Planning (parallel): Plot, Characters, Style
        2. Writing: Initial draft
        3. Validation Loop: Consistency + Critic → Editor (iterative)

        Args:
            request: Story parameters
            session_id: Unique session identifier
        """
        try:
            logger.info(f"Starting story generation for session {session_id}")

            await self.session_manager.update_session(session_id, {
                "status": "planning",
                "current_phase": "planning"
            })

            # Phase 1: Planning (run in parallel)
            await send_progress_update(session_id, 1, 10, "planning", "Creating story structure...")

            plot_structure, characters, style_guide = await self._planning_phase(request, session_id)

            # Phase 2: Writing
            await self.session_manager.update_session(session_id, {
                "status": "writing",
                "current_phase": "writing"
            })
            await send_progress_update(session_id, 3, 10, "writing", "Writing initial draft...")

            draft = await self._writing_phase(
                request, plot_structure, characters, style_guide, session_id
            )

            # Add draft v1
            await self.session_manager.add_draft(session_id, draft, version=1)

            # Phase 3: Validation Loop
            await self.session_manager.update_session(session_id, {
                "status": "validating",
                "current_phase": "validation"
            })

            final_draft, approved = await self._validation_loop(
                draft, plot_structure, characters, style_guide, request, session_id
            )

            # Complete session
            await self.session_manager.complete_session(
                session_id,
                final_draft=final_draft,
                approved=approved,
                metadata={
                    "word_count": len(final_draft.split()),
                    "iterations": await self._get_iteration_count(session_id)
                }
            )

            logger.info(f"Completed story generation for session {session_id} (approved={approved})")

        except Exception as e:
            logger.error(f"Error in story generation for session {session_id}: {e}", exc_info=True)
            await self.session_manager.fail_session(session_id, str(e))
            raise

    async def _planning_phase(
        self,
        request: StoryRequest,
        session_id: str
    ) -> tuple[Dict, Dict, str]:
        """
        Phase 1: Planning (parallel execution of Plot, Character, Style agents)

        Returns:
            Tuple of (plot_structure, characters, style_guide)
        """
        # Run planning agents in parallel
        tasks = [
            self._call_plot_architect(request, session_id),
            self._call_character_designer(request, session_id),
            self._call_style_master(request, session_id)
        ]

        results = await asyncio.gather(*tasks)
        plot_structure, characters, style_guide = results

        return plot_structure, characters, style_guide

    async def _writing_phase(
        self,
        request: StoryRequest,
        plot_structure: Dict,
        characters: Dict,
        style_guide: str,
        session_id: str
    ) -> str:
        """
        Phase 2: Writing the initial draft

        Returns:
            Draft content as markdown string
        """
        await send_agent_update(session_id, "writer", "starting", "Generating initial draft...")
        await self.session_manager.set_agent_status(session_id, "writer", "in_progress")

        # Call Writer agent with all planning materials
        prompt = f"""You are the Writer Agent. Generate a complete story draft following these specifications:

**Plot Structure:**
```json
{json.dumps(plot_structure, indent=2)}
```

**Characters:**
```json
{json.dumps(characters, indent=2)}
```

**Style Guide:**
{style_guide}

**Requirements:**
- Genre: {request.genre.value}
- Target Audience: {request.target_audience.value}
- Target Word Count: {request.word_count_target} words (±10%)
- Author Style: {request.author_style.value}
- **Language: PORTUGUESE (BRAZIL) - pt-BR**

**CRITICAL: Write the ENTIRE story in BRAZILIAN PORTUGUESE (pt-BR). All narrative, dialogue, descriptions, and text must be in Portuguese from Brazil.**

Write the complete story in Markdown format. Follow the plot structure precisely,
bring characters to life, and match the author's style consistently.

Output only the story content in Markdown, starting with the title.
"""

        # Send the prompt for transparency
        await send_agent_prompt(
            session_id,
            "writer",
            prompt,
            reasoning="Requesting complete story draft following plot, characters, and style guide"
        )

        draft = await self._call_anthropic(prompt, max_tokens=16000)
        word_count = len(draft.split())

        # Send partial draft (the full initial draft in this case)
        await send_partial_draft(
            session_id,
            draft,
            word_count,
            progress_message=f"Initial draft completed: {word_count} words"
        )

        # Send the response for transparency
        await send_agent_response(
            session_id,
            "writer",
            draft[:1000] + "..." if len(draft) > 1000 else draft,  # Truncate for summary
            summary=f"Generated {word_count}-word draft ({len(draft)} chars)"
        )

        await self.session_manager.set_agent_status(session_id, "writer", "completed")
        await send_agent_update(session_id, "writer", "completed", f"Draft complete ({word_count} words)")

        return draft

    async def _validation_loop(
        self,
        draft: str,
        plot_structure: Dict,
        characters: Dict,
        style_guide: str,
        request: StoryRequest,
        session_id: str
    ) -> tuple[str, bool]:
        """
        Phase 3: Iterative validation and refinement loop

        Returns:
            Tuple of (final_draft, approved)
        """
        current_draft = draft
        iteration = 1
        max_iterations = settings.max_agent_iterations

        while iteration <= max_iterations:
            await send_progress_update(
                session_id,
                iteration + 3,
                10,
                "validation",
                f"Validation cycle {iteration}/{max_iterations}"
            )

            await self.session_manager.update_session(session_id, {
                "current_iteration": iteration
            })

            # Run validators in parallel
            validation_task = self._call_consistency_validator(current_draft, plot_structure, characters, session_id)
            critique_task = self._call_literary_critic(current_draft, style_guide, request, session_id)

            validation_report, critique_report = await asyncio.gather(validation_task, critique_task)

            # Send validation results via WebSocket
            await send_validation_results(session_id, validation_report, critique_report)

            # Check approval criteria
            is_consistent = validation_report.get("status") == "PASSED"
            min_critic_score = critique_report.get("min_score", 0)
            approved = is_consistent and min_critic_score >= settings.min_critic_score

            if approved:
                logger.info(f"Story approved in iteration {iteration}")
                await send_progress_update(
                    session_id,
                    10,
                    10,
                    "completed",
                    f"Story approved! Min score: {min_critic_score:.1f}/10"
                )
                return current_draft, True

            # If not approved, call Editor
            await send_agent_update(
                session_id,
                "editor",
                "starting",
                f"Implementing corrections (iteration {iteration})"
            )

            current_draft = await self._call_editor(
                current_draft,
                validation_report,
                critique_report,
                plot_structure,
                characters,
                style_guide,
                session_id
            )

            # Add new draft version
            await self.session_manager.add_draft(
                session_id,
                current_draft,
                version=iteration + 1,
                metadata={
                    "validation_status": validation_report.get("status"),
                    "min_critic_score": min_critic_score
                }
            )

            iteration += 1

        # Max iterations reached without approval
        logger.warning(f"Max iterations reached for session {session_id} without approval")
        await send_progress_update(
            session_id,
            10,
            10,
            "completed",
            f"Max iterations reached. Returning best draft."
        )

        return current_draft, False

    # ===== Individual Agent Callers =====

    async def _call_plot_architect(self, request: StoryRequest, session_id: str) -> Dict:
        """Call Plot Architect agent"""
        await send_agent_update(session_id, "plot-architect", "starting", "Creating story structure...")
        await self.session_manager.set_agent_status(session_id, "plot-architect", "in_progress")

        prompt = f"""You are the Plot Architect Agent. Create a detailed 3-act story structure.

**Initial Plot:** {request.plot}
**Genre:** {request.genre.value}
**Target Audience:** {request.target_audience.value}
**Target Word Count:** {request.word_count_target}
**Language:** PORTUGUESE (BRAZIL) - pt-BR

**IMPORTANT: Create the plot structure with all descriptions, scene descriptions, and notes in BRAZILIAN PORTUGUESE (pt-BR).**

Follow your instructions to create a comprehensive plot structure in JSON format.
Output ONLY valid JSON, no additional text.
"""

        # Send the prompt for transparency
        await send_agent_prompt(
            session_id,
            "plot-architect",
            prompt,
            reasoning="Requesting detailed 3-act structure based on user's plot idea"
        )

        response = await self._call_anthropic(prompt, max_tokens=4000)
        plot_structure = self._extract_json(response)

        # Send the response for transparency
        await send_agent_response(
            session_id,
            "plot-architect",
            response,
            summary=f"Created structure with {len(plot_structure.get('act_1', {}))} act 1 elements, {len(plot_structure.get('act_2', {}))} act 2 elements"
        )

        await self.session_manager.set_agent_status(session_id, "plot-architect", "completed")
        await send_agent_update(session_id, "plot-architect", "completed", "Plot structure created")

        return plot_structure

    async def _call_character_designer(self, request: StoryRequest, session_id: str) -> Dict:
        """Call Character Designer agent"""
        await send_agent_update(session_id, "character-designer", "starting", "Creating characters...")
        await self.session_manager.set_agent_status(session_id, "character-designer", "in_progress")

        prompt = f"""You are the Character Designer Agent. Create detailed character profiles.

**Plot:** {request.plot}
**Genre:** {request.genre.value}
**Target Audience:** {request.target_audience.value}
**Author Style:** {request.author_style.value}
**Language:** PORTUGUESE (BRAZIL) - pt-BR

**IMPORTANT: Create all character descriptions, backgrounds, motivations, and traits in BRAZILIAN PORTUGUESE (pt-BR).**

Follow your instructions to create comprehensive character profiles in JSON format.
Output ONLY valid JSON, no additional text.
"""

        # Send the prompt for transparency
        await send_agent_prompt(
            session_id,
            "character-designer",
            prompt,
            reasoning="Requesting character profiles that fit the plot and author style"
        )

        response = await self._call_anthropic(prompt, max_tokens=4000)
        characters = self._extract_json(response)

        # Send the response for transparency
        await send_agent_response(
            session_id,
            "character-designer",
            response,
            summary=f"Created {len(characters.get('protagonist', {}))} protagonist(s), {len(characters.get('antagonist', {}))} antagonist(s), {len(characters.get('supporting', []))} supporting characters"
        )

        await self.session_manager.set_agent_status(session_id, "character-designer", "completed")
        await send_agent_update(session_id, "character-designer", "completed", "Characters created")

        return characters

    async def _call_style_master(self, request: StoryRequest, session_id: str) -> str:
        """Call Style Master agent"""
        await send_agent_update(session_id, "style-master", "starting", f"Analyzing {request.author_style.value} style...")
        await self.session_manager.set_agent_status(session_id, "style-master", "in_progress")

        prompt = f"""You are the Style Master Agent. Create a comprehensive style guide for {request.author_style.value}.

**Author:** {request.author_style.value}
**Genre:** {request.genre.value}
**Target Audience:** {request.target_audience.value}
**Language:** PORTUGUESE (BRAZIL) - pt-BR

**IMPORTANT: The style guide must specify that the story will be written in BRAZILIAN PORTUGUESE (pt-BR). Include notes about Portuguese language style, idioms, and expressions that {request.author_style.value} would use.**

Follow your instructions to create a detailed style guide in Markdown format.
"""

        # Send the prompt for transparency
        await send_agent_prompt(
            session_id,
            "style-master",
            prompt,
            reasoning=f"Analyzing {request.author_style.value}'s writing style to create a guide for the writer"
        )

        style_guide = await self._call_anthropic(prompt, max_tokens=3000)

        # Send the response for transparency
        await send_agent_response(
            session_id,
            "style-master",
            style_guide,
            summary=f"Created style guide for {request.author_style.value} ({len(style_guide)} chars)"
        )

        await self.session_manager.set_agent_status(session_id, "style-master", "completed")
        await send_agent_update(session_id, "style-master", "completed", "Style guide created")

        return style_guide

    async def _call_consistency_validator(
        self, draft: str, plot_structure: Dict, characters: Dict, session_id: str
    ) -> Dict:
        """Call Consistency Validator agent"""
        await send_agent_update(session_id, "consistency-validator", "starting", "Checking for plot holes...")
        await self.session_manager.set_agent_status(session_id, "consistency-validator", "in_progress")

        prompt = f"""You are the Consistency Validator Agent. Analyze this draft for plot holes and inconsistencies.

**Draft:**
{draft}

**Plot Structure:**
```json
{json.dumps(plot_structure, indent=2)}
```

**Characters:**
```json
{json.dumps(characters, indent=2)}
```

Follow your instructions and output a validation report in JSON format.
Output ONLY valid JSON, no additional text.
"""

        # Send the prompt for transparency
        await send_agent_prompt(
            session_id,
            "consistency-validator",
            prompt,
            reasoning="Checking draft for plot holes, timeline issues, and inconsistencies"
        )

        response = await self._call_anthropic(prompt, max_tokens=4000)
        validation_report = self._extract_json(response)

        # Send individual issues for real-time visibility
        issues = validation_report.get("issues", [])
        for issue in issues:
            await send_validation_issue(session_id, issue)

        # Send the response for transparency
        await send_agent_response(
            session_id,
            "consistency-validator",
            response,
            summary=f"Found {len(issues)} issues: {validation_report.get('summary', {})}"
        )

        await self.session_manager.set_agent_status(session_id, "consistency-validator", "completed")

        status = validation_report.get("status", "UNKNOWN")
        issues_count = len(issues)
        await send_agent_update(
            session_id,
            "consistency-validator",
            "completed",
            f"{status}: {issues_count} issues found"
        )

        return validation_report

    async def _call_literary_critic(
        self, draft: str, style_guide: str, request: StoryRequest, session_id: str
    ) -> Dict:
        """Call Literary Critic agent"""
        await send_agent_update(session_id, "literary-critic", "starting", "Evaluating story quality...")
        await self.session_manager.set_agent_status(session_id, "literary-critic", "in_progress")

        prompt = f"""You are the Literary Critic Agent. Evaluate this draft across 6 dimensions.

**Draft:**
{draft}

**Style Guide:**
{style_guide}

**Genre:** {request.genre.value}
**Target Audience:** {request.target_audience.value}

Follow your instructions and output a critique report in JSON format.
Output ONLY valid JSON, no additional text.
"""

        # Send the prompt for transparency
        await send_agent_prompt(
            session_id,
            "literary-critic",
            prompt,
            reasoning="Evaluating draft across 6 quality dimensions (prose, character, structure, style, emotion, originality)"
        )

        response = await self._call_anthropic(prompt, max_tokens=4000)
        critique_report = self._extract_json(response)

        # Send the response for transparency
        scores = critique_report.get("scores", {})
        await send_agent_response(
            session_id,
            "literary-critic",
            response,
            summary=f"Scores: {scores}"
        )

        await self.session_manager.set_agent_status(session_id, "literary-critic", "completed")

        min_score = critique_report.get("min_score", 0)
        avg_score = critique_report.get("average_score", 0)
        await send_agent_update(
            session_id,
            "literary-critic",
            "completed",
            f"Avg: {avg_score:.1f}/10, Min: {min_score:.1f}/10"
        )

        return critique_report

    async def _call_editor(
        self,
        draft: str,
        validation_report: Dict,
        critique_report: Dict,
        plot_structure: Dict,
        characters: Dict,
        style_guide: str,
        session_id: str
    ) -> str:
        """Call Editor agent"""
        await self.session_manager.set_agent_status(session_id, "editor", "in_progress")

        prompt = f"""You are the Editor Agent. Revise this draft to address all issues.

**Current Draft:**
{draft}

**Validation Report:**
```json
{json.dumps(validation_report, indent=2)}
```

**Critique Report:**
```json
{json.dumps(critique_report, indent=2)}
```

**Plot Structure:**
```json
{json.dumps(plot_structure, indent=2)}
```

**Characters:**
```json
{json.dumps(characters, indent=2)}
```

**Style Guide:**
{style_guide}

**CRITICAL: Maintain the ENTIRE revised story in BRAZILIAN PORTUGUESE (pt-BR). All edits, additions, and modifications must be in Portuguese from Brazil.**

Follow your instructions and output the revised draft in Markdown format.
Output only the story content, no meta-commentary.
"""

        issues_count = len(validation_report.get("issues", []))
        weak_scores = [k for k, v in critique_report.get("scores", {}).items() if v < settings.min_critic_score]

        # Send the prompt for transparency
        await send_agent_prompt(
            session_id,
            "editor",
            prompt,
            reasoning=f"Revising draft to fix {issues_count} validation issues and improve {len(weak_scores)} weak dimensions: {weak_scores}"
        )

        revised_draft = await self._call_anthropic(prompt, max_tokens=16000)
        revised_word_count = len(revised_draft.split())

        # Send partial draft with revision
        await send_partial_draft(
            session_id,
            revised_draft,
            revised_word_count,
            progress_message=f"Revision completed: {revised_word_count} words"
        )

        # Send the response for transparency
        await send_agent_response(
            session_id,
            "editor",
            revised_draft[:1000] + "..." if len(revised_draft) > 1000 else revised_draft,
            summary=f"Revised draft: {revised_word_count} words, addressed {issues_count} issues"
        )

        await self.session_manager.set_agent_status(session_id, "editor", "completed")

        await send_agent_update(
            session_id,
            "editor",
            "completed",
            f"Fixed {issues_count} issues, improved {len(weak_scores)} weak sections"
        )

        return revised_draft

    def _extract_json(self, response: str) -> Dict:
        """
        Extract JSON from response, handling markdown code blocks.

        Args:
            response: Raw response text

        Returns:
            Parsed JSON dict
        """
        # Try to parse directly first
        try:
            return json.loads(response)
        except json.JSONDecodeError:
            pass

        # Try to extract from markdown code block
        import re

        # Look for ```json ... ``` or ``` ... ```
        json_pattern = r'```(?:json)?\s*\n?(.*?)\n?```'
        matches = re.findall(json_pattern, response, re.DOTALL)

        if matches:
            try:
                return json.loads(matches[0])
            except json.JSONDecodeError:
                pass

        # Try to find JSON-like content between { and }
        json_pattern2 = r'\{.*\}'
        matches2 = re.findall(json_pattern2, response, re.DOTALL)

        if matches2:
            for match in matches2:
                try:
                    return json.loads(match)
                except json.JSONDecodeError:
                    continue

        # If all else fails, log and raise
        logger.error(f"Failed to extract JSON from response: {response[:500]}")
        raise json.JSONDecodeError("Could not extract valid JSON from response", response, 0)

    async def _call_anthropic(self, prompt: str, max_tokens: int = 4096) -> str:
        """
        Call Anthropic API with Claude model.

        Args:
            prompt: The prompt to send
            max_tokens: Maximum tokens in response

        Returns:
            Response text
        """
        try:
            # Use asyncio to run sync Anthropic client in async context
            loop = asyncio.get_event_loop()

            response = await loop.run_in_executor(
                None,
                lambda: self.anthropic_client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=max_tokens,
                    messages=[{"role": "user", "content": prompt}]
                )
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Error calling Anthropic API: {e}", exc_info=True)
            raise

    async def _get_iteration_count(self, session_id: str) -> int:
        """Get current iteration count from session"""
        session = await self.session_manager.get_session(session_id)
        return session.get("current_iteration", 0) if session else 0
