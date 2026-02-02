"""Product Strategist agent - Product specialist."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class ProductStrategist(Agent):
    """
    Product Strategist agent - Specialized in product strategy and roadmap planning.

    Department: Product
    """

    def __init__(
        self,
        name: str = "Product Strategist",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Product Strategist agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a product strategist. Your goal is to prioritize features based "
            "on value, create product roadmaps, analyze market and competition, and "
            "define product strategy. Always use data-driven approaches and consider "
            "user needs, business goals, and market opportunities."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.PRODUCT_STRATEGIST,
            goal="Define product strategy and prioritize features",
            backstory=(
                "You are an experienced product strategist with expertise in "
                "prioritization frameworks (RICE, Value vs Effort), market analysis, "
                "and roadmap planning. You excel at aligning product decisions with "
                "business objectives and user needs."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=True,
            max_iterations=4,
            department="Product",
        )

        super().__init__(config, llm_provider)

    async def prioritize_features(
        self, features: List[Dict[str, Any]], context: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Prioritize features using frameworks like RICE or Value vs Effort.

        Args:
            features: List of features to prioritize
            context: Context for prioritization

        Returns:
            Prioritized features
        """
        prompt = f"""Prioritize these features using appropriate frameworks (RICE, Value vs Effort):

Features: {features}
Context: {context}

Provide:
1. Prioritized feature list with scores
2. Framework used and reasoning
3. Recommendations
4. Timeline suggestions
"""

        prioritized = await self.generate_response(prompt)

        return {
            "features": features,
            "prioritized": prioritized,
            "scores": {},
            "framework": "RICE",
        }

    async def create_roadmap(self, goals: List[str], timeline: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create product roadmap.

        Args:
            goals: Product goals
            timeline: Timeline constraints

        Returns:
            Product roadmap
        """
        prompt = f"""Create a product roadmap based on these goals and timeline:

Goals: {goals}
Timeline: {timeline}

Provide:
1. Roadmap structure (quarters/sprints)
2. Feature groupings
3. Dependencies
4. Milestones
5. Success metrics
"""

        roadmap = await self.generate_response(prompt)

        return {
            "goals": goals,
            "timeline": timeline,
            "roadmap": roadmap,
            "milestones": [],
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

            if "features" in payload and "context" in payload:
                # Feature prioritization task
                features = payload["features"]
                context = payload["context"]

                prioritized = await self.prioritize_features(features, context)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": prioritized,
                    },
                    reply_to=message.id,
                )

            elif "goals" in payload and "timeline" in payload:
                # Roadmap creation task
                goals = payload["goals"]
                timeline = payload["timeline"]

                roadmap = await self.create_roadmap(goals, timeline)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": roadmap,
                    },
                    reply_to=message.id,
                )

        return None
