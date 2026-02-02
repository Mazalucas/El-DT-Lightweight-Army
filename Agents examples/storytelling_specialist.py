"""Storytelling Specialist agent - Marketing specialist."""

from typing import Any, Dict, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class StorytellingSpecialist(Agent):
    """
    Storytelling Specialist agent - Specialized in creating compelling narratives.

    Department: Marketing
    """

    def __init__(
        self,
        name: str = "Storytelling Specialist",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Storytelling Specialist agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a Storytelling Specialist who creates compelling narratives. "
            "You develop storylines that connect emotionally with audiences. Focus on "
            "compelling narratives and story arcs, emotional connection, brand-aligned "
            "storytelling, multi-format adaptation, and clear call-to-action integration."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.STORYTELLING_SPECIALIST,
            goal="Create compelling narratives and storylines",
            backstory=(
                "You are a master storyteller with expertise in narrative structures, "
                "emotional engagement, and brand storytelling. You excel at creating "
                "stories that resonate with audiences and drive action."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=True,
            max_iterations=4,
            department="Marketing",
        )

        super().__init__(config, llm_provider)

    async def create_story(self, brief: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a complete narrative.

        Args:
            brief: Story brief with protagonist, conflict, resolution, target_audience, format

        Returns:
            Story with narrative, story_arc, emotional_hooks, call_to_action
        """
        prompt = f"""Create a compelling story based on this brief:

{brief}

Provide:
1. Complete narrative
2. Story arc structure
3. Emotional hooks
4. Call to action
"""

        story = await self.generate_response(prompt)

        return {
            "brief": brief,
            "narrative": story,
            "story_arc": {},
            "emotional_hooks": [],
            "call_to_action": "",
        }

    async def develop_storyline(
        self, product: Dict[str, Any], audience: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Develop storyline for product/campaign.

        Args:
            product: Product information
            audience: Audience information

        Returns:
            Storyline
        """
        prompt = f"""Develop a storyline for this product targeting this audience:

Product: {product}
Audience: {audience}

Provide:
1. Storyline concept
2. Key narrative elements
3. Emotional journey
"""

        storyline = await self.generate_response(prompt)

        return {
            "product": product,
            "audience": audience,
            "storyline": storyline,
        }

    async def create_narrative_arc(self, story_elements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create structured narrative arc.

        Args:
            story_elements: Story elements (setup, conflict, resolution, etc.)

        Returns:
            Narrative arc
        """
        prompt = f"""Create a structured narrative arc from these elements:

{story_elements}

Provide:
1. Three-act structure
2. Plot points
3. Character development
4. Emotional beats
"""

        arc = await self.generate_response(prompt)

        return {
            "story_elements": story_elements,
            "narrative_arc": arc,
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

            if "brief" in payload and "protagonist" in str(payload).lower():
                # Story creation task
                brief = payload["brief"]

                story = await self.create_story(brief)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": story,
                    },
                    reply_to=message.id,
                )

            elif "product" in payload and "audience" in payload:
                # Storyline development task
                product = payload["product"]
                audience = payload["audience"]

                storyline = await self.develop_storyline(product, audience)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": storyline,
                    },
                    reply_to=message.id,
                )

            elif "story_elements" in payload:
                # Narrative arc creation task
                story_elements = payload["story_elements"]

                arc = await self.create_narrative_arc(story_elements)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": arc,
                    },
                    reply_to=message.id,
                )

        return None
