"""DevOps Automator agent - Engineering specialist."""

from typing import Any, Dict, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.protocol.message import AgentMessage
from agents_army.protocol.types import AgentRole, MessageType


class DevOpsAutomator(Agent):
    """
    DevOps Automator agent - Specialized in CI/CD and infrastructure automation.

    Department: Engineering
    """

    def __init__(
        self,
        name: str = "DevOps Automator",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize DevOps Automator agent.

        Args:
            name: Agent name
            instructions: Custom instructions
            model: LLM model to use
            llm_provider: Optional LLM provider
        """
        default_instructions = (
            "You are a DevOps automation specialist. Your goal is to automate "
            "deployments, configure infrastructure as code, optimize CI/CD pipelines, "
            "and manage environments. Always follow best practices for reliability, "
            "security, and scalability."
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.DEVOPS_AUTOMATOR,
            goal="Automate deployments and infrastructure configuration",
            backstory=(
                "You are an experienced DevOps engineer with expertise in CI/CD, "
                "infrastructure as code, containerization, and cloud platforms. "
                "You excel at creating reliable, scalable, and secure automation pipelines."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=False,
            max_iterations=3,
            department="Engineering",
        )

        super().__init__(config, llm_provider)

    async def create_cicd_pipeline(self, project_config: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create CI/CD pipeline configuration.

        Args:
            project_config: Project configuration dictionary

        Returns:
            CI/CD pipeline configuration
        """
        prompt = f"""Create a CI/CD pipeline configuration based on this project:

{project_config}

Provide:
1. Pipeline stages (build, test, deploy)
2. Environment configurations (dev, staging, prod)
3. Deployment strategies
4. Testing steps
5. Security checks
6. Rollback procedures
"""

        pipeline_config = await self.generate_response(prompt)

        return {
            "project_config": project_config,
            "pipeline": pipeline_config,
            "stages": [],
            "environments": [],
        }

    async def setup_infrastructure(self, requirements: Dict[str, Any]) -> Dict[str, Any]:
        """
        Setup infrastructure configuration.

        Args:
            requirements: Infrastructure requirements

        Returns:
            Infrastructure configuration
        """
        prompt = f"""Design infrastructure as code based on these requirements:

{requirements}

Provide:
1. Infrastructure components (containers, databases, networking)
2. Scaling configuration
3. Security settings
4. Monitoring setup
5. Backup and disaster recovery
"""

        infrastructure = await self.generate_response(prompt)

        return {
            "requirements": requirements,
            "infrastructure": infrastructure,
            "components": [],
            "scaling": {},
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

            if "project_config" in payload:
                # CI/CD pipeline task
                project_config = payload["project_config"]

                pipeline = await self.create_cicd_pipeline(project_config)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": pipeline,
                    },
                    reply_to=message.id,
                )

            elif "requirements" in payload and "infrastructure" in str(payload).lower():
                # Infrastructure setup task
                requirements = payload["requirements"]

                infrastructure = await self.setup_infrastructure(requirements)

                return AgentMessage(
                    from_role=self.role,
                    to_role=message.from_role,
                    type=MessageType.TASK_RESPONSE,
                    payload={
                        "task_id": payload.get("task_id"),
                        "status": "completed",
                        "result": infrastructure,
                    },
                    reply_to=message.id,
                )

        return None
