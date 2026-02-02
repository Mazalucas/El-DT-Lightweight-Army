"""El DT (Director Técnico) - Main coordinator agent."""

import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from agents_army.core.agent import Agent, AgentConfig, LLMProvider
from agents_army.core.autonomy import DTAutonomyEngine, DecisionHistory
from agents_army.core.models import (
    AgentConflict,
    ActionResult,
    ConflictResolution,
    Decision,
    Project,
    Situation,
    Task,
    TaskAssignment,
    TaskResult,
)
from agents_army.protocol.message import AgentMessage
from agents_army.core.rules import RulesChecker, RulesLoader
from agents_army.core.system import AgentSystem
from agents_army.core.task_decomposer import TaskDecomposer
from agents_army.core.task_scheduler import TaskScheduler
from agents_army.core.task_storage import TaskStorage
from agents_army.mcp.models import MCPServerConfig, MCPTool
from agents_army.mcp.server import MCPServer
from agents_army.protocol.types import AgentRole, MessageType


class DT(Agent):
    """
    El DT (Director Técnico) - Main coordinator agent.

    Based on taskmaster architecture with multi-agent coordination capabilities.
    """

    def __init__(
        self,
        name: str = "El DT",
        instructions: Optional[str] = None,
        model: str = "gpt-4",
        project_path: str = ".dt",
        prd_path: str = ".dt/docs/prd.txt",
        llm_provider: Optional[LLMProvider] = None,
    ):
        """
        Initialize El DT.

        Args:
            name: Agent name
            instructions: Custom instructions (uses defaults if None)
            model: LLM model to use
            project_path: Path to .dt directory
            prd_path: Path to PRD file
            llm_provider: Optional LLM provider
        """
        # Default instructions for El DT
        default_instructions = (
            "You are El DT (Technical Director), responsible for coordinating "
            "and managing all project tasks and agents. You parse PRDs, generate "
            "tasks, assign them to specialized agents, and ensure project completion.\n\n"
            "## Communication Principles\n\n"
            "Your role is to be a critical but respectful technical advisor:\n\n"
            "1. **When user proposes or decides**: If the user explicitly decides to proceed "
            "or approves a direction, respect their decision and move forward efficiently. "
            "Don't continue questioning once a decision is made - instead, create a detailed "
            "plan before execution.\n\n"
            "2. **Before implementation**: Always present a structured plan first. Work on "
            "refining the plan collaboratively. **CRITICAL: Never execute or implement until "
            "the user explicitly approves the plan.** Always wait for user approval before "
            "starting any implementation.\n\n"
            "3. **Critical thinking**: Question proposals constructively by:\n"
            "   - Identifying potential risks, edge cases, or technical challenges\n"
            "   - Proposing alternative approaches with their trade-offs\n"
            "   - Justifying your concerns with technical reasoning\n"
            "   - Inviting discussion rather than simply approving\n\n"
            "4. **Conversational flow**: Keep interactions conversational. After analysis, "
            "always open the door for refinement: 'Should we consider...?', 'What if we "
            "explore...?', 'Before proceeding, let's review...'\n\n"
            "5. **Balance**: Be thorough in analysis but efficient in execution. Once the "
            "user confirms a direction, shift from questioning to planning. **CRITICAL: "
            "Never execute or implement anything until the user explicitly approves the plan. "
            "Always wait for explicit approval before starting implementation.**\n\n"
            "6. **Project structure awareness**: Each project has its own isolated directory. "
            "Never mix DT system files (.dt/) with project-specific files. Project files go "
            "in the project's dedicated directory, DT management files stay in .dt/"
        )

        config = AgentConfig(
            name=name,
            role=AgentRole.DT,
            goal="Coordinate and manage all project tasks and agents while providing critical technical guidance",
            backstory=(
                "You are the Technical Director, responsible for orchestrating "
                "the entire project. You have deep technical knowledge and excellent "
                "coordination skills. You are known for your ability to critically analyze "
                "proposals, identify risks, and propose alternatives, while respecting "
                "user decisions and maintaining efficient workflow. You understand that "
                "once a direction is approved, your role shifts to planning and execution "
                "rather than continued questioning."
            ),
            instructions=instructions or default_instructions,
            model=model,
            allow_delegation=True,
            max_iterations=5,
        )

        super().__init__(config, llm_provider)

        self.project_path = Path(project_path)
        self.prd_path = Path(prd_path)
        self.task_storage = TaskStorage(str(self.project_path))
        self.current_project: Optional[Project] = None
        self.rules_checker: Optional[RulesChecker] = None
        self.system: Optional[AgentSystem] = None
        self.mcp_servers: Dict[str, MCPServer] = {}

        # Initialize autonomy engine
        rules_loader = RulesLoader()
        rules = rules_loader.load_all_rules(str(self.project_path))
        self.autonomy_engine: Optional[DTAutonomyEngine] = DTAutonomyEngine(
            rules_loader=rules_loader,
            history=DecisionHistory(),
            dt=self,  # Pass reference to DT for execution
        )

        # Initialize task decomposer and scheduler
        self.task_decomposer = TaskDecomposer(llm_provider=llm_provider)
        self.task_scheduler = TaskScheduler()

    def set_system(self, system: AgentSystem) -> None:
        """
        Set the agent system for coordination.

        Args:
            system: AgentSystem instance
        """
        self.system = system

    async def initialize_project(
        self,
        project_name: str,
        description: str,
        rules: Optional[List[str]] = None,
        project_base_path: Optional[str] = None,
    ) -> Project:
        """
        Initialize a new project.

        Creates separate directory structures:
        - .dt/ : DT system files (tasks, rules, config) - shared across projects
        - projects/{project_name}/ : Project-specific files (code, docs, assets)

        Args:
            project_name: Name of the project (used for project directory name)
            description: Project description
            rules: Optional list of project rules
            project_base_path: Optional base path for projects (defaults to 'projects'
                              relative to DT's project_path)

        Returns:
            Project instance
        """
        # Sanitize project name for directory
        safe_project_name = re.sub(r"[^\w\s-]", "", project_name).strip()
        safe_project_name = re.sub(r"[-\s]+", "_", safe_project_name)

        # Determine project-specific directory
        if project_base_path is None:
            # Default: projects/{project_name}/ relative to DT's base path
            dt_base = (
                self.project_path.parent
                if self.project_path.name == ".dt"
                else self.project_path.parent
            )
            project_dir = dt_base / "projects" / safe_project_name
        else:
            project_dir = Path(project_base_path) / safe_project_name

        # Create DT directory structure (for DT management files)
        (self.project_path / "docs").mkdir(parents=True, exist_ok=True)
        (self.project_path / "tasks").mkdir(parents=True, exist_ok=True)
        (self.project_path / "rules").mkdir(parents=True, exist_ok=True)
        (self.project_path / "config").mkdir(parents=True, exist_ok=True)
        (self.project_path / "templates").mkdir(parents=True, exist_ok=True)

        # Create project-specific directory structure
        project_dir.mkdir(parents=True, exist_ok=True)
        (project_dir / "docs").mkdir(parents=True, exist_ok=True)
        (project_dir / "src").mkdir(parents=True, exist_ok=True)
        (project_dir / "tests").mkdir(parents=True, exist_ok=True)
        (project_dir / "assets").mkdir(parents=True, exist_ok=True)
        (project_dir / "config").mkdir(parents=True, exist_ok=True)

        # Project PRD goes in project directory, not DT directory
        project_prd_path = project_dir / "docs" / "prd.txt"

        # Create project metadata file
        project_meta = {
            "name": project_name,
            "description": description,
            "dt_path": str(self.project_path),
            "project_path": str(project_dir),
            "created_at": datetime.now().isoformat(),
        }
        with open(project_dir / "project.json", "w", encoding="utf-8") as f:
            json.dump(project_meta, f, indent=2, ensure_ascii=False)

        # Create project
        project = Project(
            name=project_name,
            description=description,
            path=str(project_dir),  # Project-specific path, not DT path
            prd_path=str(project_prd_path),
            rules=rules or [],
        )

        self.current_project = project

        # Load rules from DT directory (system rules)
        rules_dict = RulesLoader.load_all_rules(str(self.project_path))
        self.rules_checker = RulesChecker(rules_dict)

        return project

    async def parse_prd(self, prd_path: Optional[str] = None) -> List[Task]:
        """
        Parse a PRD and generate tasks.

        Args:
            prd_path: Optional path to PRD file (uses project's PRD path if None)

        Returns:
            List of generated tasks
        """
        # Use project's PRD path if available, otherwise fall back to DT's default
        if prd_path:
            prd_file = Path(prd_path)
        elif self.current_project:
            prd_file = Path(self.current_project.prd_path)
        else:
            prd_file = self.prd_path

        if not prd_file.exists():
            raise FileNotFoundError(f"PRD file not found: {prd_file}")

        # Read PRD
        with open(prd_file, "r", encoding="utf-8") as f:
            prd_content = f.read()

        # Generate tasks using LLM
        prompt = f"""Parse the following PRD and generate a list of tasks.

PRD:
{prd_content}

Generate tasks in JSON format:
[
  {{
    "title": "Task title",
    "description": "Task description",
    "priority": 3,
    "tags": ["tag1", "tag2"]
  }}
]

Return only valid JSON array."""

        try:
            response = await self.generate_response(prompt)
            # Parse JSON response (simplified - in production would be more robust)
            import json

            # Extract JSON from response
            json_start = response.find("[")
            json_end = response.rfind("]") + 1
            if json_start >= 0 and json_end > json_start:
                tasks_data = json.loads(response[json_start:json_end])
            else:
                # Fallback: create a single task
                tasks_data = [
                    {
                        "title": "Implement PRD requirements",
                        "description": prd_content[:200],
                        "priority": 3,
                        "tags": [],
                    }
                ]
        except Exception:
            # Fallback: create a single task
            tasks_data = [
                {
                    "title": "Implement PRD requirements",
                    "description": prd_content[:200],
                    "priority": 3,
                    "tags": [],
                }
            ]

        # Create Task objects
        tasks = []
        for task_data in tasks_data:
            task = Task(
                id=f"task_{uuid.uuid4().hex[:8]}",
                title=task_data.get("title", "Untitled Task"),
                description=task_data.get("description", ""),
                priority=task_data.get("priority", 3),
                tags=task_data.get("tags", []),
            )
            tasks.append(task)
            self.task_storage.save_task(task)

        return tasks

    async def get_tasks(
        self,
        status: Optional[str] = None,
        tag: Optional[str] = None,
        limit: int = 10,
    ) -> List[Task]:
        """
        Get list of tasks.

        Args:
            status: Optional status filter
            tag: Optional tag filter
            limit: Maximum number of tasks

        Returns:
            List of tasks
        """
        tasks = self.task_storage.list_tasks(status=status, limit=limit)

        if tag:
            tasks = [t for t in tasks if tag in t.tags]

        return tasks

    async def get_next_task(self) -> Optional[Task]:
        """
        Get the next task to work on.

        Returns:
            Next task or None if no tasks available
        """
        # Get pending tasks
        pending_tasks = await self.get_tasks(status="pending", limit=100)

        # Filter ready tasks (no dependencies)
        ready_tasks = [t for t in pending_tasks if t.is_ready()]

        if not ready_tasks:
            return None

        # Sort by priority (highest first)
        ready_tasks.sort(key=lambda t: t.priority, reverse=True)

        return ready_tasks[0]

    async def assign_task(self, task: Task, agent_role: AgentRole) -> TaskAssignment:
        """
        Assign a task to an agent and execute autonomously.

        The system automatically decides:
        - If use autonomous loop (level 4)
        - If use validated loop (level 3)
        - If use simple execution (level 2)
        - If escalate to human (level 1)

        Args:
            task: Task to assign
            agent_role: Role of agent to assign to

        Returns:
            TaskAssignment
        """
        old_status = task.status
        task.assigned_agent = agent_role
        task.update_status("in-progress")

        # Move task file first, then save
        if old_status != "in-progress":
            self.task_storage.move_task(task.id, old_status, "in-progress")

        self.task_storage.save_task(task)

        assignment = TaskAssignment(
            task_id=task.id,
            agent_role=agent_role,
        )

        # Create situation for autonomy decision
        situation = Situation(
            task=task,
            context={"assigned_agent": agent_role},
            available_agents=[agent_role] if self.system else [],
            constraints={},
        )

        # Decide and execute automatically
        if self.autonomy_engine:
            try:
                result = await self.autonomy_engine.decide_and_act(situation)

                # Update task status according to result
                if result.success:
                    await self.update_task_status(task.id, "done")
                elif result.escalated:
                    await self.update_task_status(task.id, "blocked")
                    # Log escalation reason if available
                    if result.escalation_reason:
                        # Could store in task metadata or log
                        pass
                # If in-progress, status remains as is
            except Exception as e:
                # If execution fails, keep task in-progress
                # Log error but don't break the flow
                pass

        return assignment

    async def update_task_status(
        self,
        task_id: str,
        status: str,
        agent_result: Optional[TaskResult] = None,
    ) -> Task:
        """
        Update task status.

        Args:
            task_id: Task ID
            status: New status
            agent_result: Optional result from agent

        Returns:
            Updated task
        """
        task = self.task_storage.load_task(task_id)
        if not task:
            raise ValueError(f"Task not found: {task_id}")

        old_status = task.status
        task.update_status(status)

        # Move task file if status changed
        if old_status != status:
            self.task_storage.move_task(task.id, old_status, status)

        self.task_storage.save_task(task)

        return task

    async def expand_task(self, task_id: str) -> Task:
        """
        Expand a task with more details.

        Args:
            task_id: Task ID

        Returns:
            Expanded task
        """
        task = self.task_storage.load_task(task_id)
        if not task:
            raise ValueError(f"Task not found: {task_id}")

        # Use LLM to expand task
        prompt = f"""Expand the following task with more details:

Title: {task.title}
Description: {task.description}

Provide:
1. More detailed description
2. Subtasks if applicable
3. Required resources
4. Estimated complexity

Return JSON:
{{
  "description": "expanded description",
  "subtasks": ["subtask1", "subtask2"],
  "resources": ["resource1"],
  "complexity": "low|medium|high"
}}"""

        try:
            response = await self.generate_response(prompt)
            import json

            json_start = response.find("{")
            json_end = response.rfind("}") + 1
            if json_start >= 0 and json_end > json_start:
                expanded = json.loads(response[json_start:json_end])
                task.description = expanded.get("description", task.description)
                task.metadata.update(expanded)
        except Exception:
            pass  # Keep original task if expansion fails

        self.task_storage.save_task(task)
        return task

    async def research(self, query: str, context: Optional[str] = None) -> Dict[str, Any]:
        """
        Perform research.

        Args:
            query: Research query
            context: Optional context

        Returns:
            Research results
        """
        # If Researcher agent is available, delegate
        if self.system:
            researcher = self.system.get_agent(AgentRole.RESEARCHER)
            if researcher:
                message = AgentMessage(
                    from_role=self.role,
                    to_role=AgentRole.RESEARCHER,
                    type=MessageType.TASK_REQUEST,
                    payload={"query": query, "context": context},
                )
                response = await researcher.handle_message(message)
                if response:
                    return response.payload

        # Otherwise, use LLM directly
        prompt = f"Research: {query}"
        if context:
            prompt += f"\n\nContext: {context}"

        result = await self.generate_response(prompt)

        return {
            "query": query,
            "result": result,
            "sources": [],
        }

    async def synthesize_results(self, task_results: List[TaskResult]) -> TaskResult:
        """
        Synthesize results from multiple agents into a single result.

        Args:
            task_results: List of task results from different agents

        Returns:
            Synthesized task result
        """
        if not task_results:
            raise ValueError("Cannot synthesize empty results list")

        # Get the first task ID (all should be for the same task)
        task_id = task_results[0].task_id

        # Build synthesis prompt
        prompt = f"""Synthesize the following results from multiple agents for task {task_id}:

"""
        for i, result in enumerate(task_results):
            prompt += f"Agent {i+1} Result:\n"
            prompt += f"Status: {result.status}\n"
            prompt += f"Result: {result.result}\n"
            if result.error:
                prompt += f"Error: {result.error}\n"
            if result.quality_score:
                prompt += f"Quality Score: {result.quality_score}\n"
            prompt += "\n"

        prompt += """
Provide a comprehensive synthesis that:
1. Combines the best insights from all agents
2. Resolves any contradictions
3. Provides a unified conclusion
4. Maintains quality and accuracy

Return the synthesized result.
"""

        synthesized_text = await self.generate_response(prompt)

        # Calculate average quality score
        quality_scores = [r.quality_score for r in task_results if r.quality_score]
        avg_quality = sum(quality_scores) / len(quality_scores) if quality_scores else None

        # Determine overall status
        all_successful = all(r.is_successful() for r in task_results)
        status = "completed" if all_successful else "partial"

        return TaskResult(
            task_id=task_id,
            status=status,
            result={"synthesized": synthesized_text, "sources": len(task_results)},
            quality_score=avg_quality,
            agent_id=self.id,
        )

    async def resolve_conflict(self, conflict: AgentConflict) -> ConflictResolution:
        """
        Resolve conflicts between agents.

        Args:
            conflict: Agent conflict to resolve

        Returns:
            Conflict resolution
        """
        # Build conflict resolution prompt
        prompt = f"""Resolve the following conflict between agents:

Conflict Type: {conflict.conflict_type}
Severity: {conflict.severity}
Description: {conflict.description}

Agent Opinions:
"""
        for agent_role, opinion in conflict.agent_opinions.items():
            prompt += f"\n{agent_role.value}:\n"
            prompt += f"{opinion}\n"

        prompt += """
Analyze the conflict and provide a resolution that:
1. Considers all agent perspectives
2. Aligns with project goals and rules
3. Provides clear reasoning
4. Chooses the best approach or creates a compromise

Return:
- resolution_type: "merge" | "choose_one" | "compromise" | "escalate"
- chosen_approach: Description of the chosen approach
- reasoning: Explanation of why this resolution was chosen
"""

        resolution_text = await self.generate_response(prompt)

        # Parse resolution (simple heuristic)
        resolution_type = "compromise"
        if "choose" in resolution_text.lower() or "select" in resolution_text.lower():
            resolution_type = "choose_one"
        elif "merge" in resolution_text.lower() or "combine" in resolution_text.lower():
            resolution_type = "merge"
        elif "escalate" in resolution_text.lower() or "human" in resolution_text.lower():
            resolution_type = "escalate"

        return ConflictResolution(
            conflict_id=conflict.conflict_id,
            resolution_type=resolution_type,
            chosen_approach={"description": resolution_text},
            reasoning=resolution_text,
            resolved_by=self.role,
            success=True,
        )

    async def setup_mcp_server(self, server_config: MCPServerConfig) -> MCPServer:
        """
        Setup an MCP server for El DT.

        Args:
            server_config: MCP server configuration

        Returns:
            Configured MCP server
        """
        server = MCPServer(server_config)
        self.mcp_servers[server_config.name] = server
        return server

    async def register_mcp_tool(
        self,
        tool: MCPTool,
        server_name: Optional[str] = None,
        accessible_by: Optional[List[AgentRole]] = None,
    ) -> None:
        """
        Register an MCP tool for use by agents.

        Args:
            tool: MCP tool to register
            server_name: Optional server name (uses default if None)
            accessible_by: Optional list of agent roles that can use this tool
                          (None = all agents)
        """
        if not self.mcp_servers:
            # Create default server if none exists
            default_config = MCPServerConfig(name="default", server_type="local")
            await self.setup_mcp_server(default_config)

        server_name = server_name or "default"
        if server_name not in self.mcp_servers:
            raise ValueError(f"MCP server not found: {server_name}")

        server = self.mcp_servers[server_name]
        await server.register_tool(tool, accessible_by=accessible_by)

    async def get_mcp_tools(
        self, agent_role: AgentRole, server_name: Optional[str] = None
    ) -> List[MCPTool]:
        """
        Get MCP tools available for an agent.

        Args:
            agent_role: Agent role
            server_name: Optional server name (None = all servers)

        Returns:
            List of available MCP tools
        """
        all_tools = []
        servers_to_check = (
            [self.mcp_servers[server_name]]
            if server_name and server_name in self.mcp_servers
            else self.mcp_servers.values()
        )

        for server in servers_to_check:
            tools = server.get_tools(agent_role)
            all_tools.extend(tools)

        return all_tools

    async def create_prd(
        self,
        product_idea: str,
        business_objectives: Optional[List[str]] = None,
        target_users: Optional[List[str]] = None,
        constraints: Optional[Dict[str, Any]] = None,
        context: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a PRD using the PRD Creator agent.

        Args:
            product_idea: Description of the product idea
            business_objectives: List of business objectives
            target_users: List of target user personas
            constraints: Constraints (budget, timeline, etc.)
            context: Additional context

        Returns:
            PRD document
        """
        if not self.system:
            raise ValueError("DT must be registered in AgentSystem to use planning agents")

        prd_creator = self.system.get_agent(AgentRole.PRD_CREATOR)
        if not prd_creator:
            raise ValueError("PRD Creator agent not found in system")

        message = AgentMessage(
            from_role=self.role,
            to_role=AgentRole.PRD_CREATOR,
            type=MessageType.TASK_REQUEST,
            payload={
                "product_idea": product_idea,
                "business_objectives": business_objectives,
                "target_users": target_users,
                "constraints": constraints,
                "context": context,
            },
        )

        response = await prd_creator.handle_message(message)
        if response and response.payload.get("status") == "completed":
            return response.payload.get("result", {})

        raise RuntimeError("Failed to create PRD")

    async def create_srd(
        self,
        prd: Dict[str, Any],
        technical_context: Optional[Dict[str, Any]] = None,
        existing_systems: Optional[List[str]] = None,
        technical_constraints: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create an SRD using the SRD Creator agent.

        Args:
            prd: Product Requirements Document
            technical_context: Technical context
            existing_systems: List of existing systems to integrate with
            technical_constraints: Technical constraints

        Returns:
            SRD document
        """
        if not self.system:
            raise ValueError("DT must be registered in AgentSystem to use planning agents")

        srd_creator = self.system.get_agent(AgentRole.SRD_CREATOR)
        if not srd_creator:
            raise ValueError("SRD Creator agent not found in system")

        message = AgentMessage(
            from_role=self.role,
            to_role=AgentRole.SRD_CREATOR,
            type=MessageType.TASK_REQUEST,
            payload={
                "prd": prd,
                "technical_context": technical_context,
                "existing_systems": existing_systems,
                "technical_constraints": technical_constraints,
            },
        )

        response = await srd_creator.handle_message(message)
        if response and response.payload.get("status") == "completed":
            return response.payload.get("result", {})

        raise RuntimeError("Failed to create SRD")

    async def create_development_plan(
        self,
        prd: Optional[Dict[str, Any]] = None,
        srd: Optional[Dict[str, Any]] = None,
        constraints: Optional[Dict[str, Any]] = None,
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Create a development plan using the Development Planner agent.

        Args:
            prd: Product Requirements Document
            srd: Software Requirements Document
            constraints: Constraints (budget, timeline, team size, etc.)
            preferences: Preferences (technology, methodology, etc.)

        Returns:
            Development plan document
        """
        if not self.system:
            raise ValueError("DT must be registered in AgentSystem to use planning agents")

        planner = self.system.get_agent(AgentRole.DEVELOPMENT_PLANNER)
        if not planner:
            raise ValueError("Development Planner agent not found in system")

        message = AgentMessage(
            from_role=self.role,
            to_role=AgentRole.DEVELOPMENT_PLANNER,
            type=MessageType.TASK_REQUEST,
            payload={
                "prd": prd,
                "srd": srd,
                "constraints": constraints,
                "preferences": preferences,
            },
        )

        response = await planner.handle_message(message)
        if response and response.payload.get("status") == "completed":
            return response.payload.get("result", {})

        raise RuntimeError("Failed to create development plan")

    async def extract_tasks_from_plan(
        self,
        plan: Dict[str, Any],
        phase: Optional[str] = None,
    ) -> List[Task]:
        """
        Extract tasks from a development plan and create Task objects.

        Args:
            plan: Development plan document
            phase: Optional phase name to extract tasks from specific phase

        Returns:
            List of Task objects
        """
        if not self.system:
            raise ValueError("DT must be registered in AgentSystem to use planning agents")

        planner = self.system.get_agent(AgentRole.DEVELOPMENT_PLANNER)
        if not planner:
            raise ValueError("Development Planner agent not found in system")

        message = AgentMessage(
            from_role=self.role,
            to_role=AgentRole.DEVELOPMENT_PLANNER,
            type=MessageType.TASK_REQUEST,
            payload={
                "plan": plan,
                "action": "extract_tasks",
                "phase": phase,
            },
        )

        response = await planner.handle_message(message)
        if not response or response.payload.get("status") != "completed":
            raise RuntimeError("Failed to extract tasks from plan")

        tasks_data = response.payload.get("result", {}).get("tasks", [])

        # Convert task data to Task objects
        tasks = []
        for task_data in tasks_data:
            task = Task(
                id=task_data.get("task_id", f"task_{uuid.uuid4().hex[:8]}"),
                title=task_data.get("description", "Untitled Task"),
                description=task_data.get("description", ""),
                priority=task_data.get("priority", "Medium"),
                tags=task_data.get("tags", []) + [task_data.get("phase", "unknown")],
                metadata={
                    "phase": task_data.get("phase"),
                    "dependencies": task_data.get("dependencies", []),
                    "effort": task_data.get("effort"),
                    "skills": task_data.get("skills", []),
                    "acceptance_criteria": task_data.get("acceptance_criteria", []),
                    "deliverables": task_data.get("deliverables", []),
                },
            )
            tasks.append(task)
            # Save task
            self.task_storage.save_task(task)

        return tasks

    async def map_task_to_agent(
        self,
        task: Task,
        plan: Optional[Dict[str, Any]] = None,
    ) -> Optional[AgentRole]:
        """
        Map a task to the appropriate agent based on task content and development plan.

        Args:
            task: Task to map
            plan: Optional development plan for context

        Returns:
            Recommended AgentRole or None if unclear
        """
        # Build mapping prompt
        prompt = f"""Given the following task, determine which agent role should handle it.

Task: {task.title}
Description: {task.description}
Tags: {task.tags}
Metadata: {task.metadata}

Available agent roles:
- BACKEND_ARCHITECT: Backend architecture, APIs, databases, server-side logic
- FRONTEND_DEVELOPER: Frontend UI/UX implementation, client-side code
- DEVOPS_AUTOMATOR: Infrastructure, CI/CD, deployment, monitoring
- UX_RESEARCHER: User research, usability studies, user testing
- UI_DESIGNER: Visual design, UI mockups, design systems
- QA_TESTER: Testing, quality assurance, test plans
- PRODUCT_STRATEGIST: Product strategy, feature prioritization
- MARKETING_STRATEGIST: Marketing strategy, campaigns
- CONTENT_CREATOR: Content creation, copywriting
- RESEARCHER: Research, information gathering
- OPERATIONS_MAINTAINER: Operations, maintenance, monitoring

Based on the task description, which agent role should handle this task?
Return only the role name (e.g., BACKEND_ARCHITECT).
"""

        if plan:
            prompt += f"\n\nDevelopment Plan Context:\n{plan.get('plan_content', '')[:500]}"

        try:
            response = await self.generate_response(prompt)
            # Extract role name from response
            response_upper = response.upper().strip()

            # Map response to AgentRole
            role_mapping = {
                "BACKEND_ARCHITECT": AgentRole.BACKEND_ARCHITECT,
                "FRONTEND_DEVELOPER": AgentRole.FRONTEND_DEVELOPER,
                "DEVOPS_AUTOMATOR": AgentRole.DEVOPS_AUTOMATOR,
                "UX_RESEARCHER": AgentRole.UX_RESEARCHER,
                "UI_DESIGNER": AgentRole.UI_DESIGNER,
                "QA_TESTER": AgentRole.QA_TESTER,
                "PRODUCT_STRATEGIST": AgentRole.PRODUCT_STRATEGIST,
                "MARKETING_STRATEGIST": AgentRole.MARKETING_STRATEGIST,
                "CONTENT_CREATOR": AgentRole.CONTENT_CREATOR,
                "RESEARCHER": AgentRole.RESEARCHER,
                "OPERATIONS_MAINTAINER": AgentRole.OPERATIONS_MAINTAINER,
            }

            for key, role in role_mapping.items():
                if key in response_upper:
                    return role

            # Fallback: try to infer from task content
            task_lower = (task.title + " " + task.description).lower()
            if any(word in task_lower for word in ["backend", "api", "database", "server"]):
                return AgentRole.BACKEND_ARCHITECT
            elif any(
                word in task_lower for word in ["frontend", "ui", "ux", "interface", "client"]
            ):
                return AgentRole.FRONTEND_DEVELOPER
            elif any(word in task_lower for word in ["test", "qa", "quality"]):
                return AgentRole.QA_TESTER
            elif any(
                word in task_lower for word in ["deploy", "infrastructure", "ci/cd", "devops"]
            ):
                return AgentRole.DEVOPS_AUTOMATOR

        except Exception:
            pass

        return None

    async def execute_plan(
        self,
        plan: Dict[str, Any],
        phase: Optional[str] = None,
        auto_assign: bool = True,
    ) -> List[TaskAssignment]:
        """
        Execute a development plan by extracting tasks and assigning them to agents.

        Args:
            plan: Development plan document
            phase: Optional phase name to execute specific phase
            auto_assign: Whether to automatically assign tasks to agents

        Returns:
            List of task assignments
        """
        # Extract tasks from plan
        tasks = await self.extract_tasks_from_plan(plan, phase)

        assignments = []
        for task in tasks:
            if auto_assign:
                # Map task to appropriate agent
                agent_role = await self.map_task_to_agent(task, plan)
                if agent_role:
                    assignment = await self.assign_task(task, agent_role)
                    assignments.append(assignment)
                else:
                    # If unclear, leave task unassigned for manual assignment
                    self.task_storage.save_task(task)

        return assignments

    async def _process_message(self, message: AgentMessage) -> Optional[AgentMessage]:
        """
        Process incoming message.

        Args:
            message: Incoming message

        Returns:
            Optional response message
        """
        # Handle different message types
        if message.type == MessageType.TASK_REQUEST:
            # Handle task request
            task_id = message.payload.get("task_id")
            if task_id:
                task = self.task_storage.load_task(task_id)
                if task:
                    # Process task assignment
                    agent_role = message.payload.get("agent_role")
                    if agent_role:
                        await self.assign_task(task, AgentRole(agent_role))

        elif message.type == MessageType.STATUS_QUERY:
            # Return status
            tasks = await self.get_tasks(limit=10)
            return AgentMessage(
                from_role=self.role,
                to_role=message.from_role,
                type=MessageType.STATUS_RESPONSE,
                payload={
                    "total_tasks": len(await self.get_tasks()),
                    "pending": len(await self.get_tasks(status="pending")),
                    "in_progress": len(await self.get_tasks(status="in-progress")),
                    "done": len(await self.get_tasks(status="done")),
                    "recent_tasks": [t.to_dict() for t in tasks[:5]],
                },
                reply_to=message.id,
            )

        return None
