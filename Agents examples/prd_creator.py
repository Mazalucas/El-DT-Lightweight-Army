"""PRD Creator agent - Specialized in creating Product Requirements Documents."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class PRDCreator(Agent):
    """
    PRD Creator agent - Specialized in creating comprehensive Product Requirements Documents.

    This agent creates detailed PRDs that serve as the foundation for software development,
    including product vision, user stories, features, success metrics, and acceptance criteria.

    Department: Planning
    """

    def __init__(
        self,
        name: str = "PRD Creator",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize PRD Creator agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a Product Requirements Document (PRD) creator. Your goal is to create "
            "comprehensive, well-structured PRDs that clearly define product vision, user needs, "
            "features, success metrics, and acceptance criteria. You excel at:\n\n"
            "1. Understanding business objectives and translating them into product requirements\n"
            "2. Identifying user personas and their needs\n"
            "3. Defining clear user stories and use cases\n"
            "4. Establishing success metrics and KPIs\n"
            "5. Creating detailed feature specifications\n"
            "6. Defining acceptance criteria\n"
            "7. Considering edge cases and non-functional requirements\n\n"
            "Always create PRDs that are clear, actionable, and provide enough detail for "
            "technical teams to understand what needs to be built."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.PRD_CREATOR,
            goal="Create comprehensive Product Requirements Documents",
            backstory=(
                "You are an experienced product manager and PRD specialist with expertise in "
                "creating detailed product requirements documents. You have worked with "
                "cross-functional teams and understand how to bridge the gap between business "
                "objectives and technical implementation. You excel at asking the right questions "
                "to uncover requirements and documenting them in a clear, structured format."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=True,
            max_iterations=5,
            department="Planning",
        )

        super().__init__(config, llm_provider)

    async def create_prd(
        self,
        product_idea: str,
        business_objectives: Optional[List[str]] = None,
        target_users: Optional[List[str]] = None,
        constraints: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a comprehensive Product Requirements Document.

        Args:
            product_idea: Description of the product idea or vision
            business_objectives: List of business objectives
            target_users: List of target user personas
            constraints: Constraints (budget, timeline, technical, etc.)
            context: Additional context about the product or market

        Returns:
            Complete PRD document with all sections
        """
        prompt = f"""Create a comprehensive Product Requirements Document (PRD) based on the following information:

## Product Idea
{product_idea}

## Business Objectives
{business_objectives or "Not specified - please infer from product idea"}

## Target Users
{target_users or "Not specified - please identify potential user personas"}

## Constraints
{constraints or "None specified"}

## Additional Context
{context or "None"}

## Required PRD Structure

Create a detailed PRD that includes:

### 1. Executive Summary
- Product vision and mission
- Key objectives
- Success criteria

### 2. Product Overview
- Problem statement
- Solution overview
- Value proposition
- Target market

### 3. User Personas & User Stories
- Detailed user personas
- User stories with format: "As a [persona], I want [goal] so that [benefit]"
- Use cases and scenarios

### 4. Features & Requirements
- Core features (must-have)
- Nice-to-have features
- Feature descriptions with details
- User flows for key features

### 5. Success Metrics & KPIs
- Key performance indicators
- Success metrics
- Measurement methods
- Target values

### 6. Acceptance Criteria
- Clear acceptance criteria for each feature
- Definition of Done
- Quality standards

### 7. Non-Functional Requirements
- Performance requirements
- Security requirements
- Scalability requirements
- Usability requirements
- Accessibility requirements

### 8. Out of Scope
- Explicitly state what is NOT included
- Future considerations

### 9. Dependencies & Risks
- Technical dependencies
- Business dependencies
- Identified risks
- Mitigation strategies

### 10. Timeline & Milestones
- High-level timeline
- Key milestones
- Phase breakdown

Provide the PRD in a structured, clear format that can be used by development teams.
"""

        prd_content = await self.generate_response(prompt)

        # Parse and structure the PRD
        prd = {
            "product_idea": product_idea,
            "business_objectives": business_objectives or [],
            "target_users": target_users or [],
            "constraints": constraints or {},
            "context": context or {},
            "prd_content": prd_content,
            "sections": {
                "executive_summary": "",
                "product_overview": "",
                "user_personas": [],
                "user_stories": [],
                "features": [],
                "success_metrics": [],
                "acceptance_criteria": [],
                "non_functional_requirements": {},
                "out_of_scope": [],
                "dependencies": [],
                "risks": [],
                "timeline": {},
            },
            "metadata": {
                "created_at": self._get_timestamp(),
                "version": "1.0",
            },
        }

        return prd

    async def refine_prd(
        self, prd: Dict[str, Any], feedback: str, changes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Refine an existing PRD based on feedback or changes.

        Args:
            prd: Existing PRD document
            feedback: Feedback or requested changes
            changes: Specific changes to apply

        Returns:
            Updated PRD document
        """
        prompt = f"""Refine the following PRD based on feedback and requested changes:

## Current PRD
{prd.get('prd_content', 'N/A')}

## Feedback
{feedback}

## Requested Changes
{changes or "None specified"}

Please update the PRD accordingly, maintaining consistency and ensuring all sections remain coherent.
"""

        updated_content = await self.generate_response(prompt)

        updated_prd = prd.copy()
        updated_prd["prd_content"] = updated_content
        updated_prd["metadata"]["version"] = str(float(prd["metadata"].get("version", "1.0")) + 0.1)
        updated_prd["metadata"]["updated_at"] = self._get_timestamp()

        return updated_prd

    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime

        return datetime.now().isoformat()

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

            if "product_idea" in payload:
                # PRD creation task
                product_idea = payload["product_idea"]
                business_objectives = payload.get("business_objectives")
                target_users = payload.get("target_users")
                constraints = payload.get("constraints")
                context = payload.get("context")

                prd = await self.create_prd(
                    product_idea=product_idea,
                    business_objectives=business_objectives,
                    target_users=target_users,
                    constraints=constraints,
                    context=context,
                )

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": prd,
                        "document_type": "PRD",
                    },
                    reply_to=message.id,
                )

            elif "prd" in payload and "feedback" in payload:
                # PRD refinement task
                prd = payload["prd"]
                feedback = payload["feedback"]
                changes = payload.get("changes")

                updated_prd = await self.refine_prd(prd, feedback, changes)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": updated_prd,
                        "document_type": "PRD",
                    },
                    reply_to=message.id,
                )

        return None
