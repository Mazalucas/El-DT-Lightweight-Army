"""UX Researcher agent - Design specialist."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class UXResearcher(Agent):
    """
    UX Researcher agent - Specialized in user research and UX analysis.

    Department: Design
    """

    def __init__(
        self,
        name: str = "UX Researcher",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize UX Researcher agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a UX researcher. Your goal is to conduct user research, create "
            "user personas, analyze user journeys, and propose UX improvements. Always "
            "base your recommendations on user data and research findings."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.UX_RESEARCHER,
            goal="Conduct user research and improve UX",
            backstory=(
                "You are an experienced UX researcher with expertise in user interviews, "
                "usability testing, persona creation, and journey mapping. You excel at "
                "understanding user needs and translating research into actionable UX "
                "improvements."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Design",
        )

        super().__init__(config, llm_provider)

    async def research_users(self, research_questions: List[str]) -> Dict[str, Any]:
        """
        Conduct user research.

        Args:
            research_questions: Research questions to answer

        Returns:
            User research results
        """
        prompt = f"""Conduct user research to answer these questions:

{research_questions}

Provide:
1. Research methodology
2. Key findings
3. User insights
4. Pain points identified
5. Recommendations
"""

        research = await self.generate_response(prompt)

        return {
            "questions": research_questions,
            "research": research,
            "findings": [],
            "insights": [],
        }

    async def create_personas(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create user personas.

        Args:
            user_data: User data for persona creation

        Returns:
            User personas
        """
        prompt = f"""Create user personas based on this data:

{user_data}

Provide:
1. Primary personas with demographics
2. Goals and motivations
3. Pain points
4. Behaviors and preferences
5. Use cases
"""

        personas = await self.generate_response(prompt)

        return {
            "user_data": user_data,
            "personas": personas,
            "persona_list": [],
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

            if "research_questions" in payload:
                # User research task
                research_questions = payload["research_questions"]

                research = await self.research_users(research_questions)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": research,
                    },
                    reply_to=message.id,
                )

            elif "user_data" in payload:
                # Persona creation task
                user_data = payload["user_data"]

                personas = await self.create_personas(user_data)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": personas,
                    },
                    reply_to=message.id,
                )

        return None
