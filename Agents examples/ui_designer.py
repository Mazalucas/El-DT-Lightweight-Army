"""UI Designer agent - Design specialist."""

from typing import Any, Dict, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class UIDesigner(Agent):
    """
    UI Designer agent - Specialized in interface design and design specifications.

    Department: Design
    """

    def __init__(
        self,
        name: str = "UI Designer",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize UI Designer agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a UI designer. Your goal is to create interface designs, generate "
            "design specifications, ensure visual consistency, and create design "
            "components. Always follow design principles, accessibility guidelines, "
            "and brand guidelines."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.UI_DESIGNER,
            goal="Create interface designs and specifications",
            backstory=(
                "You are a skilled UI designer with expertise in visual design, "
                "design systems, component libraries, and design specifications. "
                "You excel at creating consistent, accessible, and user-friendly "
                "interfaces."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Design",
        )

        super().__init__(config, llm_provider)

    async def create_design(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create interface design.

        Args:
            requirements: Design requirements

        Returns:
            UI design
        """
        prompt = f"""Create a UI design based on these requirements:

{requirements}

Provide:
1. Design concept and layout
2. Component structure
3. Visual hierarchy
4. Color and typography choices
5. Responsive considerations
"""

        design = await self.generate_response(prompt)

        return {
            "requirements": requirements,
            "design": design,
            "components": [],
            "layout": {},
        }

    async def generate_specs(self, design: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate technical design specifications.

        Args:
            design: UI design

        Returns:
            Design specifications
        """
        prompt = f"""Generate technical specifications for this design:

{design}

Provide:
1. Component specifications
2. Spacing and sizing
3. Color codes and typography
4. Interaction states
5. Responsive breakpoints
"""

        specs = await self.generate_response(prompt)

        return {
            "design": design,
            "specs": specs,
            "components": [],
            "spacing": {},
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

            if "requirements" in payload and "design" in str(payload).lower():
                # Design creation task
                requirements = payload["requirements"]

                design = await self.create_design(requirements)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": design,
                    },
                    reply_to=message.id,
                )

            elif "design" in payload and "specs" in str(payload).lower():
                # Spec generation task
                design = payload["design"]

                specs = await self.generate_specs(design)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": specs,
                    },
                    reply_to=message.id,
                )

        return None
