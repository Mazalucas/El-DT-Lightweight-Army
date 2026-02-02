"""Brand Guardian agent - Marketing specialist."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class BrandGuardian(Agent):
    """
    Brand Guardian agent - Specialized in brand compliance and consistency.

    Department: Marketing
    """

    def __init__(
        self,
        name: str = "Brand Guardian",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Brand Guardian agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a Brand Guardian responsible for protecting and maintaining "
            "brand identity. You ensure all content is consistent with brand guidelines. "
            "Be strict but constructive, always reference brand guidelines, provide "
            "actionable feedback, and escalate major brand violations to El DT."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.BRAND_GUARDIAN,
            goal="Protect and maintain brand identity and consistency",
            backstory=(
                "You are a brand guardian with expertise in brand management, "
                "visual and verbal consistency, and brand compliance. You excel at "
                "identifying brand inconsistencies and ensuring all content aligns with "
                "brand guidelines."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Marketing",
        )

        super().__init__(config, llm_provider)

    async def review_brand_compliance(self, content: Any, content_type: str) -> Dict[str, Any]:
        """
        Review content for brand compliance.

        Args:
            content: Content to review
            content_type: Type of content (text, visual, audio, video)

        Returns:
            Brand compliance report
        """
        prompt = f"""Review this {content_type} content for brand compliance:

{content}

Provide:
1. Compliance status (compliant/not compliant)
2. Issues found
3. Suggestions for improvement
4. Compliance score (0-1)
"""

        report = await self.generate_response(prompt)

        return {
            "content": str(content),
            "content_type": content_type,
            "compliant": True,
            "issues": [],
            "suggestions": [],
            "score": 0.8,
            "report": report,
        }

    async def check_visual_consistency(
        self, design: Dict[str, Any], brand_guidelines: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Check visual consistency with brand guidelines.

        Args:
            design: Design to check
            brand_guidelines: Brand guidelines

        Returns:
            Consistency report
        """
        prompt = f"""Check visual consistency of this design with brand guidelines:

Design: {design}
Brand Guidelines: {brand_guidelines}

Provide:
1. Consistency status
2. Deviations found
3. Recommendations
"""

        report = await self.generate_response(prompt)

        return {
            "design": design,
            "consistent": True,
            "deviations": [],
            "recommendations": [],
            "report": report,
        }

    async def check_verbal_consistency(
        self, text: str, brand_voice: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Check verbal consistency with brand voice.

        Args:
            text: Text to check
            brand_voice: Brand voice guidelines

        Returns:
            Voice compliance report
        """
        prompt = f"""Check verbal consistency of this text with brand voice:

Text: {text}
Brand Voice: {brand_voice}

Provide:
1. Voice compliance status
2. Tone issues
3. Suggestions
"""

        report = await self.generate_response(prompt)

        return {
            "text": text,
            "compliant": True,
            "tone_issues": [],
            "suggestions": [],
            "report": report,
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

            if "content" in payload and "content_type" in payload:
                # Brand compliance review task
                content = payload["content"]
                content_type = payload["content_type"]

                report = await self.review_brand_compliance(content, content_type)

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

            elif "design" in payload and "brand_guidelines" in payload:
                # Visual consistency check task
                design = payload["design"]
                brand_guidelines = payload["brand_guidelines"]

                report = await self.check_visual_consistency(design, brand_guidelines)

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

            elif "text" in payload and "brand_voice" in payload:
                # Verbal consistency check task
                text = payload["text"]
                brand_voice = payload["brand_voice"]

                report = await self.check_verbal_consistency(text, brand_voice)

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
