"""Frontend Developer agent - Engineering specialist."""

from typing import Any, Dict, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class FrontendDeveloper(Agent):
    """
    Frontend Developer agent - Specialized in UI implementation and frontend development.

    Department: Engineering
    """

    def __init__(
        self,
        name: str = "Frontend Developer",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Frontend Developer agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a frontend developer. Your goal is to implement user interfaces "
            "according to design specifications, ensure accessibility, optimize "
            "performance, and create reusable components. Always follow best practices "
            "for responsive design, accessibility standards, and code quality."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.FRONTEND_DEVELOPER,
            goal="Implement accessible and performant user interfaces",
            backstory=(
                "You are a skilled frontend developer with expertise in modern "
                "frameworks, responsive design, accessibility standards, and "
                "performance optimization. You excel at translating designs into "
                "high-quality, maintainable code."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Engineering",
        )

        super().__init__(config, llm_provider)

    async def implement_ui(self, design_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Implement UI according to design specification.

        Args:
            design_spec: UI design specification

        Returns:
            Implementation result
        """
        prompt = f"""Implement a user interface based on this design specification:

{design_spec}

Provide:
1. Component structure
2. Implementation code (HTML/CSS/JS or framework code)
3. Responsive breakpoints
4. Accessibility features
5. Performance considerations
"""

        implementation = await self.generate_response(prompt)

        return {
            "design_spec": design_spec,
            "implementation": implementation,
            "components": [],
            "accessibility_score": 0.0,
        }

    async def ensure_accessibility(self, code: str) -> Dict[str, Any]:
        """
        Verify and improve accessibility.

        Args:
            code: Code to check

        Returns:
            Accessibility report
        """
        prompt = f"""Review and improve accessibility for this code:

{code}

Provide:
1. Accessibility issues found
2. WCAG compliance level
3. Improvements needed
4. Updated code with accessibility fixes
"""

        report = await self.generate_response(prompt)

        return {
            "code": code,
            "report": report,
            "issues": [],
            "compliance_level": "A",
            "improved_code": "",
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

            if "design_spec" in payload:
                # UI implementation task
                design_spec = payload["design_spec"]

                implementation = await self.implement_ui(design_spec)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": implementation,
                    },
                    reply_to=message.id,
                )

            elif "code" in payload and "accessibility" in str(payload).lower():
                # Accessibility check task
                code = payload["code"]

                report = await self.ensure_accessibility(code)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": report,
                    },
                    reply_to=message.id,
                )

        return None
