"""Content Creator agent - Marketing specialist."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class ContentCreator(Agent):
    """
    Content Creator agent - Specialized in multi-channel content creation.

    Department: Marketing
    """

    def __init__(
        self,
        name: str = "Content Creator",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Content Creator agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a Content Creator specializing in multi-channel content creation. "
            "You create engaging, SEO-optimized content aligned with brand guidelines. "
            "Focus on high-quality content, SEO optimization, brand consistency, "
            "audience adaptation, and multi-channel expertise."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.CONTENT_CREATOR,
            goal="Create engaging, SEO-optimized content for multiple channels",
            backstory=(
                "You are a skilled content creator with expertise in writing for "
                "various channels (blog, social media, email), SEO optimization, "
                "and audience adaptation. You excel at creating content that engages "
                "audiences while maintaining brand consistency."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=True,
            max_iterations=4,
            department="Marketing",
        )

        super().__init__(config, llm_provider)

    async def create_content(self, brief: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create content according to brief.

        Args:
            brief: Content brief with channel, audience, topic, tone, length, brand_guidelines

        Returns:
            Created content
        """
        prompt = f"""Create content based on this brief:

{brief}

Provide:
1. Content text
2. SEO optimization notes
3. Brand alignment notes
4. Metadata
"""

        content = await self.generate_response(prompt)

        return {
            "brief": brief,
            "content": content,
            "seo_optimized": True,
            "metadata": {},
        }

    async def optimize_seo(self, content: str, keywords: List[str]) -> Dict[str, Any]:
        """
        Optimize content for SEO.

        Args:
            content: Content to optimize
            keywords: Keywords to target

        Returns:
            SEO-optimized content
        """
        prompt = f"""Optimize this content for SEO with these keywords:

Content: {content}
Keywords: {keywords}

Provide:
1. Optimized content
2. Keyword placement
3. SEO score
4. Recommendations
"""

        optimized = await self.generate_response(prompt)

        return {
            "original_content": content,
            "optimized_content": optimized,
            "keywords": keywords,
            "seo_score": 0.8,
        }

    async def adapt_content(
        self, content: str, target_channel: str, target_audience: str
    ) -> Dict[str, Any]:
        """
        Adapt content for different channels/audiences.

        Args:
            content: Original content
            target_channel: Target channel (blog, social, email, etc.)
            target_audience: Target audience

        Returns:
            Adapted content
        """
        prompt = f"""Adapt this content for {target_channel} targeting {target_audience}:

{content}

Provide:
1. Adapted content
2. Changes made
3. Rationale
"""

        adapted = await self.generate_response(prompt)

        return {
            "original_content": content,
            "adapted_content": adapted,
            "target_channel": target_channel,
            "target_audience": target_audience,
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

            if "brief" in payload:
                # Content creation task
                brief = payload["brief"]

                content = await self.create_content(brief)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": content,
                    },
                    reply_to=message.id,
                )

            elif "content" in payload and "keywords" in payload:
                # SEO optimization task
                content = payload["content"]
                keywords = payload["keywords"]

                optimized = await self.optimize_seo(content, keywords)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": optimized,
                    },
                    reply_to=message.id,
                )

            elif "content" in payload and "target_channel" in payload:
                # Content adaptation task
                content = payload["content"]
                target_channel = payload["target_channel"]
                target_audience = payload.get("target_audience", "general")

                adapted = await self.adapt_content(content, target_channel, target_audience)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": adapted,
                    },
                    reply_to=message.id,
                )

        return None
