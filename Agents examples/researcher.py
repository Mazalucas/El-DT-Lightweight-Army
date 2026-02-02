"""Researcher agent - Generic research specialist."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class Researcher(Agent):
    """
    Researcher agent - Specialized in research and information gathering.

    Department: Research
    """

    def __init__(
        self,
        name: str = "Researcher",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Researcher agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a research specialist. Your goal is to gather, analyze, "
            "and synthesize information from various sources. Always cite your "
            "sources and provide comprehensive, accurate research results."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.RESEARCHER,
            goal="Research topics thoroughly and provide comprehensive information",
            backstory=(
                "You are an expert researcher with years of experience in "
                "information gathering and analysis. You excel at finding "
                "reliable sources, synthesizing complex information, and "
                "presenting findings clearly."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Research",
        )

        super().__init__(config, llm_provider)

    async def research(self, query: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform research on a topic.

        Args:
            query: Research query
            context: Optional context for the research

        Returns:
            Research results dictionary
        """
        prompt = f"""Research the following topic:

Query: {query}
"""

        if context:
            prompt += f"\nContext: {context}"

        prompt += """
Provide a comprehensive research result including:
1. Key findings
2. Important facts
3. Relevant sources (if available)
4. Summary
"""

        result_text = await self.generate_response(prompt)

        return {
            "query": query,
            "result": result_text,
            "sources": [],  # Would be populated by actual search tools
            "context": context,
        }

    async def analyze_document(self, document: str) -> Dict[str, Any]:
        """
        Analyze a document.

        Args:
            document: Document content to analyze

        Returns:
            Analysis results
        """
        prompt = f"""Analyze the following document:

{document}

Provide:
1. Main topics
2. Key points
3. Important information
4. Summary
"""

        analysis = await self.generate_response(prompt)

        return {
            "document_length": len(document),
            "analysis": analysis,
            "topics": [],  # Would be extracted by NLP tools
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

            if "query" in payload:
                # Research task
                query = payload["query"]
                context = payload.get("context")

                result = await self.research(query, context)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": result,
                    },
                    reply_to=message.id,
                )

            elif "document" in payload:
                # Document analysis task
                document = payload["document"]

                analysis = await self.analyze_document(document)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": analysis,
                    },
                    reply_to=message.id,
                )

        return None
