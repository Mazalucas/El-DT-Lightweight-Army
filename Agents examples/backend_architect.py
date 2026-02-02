"""Backend Architect agent - Engineering specialist."""

from typing import Any, Dict, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class BackendArchitect(Agent):
    """
    Backend Architect agent - Specialized in backend architecture design.

    Department: Engineering
    """

    def __init__(
        self,
        name: str = "Backend Architect",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Backend Architect agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a backend architect. Your goal is to design scalable, "
            "maintainable, and performant backend architectures. Always consider "
            "best practices, scalability, security, and maintainability."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.BACKEND_ARCHITECT,
            goal="Design scalable and maintainable backend architectures",
            backstory=(
                "You are a senior backend architect with extensive experience "
                "in designing distributed systems, APIs, and databases. You "
                "excel at creating architectures that scale and are easy to maintain."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Engineering",
        )

        super().__init__(config, llm_provider)

    async def design_architecture(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Design backend architecture.

        Args:
            requirements: Requirements dictionary

        Returns:
            Architecture design
        """
        prompt = f"""Design a backend architecture based on these requirements:

{requirements}

Provide:
1. System components
2. API endpoints structure
3. Database schema overview
4. Scalability considerations
5. Technology recommendations
"""

        design = await self.generate_response(prompt)

        return {
            "requirements": requirements,
            "design": design,
            "components": [],
            "api_endpoints": [],
            "database_schema": {},
        }

    async def design_api(self, api_spec: Dict[str, Any]) -> Dict[str, Any]:
        """
        Design API endpoints.

        Args:
            api_spec: API specification

        Returns:
            API design
        """
        prompt = f"""Design REST API endpoints based on this specification:

{api_spec}

Provide:
1. Endpoint list with methods
2. Request/response schemas
3. Authentication approach
4. Error handling strategy
"""

        api_design = await self.generate_response(prompt)

        return {
            "spec": api_spec,
            "design": api_design,
            "endpoints": [],
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

            if "requirements" in payload:
                # Architecture design task
                requirements = payload["requirements"]

                design = await self.design_architecture(requirements)

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

            elif "api_spec" in payload:
                # API design task
                api_spec = payload["api_spec"]

                design = await self.design_api(api_spec)

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

        return None
