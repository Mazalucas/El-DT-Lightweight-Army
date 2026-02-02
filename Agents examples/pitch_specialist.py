"""Pitch Specialist agent - Marketing specialist."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class PitchSpecialist(Agent):
    """
    Pitch Specialist agent - Specialized in creating pitches for investors and stakeholders.

    Department: Marketing
    """

    def __init__(
        self,
        name: str = "Pitch Specialist",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Pitch Specialist agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a Pitch Specialist who creates compelling pitches for investors "
            "and stakeholders. You develop presentations that clearly communicate "
            "value propositions. Focus on clear value proposition, compelling narratives, "
            "audience adaptation, strong presentations, and Q&A preparation."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.PITCH_SPECIALIST,
            goal="Create compelling pitches and presentations",
            backstory=(
                "You are an expert at creating pitches that win over investors and "
                "stakeholders. You excel at crafting clear value propositions, "
                "developing compelling narratives, and preparing for tough questions."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=True,
            max_iterations=4,
            department="Marketing",
        )

        super().__init__(config, llm_provider)

    async def create_pitch(self, brief: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create complete pitch.

        Args:
            brief: Pitch brief with audience, objective, duration, key_points, product_info

        Returns:
            Pitch with narrative, slides, talking_points, qa_prep
        """
        prompt = f"""Create a pitch based on this brief:

{brief}

Provide:
1. Pitch narrative
2. Slide structure and content
3. Talking points
4. Q&A preparation
"""

        pitch = await self.generate_response(prompt)

        return {
            "brief": brief,
            "narrative": pitch,
            "slides": [],
            "talking_points": [],
            "qa_prep": [],
        }

    async def create_presentation(self, pitch: Dict[str, Any], style: str) -> Dict[str, Any]:
        """
        Create visual presentation from pitch.

        Args:
            pitch: Pitch content
            style: Presentation style

        Returns:
            Presentation
        """
        prompt = f"""Create a {style} presentation from this pitch:

{pitch}

Provide:
1. Slide designs
2. Visual elements
3. Layout recommendations
"""

        presentation = await self.generate_response(prompt)

        return {
            "pitch": pitch,
            "style": style,
            "presentation": presentation,
            "slides": [],
        }

    async def prepare_qa(self, pitch: Dict[str, Any]) -> Dict[str, Any]:
        """
        Prepare Q&A responses.

        Args:
            pitch: Pitch content

        Returns:
            Q&A preparation
        """
        prompt = f"""Prepare Q&A responses for this pitch:

{pitch}

Provide:
1. Anticipated questions
2. Prepared answers
3. Talking points
"""

        qa = await self.generate_response(prompt)

        return {
            "pitch": pitch,
            "qa_preparation": qa,
            "questions": [],
            "answers": [],
        }

    async def _process_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        """
        Process incoming message.

        Args:
            message: Incoming message

        Returns:
            Optional response message
        """
        if message.type == MessageType.TASK_REQUEST:
            payload = message.payload

            if "brief" in payload and "audience" in str(payload).lower():
                # Pitch creation task
                brief = payload["brief"]

                pitch = await self.create_pitch(brief)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": pitch,
                    },
                    reply_to=message.id,
                )

            elif "pitch" in payload and "style" in payload:
                # Presentation creation task
                pitch = payload["pitch"]
                style = payload["style"]

                presentation = await self.create_presentation(pitch, style)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": presentation,
                    },
                    reply_to=message.id,
                )

            elif "pitch" in payload and "qa" in str(payload).lower():
                # Q&A preparation task
                pitch = payload["pitch"]

                qa = await self.prepare_qa(pitch)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": qa,
                    },
                    reply_to=message.id,
                )

        return None
