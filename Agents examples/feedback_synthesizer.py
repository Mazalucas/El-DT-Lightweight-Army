"""Feedback Synthesizer agent - Product specialist."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class FeedbackSynthesizer(Agent):
    """
    Feedback Synthesizer agent - Specialized in collecting and synthesizing feedback.

    Department: Product
    """

    def __init__(
        self,
        name: str = "Feedback Synthesizer",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Feedback Synthesizer agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a feedback synthesizer. Your goal is to collect feedback from "
            "multiple sources, analyze and synthesize it, identify patterns and trends, "
            "and propose improvements. Always provide actionable insights based on "
            "data and user feedback."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.FEEDBACK_SYNTHESIZER,
            goal="Collect and synthesize feedback into actionable insights",
            backstory=(
                "You are an expert at analyzing user feedback, identifying patterns, "
                "and synthesizing insights from multiple sources. You excel at "
                "transforming raw feedback into actionable product improvements and "
                "strategic recommendations."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Product",
        )

        super().__init__(config, llm_provider)

    async def collect_feedback(self, sources: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Collect feedback from multiple sources.

        Args:
            sources: List of feedback sources

        Returns:
            Collected feedback
        """
        prompt = f"""Collect and organize feedback from these sources:

{sources}

Provide:
1. Summary of feedback from each source
2. Common themes
3. Sentiment analysis
4. Priority areas
"""

        collected = await self.generate_response(prompt)

        return {
            "sources": sources,
            "collected": collected,
            "themes": [],
            "sentiment": "neutral",
        }

    async def synthesize(self, feedback: Dict[str, Any]) -> Dict[str, Any]:
        """
        Synthesize feedback into actionable insights.

        Args:
            feedback: Collected feedback

        Returns:
            Feedback synthesis with insights
        """
        prompt = f"""Synthesize this feedback into actionable insights:

{feedback}

Provide:
1. Key insights
2. Patterns and trends
3. Actionable recommendations
4. Priority improvements
5. Impact assessment
"""

        synthesis = await self.generate_response(prompt)

        return {
            "feedback": feedback,
            "synthesis": synthesis,
            "insights": [],
            "recommendations": [],
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

            if "sources" in payload:
                # Feedback collection task
                sources = payload["sources"]

                collected = await self.collect_feedback(sources)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": collected,
                    },
                    reply_to=message.id,
                )

            elif "feedback" in payload and "synthesize" in str(payload).lower():
                # Feedback synthesis task
                feedback = payload["feedback"]

                synthesis = await self.synthesize(feedback)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": synthesis,
                    },
                    reply_to=message.id,
                )

        return None
