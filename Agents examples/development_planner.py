"""Development Planner agent - Specialized in creating phased development plans."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class DevelopmentPlanner(Agent):
    """
    Development Planner agent - Specialized in creating comprehensive phased development plans.

    This agent creates detailed development plans that include:
    - Technology stack selection
    - MVP definition and scope
    - Phased development roadmap
    - Timeline estimates
    - Resource requirements
    - Dependencies and critical path
    - Risk mitigation strategies

    Department: Planning
    """

    def __init__(
        self,
        name: str = "Development Planner",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize Development Planner agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a Development Planner specializing in creating comprehensive, phased "
            "development plans. Your goal is to translate PRDs and SRDs into actionable development "
            "plans. You excel at:\n\n"
            "1. Analyzing requirements and defining MVP scope\n"
            "2. Selecting appropriate technology stacks based on requirements\n"
            "3. Breaking down development into logical phases\n"
            "4. Estimating timelines and resource requirements\n"
            "5. Identifying dependencies and critical paths\n"
            "6. Creating detailed roadmaps with milestones\n"
            "7. Defining clear scope boundaries for each phase\n"
            "8. Identifying risks and mitigation strategies\n\n"
            "Always create plans that are realistic, actionable, and provide clear guidance for "
            "development teams. Consider technical feasibility, resource constraints, and business "
            "priorities when making recommendations."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.DEVELOPMENT_PLANNER,
            goal="Create comprehensive phased development plans",
            backstory=(
                "You are an experienced technical project manager and development planner with "
                "expertise in software development methodologies (Agile, Scrum, Waterfall). You have "
                "deep knowledge of technology stacks, development best practices, and project "
                "management. You excel at balancing technical requirements with business constraints "
                "and creating realistic, achievable development plans."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=True,
            max_iterations=5,
            department="Planning",
        )

        super().__init__(config, llm_provider)

    async def create_development_plan(
        self,
        prd: Optional[Dict[str, Any]] = None,
        srd: Optional[Dict[str, Any]] = None,
        constraints: Optional[Dict[str, Any]] = None,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a comprehensive phased development plan.

        Args:
            prd: Product Requirements Document
            srd: Software Requirements Document
            constraints: Constraints (budget, timeline, team size, etc.)
            preferences: Preferences (technology preferences, methodology, etc.)

        Returns:
            Complete development plan with phases, stack, MVP, roadmap, timelines
        """
        # Build context from PRD and SRD
        prd_content = prd.get("prd_content", str(prd)) if prd else "Not provided"
        srd_content = srd.get("srd_content", str(srd)) if srd else "Not provided"

        prompt = f"""Create a comprehensive phased development plan based on the following requirements:

## Product Requirements Document (PRD)
{prd_content}

## Software Requirements Document (SRD)
{srd_content}

## Constraints
{constraints or "None specified - please make reasonable assumptions"}

## Preferences
{preferences or "None specified"}

## Required Development Plan Structure

Create a detailed development plan that includes:

### 1. Executive Summary
- Project overview
- Key objectives
- High-level timeline
- Resource summary

### 2. Technology Stack Selection
For each component (frontend, backend, database, infrastructure, etc.):
- Recommended technology stack with justification
- Alternative options considered
- Pros and cons of selected stack
- Compatibility and integration considerations
- Learning curve and team expertise considerations

### 3. MVP Definition
- MVP scope (what's included)
- MVP features prioritized from PRD
- MVP success criteria
- What's explicitly OUT of MVP
- MVP timeline estimate
- MVP resource requirements

### 4. Development Phases
Break down development into logical phases. For each phase:
- Phase name and number
- Phase objectives
- Features/functionality included
- Dependencies (what must be completed before this phase)
- Deliverables
- Success criteria
- Estimated timeline
- Resource requirements (team size, roles needed)
- Technical milestones

### 5. Detailed Roadmap
- Timeline visualization (Gantt-style breakdown)
- Phase sequence and overlap
- Critical path identification
- Key milestones and dates
- Dependencies between phases
- Buffer time for unexpected issues

### 6. Scope Definition
For each phase:
- In-scope items (explicitly listed)
- Out-of-scope items (explicitly listed)
- Assumptions
- Constraints

### 7. Resource Planning
- Team composition for each phase
- Required roles and skills
- Team size estimates
- External resources needed (designers, QA, DevOps, etc.)
- Budget estimates (if applicable)

### 8. Risk Assessment & Mitigation
- Technical risks per phase
- Timeline risks
- Resource risks
- Scope creep risks
- Mitigation strategies for each risk
- Contingency plans

### 9. Quality Assurance Plan
- Testing strategy per phase
- QA milestones
- Code review process
- Deployment strategy
- Rollback plans

### 10. Success Metrics
- Phase completion criteria
- Quality metrics
- Performance metrics
- Business metrics

### 11. Post-MVP Roadmap
- Future phases beyond MVP
- Feature roadmap
- Technical debt considerations
- Scalability improvements
- Enhancement opportunities

Provide the plan in a structured format that can be used by development teams and project managers.
Consider realistic timelines, account for dependencies, and provide actionable guidance.
"""

        plan_content = await self.generate_response(prompt)

        # Structure the development plan
        development_plan = {
            "prd_reference": prd.get("metadata", {}).get("version", "1.0") if prd else None,
            "srd_reference": srd.get("metadata", {}).get("version", "1.0") if srd else None,
            "constraints": constraints or {},
            "preferences": preferences or {},
            "plan_content": plan_content,
            "sections": {
                "executive_summary": {},
                "technology_stack": {},
                "mvp_definition": {},
                "development_phases": [],
                "roadmap": {},
                "scope_definition": {},
                "resource_planning": {},
                "risk_assessment": [],
                "qa_plan": {},
                "success_metrics": {},
                "post_mvp_roadmap": {},
            },
            "metadata": {
                "created_at": self._get_timestamp(),
                "version": "1.0",
            },
        }

        return development_plan

    async def refine_plan(
        self,
        plan: Dict[str, Any],
        feedback: str,
        changes: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Refine an existing development plan based on feedback or changes.

        Args:
            plan: Existing development plan
            feedback: Feedback or requested changes
            changes: Specific changes to apply

        Returns:
            Updated development plan
        """
        prompt = f"""Refine the following development plan based on feedback and requested changes:

## Current Development Plan
{plan.get('plan_content', 'N/A')}

## Feedback
{feedback}

## Requested Changes
{changes or "None specified"}

Please update the plan accordingly, maintaining consistency across all phases and ensuring timelines and dependencies remain realistic.
"""

        updated_content = await self.generate_response(prompt)

        updated_plan = plan.copy()
        updated_plan["plan_content"] = updated_content
        updated_plan["metadata"]["version"] = str(
            float(plan["metadata"].get("version", "1.0")) + 0.1
        )
        updated_plan["metadata"]["updated_at"] = self._get_timestamp()

        return updated_plan

    async def extract_tasks_from_plan(
        self, plan: Dict[str, Any], phase: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Extract actionable tasks from a development plan.

        This method helps the DT understand what tasks need to be executed.

        Args:
            plan: Development plan
            phase: Optional phase name to extract tasks from specific phase

        Returns:
            List of tasks with metadata
        """
        prompt = f"""Extract actionable development tasks from the following development plan:

## Development Plan
{plan.get('plan_content', 'N/A')}

## Phase Filter
{phase or "All phases"}

For each task, provide:
1. Task ID (unique identifier)
2. Task name/description
3. Phase it belongs to
4. Dependencies (other task IDs)
5. Estimated effort (in story points or hours)
6. Required skills/roles
7. Priority (High/Medium/Low)
8. Acceptance criteria
9. Deliverables

Format the output as a structured list that can be used by a task management system.
"""

        tasks_content = await self.generate_response(prompt)

        # Parse tasks (simplified - in production, you'd want more robust parsing)
        tasks = [
            {
                "task_id": f"task_{i}",
                "description": task_content,
                "phase": phase or "unknown",
                "dependencies": [],
                "effort": "TBD",
                "skills": [],
                "priority": "Medium",
                "acceptance_criteria": [],
                "deliverables": [],
            }
            for i, task_content in enumerate(
                tasks_content.split("\n") if isinstance(tasks_content, str) else []
            )
            if task_content.strip()
        ]

        return tasks

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

            if "prd" in payload or "srd" in payload:
                # Development plan creation task
                prd = payload.get("prd")
                srd = payload.get("srd")
                constraints = payload.get("constraints")
                preferences = payload.get("preferences")

                plan = await self.create_development_plan(
                    prd=prd,
                    srd=srd,
                    constraints=constraints,
                    preferences=preferences,
                )

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": plan,
                        "document_type": "DEVELOPMENT_PLAN",
                    },
                    reply_to=message.id,
                )

            elif "plan" in payload and "feedback" in payload:
                # Plan refinement task
                plan = payload["plan"]
                feedback = payload["feedback"]
                changes = payload.get("changes")

                updated_plan = await self.refine_plan(plan, feedback, changes)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": updated_plan,
                        "document_type": "DEVELOPMENT_PLAN",
                    },
                    reply_to=message.id,
                )

            elif "plan" in payload and payload.get("action") == "extract_tasks":
                # Task extraction task
                plan = payload["plan"]
                phase = payload.get("phase")

                tasks = await self.extract_tasks_from_plan(plan, phase)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": {"tasks": tasks},
                        "document_type": "TASK_LIST",
                    },
                    reply_to=message.id,
                )

        return None
