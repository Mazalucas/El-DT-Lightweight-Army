"""SRD Creator agent - Specialized in creating Software Requirements Documentation."""

from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class SRDCreator(Agent):
    """
    SRD Creator agent - Specialized in creating Software Requirements Documentation.

    This agent creates detailed SRDs that translate PRDs into technical specifications,
    including system architecture, APIs, data models, technical constraints, and integration
    requirements.

    Department: Planning
    """

    def __init__(
        self,
        name: str = "SRD Creator",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize SRD Creator agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a Software Requirements Document (SRD) creator. Your goal is to create "
            "comprehensive, technically detailed SRDs that translate product requirements into "
            "actionable technical specifications. You excel at:\n\n"
            "1. Analyzing PRDs and extracting technical requirements\n"
            "2. Defining system architecture and components\n"
            "3. Specifying APIs, data models, and interfaces\n"
            "4. Identifying technical constraints and dependencies\n"
            "5. Defining integration requirements\n"
            "6. Specifying performance, security, and scalability requirements\n"
            "7. Creating detailed technical specifications for development teams\n\n"
            "Always create SRDs that are precise, technically accurate, and provide clear "
            "guidance for implementation."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.SRD_CREATOR,
            goal="Create comprehensive Software Requirements Documentation",
            backstory=(
                "You are an experienced software architect and technical writer with expertise in "
                "creating detailed software requirements documents. You have deep technical knowledge "
                "across multiple domains (backend, frontend, databases, APIs, infrastructure) and "
                "excel at translating product requirements into technical specifications. You "
                "understand how to balance technical feasibility with business requirements."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=True,
            max_iterations=5,
            department="Planning",
        )

        super().__init__(config, llm_provider)

    async def create_srd(
        self,
        prd: Dict[str, Any],
        technical_context: Optional[Dict[str, Any]] = None,
        existing_systems: Optional[List[str]] = None,
        technical_constraints: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a comprehensive Software Requirements Document from a PRD.

        Args:
            prd: Product Requirements Document
            technical_context: Technical context (current stack, infrastructure, etc.)
            existing_systems: List of existing systems to integrate with
            technical_constraints: Technical constraints (budget, infrastructure, etc.)

        Returns:
            Complete SRD document with all technical specifications
        """
        prompt = f"""Create a comprehensive Software Requirements Document (SRD) based on the following PRD:

## Product Requirements Document (PRD)
{prd.get('prd_content', prd)}

## Technical Context
{technical_context or "Not specified - please infer from PRD"}

## Existing Systems to Integrate
{existing_systems or "None specified"}

## Technical Constraints
{technical_constraints or "None specified"}

## Required SRD Structure

Create a detailed SRD that includes:

### 1. System Overview
- System architecture (high-level)
- Component diagram
- Technology stack recommendations
- System boundaries

### 2. Functional Requirements
- Detailed functional specifications for each feature from PRD
- User flows translated to system flows
- Business logic specifications
- Input/output specifications

### 3. System Architecture
- Architecture patterns (microservices, monolith, serverless, etc.)
- Component breakdown
- Service boundaries
- Communication patterns
- Data flow diagrams

### 4. Data Models & Database Design
- Entity relationship diagrams (conceptual)
- Data models for each entity
- Database schema design
- Data relationships and constraints
- Data migration requirements

### 5. API Specifications
- REST/GraphQL API endpoints
- Request/response schemas
- Authentication and authorization
- Error handling
- Rate limiting
- API versioning strategy

### 6. Integration Requirements
- Third-party integrations
- External API requirements
- Integration patterns
- Data synchronization requirements
- Error handling for integrations

### 7. Non-Functional Requirements
- Performance requirements (response times, throughput)
- Scalability requirements
- Security requirements (authentication, authorization, encryption)
- Reliability and availability requirements
- Usability requirements
- Accessibility requirements
- Compliance requirements

### 8. Technical Constraints
- Technology stack constraints
- Infrastructure constraints
- Budget constraints
- Timeline constraints
- Resource constraints

### 9. Development Phases
- Phase breakdown
- Dependencies between phases
- Critical path identification
- Phase deliverables

### 10. Testing Requirements
- Unit testing requirements
- Integration testing requirements
- End-to-end testing requirements
- Performance testing requirements
- Security testing requirements

### 11. Deployment & DevOps
- Deployment architecture
- CI/CD requirements
- Monitoring and logging requirements
- Backup and recovery requirements
- Environment requirements (dev, staging, prod)

### 12. Risk Assessment
- Technical risks
- Mitigation strategies
- Contingency plans

Provide the SRD in a structured, clear format that can be used by development teams to implement the system.
"""

        srd_content = await self.generate_response(prompt)

        # Parse and structure the SRD
        srd = {
            "prd_reference": prd.get("metadata", {}).get("version", "1.0"),
            "technical_context": technical_context or {},
            "existing_systems": existing_systems or [],
            "technical_constraints": technical_constraints or {},
            "srd_content": srd_content,
            "sections": {
                "system_overview": "",
                "functional_requirements": [],
                "system_architecture": {},
                "data_models": [],
                "api_specifications": [],
                "integration_requirements": [],
                "non_functional_requirements": {},
                "technical_constraints": {},
                "development_phases": [],
                "testing_requirements": {},
                "deployment_devops": {},
                "risk_assessment": [],
            },
            "metadata": {
                "created_at": self._get_timestamp(),
                "version": "1.0",
            },
        }

        return srd

    async def refine_srd(
        self, srd: Dict[str, Any], feedback: str, changes: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Refine an existing SRD based on feedback or changes.

        Args:
            srd: Existing SRD document
            feedback: Feedback or requested changes
            changes: Specific changes to apply

        Returns:
            Updated SRD document
        """
        prompt = f"""Refine the following SRD based on feedback and requested changes:

## Current SRD
{srd.get('srd_content', 'N/A')}

## Feedback
{feedback}

## Requested Changes
{changes or "None specified"}

Please update the SRD accordingly, maintaining technical consistency and ensuring all sections remain coherent.
"""

        updated_content = await self.generate_response(prompt)

        updated_srd = srd.copy()
        updated_srd["srd_content"] = updated_content
        updated_srd["metadata"]["version"] = str(float(srd["metadata"].get("version", "1.0")) + 0.1)
        updated_srd["metadata"]["updated_at"] = self._get_timestamp()

        return updated_srd

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

            if "prd" in payload:
                # SRD creation task
                prd = payload["prd"]
                technical_context = payload.get("technical_context")
                existing_systems = payload.get("existing_systems")
                technical_constraints = payload.get("technical_constraints")

                srd = await self.create_srd(
                    prd=prd,
                    technical_context=technical_context,
                    existing_systems=existing_systems,
                    technical_constraints=technical_constraints,
                )

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": srd,
                        "document_type": "SRD",
                    },
                    reply_to=message.id,
                )

            elif "srd" in payload and "feedback" in payload:
                # SRD refinement task
                srd = payload["srd"]
                feedback = payload["feedback"]
                changes = payload.get("changes")

                updated_srd = await self.refine_srd(srd, feedback, changes)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": updated_srd,
                        "document_type": "SRD",
                    },
                    reply_to=message.id,
                )

        return None
